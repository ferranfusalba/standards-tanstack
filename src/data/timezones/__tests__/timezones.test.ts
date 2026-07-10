import { beforeAll, describe, expect, it, vi } from "vitest";

// biome-ignore lint/suspicious/noExplicitAny: mock factory for createServerFn
type HandlerFn = (...args: any[]) => any;

vi.mock("@tanstack/react-start", () => ({
	createServerFn: () => ({
		handler: (fn: HandlerFn) => fn,
		validator: () => ({
			handler: (fn: HandlerFn) => fn,
		}),
	}),
}));

import { getTimezonesFromIntl, type Timezone, type TimezoneIntl } from "..";

describe("getTimezonesFromIntl", () => {
	let timezones: Timezone[];

	beforeAll(async () => {
		timezones = await (getTimezonesFromIntl as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		});
	});

	it("returns an array of timezones", () => {
		expect(Array.isArray(timezones)).toBe(true);
		expect(timezones.length).toBeGreaterThan(300);
	});

	it("each timezone has required fields", () => {
		for (const tz of timezones) {
			expect(tz.id).toBeDefined();
			expect(typeof tz.id).toBe("string");
			expect(tz.name).toBeDefined();
			expect(typeof tz.name).toBe("string");
			expect(tz.offset).toBeDefined();
			expect(tz.offset).toMatch(/^UTC/);
			expect(tz.region).toBeDefined();
			expect(typeof tz.region).toBe("string");
		}
	});

	it("includes well-known timezones", () => {
		const ids = timezones.map((tz) => tz.id);
		expect(ids).toContain("America/New_York");
		expect(ids).toContain("Europe/London");
		expect(ids).toContain("Asia/Tokyo");
	});

	it("ids are unique", () => {
		const ids = timezones.map((tz) => tz.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("regions are extracted from timezone IDs", () => {
		const ny = timezones.find((tz) => tz.id === "America/New_York");
		expect(ny?.region).toBe("America");
		expect(ny?.name).toBe("New York");
	});
});

describe("getTimezonesFromIntl — standard/DST offsets", () => {
	let byId: Map<string, TimezoneIntl>;

	beforeAll(async () => {
		const all = (await (getTimezonesFromIntl as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		})) as TimezoneIntl[];
		byId = new Map(all.map((tz) => [tz.id, tz]));
	});

	// Standard time is the smaller (more negative) offset; DST the larger one.
	// Regression: a string compare of "UTC-05"/"UTC-04" swapped these for the
	// Americas.
	it.each([
		["America/New_York", "UTC-05", "UTC-04"], // northern, negative
		["Europe/Paris", "UTC+01", "UTC+02"], // northern, positive
		["Australia/Sydney", "UTC+10", "UTC+11"], // southern, positive
		["America/Santiago", "UTC-04", "UTC-03"], // southern, negative
	])("%s → standard %s / DST %s", (id, standard, dst) => {
		const tz = byId.get(id);
		expect(tz?.isDST).toBe(true);
		expect(tz?.standardOffset).toBe(standard);
		expect(tz?.dstOffset).toBe(dst);
	});

	it("leaves standardOffset = offset and dstOffset = null for non-DST zones", () => {
		const tokyo = byId.get("Asia/Tokyo");
		expect(tokyo?.isDST).toBe(false);
		expect(tokyo?.dstOffset).toBeNull();
		expect(tokyo?.standardOffset).toBe(tokyo?.offset);
	});
});
