import type { Table as TanStackTable } from "@tanstack/react-table";

interface PaginationProps<TData> {
	table: TanStackTable<TData>;
	totalItems: number;
}

export function Pagination<TData>({
	table,
	totalItems,
}: PaginationProps<TData>) {
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
				value={table.getState().pagination.pageSize}
				onChange={(e) => table.setPageSize(Number(e.target.value))}
				className="px-3 py-1 bg-secondary text-secondary-foreground rounded"
			>
				{[10, 20, 50, 100, totalItems].map((pageSize) => (
					<option key={pageSize} value={pageSize}>
						{pageSize === totalItems ? "Show All" : `Show ${pageSize}`}
					</option>
				))}
			</select>
		</div>
	);
}
