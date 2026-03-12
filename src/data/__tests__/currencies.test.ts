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

import { type Currency, getCurrencies } from "../currencies";

describe("getCurrencies", () => {
	let currencies: Currency[];

	beforeAll(async () => {
		currencies = await (getCurrencies as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		});
	});

	it("returns an array of currencies", () => {
		expect(Array.isArray(currencies)).toBe(true);
		expect(currencies.length).toBeGreaterThan(100);
	});

	it("each currency has required fields", () => {
		for (const c of currencies) {
			expect(c.code).toBeDefined();
			expect(typeof c.code).toBe("string");
			expect(c.code.length).toBe(3);
			expect(c.name).toBeDefined();
			expect(typeof c.name).toBe("string");
			expect(c.numericCode).toBeDefined();
			expect(typeof c.numericCode).toBe("string");
		}
	});

	it("includes well-known currencies", () => {
		const codes = currencies.map((c) => c.code);
		expect(codes).toContain("USD");
		expect(codes).toContain("EUR");
		expect(codes).toContain("GBP");
		expect(codes).toContain("JPY");
	});

	it("adds Intl symbols", () => {
		const usd = currencies.find((c) => c.code === "USD");
		expect(usd?.symbolIntl).toBeDefined();
		expect(typeof usd?.symbolIntl).toBe("string");
	});

	it("fund types have definitions", () => {
		const funds = currencies.filter((c) => c.type === "fund");
		expect(funds.length).toBeGreaterThan(0);
		for (const f of funds) {
			expect(f.definitions).toBeDefined();
			expect(typeof f.definitions).toBe("string");
		}
	});
});
