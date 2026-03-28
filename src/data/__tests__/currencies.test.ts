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

import {
	type Currency,
	getCurrencies,
	getHistoricalCurrencies,
	getHistoricalCurrenciesByCountry,
	type HistoricalCountryCurrency,
	type HistoricalCurrency,
} from "../currencies";

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

describe("getHistoricalCurrencies", () => {
	let historical: HistoricalCurrency[];

	beforeAll(async () => {
		historical = await (getHistoricalCurrencies as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		});
	});

	it("returns an array of historical currencies", () => {
		expect(Array.isArray(historical)).toBe(true);
		expect(historical.length).toBeGreaterThan(100);
	});

	it("each historical currency has required fields", () => {
		for (const c of historical) {
			expect(typeof c.code).toBe("string");
			expect(c.code.length).toBe(3);
			expect(typeof c.name).toBe("string");
			expect(typeof c.country).toBe("string");
			expect(typeof c.withdrawalDate).toBe("string");
			expect(typeof c.isFund).toBe("boolean");
		}
	});

	it("includes well-known historical currencies", () => {
		const codes = historical.map((c) => c.code);
		expect(codes).toContain("DEM"); // Deutsche Mark
		expect(codes).toContain("FRF"); // French Franc
		expect(codes).toContain("ITL"); // Italian Lira
		expect(codes).toContain("ESP"); // Spanish Peseta
	});

	it("maps country codes where possible", () => {
		const germany = historical.find(
			(c) => c.code === "DEM" && c.country === "GERMANY",
		);
		expect(germany?.countryCode).toBe("DE");

		const france = historical.find(
			(c) => c.code === "FRF" && c.country === "FRANCE",
		);
		expect(france?.countryCode).toBe("FR");
	});

	it("leaves countryCode undefined for unmappable entities", () => {
		const ussr = historical.find(
			(c) => c.country === "UNION OF SOVIET SOCIALIST REPUBLICS",
		);
		expect(ussr).toBeDefined();
		expect(ussr?.countryCode).toBeUndefined();
	});
});

describe("getHistoricalCurrenciesByCountry", () => {
	let map: Record<string, HistoricalCountryCurrency[]>;

	beforeAll(async () => {
		map = await (getHistoricalCurrenciesByCountry as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		});
	});

	it("returns a record keyed by alpha-2 codes", () => {
		expect(typeof map).toBe("object");
		for (const key of Object.keys(map)) {
			expect(key.length).toBeLessThanOrEqual(2);
		}
	});

	it("contains historical currencies for Bulgaria", () => {
		expect(map.BG).toBeDefined();
		expect(map.BG.length).toBeGreaterThan(0);
		const codes = map.BG.map((c) => c.code);
		expect(codes).toContain("BGN");
	});

	it("each entry has required fields", () => {
		for (const entries of Object.values(map)) {
			for (const c of entries) {
				expect(typeof c.code).toBe("string");
				expect(typeof c.name).toBe("string");
				expect(typeof c.withdrawalDate).toBe("string");
			}
		}
	});
});
