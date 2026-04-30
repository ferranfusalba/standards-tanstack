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
}: UseTableUrlStateOptions): TableUrlState {
	const sortKey = key(prefix, "sort");
	const pageKey = key(prefix, "page");
	const sizeKey = key(prefix, "size");
	const filterKey = key(prefix, "f");

	const sorting = React.useMemo(
		() => parseSorting(search[sortKey] as string | undefined),
		[search, sortKey],
	);
	const pagination = React.useMemo(
		() => parsePagination(search[pageKey], search[sizeKey], defaultPageSize),
		[search, pageKey, sizeKey, defaultPageSize],
	);
	const columnFilters = React.useMemo(
		() => (includeColumnFilters ? parseColumnFilters(search[filterKey]) : []),
		[search, filterKey, includeColumnFilters],
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
