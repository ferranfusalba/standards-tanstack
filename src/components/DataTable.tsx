import {
	type Column,
	flexRender,
	type Row,
	type Table as TanStackTable,
} from "@tanstack/react-table";
import { Info } from "lucide-react";
import React from "react";
import { ColumnFilter } from "@/components/ColumnFilter";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataTableProps<TData> {
	table: TanStackTable<TData>;
	cellClassName?: (columnId: string, row: Row<TData>) => string;
	headerClassName?: (columnId: string) => string;
	renderExpandedRow?: (row: Row<TData>) => React.ReactNode;
	/** Optional per-column data-source label, keyed by column id. When provided,
	 *  a second header row renders the source (e.g. issuing standard/org) beneath
	 *  each column title. Columns absent from the map render a blank source cell. */
	columnSources?: Record<string, string>;
	/** Optional metadata per source label (the values of `columnSources`), keyed
	 *  by label so a standard shared by several columns (e.g. "ISO 3166-1") is
	 *  defined once. `href` turns the label into a link to its authoritative
	 *  reference; `note` adds an info-tooltip beside it (e.g. a section/page). */
	sourceMeta?: Record<string, { href?: string; note?: string }>;
}

const stickyFirstCol =
	"sticky left-0 z-10 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-border";

/** Extra width reserved on sortable columns so the sort indicator (🔼/🔽) sits
 *  on the header's line instead of wrapping below the label. */
const SORT_INDICATOR_WIDTH = 28;

function columnWidth<TData>(column: Column<TData, unknown>): number {
	return column.getSize() + (column.getCanSort() ? SORT_INDICATOR_WIDTH : 0);
}

export function DataTable<TData>({
	table,
	cellClassName,
	headerClassName,
	renderExpandedRow,
	columnSources,
	sourceMeta,
}: DataTableProps<TData>) {
	const headerGroups = table.getHeaderGroups();
	const sourceHeaders = headerGroups[headerGroups.length - 1]?.headers ?? [];
	const showSourceRow =
		!!columnSources &&
		sourceHeaders.some((header) => columnSources[header.column.id]);
	return (
		<div className="overflow-x-auto rounded-lg border border-border">
			<table className="w-full text-sm">
				<thead className="bg-secondary text-secondary-foreground">
					{headerGroups.map((headerGroup) => (
						<tr key={headerGroup.id} className="h-12.5">
							{headerGroup.headers.map((header, index) => {
								const filterable =
									(
										header.column.columnDef.meta as
											| { filterable?: boolean }
											| undefined
									)?.filterable === true;
								const width = columnWidth(header.column);
								return (
									<th
										key={header.id}
										className={`px-2 py-2 md:px-4 md:py-3 text-left border-r border-black/20 dark:border-white/20 last:border-r-0 ${index === 0 ? `${stickyFirstCol} bg-secondary` : ""} ${headerClassName?.(header.column.id) ?? ""}`}
										style={{
											width,
											minWidth: width,
											maxWidth: width,
										}}
									>
										{header.isPlaceholder ? null : (
											<div className="flex items-center gap-1 justify-between">
												{/* biome-ignore lint/a11y/noStaticElementInteractions: role is conditionally set for sortable columns */}
												<div
													className={
														header.column.getCanSort()
															? "cursor-pointer select-none flex items-center gap-2 whitespace-nowrap"
															: ""
													}
													role={
														header.column.getCanSort() ? "button" : undefined
													}
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
														asc: <span>{"\u{1F53C}"}</span>,
														desc: <span>{"\u{1F53D}"}</span>,
													}[header.column.getIsSorted() as string] ?? null}
												</div>
												{filterable && <ColumnFilter column={header.column} />}
											</div>
										)}
									</th>
								);
							})}
						</tr>
					))}
					{showSourceRow && (
						<tr className="text-xs font-normal text-muted-foreground">
							{sourceHeaders.map((header, index) => {
								const width = columnWidth(header.column);
								const source = columnSources?.[header.column.id];
								const meta = source ? sourceMeta?.[source] : undefined;
								return (
									<th
										key={`${header.id}-source`}
										className={`px-2 pb-2 md:px-4 md:pb-3 align-top text-left font-normal border-r border-black/20 dark:border-white/20 last:border-r-0 ${index === 0 ? `${stickyFirstCol} bg-secondary` : ""} ${headerClassName?.(header.column.id) ?? ""}`}
										style={{
											width,
											minWidth: width,
											maxWidth: width,
										}}
									>
										{header.isPlaceholder || !source ? null : (
											<span className="inline-flex items-center gap-1">
												{meta?.href ? (
													<a
														href={meta.href}
														target="_blank"
														rel="noopener noreferrer"
														className="underline decoration-dotted underline-offset-2 hover:text-foreground transition-colors"
													>
														{source}
													</a>
												) : (
													source
												)}
												{meta?.note && (
													<Tooltip>
														<TooltipTrigger asChild>
															<button
																type="button"
																aria-label={`About ${source}`}
																className="text-muted-foreground/60 hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
															>
																<Info className="size-3" />
															</button>
														</TooltipTrigger>
														<TooltipContent className="text-xs">
															{meta.note}
														</TooltipContent>
													</Tooltip>
												)}
											</span>
										)}
									</th>
								);
							})}
						</tr>
					)}
				</thead>
				<tbody className="divide-y divide-border">
					{table.getRowModel().rows.map((row) => (
						<React.Fragment key={row.id}>
							<tr className="group/row hover:bg-accent transition-colors h-12.5">
								{row.getVisibleCells().map((cell, index) => {
									const width = columnWidth(cell.column);
									return (
										<td
											key={cell.id}
											className={`px-2 py-1 md:px-4 md:py-1 h-12.5 align-middle ${index === 0 ? `${stickyFirstCol} bg-background group-hover/row:bg-accent transition-colors` : ""} ${cellClassName?.(cell.column.id, cell.row) ?? ""}`}
											style={{
												width,
												minWidth: width,
												maxWidth: width,
											}}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									);
								})}
							</tr>
							{row.getIsExpanded() && renderExpandedRow?.(row)}
						</React.Fragment>
					))}
				</tbody>
			</table>
		</div>
	);
}
