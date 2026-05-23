import { describe, expect, it } from "vitest";
import { facetedFilter, isEmptyValue, presenceFilter } from "../table-filters";

// Minimal stand-in for a TanStack Row: only getValue is used by these filters.
// biome-ignore lint/suspicious/noExplicitAny: test stub for Row
const rowWith = (value: unknown): any => ({ getValue: () => value });
const run = (
	// biome-ignore lint/suspicious/noExplicitAny: see above
	fn: any,
	value: unknown,
	filterValue: unknown,
): boolean => fn(rowWith(value), "col", filterValue);

describe("isEmptyValue", () => {
	it("treats null, undefined and '' as empty", () => {
		expect(isEmptyValue(null)).toBe(true);
		expect(isEmptyValue(undefined)).toBe(true);
		expect(isEmptyValue("")).toBe(true);
		expect(isEmptyValue("x")).toBe(false);
		expect(isEmptyValue(false)).toBe(false);
	});
});

describe("facetedFilter", () => {
	it("passes everything when no filter is set", () => {
		expect(run(facetedFilter, "member", [])).toBe(true);
		expect(run(facetedFilter, "member", undefined)).toBe(true);
	});

	it("matches by value", () => {
		expect(run(facetedFilter, "member", ["member"])).toBe(true);
		expect(run(facetedFilter, "observer", ["member"])).toBe(false);
		expect(run(facetedFilter, true, [true])).toBe(true);
	});

	it("matches empty rows against an empty filter entry — the bug", () => {
		// The "(empty)" option is null after the URL round-trip; the cell is undefined.
		expect(run(facetedFilter, undefined, [null])).toBe(true);
		expect(run(facetedFilter, "", [null])).toBe(true);
		// A real value must NOT match the empty filter.
		expect(run(facetedFilter, "member", [null])).toBe(false);
		// And empty rows must NOT match a value filter.
		expect(run(facetedFilter, undefined, ["member"])).toBe(false);
	});

	it("supports mixed value + empty selections", () => {
		expect(run(facetedFilter, "member", ["member", null])).toBe(true);
		expect(run(facetedFilter, undefined, ["member", null])).toBe(true);
		expect(run(facetedFilter, "observer", ["member", null])).toBe(false);
	});
});

describe("presenceFilter", () => {
	it("matches Has value / Empty", () => {
		expect(run(presenceFilter, "ABC", ["has-value"])).toBe(true);
		expect(run(presenceFilter, undefined, ["has-value"])).toBe(false);
		expect(run(presenceFilter, undefined, ["empty"])).toBe(true);
		expect(run(presenceFilter, "ABC", ["empty"])).toBe(false);
	});
});
