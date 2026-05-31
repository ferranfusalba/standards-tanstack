import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportRowsCSV, exportRowsJSON } from "../export";

// Mock DOM APIs used by downloadFile
let lastFilename = "";
let lastContent = "";

const OriginalBlob = globalThis.Blob;

beforeEach(() => {
	lastFilename = "";
	lastContent = "";

	// Intercept Blob constructor to capture content
	globalThis.Blob = class MockBlob extends OriginalBlob {
		constructor(parts: BlobPart[], options?: BlobPropertyBag) {
			super(parts, options);
			lastContent = parts.map(String).join("");
		}
	} as typeof Blob;

	globalThis.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
	globalThis.URL.revokeObjectURL = vi.fn();

	vi.spyOn(document, "createElement").mockReturnValue({
		href: "",
		set download(val: string) {
			lastFilename = val;
		},
		get download() {
			return lastFilename;
		},
		click: vi.fn(),
	} as unknown as HTMLAnchorElement);
});

describe("exportRowsCSV", () => {
	it("does nothing for empty array", () => {
		exportRowsCSV([], "test.csv");
		expect(URL.createObjectURL).not.toHaveBeenCalled();
	});

	it("generates CSV with header and rows", () => {
		const rows = [
			{ code: "USD", name: "US Dollar", minorUnit: 2 },
			{ code: "EUR", name: "Euro", minorUnit: 2 },
		];
		exportRowsCSV(rows, "test.csv");

		const text = lastContent;
		const lines = text.split("\n");
		expect(lines[0]).toBe("code,name,minorUnit");
		expect(lines[1]).toBe('"USD","US Dollar","2"');
		expect(lines[2]).toBe('"EUR","Euro","2"');
		expect(lastFilename).toBe("test.csv");
	});

	it("escapes double quotes in values", () => {
		const rows = [{ name: 'He said "hello"' }];
		exportRowsCSV(rows, "test.csv");

		const text = lastContent;
		const lines = text.split("\n");
		expect(lines[1]).toBe('"He said ""hello"""');
	});

	it("handles null and undefined values", () => {
		const rows = [{ a: null, b: undefined, c: "ok" }];
		exportRowsCSV(rows, "test.csv");

		const text = lastContent;
		const lines = text.split("\n");
		expect(lines[1]).toBe('"","","ok"');
	});

	it("includes columns present in later rows, not just the first", () => {
		// Ragged rows: the first row lacks the `currency` key that a later one has.
		const rows = [
			{ code: "US", name: "United States" },
			{ code: "FR", name: "France", currency: "EUR" },
		];
		exportRowsCSV(rows, "test.csv");

		const lines = lastContent.split("\n");
		expect(lines[0]).toBe("code,name,currency");
		// The first row gets an empty cell for the missing column, not a dropped one.
		expect(lines[1]).toBe('"US","United States",""');
		expect(lines[2]).toBe('"FR","France","EUR"');
	});

	it("serializes object values as JSON", () => {
		const rows = [{ data: { nested: true } }];
		exportRowsCSV(rows, "test.csv");

		const text = lastContent;
		const lines = text.split("\n");
		// Inner quotes in JSON get escaped
		expect(lines[1]).toContain("nested");
		expect(lines[1][0]).toBe('"');
	});
});

describe("exportRowsJSON", () => {
	it("generates pretty-printed JSON", () => {
		const rows = [
			{ code: "USD", name: "US Dollar" },
			{ code: "EUR", name: "Euro" },
		];
		exportRowsJSON(rows, "test.json");

		const text = lastContent;
		const parsed = JSON.parse(text);
		expect(parsed).toEqual(rows);
		// Should be pretty-printed with 2-space indent
		expect(text).toContain("\n");
		expect(text).toContain("  ");
		expect(lastFilename).toBe("test.json");
	});

	it("handles empty array", () => {
		exportRowsJSON([], "test.json");

		const text = lastContent;
		expect(JSON.parse(text)).toEqual([]);
	});
});
