function downloadFile(content: string, filename: string, mimeType: string) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function exportRowsCSV(
	rows: Record<string, unknown>[],
	filename: string,
) {
	if (rows.length === 0) return;
	const keys = Object.keys(rows[0]);
	const header = keys.join(",");
	const lines = rows.map((row) =>
		keys
			.map((k) => {
				const val = row[k];
				if (val === null || val === undefined) return '""';
				if (typeof val === "object")
					return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
				return `"${String(val).replace(/"/g, '""')}"`;
			})
			.join(","),
	);
	downloadFile([header, ...lines].join("\n"), filename, "text/csv");
}

export function exportRowsJSON(
	rows: Record<string, unknown>[],
	filename: string,
) {
	downloadFile(JSON.stringify(rows, null, 2), filename, "application/json");
}
