// Tier 0 import-and-compare: deterministic, AI-free diffing of a user's uploaded
// list against the app's canonical reference data. The whole comparison runs in
// the browser — uploaded data never leaves the user's device.

export type DatasetKey = "countries" | "currencies" | "languages" | "timezones";

export type RowStatus =
	| "identical" // matched to one of ours; every field they provided agrees
	| "changed" // matched to one of ours; at least one provided field differs
	| "missing" // in our data, absent from their file
	| "extra"; // in their file, with no match in our data

/** How a their-row was reconciled to one of ours. */
export type MatchedBy = "key" | "name" | "semantic" | null;

/** A single field that differs between a matched pair. */
export interface FieldDiff {
	field: string; // canonical field name (e.g. "alpha2Code")
	label: string; // human label (e.g. "Alpha-2")
	ours: string; // our value, display form
	theirs: string; // their value, display form
}

/** One row of the comparison: either a reconciled pair, a missing, or an extra. */
export interface RowComparison {
	id: string; // stable, unique row id
	status: RowStatus;
	key: string; // primary-key value (ours when matched/missing, theirs when extra)
	name: string; // display name
	matchedBy: MatchedBy;
	matchedField?: string; // which key field matched (when matchedBy === "key")
	diffs: FieldDiff[];
	ourRow?: Record<string, unknown>;
	theirRow?: Record<string, unknown>;
}

/** Result of mapping the upload's column headers onto canonical fields. */
export interface ColumnMapping {
	/** Upload header -> canonical field it was recognized as. */
	mapped: Record<string, string>;
	/** Upload headers we couldn't recognize. */
	unmapped: string[];
}

/** One matching strategy: join on a canonical field, exactly or by similarity. */
export interface MatchSpec {
	field: string;
	mode: "exact" | "fuzzy";
}

/**
 * A user-editable plan for lining an upload up against our data. The comparison
 * is driven entirely by this — never by column names — so the user can point any
 * column at any field and choose what to match on after seeing the first guess.
 */
export interface CompareSpec {
	/** Canonical field -> the uploaded header that feeds it. */
	mapping: Record<string, string>;
	/** The primary join strategy the user picks. */
	primary: MatchSpec;
}

export interface CompareSummary {
	total: number; // total comparison rows
	identical: number;
	changed: number;
	missing: number;
	extra: number;
	theirCount: number; // records parsed from the upload
	ourCount: number; // canonical records
}

export interface CompareResult {
	dataset: DatasetKey;
	rows: RowComparison[];
	summary: CompareSummary;
	columns: ColumnMapping;
}
