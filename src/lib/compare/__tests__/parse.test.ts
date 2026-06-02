import { describe, expect, it } from "vitest";
import {
	CompareParseError,
	detectFormat,
	parseCSV,
	parseJSONRecords,
	parseUpload,
} from "../parse";

describe("detectFormat", () => {
	it("uses the file extension first", () => {
		expect(detectFormat("data.json", "code,name")).toBe("json");
		expect(detectFormat("data.csv", "[]")).toBe("csv");
	});

	it("sniffs content when the extension is unknown", () => {
		expect(detectFormat("data.txt", "  [\n{}]")).toBe("json");
		expect(detectFormat("data.txt", "{ }")).toBe("json");
		expect(detectFormat("data.txt", "code,name\nUSD,Dollar")).toBe("csv");
	});
});

describe("parseCSV", () => {
	it("parses a simple table into header-keyed records", () => {
		const rows = parseCSV("code,name\nUSD,US Dollar\nEUR,Euro");
		expect(rows).toEqual([
			{ code: "USD", name: "US Dollar" },
			{ code: "EUR", name: "Euro" },
		]);
	});

	it("handles quoted fields with commas and escaped quotes", () => {
		const rows = parseCSV(
			'code,name\nXAF,"Franc, Central African"\nQ,"a ""b"" c"',
		);
		expect(rows[0].name).toBe("Franc, Central African");
		expect(rows[1].name).toBe('a "b" c');
	});

	it("handles quoted fields spanning newlines and CRLF endings", () => {
		const rows = parseCSV('code,note\r\nAA,"line1\nline2"\r\nBB,plain');
		expect(rows[0]).toEqual({ code: "AA", note: "line1\nline2" });
		expect(rows[1]).toEqual({ code: "BB", note: "plain" });
	});

	it("skips blank lines and trims headers", () => {
		const rows = parseCSV(" code , name \nUSD,Dollar\n\n");
		expect(rows).toEqual([{ code: "USD", name: "Dollar" }]);
	});
});

describe("parseJSONRecords", () => {
	it("reads a top-level array", () => {
		expect(parseJSONRecords('[{"code":"USD"}]')).toEqual([{ code: "USD" }]);
	});

	it("unwraps a records array nested under a common key", () => {
		expect(parseJSONRecords('{"data":[{"code":"EUR"}]}')).toEqual([
			{ code: "EUR" },
		]);
	});

	it("unwraps a single-property object whose value is the records array", () => {
		expect(parseJSONRecords('{"whatever":[{"a":1}]}')).toEqual([{ a: 1 }]);
	});

	it("expands a keyed dictionary of scalars into key/value records", () => {
		expect(
			parseJSONRecords('{"America/New_York":"Eastern","Europe/Paris":"CET"}'),
		).toEqual([
			{ key: "America/New_York", value: "Eastern" },
			{ key: "Europe/Paris", value: "CET" },
		]);
	});

	it("expands a dictionary of objects, keeping the key as a column", () => {
		expect(parseJSONRecords('{"US":{"name":"United States"}}')).toEqual([
			{ key: "US", name: "United States" },
		]);
	});

	it("drops non-object entries", () => {
		expect(parseJSONRecords('[{"a":1}, 2, null, [3]]')).toEqual([{ a: 1 }]);
	});

	it("throws a friendly error on invalid JSON", () => {
		expect(() => parseJSONRecords("{not json")).toThrow(CompareParseError);
	});

	it("throws when the JSON is a bare scalar, not a collection", () => {
		expect(() => parseJSONRecords("42")).toThrow(CompareParseError);
	});
});

describe("parseUpload", () => {
	it("rejects an empty file", () => {
		expect(() => parseUpload("   ")).toThrow(CompareParseError);
	});

	it("rejects a file with headers but no rows", () => {
		expect(() => parseUpload("code,name\n", { format: "csv" })).toThrow(
			/No records/,
		);
	});

	it("parses CSV by extension", () => {
		const { format, records } = parseUpload("code\nUSD", {
			filename: "x.csv",
		});
		expect(format).toBe("csv");
		expect(records).toEqual([{ code: "USD" }]);
	});

	it("parses JSON by extension", () => {
		const { format, records } = parseUpload('[{"code":"USD"}]', {
			filename: "x.json",
		});
		expect(format).toBe("json");
		expect(records).toEqual([{ code: "USD" }]);
	});
});
