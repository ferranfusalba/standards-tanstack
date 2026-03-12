import type { Table as TanStackTable } from "@tanstack/react-table";
import React from "react";

interface ColumnVisibilityProps<TData> {
	table: TanStackTable<TData>;
}

export function ColumnVisibility<TData>({
	table,
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

	const hasHiddenColumns = toggleableColumns.some(
		(col) => !col.getIsVisible(),
	);

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
				<div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-border bg-background shadow-lg">
					<div className="p-2 space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto">
						{toggleableColumns.map((column) => (
							<label
								key={column.id}
								className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-sm"
							>
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
						))}
						<div className="flex gap-1 mt-1 pt-1 border-t border-border">
							<button
								type="button"
								onClick={() => {
									for (const col of toggleableColumns) {
										col.toggleVisibility(false);
									}
								}}
								className="flex-1 px-2 py-1 text-xs rounded hover:bg-accent text-muted-foreground text-left"
							>
								Hide all
							</button>
							{hasHiddenColumns && (
								<button
									type="button"
									onClick={() => table.resetColumnVisibility()}
									className="flex-1 px-2 py-1 text-xs rounded hover:bg-accent text-muted-foreground text-left"
								>
									Reset
								</button>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
