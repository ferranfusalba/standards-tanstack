function downloadFile(content: string, filename: string, mimeType: string) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function getVisibleKeys<TData>(
	table: { getVisibleLeafColumns: () => { id: string }[] },
	rows: TData[],
): string[] {
	const cols = table.getVisibleLeafColumns().map((c) => c.id);
	if (rows.length === 0) return cols;
	const dataKeys = new Set(Object.keys(rows[0] as Record<string, unknown>));
	return cols.filter((c) => dataKeys.has(c));
}

export function exportTableCSV<TData extends Record<string, unknown>>(
	table: { getVisibleLeafColumns: () => { id: string }[] },
	rows: TData[],
	filename: string,
) {
	const keys = getVisibleKeys(table, rows);
	const header = keys.join(",");
	const lines = rows.map((row) =>
		keys
			.map((k) => {
				const val = row[k];
				if (Array.isArray(val)) return `"${val.join(",")}"`;
				if (val === null || val === undefined) return '""';
				return `"${String(val)}"`;
			})
			.join(","),
	);
	downloadFile([header, ...lines].join("\n"), filename, "text/csv");
}

export function exportTableJSON<TData extends Record<string, unknown>>(
	table: { getVisibleLeafColumns: () => { id: string }[] },
	rows: TData[],
	filename: string,
) {
	const keys = getVisibleKeys(table, rows);
	const filtered = rows.map((row) => {
		const obj: Record<string, unknown> = {};
		for (const k of keys) obj[k] = row[k];
		return obj;
	});
	downloadFile(JSON.stringify(filtered, null, 2), filename, "application/json");
}
