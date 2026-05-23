import type { Table as TanStackTable } from "@tanstack/react-table";
import { exportRowsCSV, exportRowsJSON } from "@/lib/export";

interface ExportButtonsProps<TData> {
	table: TanStackTable<TData>;
	filename: string;
	/** May be async — e.g. to fetch extra data only when the user exports. */
	transformRows?: (
		rows: Record<string, unknown>[],
	) => Record<string, unknown>[] | Promise<Record<string, unknown>[]>;
}

export function ExportButtons<TData>({
	table,
	filename,
	transformRows,
}: ExportButtonsProps<TData>) {
	const getRows = async () => {
		const visibleKeys = new Set(table.getVisibleLeafColumns().map((c) => c.id));
		const raw = table
			.getSortedRowModel()
			.rows.map((r) => r.original as unknown as Record<string, unknown>);
		const filtered = raw.map((row) => {
			const obj: Record<string, unknown> = {};
			for (const k of visibleKeys) {
				if (k in row) obj[k] = row[k];
			}
			return obj;
		});
		return transformRows ? await transformRows(filtered) : filtered;
	};

	return (
		<div className="flex gap-1">
			<button
				type="button"
				onClick={async () => exportRowsCSV(await getRows(), `${filename}.csv`)}
				className="px-2 py-1 text-xs bg-secondary text-secondary-foreground border border-border rounded hover:bg-accent"
			>
				CSV
			</button>
			<button
				type="button"
				onClick={async () =>
					exportRowsJSON(await getRows(), `${filename}.json`)
				}
				className="px-2 py-1 text-xs bg-secondary text-secondary-foreground border border-border rounded hover:bg-accent"
			>
				JSON
			</button>
		</div>
	);
}
