import type { Table as TanStackTable } from "@tanstack/react-table";
import { exportTableCSV, exportTableJSON } from "@/lib/export";

interface ExportButtonsProps<TData> {
	table: TanStackTable<TData>;
	filename: string;
}

export function ExportButtons<TData>({
	table,
	filename,
}: ExportButtonsProps<TData>) {
	const getRows = () =>
		table
			.getSortedRowModel()
			.rows.map((r) => r.original as unknown as Record<string, unknown>);

	return (
		<div className="flex gap-1">
			<button
				type="button"
				onClick={() => exportTableCSV(table, getRows(), `${filename}.csv`)}
				className="px-2 py-1 text-xs bg-secondary text-secondary-foreground border border-border rounded hover:bg-accent"
			>
				CSV
			</button>
			<button
				type="button"
				onClick={() => exportTableJSON(table, getRows(), `${filename}.json`)}
				className="px-2 py-1 text-xs bg-secondary text-secondary-foreground border border-border rounded hover:bg-accent"
			>
				JSON
			</button>
		</div>
	);
}
