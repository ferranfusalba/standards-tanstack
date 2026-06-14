import type {
	ColumnFiltersState,
	OnChangeFn,
	PaginationState,
	SortingState,
} from "@tanstack/react-table";
import React from "react";
import {
	DEFAULT_PAGE_SIZE,
	parseColumnFilters,
	parsePagination,
	parseSorting,
	serializeColumnFilters,
	serializePage,
	serializeSize,
	serializeSorting,
} from "@/lib/url-state";

type SearchRecord = Record<string, unknown>;

type Navigate = (opts: {
	search: (prev: SearchRecord) => SearchRecord;
	replace?: boolean;
}) => void | Promise<void>;

interface UseTableUrlStateOptions {
	prefix: string;
	search: SearchRecord;
	navigate: Navigate;
	defaultPageSize?: number;
	includeColumnFilters?: boolean;
	sizeKey?: string;
}

interface TableUrlState {
	sorting: SortingState;
	pagination: PaginationState;
	columnFilters: ColumnFiltersState;
	onSortingChange: OnChangeFn<SortingState>;
	onPaginationChange: OnChangeFn<PaginationState>;
	onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
}

function key(prefix: string, name: string) {
	return prefix ? `${prefix}_${name}` : name;
}

function applyUpdater<T>(updater: T | ((prev: T) => T), prev: T): T {
	return typeof updater === "function"
		? (updater as (p: T) => T)(prev)
		: updater;
}

export function useTableUrlState({
	prefix,
	search,
	navigate,
	defaultPageSize = DEFAULT_PAGE_SIZE,
	includeColumnFilters = false,
	sizeKey: sharedSizeKey,
}: UseTableUrlStateOptions): TableUrlState {
	const sortKey = key(prefix, "sort");
	const pageKey = key(prefix, "page");
	const sizeKey = sharedSizeKey ?? key(prefix, "size");
	const filterKey = key(prefix, "f");

	const sortValue = search[sortKey];
	const pageValue = search[pageKey];
	const sizeValue = search[sizeKey];
	const filterValue = search[filterKey];
	const sorting = React.useMemo(
		() => parseSorting(sortValue as string | undefined),
		[sortValue],
	);
	const pagination = React.useMemo(
		() => parsePagination(pageValue, sizeValue, defaultPageSize),
		[pageValue, sizeValue, defaultPageSize],
	);
	const columnFilters = React.useMemo(
		() => (includeColumnFilters ? parseColumnFilters(filterValue) : []),
		[filterValue, includeColumnFilters],
	);

	const onSortingChange: OnChangeFn<SortingState> = (updater) => {
		const next = applyUpdater(updater, sorting);
		navigate({
			search: (prev) => ({ ...prev, [sortKey]: serializeSorting(next) }),
			replace: true,
		});
	};

	const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
		const next = applyUpdater(updater, pagination);
		navigate({
			search: (prev) => ({
				...prev,
				[pageKey]: serializePage(next.pageIndex),
				[sizeKey]: serializeSize(next.pageSize, defaultPageSize),
			}),
			replace: true,
		});
	};

	const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
		if (!includeColumnFilters) return;
		const next = applyUpdater(updater, columnFilters);
		navigate({
			search: (prev) => ({
				...prev,
				[filterKey]: serializeColumnFilters(next),
				// Reset to first page when filters change
				[pageKey]: undefined,
			}),
			replace: true,
		});
	};

	return {
		sorting,
		pagination,
		columnFilters,
		onSortingChange,
		onPaginationChange,
		onColumnFiltersChange,
	};
}

/**
 * Open a paginated table directly on the page that holds a deep-linked row.
 *
 * When a cross-view link arrives with a `highlight` (and no explicit page in the
 * URL), the destination should land on the row's page instead of page 1. We do
 * this as *derived* state rather than an imperative `table.setPageIndex()` in a
 * mount effect: navigating from a mount effect races the URL-controlled pagination
 * round-trip and gets dropped/clobbered for pages 2+. Feeding the page straight
 * into the table's controlled state can't be undone that way.
 *
 * Pass the highlighted row's index within the table's (unsorted) data, or a
 * negative/nullish value when there's nothing to jump to. The returned state
 * overrides `pagination` and rebases `onPaginationChange` so a subsequent page
 * click still computes from the page the user is actually viewing. `onUserPaginate`
 * fires on that first click — callers use it to stop overriding (see
 * {@link useDeepLinkPage}), otherwise the always-present `highlight` would bounce
 * the user back to the row's page every time they returned to page 1.
 */
export function withDeepLinkPage(
	state: TableUrlState,
	rowIndex: number | null | undefined,
	onUserPaginate?: () => void,
): TableUrlState {
	if (rowIndex == null || rowIndex < 0) return state;
	const pageIndex = Math.floor(rowIndex / state.pagination.pageSize);
	if (pageIndex === state.pagination.pageIndex) return state;
	const pagination: PaginationState = { ...state.pagination, pageIndex };
	const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
		onUserPaginate?.();
		state.onPaginationChange(applyUpdater(updater, pagination));
	};
	return { ...state, pagination, onPaginationChange };
}

/**
 * Stateful wrapper around {@link withDeepLinkPage} that applies the deep-link page
 * exactly once: the override holds until the user first touches pagination, then
 * yields permanently so they can page freely (including back to page 1) even while
 * the `highlight` stays in the URL for its styling.
 *
 * `rowIndex` is the highlighted row's index in the table's data (memoize it in the
 * caller, returning a negative value when there's nothing to jump to).
 */
export function useDeepLinkPage(
	state: TableUrlState,
	rowIndex: number,
): TableUrlState {
	const [tookOver, setTookOver] = React.useState(false);
	return withDeepLinkPage(state, tookOver ? -1 : rowIndex, () =>
		setTookOver(true),
	);
}

interface UseGlobalFilterSyncOptions {
	search: SearchRecord;
	navigate: Navigate;
	paramKey?: string;
	debounceMs?: number;
}

export function useGlobalFilterSync({
	search,
	navigate,
	paramKey = "q",
	debounceMs = 250,
}: UseGlobalFilterSyncOptions): [string, (value: string) => void] {
	const urlValue =
		typeof search[paramKey] === "string" ? (search[paramKey] as string) : "";
	const [value, setValue] = React.useState(urlValue);

	// Sync URL → local state when the URL changes externally (back/forward)
	React.useEffect(() => {
		setValue((current) => (current === urlValue ? current : urlValue));
	}, [urlValue]);

	// Debounced local → URL
	React.useEffect(() => {
		if (value === urlValue) return;
		const timer = setTimeout(() => {
			navigate({
				search: (prev) => ({
					...prev,
					[paramKey]: value.length > 0 ? value : undefined,
				}),
				replace: true,
			});
		}, debounceMs);
		return () => clearTimeout(timer);
	}, [value, urlValue, navigate, paramKey, debounceMs]);

	return [value, setValue];
}
