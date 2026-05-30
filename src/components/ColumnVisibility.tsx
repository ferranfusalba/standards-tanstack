import type { Table as TanStackTable } from "@tanstack/react-table";
import React from "react";

interface ColumnVisibilityProps<TData> {
	table: TanStackTable<TData>;
	/** Render extra content after a specific column ID (e.g. sub-checkboxes) */
	extraItems?: { afterColumnId: string; render: () => React.ReactNode }[];
}

export function ColumnVisibility<TData>({
	table,
	extraItems,
}: ColumnVisibilityProps<TData>) {
	const [open, setOpen] = React.useState(false);
	const ref = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		if (open) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [open]);

	const toggleableColumns = table
		.getAllLeafColumns()
		.filter((col) => col.getCanHide());

	const hasHiddenColumns = toggleableColumns.some((col) => !col.getIsVisible());
	const hasVisibleColumns = toggleableColumns.some((col) => col.getIsVisible());
	// Bulk actions only earn their keep on longer lists.
	const showBulkActions = toggleableColumns.length >= 4;

	if (toggleableColumns.length === 0) return null;

	return (
		<div ref={ref} className="relative inline-block">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="px-3 py-1 bg-secondary text-secondary-foreground rounded border border-border hover:bg-accent text-sm"
			>
				Columns
			</button>
			{open && (
				<div className="absolute right-0 z-10 mt-1 flex max-h-[calc(100vh-8rem)] w-48 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg">
					<div className="p-2 space-y-1 min-h-0 overflow-y-auto">
						{toggleableColumns.map((column) => (
							<React.Fragment key={column.id}>
								<label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-sm">
									<input
										type="checkbox"
										checked={column.getIsVisible()}
										onChange={column.getToggleVisibilityHandler()}
										className="rounded"
									/>
									<span className="truncate">
										{typeof column.columnDef.header === "string"
											? column.columnDef.header
											: column.id}
									</span>
								</label>
								{extraItems
									?.filter((item) => item.afterColumnId === column.id)
									.map((item) => item.render())}
							</React.Fragment>
						))}
					</div>
					{showBulkActions && (
						<div className="flex border-t border-border text-xs">
							<button
								type="button"
								onClick={() => {
									for (const col of toggleableColumns) {
										col.toggleVisibility(true);
									}
								}}
								disabled={!hasHiddenColumns}
								className="flex-1 px-2 py-1.5 text-center text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
							>
								Select all
							</button>
							<button
								type="button"
								onClick={() => {
									for (const col of toggleableColumns) {
										col.toggleVisibility(false);
									}
								}}
								disabled={!hasVisibleColumns}
								className="flex-1 border-l border-border px-2 py-1.5 text-center text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
							>
								Reset values
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
