import type { Table as TanStackTable } from "@tanstack/react-table";

interface PaginationProps<TData> {
	table: TanStackTable<TData>;
	totalItems: number;
}

export const SHOW_ALL_SIZE = 100_000;

export function getPageSizeOptions(pageSize: number, totalItems: number) {
	const showingAll = pageSize >= totalItems;
	const pageSizeOptions = [10, 20, 50, 100].filter((size) => size < totalItems);
	if (!showingAll && !pageSizeOptions.includes(pageSize)) {
		pageSizeOptions.push(pageSize);
		pageSizeOptions.sort((a, b) => a - b);
	}
	return { showingAll, pageSizeOptions };
}

export function Pagination<TData>({
	table,
	totalItems,
}: PaginationProps<TData>) {
	const { pageSize } = table.getState().pagination;
	const { showingAll, pageSizeOptions } = getPageSizeOptions(
		pageSize,
		totalItems,
	);
	return (
		<div className="flex items-center justify-between mt-4">
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => table.setPageIndex(0)}
					disabled={!table.getCanPreviousPage()}
					className="px-3 py-1 bg-secondary text-secondary-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
					aria-label="First page"
				>
					{"<<"}
				</button>
				<button
					type="button"
					onClick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
					className="px-3 py-1 bg-secondary text-secondary-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
					aria-label="Previous page"
				>
					{"<"}
				</button>
				<button
					type="button"
					onClick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
					className="px-3 py-1 bg-secondary text-secondary-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
					aria-label="Next page"
				>
					{">"}
				</button>
				<button
					type="button"
					onClick={() => table.setPageIndex(table.getPageCount() - 1)}
					disabled={!table.getCanNextPage()}
					className="px-3 py-1 bg-secondary text-secondary-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
					aria-label="Last page"
				>
					{">>"}
				</button>
			</div>
			<span className="text-sm text-muted-foreground">
				{table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
			</span>
			<select
				value={showingAll ? "all" : String(pageSize)}
				onChange={(e) => {
					const value = e.target.value;
					table.setPageSize(value === "all" ? SHOW_ALL_SIZE : Number(value));
				}}
				className="px-3 py-1 bg-secondary text-secondary-foreground rounded"
			>
				{pageSizeOptions.map((size) => (
					<option key={size} value={size}>
						{`Show ${size}`}
					</option>
				))}
				<option value="all">Show All</option>
			</select>
		</div>
	);
}
