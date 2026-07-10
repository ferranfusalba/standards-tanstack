// Format-detection + parsing for uploaded country/currency/language/timezone
// lists. Pure and synchronous: the caller reads the file text (e.g. File.text())
// and hands it here, so nothing here touches the filesystem or the network.

export type UploadFormat = "json" | "csv";

export interface ParsedUpload {
	format: UploadFormat;
	records: Record<string, unknown>[];
}

/** Thrown for any malformed/empty upload, with a message safe to show users. */
export class CompareParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "CompareParseError";
	}
}

/** Decide JSON vs CSV from the filename extension, falling back to sniffing. */
export function detectFormat(filename: string, text: string): UploadFormat {
	const lower = filename.toLowerCase();
	if (lower.endsWith(".json")) return "json";
	if (lower.endsWith(".csv")) return "csv";
	const trimmed = text.trimStart();
	return trimmed.startsWith("{") || trimmed.startsWith("[") ? "json" : "csv";
}

/**
 * Tokenize CSV text into rows of raw string cells. Handles quoted fields with
 * embedded commas, newlines, and "" escaped quotes (RFC 4180), plus CRLF line
 * endings. Returns one array per record line; the header row is rows[0].
 */
function tokenizeCSV(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let inQuotes = false;
	let i = 0;
	const n = text.length;

	while (i < n) {
		const c = text[i];
		if (inQuotes) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i += 2;
					continue;
				}
				inQuotes = false;
				i++;
				continue;
			}
			field += c;
			i++;
			continue;
		}
		if (c === '"') {
			inQuotes = true;
			i++;
			continue;
		}
		if (c === ",") {
			row.push(field);
			field = "";
			i++;
			continue;
		}
		if (c === "\r") {
			i++;
			continue; // CRLF: drop the \r, the \n ends the row
		}
		if (c === "\n") {
			row.push(field);
			rows.push(row);
			row = [];
			field = "";
			i++;
			continue;
		}
		field += c;
		i++;
	}
	// Flush a trailing record that wasn't terminated by a newline.
	if (field.length > 0 || row.length > 0) {
		row.push(field);
		rows.push(row);
	}
	return rows;
}

export function parseCSV(text: string): Record<string, string>[] {
	const rows = tokenizeCSV(text);
	const headerRow = rows[0];
	if (!headerRow) return [];
	const headers = headerRow.map((h) => h.trim());
	if (headers.every((h) => h === "")) {
		throw new CompareParseError("CSV is missing a header row.");
	}
	const records: Record<string, string>[] = [];
	for (let r = 1; r < rows.length; r++) {
		const cells = rows[r];
		if (!cells) continue;
		if (cells.every((c) => c.trim() === "")) continue; // skip blank lines
		const record: Record<string, string> = {};
		headers.forEach((header, idx) => {
			if (header) record[header] = cells[idx] ?? "";
		});
		records.push(record);
	}
	return records;
}

const ARRAY_WRAPPER_KEYS = [
	"data",
	"items",
	"records",
	"results",
	"rows",
	"countries",
	"currencies",
	"languages",
	"timezones",
];

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * Find a records array inside a wrapper object: either a known wrapper key
 * (`{ data: [...] }`) or a single-property object whose one value is an array.
 * Multi-key objects are left alone — they're treated as keyed dictionaries.
 */
function findRecordArray(root: unknown): unknown[] | null {
	if (!isRecord(root)) return null;
	for (const key of ARRAY_WRAPPER_KEYS) {
		if (Array.isArray(root[key])) return root[key] as unknown[];
	}
	const keys = Object.keys(root);
	const firstKey = keys[0];
	if (keys.length === 1 && firstKey && Array.isArray(root[firstKey])) {
		return root[firstKey] as unknown[];
	}
	return null;
}

/**
 * Expand a keyed dictionary into records, keeping the key as its own `key`
 * column so it can be matched or mapped. Handles both shapes:
 *   { "America/New_York": "Eastern" }      -> { key, value }
 *   { "US": { name: "United States" } }    -> { key, ...fields }
 */
function objectToRecords(
	obj: Record<string, unknown>,
): Record<string, unknown>[] {
	return Object.entries(obj).map(([key, value]) =>
		isRecord(value) ? { key, ...value } : { key, value },
	);
}

export function parseJSONRecords(text: string): Record<string, unknown>[] {
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch (err) {
		const detail = err instanceof Error ? err.message : "invalid JSON";
		throw new CompareParseError(`Could not parse JSON: ${detail}`);
	}
	if (Array.isArray(data)) return data.filter(isRecord);
	if (isRecord(data)) {
		const wrapped = findRecordArray(data);
		return wrapped ? wrapped.filter(isRecord) : objectToRecords(data);
	}
	throw new CompareParseError(
		"JSON must be an array of records, an object of records keyed by id, or an object wrapping a records array.",
	);
}

export function parseUpload(
	text: string,
	opts: { filename?: string; format?: UploadFormat } = {},
): ParsedUpload {
	if (text.trim() === "") {
		throw new CompareParseError("The file is empty.");
	}
	const format = opts.format ?? detectFormat(opts.filename ?? "", text);
	const records = format === "json" ? parseJSONRecords(text) : parseCSV(text);
	if (records.length === 0) {
		throw new CompareParseError("No records were found in the file.");
	}
	return { format, records };
}
