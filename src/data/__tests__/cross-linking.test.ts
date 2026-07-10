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

import { getCountries } from "../countries";
import {
	type Currency,
	getCurrencies,
	getHistoricalCurrencies,
} from "../currencies";

const callServerFn = (fn: unknown) =>
	(fn as HandlerFn)({
		data: undefined,
		context: {},
		signal: new AbortController().signal,
	});

describe("cross-linking integrity", () => {
	let currencies: Currency[];
	let countryCodes: Set<string>;
	let historicalCurrencies: Awaited<ReturnType<typeof getHistoricalCurrencies>>;

	beforeAll(async () => {
		const [countries, ccys, hist] = await Promise.all([
			callServerFn(getCountries),
			callServerFn(getCurrencies),
			callServerFn(getHistoricalCurrencies),
		]);
		countryCodes = new Set(
			(countries as { alpha2Code: string }[]).map((c) => c.alpha2Code),
		);
		currencies = ccys as Currency[];
		historicalCurrencies = hist as typeof historicalCurrencies;
	});

	it("all country codes in active currencies exist in countries dataset", () => {
		// Supranational codes like "EU" are valid references but not ISO 3166-1 countries
		const allowedNonCountry = new Set(["EU"]);
		const invalid: string[] = [];
		for (const ccy of currencies) {
			if (!ccy.countries) continue;
			for (const code of ccy.countries) {
				if (!countryCodes.has(code) && !allowedNonCountry.has(code)) {
					invalid.push(`${ccy.code} references unknown country ${code}`);
				}
			}
		}
		expect(invalid).toEqual([]);
	});

	it("all mapped country codes in historical currencies exist in countries dataset", () => {
		const invalid: string[] = [];
		for (const ccy of historicalCurrencies) {
			if (!ccy.countryCode) continue;
			// Allow defunct codes (CS, AN, etc.) that are no longer in ISO 3166-1
			const defunctCodes = new Set(["CS", "AN", "SU", "YU"]);
			if (defunctCodes.has(ccy.countryCode)) continue;
			if (!countryCodes.has(ccy.countryCode)) {
				invalid.push(
					`${ccy.code} (${ccy.country}) maps to unknown country ${ccy.countryCode}`,
				);
			}
		}
		expect(invalid).toEqual([]);
	});

	it("every historical currency country value has a mapping or is explicitly unmapped", () => {
		const unmapped = historicalCurrencies
			.filter((c) => !c.countryCode)
			.map((c) => c.country.trim());
		const uniqueUnmapped = [...new Set(unmapped)];

		// These are the known unmappable entities — if new ones appear, this test
		// will fail and force a conscious decision to map or exclude them
		const knownUnmapped = [
			"BURMA",
			"SOUTHERN RHODESIA",
			"UNION OF SOVIET SOCIALIST REPUBLICS",
			"YUGOSLAVIA",
			"ZAIRE",
			"EUROPEAN MONETARY CO-OPERATION FUND (EMCF)",
			"ZZ01_Gold-Franc",
			"ZZ02_RINET Funds Code",
			"ZZ05_UIC-Franc",
		];

		for (const name of uniqueUnmapped) {
			expect(
				knownUnmapped.includes(name),
				`Unexpected unmapped country: "${name}" — add a mapping or include in knownUnmapped`,
			).toBe(true);
		}
	});
});
