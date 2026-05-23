import type { FilterFn } from "@tanstack/react-table";

/** Treat null / undefined / "" as an "empty" cell value. */
export function isEmptyValue(v: unknown): boolean {
	return v === null || v === undefined || v === "";
}

// biome-ignore lint/suspicious/noExplicitAny: FilterFn generics are contravariant, so typed versions aren't reusable across tables
type AnyFilterFn = FilterFn<any>;

/**
 * Multi-select facet filter. The "(empty)" option round-trips through the URL as
 * `null` (JSON can't carry `undefined`), so an empty entry in the filter value is
 * matched against any empty cell value rather than by strict equality.
 */
export const facetedFilter: AnyFilterFn = (row, columnId, filterValue) => {
	if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
	const val = row.getValue(columnId);
	return filterValue.some((fv) =>
		isEmptyValue(fv) ? isEmptyValue(val) : fv === val,
	);
};

/** "Has value" / "Empty" presence filter. */
export const presenceFilter: AnyFilterFn = (row, columnId, filterValue) => {
	if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
	const empty = isEmptyValue(row.getValue(columnId));
	if (filterValue.includes("has-value") && !empty) return true;
	if (filterValue.includes("empty") && empty) return true;
	return false;
};
