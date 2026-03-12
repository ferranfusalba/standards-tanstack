import { beforeAll, describe, expect, it, vi } from "vitest";

// biome-ignore lint/suspicious/noExplicitAny: mock factory for createServerFn
type HandlerFn = (...args: any[]) => any;

vi.mock("@tanstack/react-start", () => ({
	createServerFn: () => ({
		handler: (fn: HandlerFn) => fn,
		inputValidator: () => ({
			handler: (fn: HandlerFn) => fn,
		}),
	}),
}));

import { getTimezonesFromIntl, type Timezone } from "../timezones";

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
