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

import { type Currency, getHistoricalCurrencies, getCurrencies } from "../currencies";
import { getCountries } from "../countries";

const callServerFn = (fn: unknown) =>
	(fn as HandlerFn)({
		data: undefined,
		context: {},
		signal: new AbortController().signal,
	});

describe("data uniqueness", () => {
	let currencies: Currency[];
	let countries: { alpha2Code: string }[];
	let historicalCurrencies: Awaited<ReturnType<typeof getHistoricalCurrencies>>;

	beforeAll(async () => {
		const [ctry, ccys, hist] = await Promise.all([
			callServerFn(getCountries),
			callServerFn(getCurrencies),
			callServerFn(getHistoricalCurrencies),
		]);
		countries = ctry as typeof countries;
		currencies = ccys as Currency[];
		historicalCurrencies = hist as typeof historicalCurrencies;
	});

	it("active currency codes are unique", () => {
		const codes = currencies.map((c) => c.code);
		const duplicates = codes.filter(
			(code, i) => codes.indexOf(code) !== i,
		);
		expect(
			duplicates,
			`Duplicate active currency codes: ${[...new Set(duplicates)].join(", ")}`,
		).toEqual([]);
	});

	it("country alpha-2 codes are unique", () => {
		const codes = countries.map((c) => c.alpha2Code);
		const duplicates = codes.filter(
			(code, i) => codes.indexOf(code) !== i,
		);
		expect(
			duplicates,
			`Duplicate country codes: ${[...new Set(duplicates)].join(", ")}`,
		).toEqual([]);
	});

	it("historical currencies have no exact duplicate rows", () => {
		const seen = new Set<string>();
		const duplicates: string[] = [];
		for (const c of historicalCurrencies) {
			const key = `${c.code}|${c.country}|${c.withdrawalDate}`;
			if (seen.has(key)) {
				duplicates.push(key);
			}
			seen.add(key);
		}
		expect(
			duplicates,
			`Duplicate historical currency rows: ${duplicates.join(", ")}`,
		).toEqual([]);
	});

	it("active currency numeric codes are unique (excluding funds and special types)", () => {
		const regular = currencies.filter(
			(c) =>
				!c.type ||
				c.type === "currency" ||
				c.type === "supranational",
		);
		const numCodes = regular.map((c) => c.numericCode);
		const duplicates = numCodes.filter(
			(code, i) => numCodes.indexOf(code) !== i,
		);
		expect(
			duplicates,
			`Duplicate numeric codes: ${[...new Set(duplicates)].join(", ")}`,
		).toEqual([]);
	});
});
