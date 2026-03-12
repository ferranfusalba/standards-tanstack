import {
	flexRender,
	type Row,
	type Table as TanStackTable,
} from "@tanstack/react-table";
import React from "react";

interface DataTableProps<TData> {
	table: TanStackTable<TData>;
	cellClassName?: (columnId: string, row: Row<TData>) => string;
	headerClassName?: (columnId: string) => string;
	renderExpandedRow?: (row: Row<TData>) => React.ReactNode;
}

export function DataTable<TData>({
	table,
	cellClassName,
	headerClassName,
	renderExpandedRow,
}: DataTableProps<TData>) {
	return (
		<div className="overflow-x-auto rounded-lg border border-border">
			<table className="w-full text-sm">
				<thead className="bg-secondary text-secondary-foreground">
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<th
									key={header.id}
									className={`px-4 py-3 text-left ${headerClassName?.(header.column.id) ?? ""}`}
									style={{
										width: header.column.getSize(),
										minWidth: header.column.getSize(),
										maxWidth: header.column.getSize(),
									}}
								>
									{header.isPlaceholder ? null : (
										// biome-ignore lint/a11y/noStaticElementInteractions: role is conditionally set for sortable columns
										<div
											className={
												header.column.getCanSort()
													? "cursor-pointer select-none flex items-center gap-2"
													: ""
											}
											role={header.column.getCanSort() ? "button" : undefined}
											tabIndex={header.column.getCanSort() ? 0 : undefined}
											onClick={header.column.getToggleSortingHandler()}
											onKeyDown={(e) => {
												if (
													header.column.getCanSort() &&
													(e.key === "Enter" || e.key === " ")
												) {
													e.preventDefault();
													header.column.getToggleSortingHandler()?.(e);
												}
											}}
										>
											{flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
											{{
												asc: " \u{1F53C}",
												desc: " \u{1F53D}",
											}[header.column.getIsSorted() as string] ?? null}
										</div>
									)}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody className="divide-y divide-border">
					{table.getRowModel().rows.map((row) => (
						<React.Fragment key={row.id}>
							<tr className="hover:bg-accent transition-colors">
								{row.getVisibleCells().map((cell) => (
									<td
										key={cell.id}
										className={`px-4 py-3 whitespace-nowrap ${cellClassName?.(cell.column.id, cell.row) ?? ""}`}
										style={{
											width: cell.column.getSize(),
											minWidth: cell.column.getSize(),
											maxWidth: cell.column.getSize(),
										}}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
							{row.getIsExpanded() && renderExpandedRow?.(row)}
						</React.Fragment>
					))}
				</tbody>
			</table>
		</div>
	);
}
