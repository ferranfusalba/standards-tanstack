import { describe, expect, it } from "vitest";
import {
	asNumber,
	asString,
	asStringArray,
	parseColumnFilters,
	parsePage,
	parsePagination,
	parseSize,
	parseSorting,
	serializeColumnFilters,
	serializePage,
	serializeSize,
	serializeSorting,
} from "@/lib/url-state";

describe("asString", () => {
	it("returns string when non-empty", () => {
		expect(asString("hello")).toBe("hello");
	});
	it("returns undefined for empty string, non-string, or missing", () => {
		expect(asString("")).toBeUndefined();
		expect(asString(undefined)).toBeUndefined();
		expect(asString(123)).toBeUndefined();
		expect(asString(null)).toBeUndefined();
	});
});

describe("asNumber", () => {
	it("passes through valid numbers", () => {
		expect(asNumber(5)).toBe(5);
		expect(asNumber(0)).toBe(0);
	});
	it("parses numeric strings", () => {
		expect(asNumber("42")).toBe(42);
	});
	it("returns undefined for invalid input", () => {
		expect(asNumber("abc")).toBeUndefined();
		expect(asNumber(undefined)).toBeUndefined();
		expect(asNumber(Number.NaN)).toBeUndefined();
	});
});

describe("asStringArray", () => {
	it("filters arrays to string members", () => {
		expect(asStringArray(["a", 1, "b", null])).toEqual(["a", "b"]);
	});
	it("splits comma-separated strings", () => {
		expect(asStringArray("Asia,Europe")).toEqual(["Asia", "Europe"]);
	});
	it("returns undefined for empty array, empty string, or unrelated input", () => {
		expect(asStringArray([])).toBeUndefined();
		expect(asStringArray([1, null])).toBeUndefined();
		expect(asStringArray("")).toBeUndefined();
		expect(asStringArray(42)).toBeUndefined();
	});
});

describe("sorting round-trip", () => {
	it("serializes asc as bare id, desc with :desc suffix", () => {
		expect(serializeSorting([{ id: "name", desc: false }])).toBe("name");
		expect(serializeSorting([{ id: "name", desc: true }])).toBe("name:desc");
	});
	it("serializes multiple sort entries comma-separated", () => {
		expect(
			serializeSorting([
				{ id: "name", desc: false },
				{ id: "age", desc: true },
			]),
		).toBe("name,age:desc");
	});
	it("returns undefined when empty (so the URL param is dropped)", () => {
		expect(serializeSorting([])).toBeUndefined();
	});
	it("parses URL value back to SortingState", () => {
		expect(parseSorting("name,age:desc")).toEqual([
			{ id: "name", desc: false },
			{ id: "age", desc: true },
		]);
	});
	it("handles empty / undefined input", () => {
		expect(parseSorting(undefined)).toEqual([]);
		expect(parseSorting("")).toEqual([]);
	});
});

describe("page round-trip", () => {
	it("serializes 0 (first page) as undefined to keep URL clean", () => {
		expect(serializePage(0)).toBeUndefined();
	});
	it("serializes other pages as 1-indexed", () => {
		expect(serializePage(1)).toBe(2);
		expect(serializePage(9)).toBe(10);
	});
	it("parses 1-indexed URL back to 0-indexed state", () => {
		expect(parsePage(2)).toBe(1);
		expect(parsePage("3")).toBe(2);
	});
	it("treats invalid or missing page as 0", () => {
		expect(parsePage(undefined)).toBe(0);
		expect(parsePage(0)).toBe(0);
		expect(parsePage(-5)).toBe(0);
		expect(parsePage("abc")).toBe(0);
	});
});

describe("size round-trip", () => {
	it("drops the param when equal to the default", () => {
		expect(serializeSize(20)).toBeUndefined();
		expect(serializeSize(50, 50)).toBeUndefined();
	});
	it("emits non-default sizes", () => {
		expect(serializeSize(50)).toBe(50);
	});
	it("falls back to default for invalid sizes", () => {
		expect(parseSize(undefined)).toBe(20);
		expect(parseSize("abc")).toBe(20);
		expect(parseSize(0)).toBe(20);
	});
});

describe("parsePagination", () => {
	it("combines page and size into PaginationState", () => {
		expect(parsePagination(3, 50)).toEqual({ pageIndex: 2, pageSize: 50 });
	});
	it("uses defaults when params are missing", () => {
		expect(parsePagination(undefined, undefined)).toEqual({
			pageIndex: 0,
			pageSize: 20,
		});
	});
});

describe("column filters round-trip", () => {
	it("serializes a single filter as a JSON object", () => {
		const out = serializeColumnFilters([
			{ id: "region", value: ["Asia", "Europe"] },
		]);
		expect(out).toBe('{"region":["Asia","Europe"]}');
	});
	it("preserves boolean filter values (e.g. euMember=true)", () => {
		const out = serializeColumnFilters([{ id: "euMember", value: [true] }]);
		expect(out).toBe('{"euMember":[true]}');
		expect(parseColumnFilters(out)).toEqual([
			{ id: "euMember", value: [true] },
		]);
	});
	it("returns undefined when there are no filters", () => {
		expect(serializeColumnFilters([])).toBeUndefined();
	});
	it("strips empty array values", () => {
		expect(
			serializeColumnFilters([{ id: "region", value: [] }]),
		).toBeUndefined();
	});
	it("returns empty array for invalid JSON", () => {
		expect(parseColumnFilters("not-json")).toEqual([]);
		expect(parseColumnFilters(undefined)).toEqual([]);
	});
	it("ignores null/undefined entries on parse", () => {
		expect(parseColumnFilters('{"a":null,"b":["x"]}')).toEqual([
			{ id: "b", value: ["x"] },
		]);
	});
});
