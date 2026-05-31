import { describe, expect, it } from "vitest";
import { parseUtcOffsetMinutes } from "../offset";

describe("parseUtcOffsetMinutes", () => {
	it("parses positive whole-hour offsets", () => {
		expect(parseUtcOffsetMinutes("UTC+05")).toBe(300);
		expect(parseUtcOffsetMinutes("UTC+1")).toBe(60);
	});

	it("parses negative whole-hour offsets", () => {
		expect(parseUtcOffsetMinutes("UTC-05")).toBe(-300);
		expect(parseUtcOffsetMinutes("UTC-04")).toBe(-240);
	});

	it("orders negative offsets numerically (regression for string compare)", () => {
		// "UTC-05" sorts AFTER "UTC-04" as a string, but is the smaller offset.
		expect(parseUtcOffsetMinutes("UTC-05")).toBeLessThan(
			parseUtcOffsetMinutes("UTC-04"),
		);
		expect("UTC-05" < "UTC-04").toBe(false); // documents the trap being avoided
	});

	it("parses half-hour and 45-minute offsets with the right sign", () => {
		expect(parseUtcOffsetMinutes("UTC+05:30")).toBe(330);
		expect(parseUtcOffsetMinutes("UTC-03:30")).toBe(-210);
		expect(parseUtcOffsetMinutes("UTC+05:45")).toBe(345);
		// "-00:30" must stay negative even though the hour parses to -0.
		expect(parseUtcOffsetMinutes("UTC-00:30")).toBe(-30);
	});

	it("treats zero and malformed input as 0", () => {
		expect(parseUtcOffsetMinutes("UTC+0")).toBe(0);
		expect(parseUtcOffsetMinutes("UTC")).toBe(0);
		expect(parseUtcOffsetMinutes("nonsense")).toBe(0);
	});
});
