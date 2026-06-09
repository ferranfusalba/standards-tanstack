/** Sorting helpers for the expandable subdivisions table (countries route).
 *  The table is hand-rolled rather than a TanStack `<DataTable>`, so the
 *  asc → desc → unsorted cycle and the column comparator live here where they
 *  can be unit-tested independently of React. */

/** Minimal shape these helpers read from a subdivision row. */
export interface SubdivisionLike {
	code: string;
	type?: Record<string, string>;
	iso1?: string;
	flag?: string;
	names: Record<string, string>;
}

/** Active sort: a column `key` and a direction, or `null` for source order. */
export type SubSort = { key: string; dir: "asc" | "desc" } | null;

/**
 * Column keys are `"flag"`, `"code"`, or a language-suffixed `"type:<lang>"` /
 * `"name:<lang>"`. Clicking a column cycles asc → desc → unsorted, matching the
 * removal behaviour of TanStack-driven tables elsewhere in the app. Clicking a
 * different column starts a fresh ascending sort.
 */
export function nextSubSort(current: SubSort, key: string): SubSort {
	if (!current || current.key !== key) return { key, dir: "asc" };
	if (current.dir === "asc") return { key, dir: "desc" };
	return null;
}

/**
 * Stable a→z (or z→a) sort of `subs` by the column named in `sort.key`. Returns
 * `subs` untouched when `sort` is null. `flagOf` resolves the comparable string
 * for the flag column (emoji or `""`) so the caller owns flag-emoji derivation.
 * Comparison is locale-aware, numeric, and case/diacritic-insensitive.
 */
export function sortSubdivisions<T extends SubdivisionLike>(
	subs: T[],
	sort: SubSort,
	flagOf: (sub: T) => string,
): T[] {
	if (!sort) return subs;
	// Both "type:" and "name:" prefixes are 5 chars, so the language suffix
	// starts at index 5; unused for the "flag"/"code" columns.
	const lang = sort.key.slice(5);
	const cellValue =
		sort.key === "flag"
			? flagOf
			: sort.key === "code"
				? (s: T) => s.code
				: sort.key.startsWith("type:")
					? (s: T) => s.type?.[lang] ?? ""
					: (s: T) => s.names[lang] ?? "";
	const dir = sort.dir === "asc" ? 1 : -1;
	return [...subs].sort(
		(a, b) =>
			dir *
			cellValue(a).localeCompare(cellValue(b), undefined, {
				numeric: true,
				sensitivity: "base",
			}),
	);
}
