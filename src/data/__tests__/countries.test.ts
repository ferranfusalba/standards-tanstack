import { beforeAll, describe, expect, it, vi } from "vitest";

// biome-ignore lint/suspicious/noExplicitAny: mock factory for createServerFn
type HandlerFn = (...args: any[]) => any;

vi.mock("@tanstack/react-start", () => ({
	createServerFn: () => ({
		handler: (fn: HandlerFn) => fn,
		inputValidator: (_validator: HandlerFn) => ({
			handler: (fn: HandlerFn) => fn,
		}),
	}),
}));

import { type Country, getCountries } from "../countries";

describe("getCountries (Intl)", () => {
	let countries: Country[];

	beforeAll(async () => {
		countries = await (getCountries as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		});
	});

	it("returns an array of countries", () => {
		expect(Array.isArray(countries)).toBe(true);
		expect(countries.length).toBeGreaterThan(200);
	});

	it("each country has alpha2Code, name, and flag", () => {
		for (const c of countries) {
			expect(c.alpha2Code).toBeDefined();
			expect(typeof c.alpha2Code).toBe("string");
			expect(c.alpha2Code.length).toBe(2);
			expect(c.name).toBeDefined();
			expect(typeof c.name).toBe("string");
			expect(c.flag).toBeDefined();
			expect(typeof c.flag).toBe("string");
		}
	});

	it("includes well-known countries", () => {
		const codes = countries.map((c) => c.alpha2Code);
		expect(codes).toContain("US");
		expect(codes).toContain("GB");
		expect(codes).toContain("FR");
		expect(codes).toContain("JP");
		expect(codes).toContain("ES");
	});

	it("alpha2 codes are unique", () => {
		const codes = countries.map((c) => c.alpha2Code);
		expect(new Set(codes).size).toBe(codes.length);
	});

	it("alpha2 codes are uppercase", () => {
		for (const c of countries) {
			expect(c.alpha2Code).toBe(c.alpha2Code.toUpperCase());
		}
	});
});
