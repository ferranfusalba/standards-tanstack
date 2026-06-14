import type {
	OnChangeFn,
	PaginationState,
	Updater,
} from "@tanstack/react-table";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDeepLinkPage, withDeepLinkPage } from "@/lib/use-table-url-state";

/** Minimal TableUrlState whose onPaginationChange is a spy, so we can assert what
 *  value the rebased handler forwards to the underlying URL writer. */
function makeState(pageIndex: number, pageSize: number) {
	const onPaginationChange = vi.fn<OnChangeFn<PaginationState>>();
	return {
		state: {
			sorting: [],
			pagination: { pageIndex, pageSize },
			columnFilters: [],
			onSortingChange: vi.fn(),
			onPaginationChange,
			onColumnFiltersChange: vi.fn(),
		},
		onPaginationChange,
	};
}

describe("withDeepLinkPage", () => {
	it("returns the state untouched when there's no row to jump to", () => {
		const { state } = makeState(0, 20);
		expect(withDeepLinkPage(state, -1)).toBe(state);
		expect(withDeepLinkPage(state, null)).toBe(state);
		expect(withDeepLinkPage(state, undefined)).toBe(state);
	});

	it("opens the page that contains the row's index", () => {
		const { state } = makeState(0, 20);
		// index 45 → page 2 (rows 40–59)
		expect(withDeepLinkPage(state, 45).pagination).toEqual({
			pageIndex: 2,
			pageSize: 20,
		});
		// index 19 → still page 0
		expect(withDeepLinkPage(state, 19).pagination.pageIndex).toBe(0);
		// index 20 → page 1
		expect(withDeepLinkPage(state, 20).pagination.pageIndex).toBe(1);
	});

	it("honours a non-default page size", () => {
		const { state } = makeState(0, 50);
		expect(withDeepLinkPage(state, 120).pagination.pageIndex).toBe(2);
	});

	it("returns the state untouched when the row is already on the current page", () => {
		const { state } = makeState(2, 20);
		// index 45 → page 2, which is already the active page: no override needed
		expect(withDeepLinkPage(state, 45)).toBe(state);
	});

	it("rebases a functional pagination update off the overridden page", () => {
		const { state, onPaginationChange } = makeState(0, 20);
		const next = withDeepLinkPage(state, 45); // overridden to page 2
		const advance: Updater<PaginationState> = (prev) => ({
			...prev,
			pageIndex: prev.pageIndex + 1,
		});
		next.onPaginationChange(advance);
		// "next page" from the page the user is viewing (2) → 3, not URL page 0 → 1
		expect(onPaginationChange).toHaveBeenCalledWith({
			pageIndex: 3,
			pageSize: 20,
		});
	});

	it("forwards a value pagination update unchanged", () => {
		const { state, onPaginationChange } = makeState(0, 20);
		const next = withDeepLinkPage(state, 45);
		next.onPaginationChange({ pageIndex: 5, pageSize: 50 });
		expect(onPaginationChange).toHaveBeenCalledWith({
			pageIndex: 5,
			pageSize: 50,
		});
	});

	it("invokes onUserPaginate when the overridden handler is called", () => {
		const { state } = makeState(0, 20);
		const onUserPaginate = vi.fn();
		const next = withDeepLinkPage(state, 45, onUserPaginate);
		expect(onUserPaginate).not.toHaveBeenCalled();
		next.onPaginationChange({ pageIndex: 1, pageSize: 20 });
		expect(onUserPaginate).toHaveBeenCalledTimes(1);
	});

	it("does not install an override (or fire onUserPaginate) when there's no jump", () => {
		const { state } = makeState(0, 20);
		const onUserPaginate = vi.fn();
		// row already on the current page → state returned untouched
		const next = withDeepLinkPage(state, 5, onUserPaginate);
		expect(next).toBe(state);
		next.onPaginationChange({ pageIndex: 1, pageSize: 20 });
		expect(onUserPaginate).not.toHaveBeenCalled();
	});
});

describe("useDeepLinkPage", () => {
	it("applies the row's page once, then yields after the user paginates", () => {
		const { state } = makeState(0, 20);
		// index 45 → page 2
		const { result, rerender } = renderHook(
			({ rowIndex }) => useDeepLinkPage(state, rowIndex),
			{ initialProps: { rowIndex: 45 } },
		);
		expect(result.current.pagination.pageIndex).toBe(2);

		// User pages away (e.g. back to page 1). The override yields permanently...
		act(() => {
			result.current.onPaginationChange({ pageIndex: 0, pageSize: 20 });
		});
		// ...so even with the same deep-link index it no longer forces page 2 — the
		// always-present highlight can't bounce the user back.
		rerender({ rowIndex: 45 });
		expect(result.current.pagination.pageIndex).toBe(0);
	});
});
