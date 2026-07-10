import { rankItem, rankings } from "@tanstack/match-sorter-utils";
import {
	aliasLookup,
	type DatasetConfig,
	type FieldConfig,
	normalizeHeader,
} from "./dataset-config";
import type {
	ColumnMapping,
	CompareResult,
	CompareSpec,
	FieldDiff,
	MatchSpec,
	RowComparison,
	RowStatus,
} from "./types";

type Record_ = Record<string, unknown>;

/** Normalize a key value for matching: trimmed, upper-cased, leading zeros
 *  stripped from all-digit values so "020" matches "20" and "us" matches "US". */
function normalizeKey(value: unknown): string {
	if (value === null || value === undefined) return "";
	let s = String(value).trim();
	if (s === "") return "";
	s = s.toUpperCase();
	if (/^\d+$/.test(s)) s = String(Number(s));
	return s;
}

/** Human-readable form of a value, for showing in the diff (not for comparing). */
function displayValue(value: unknown): string {
	if (value === null || value === undefined) return "";
	if (Array.isArray(value)) {
		return value
			.map((x) => String(x).trim())
			.filter(Boolean)
			.join(", ");
	}
	if (typeof value === "boolean") return value ? "true" : "false";
	return String(value).trim();
}

/** Canonical form of a value, for equality — applies the field's compare rules. */
function compareValue(value: unknown, fc: FieldConfig): string {
	if (value === null || value === undefined) return "";
	if (Array.isArray(value)) {
		const items = value
			.map((x) => String(x).trim())
			.filter(Boolean)
			.map((x) => (fc.caseInsensitive ? x.toLowerCase() : x));
		return [...items].sort().join(",");
	}
	if (fc.bool) {
		const s = String(value).trim().toLowerCase();
		if (["true", "yes", "1", "y", "t"].includes(s)) return "true";
		if (["false", "no", "0", "n", "f"].includes(s)) return "false";
		return s;
	}
	let s = String(value).trim();
	if (fc.numeric) {
		return /^-?\d+$/.test(s) ? String(Number(s)) : s;
	}
	if (fc.caseInsensitive) s = s.toLowerCase();
	return s;
}

export function buildColumnMapping(
	headers: string[],
	config: DatasetConfig,
): ColumnMapping {
	const lookup = aliasLookup(config);
	const mapped: Record<string, string> = {};
	const unmapped: string[] = [];
	for (const header of headers) {
		const field = lookup.get(normalizeHeader(header));
		if (field) mapped[header] = field;
		else unmapped.push(header);
	}
	return { mapped, unmapped };
}

/** Union of keys across all uploaded records (records can be ragged). */
function collectHeaders(records: Record_[]): string[] {
	const seen = new Set<string>();
	for (const record of records) {
		for (const key of Object.keys(record)) seen.add(key);
	}
	return [...seen];
}

function diffPair(
	ourRow: Record_,
	theirRow: Record_,
	fieldToHeader: Record<string, string>,
	config: DatasetConfig,
): FieldDiff[] {
	const diffs: FieldDiff[] = [];
	for (const fc of config.compareFields) {
		const header = fieldToHeader[fc.field];
		if (!header) continue; // they didn't provide this column at all
		const theirRaw = theirRow[header];
		const theirCompare = compareValue(theirRaw, fc);
		if (theirCompare === "") continue; // blank cell: don't assert a difference
		const ourCompare = compareValue(ourRow[fc.field], fc);
		if (ourCompare !== theirCompare) {
			diffs.push({
				field: fc.field,
				label: fc.label,
				ours: displayValue(ourRow[fc.field]),
				theirs: displayValue(theirRaw),
			});
		}
	}
	return diffs;
}

/** Field-level diff for a matched pair under a given spec. Exported so the
 *  semantic pass can recompute diffs for rows it newly reconciles. */
export function rowDiffs(
	ourRow: Record_,
	theirRow: Record_,
	spec: CompareSpec,
	config: DatasetConfig,
): FieldDiff[] {
	return diffPair(ourRow, theirRow, spec.mapping, config);
}

const FUZZY_THRESHOLD = rankings.CONTAINS;

/** Best symmetric match-sorter rank between two names (either may contain the
 *  other), so "United States" reconciles with "United States of America". */
function nameRank(a: string, b: string): number {
	return Math.max(rankItem(a, b).rank, rankItem(b, a).rank);
}

/**
 * When no key column is recognized by header name, pick the unmapped column
 * whose values actually line up with one of our key indexes. This recovers a
 * code column named something generic like `id` (or anything else) by content
 * instead of by name. A clear majority must match so we don't latch onto a
 * column that merely shares a few values (e.g. a code buried in a notes field).
 */
function detectKeyColumn(
	theirRecords: Record_[],
	unmapped: string[],
	config: DatasetConfig,
	indexes: Record<string, Map<string, Record_>>,
): { header: string; field: string } | null {
	let best: { header: string; field: string } | null = null;
	let bestHits = 0;
	for (const header of unmapped) {
		for (const field of config.keyFields) {
			const index = indexes[field];
			if (!index) continue;
			let hits = 0;
			for (const rec of theirRecords) {
				const k = normalizeKey(rec[header]);
				if (k && index.has(k)) hits++;
			}
			if (hits > bestHits) {
				bestHits = hits;
				best = { header, field };
			}
		}
	}
	// An absolute floor (not a ratio): a column is the key if enough of its values
	// hit our index. Capped at the record count so small files still work, but NOT
	// scaled by it — a large upload that's a superset of our data (only a fraction
	// matches) must still recognize its own key column. `detectKeyColumn` already
	// returns the single best column, so coincidental stray matches don't win.
	const threshold = Math.min(theirRecords.length, 3);
	return best && bestHits >= threshold ? best : null;
}

/** Index our rows by a field's normalized value; first to claim a value wins. */
function buildIndex(rows: Record_[], field: string): Map<string, Record_> {
	const index = new Map<string, Record_>();
	for (const row of rows) {
		const k = normalizeKey(row[field]);
		if (k && !index.has(k)) index.set(k, row);
	}
	return index;
}

/** Union of keys across all uploaded records — the columns the user can map. */
export function uploadHeaders(records: Record_[]): string[] {
	return collectHeaders(records);
}

/**
 * Propose how an upload lines up against our data, making NO assumption about
 * column names: fields are mapped by header alias where possible, the key column
 * is otherwise detected purely by its contents, and matching falls back to fuzzy
 * names. This is only a starting point — the user can override every part of it.
 */
export function proposeSpec(
	config: DatasetConfig,
	ourRows: Record_[],
	theirRecords: Record_[],
): CompareSpec {
	const named = buildColumnMapping(collectHeaders(theirRecords), config);
	const mapping: Record<string, string> = {};
	for (const [header, field] of Object.entries(named.mapped)) {
		if (!(field in mapping)) mapping[field] = header;
	}

	// Choose a primary key: the first key field already mapped by name, else a
	// column detected by its values alone (so an `id`-style column is found too).
	let keyField = config.keyFields.find((f) => f in mapping);
	if (!keyField) {
		const indexes: Record<string, Map<string, Record_>> = {};
		for (const f of config.keyFields) indexes[f] = buildIndex(ourRows, f);
		const detected = detectKeyColumn(
			theirRecords,
			named.unmapped,
			config,
			indexes,
		);
		if (detected) {
			mapping[detected.field] = detected.header;
			keyField = detected.field;
		}
	}

	if (keyField) return { mapping, primary: { field: keyField, mode: "exact" } };
	// Nothing key-like — match on names if we have a name column, else default to
	// the name field (the comparison will simply surface everything as extra).
	const mode = config.nameField in mapping ? "fuzzy" : "exact";
	return { mapping, primary: { field: config.nameField, mode } };
}

/**
 * Compare a user's uploaded list against the app's canonical records, driven by
 * an explicit (user-editable) spec. Pure and deterministic. Matching is by the
 * spec's chosen field — exact or fuzzy — with an automatic fuzzy-name fallback
 * for leftovers. No field is ever flagged unless the user provided a value.
 */
export function compareDataset(
	config: DatasetConfig,
	ourRows: Record_[],
	theirRecords: Record_[],
	spec: CompareSpec = proposeSpec(config, ourRows, theirRecords),
): CompareResult {
	const fieldToHeader = spec.mapping;
	const getTheir = (record: Record_, field: string): unknown => {
		const header = fieldToHeader[field];
		return header ? record[header] : undefined;
	};
	const ourId = (row: Record_): string => String(row[config.primaryKey] ?? "");

	// Matching stages: the user's chosen join, plus an automatic fuzzy-name
	// fallback for leftovers when names are mapped and aren't already the join.
	const stages: MatchSpec[] = [spec.primary];
	if (
		spec.primary.mode === "exact" &&
		config.nameField in fieldToHeader &&
		config.nameField !== spec.primary.field
	) {
		stages.push({ field: config.nameField, mode: "fuzzy" });
	}

	const matchByOurId = new Map<
		string,
		{ rec: Record_; matchedBy: "key" | "name"; matchedField: string }
	>();
	const usedOur = new Set<string>();
	let pending = theirRecords;

	for (const stage of stages) {
		const leftovers: Record_[] = [];
		if (stage.mode === "exact") {
			const index = buildIndex(ourRows, stage.field);
			for (const rec of pending) {
				const k = normalizeKey(getTheir(rec, stage.field));
				const row = k ? index.get(k) : undefined;
				if (!row || usedOur.has(ourId(row))) {
					leftovers.push(rec);
					continue;
				}
				usedOur.add(ourId(row));
				matchByOurId.set(ourId(row), {
					rec,
					matchedBy: "key",
					matchedField: stage.field,
				});
			}
		} else {
			// Greedily pair each leftover to the closest still-free our-row by name.
			const freeOur = ourRows.filter((row) => !usedOur.has(ourId(row)));
			for (const rec of pending) {
				const theirName = displayValue(getTheir(rec, stage.field));
				let best: Record_ | null = null;
				let bestRank = -1;
				if (theirName) {
					for (const row of freeOur) {
						if (usedOur.has(ourId(row))) continue;
						const ourName = displayValue(row[stage.field]);
						if (!ourName) continue;
						const rank = nameRank(ourName, theirName);
						if (rank > bestRank) {
							bestRank = rank;
							best = row;
						}
					}
				}
				if (best && bestRank >= FUZZY_THRESHOLD) {
					usedOur.add(ourId(best));
					matchByOurId.set(ourId(best), {
						rec,
						matchedBy: "name",
						matchedField: stage.field,
					});
				} else {
					leftovers.push(rec);
				}
			}
		}
		pending = leftovers;
	}
	const extras = pending;

	// Column view for display: invert the mapping (header -> field) and list any
	// uploaded columns the spec doesn't use.
	const usedHeaders = new Set(Object.values(fieldToHeader));
	const columns: ColumnMapping = {
		mapped: Object.fromEntries(
			Object.entries(fieldToHeader).map(([field, header]) => [header, field]),
		),
		unmapped: collectHeaders(theirRecords).filter((h) => !usedHeaders.has(h)),
	};

	// Build the comparison rows: canonical order first (matched + missing),
	// then any extras the user has that we don't.
	const rows: RowComparison[] = [];
	for (const row of ourRows) {
		const id = ourId(row);
		const name = displayValue(row[config.nameField]);
		const key = String(row[config.primaryKey] ?? "");
		const match = matchByOurId.get(id);
		if (!match) {
			rows.push({
				id,
				status: "missing",
				key,
				name,
				matchedBy: null,
				diffs: [],
				ourRow: row,
			});
			continue;
		}
		const diffs = diffPair(row, match.rec, fieldToHeader, config);
		rows.push({
			id,
			status: diffs.length > 0 ? "changed" : "identical",
			key,
			name,
			matchedBy: match.matchedBy,
			matchedField: match.matchedField,
			diffs,
			ourRow: row,
			theirRow: match.rec,
		});
	}
	extras.forEach((rec, i) => {
		const name = displayValue(getTheir(rec, config.nameField));
		const key = displayValue(
			config.keyFields.map((f) => getTheir(rec, f)).find(Boolean),
		);
		rows.push({
			id: `extra:${i}:${key || name}`,
			status: "extra",
			key,
			name,
			matchedBy: null,
			diffs: [],
			theirRow: rec,
		});
	});

	const count = (status: RowStatus) =>
		rows.reduce((n, r) => (r.status === status ? n + 1 : n), 0);

	return {
		dataset: config.key,
		rows,
		columns,
		summary: {
			total: rows.length,
			identical: count("identical"),
			changed: count("changed"),
			missing: count("missing"),
			extra: count("extra"),
			theirCount: theirRecords.length,
			ourCount: ourRows.length,
		},
	};
}
