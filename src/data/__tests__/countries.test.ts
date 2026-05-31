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

import {
	type Country,
	getCountries,
	getCountriesFromUN,
	getCountryNames,
	getCountryNamesByLocale,
	getLocalizedNameCountsByCountry,
	getLocalizedNamesAllByCountry,
	getLocalizedSearchByCountry,
	getMissingCountries,
	getRegionNameLocales,
	type LocalizedName,
	type RegionNameLocale,
} from "../countries";

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

describe("getCountriesFromUN (ccTLD + phone prefix)", () => {
	let countries: Country[];
	let byCode: Record<string, Country>;

	beforeAll(async () => {
		countries = await (getCountriesFromUN as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		});
		byCode = Object.fromEntries(countries.map((c) => [c.alpha2Code, c]));
	});

	it("derives ccTLDs as lowercase alpha-2 with the .uk override", () => {
		expect(byCode.ES.ccTLD).toBe(".es");
		expect(byCode.DE.ccTLD).toBe(".de");
		expect(byCode.JP.ccTLD).toBe(".jp");
		// GB uses .uk, not .gb
		expect(byCode.GB.ccTLD).toBe(".uk");
	});

	it("omits ccTLDs for reserved-but-undelegated codes", () => {
		for (const code of ["EH", "BL", "MF", "BQ", "UM"]) {
			expect(byCode[code]?.ccTLD).toBeUndefined();
		}
	});

	it("assigns ITU E.164 dialing codes", () => {
		expect(byCode.ES.phonePrefix).toBe("+34");
		expect(byCode.GB.phonePrefix).toBe("+44");
		expect(byCode.FR.phonePrefix).toBe("+33");
		// NANP members share country code +1
		expect(byCode.US.phonePrefix).toBe("+1");
		expect(byCode.CA.phonePrefix).toBe("+1");
		expect(byCode.BB.phonePrefix).toBe("+1");
		// Russia and Kazakhstan share +7
		expect(byCode.RU.phonePrefix).toBe("+7");
		expect(byCode.KZ.phonePrefix).toBe("+7");
	});

	it("leaves uninhabited territories without a phone prefix", () => {
		// Antarctica, Bouvet Island, Heard & McDonald Islands have no E.164 code
		for (const code of ["AQ", "BV", "HM"]) {
			expect(byCode[code]?.phonePrefix).toBeUndefined();
		}
	});

	it("formats every assigned phone prefix as +<digits>", () => {
		for (const c of countries) {
			if (c.phonePrefix !== undefined) {
				expect(c.phonePrefix).toMatch(/^\+\d+$/);
			}
		}
	});
});

describe("getCountryNames (localized)", () => {
	const call = (code: string): Promise<LocalizedName[]> =>
		(getCountryNames as unknown as HandlerFn)({
			data: { code },
			context: {},
			signal: new AbortController().signal,
		});

	it("returns localized names across many locales", async () => {
		const names = await call("DE");
		expect(Array.isArray(names)).toBe(true);
		// CLDR carries German region names in dozens of languages
		expect(names.length).toBeGreaterThan(50);
	});

	it("renders the requested locale, not a fallback", async () => {
		const names = await call("ES");
		const byLocale = Object.fromEntries(names.map((n) => [n.locale, n.name]));
		expect(byLocale.en).toBe("Spain");
		expect(byLocale.es).toBe("España");
		expect(byLocale.fr).toBe("Espagne");
		expect(byLocale.de).toBe("Spanien");
	});

	it("normalizes the input code to uppercase", async () => {
		const lower = await call("jp");
		const upper = await call("JP");
		expect(lower).toEqual(upper);
		expect(lower.find((n) => n.locale === "en")?.name).toBe("Japan");
	});

	it("omits gaps and bare-code echoes", async () => {
		const names = await call("DE");
		for (const n of names) {
			expect(n.name).toBeTruthy();
			expect(n.name).not.toBe("DE");
			expect(n.locale).toBeTruthy();
			expect(n.language).toBeTruthy();
		}
	});

	it("sorts results by locale", async () => {
		const names = await call("US");
		const locales = names.map((n) => n.locale);
		expect(locales).toEqual([...locales].sort((a, b) => a.localeCompare(b)));
	});
});

describe("getLocalizedNameCountsByCountry", () => {
	let counts: Record<string, number>;

	beforeAll(async () => {
		counts = await (getLocalizedNameCountsByCountry as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		});
	});

	it("covers all UN countries", () => {
		expect(Object.keys(counts).length).toBeGreaterThan(200);
		expect(counts.DE).toBeGreaterThan(50);
		expect(counts.US).toBeGreaterThan(50);
	});

	it("matches the length returned by getCountryNames", async () => {
		const names: LocalizedName[] = await (
			getCountryNames as unknown as HandlerFn
		)({
			data: { code: "DE" },
			context: {},
			signal: new AbortController().signal,
		});
		expect(counts.DE).toBe(names.length);
	});

	it("varies between countries (territories have CLDR gaps)", () => {
		// Sparsely-covered territories carry fewer names than major countries.
		expect(counts.IO).toBeLessThan(counts.DE);
	});
});

describe("getRegionNameLocales", () => {
	let locales: RegionNameLocale[];

	beforeAll(async () => {
		locales = await (getRegionNameLocales as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		});
	});

	it("returns the supported locale set sorted by language name", () => {
		expect(locales.length).toBeGreaterThan(50);
		const languageNames = locales.map((l) => l.language);
		expect(languageNames).toEqual(
			[...languageNames].sort((a, b) => a.localeCompare(b)),
		);
	});

	it("includes common locales with code and language label", () => {
		const codes = locales.map((l) => l.locale);
		expect(codes).toContain("en");
		expect(codes).toContain("es");
		expect(codes).toContain("fr");
		const en = locales.find((l) => l.locale === "en");
		expect(en?.language).toBe("English");
	});
});

describe("getMissingCountries", () => {
	it("enriches user-assigned codes with CLDR names (e.g. Kosovo)", async () => {
		const missing = (await (getMissingCountries as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		})) as Array<
			Country & {
				cldrName?: string;
				localizedNameCount?: number;
				cellNotes?: Record<string, string>;
				phonePrefix?: string;
			}
		>;
		const kosovo = missing.find((c) => c.alpha2Code === "XK");
		expect(kosovo).toBeDefined();
		// No ISO 3166-1 name (Kosovo isn't in ISO); the CLDR name carries it.
		expect(kosovo?.name).toBe("");
		expect(kosovo?.cldrName).toBe("Kosovo");
		expect(kosovo?.localizedNameCount).toBeGreaterThan(0);
		// ITU-assigned dialing code; only the alpha-2/alpha-3 cells carry a tooltip
		// note (the ISO mismatch) — the ICAO/IOC/ITU values stand on their own.
		expect(kosovo?.phonePrefix).toBe("+383");
		expect(kosovo?.cellNotes?.alpha2Code).toContain("user-assigned");
		expect(kosovo?.cellNotes?.icaoCode).toBeUndefined();
	});
});

describe("getCountryNamesByLocale", () => {
	const namesByLocale = (locale: string): Promise<Record<string, string>> =>
		(getCountryNamesByLocale as unknown as HandlerFn)({
			data: { locale },
			context: {},
			signal: new AbortController().signal,
		});
	const subrow = (code: string): Promise<LocalizedName[]> =>
		(getCountryNames as unknown as HandlerFn)({
			data: { code },
			context: {},
			signal: new AbortController().signal,
		});

	it("returns names for the requested locale across all countries", async () => {
		const es = await namesByLocale("es");
		expect(es.DE).toBe("Alemania");
		expect(es.ES).toBe("España");
		expect(Object.keys(es).length).toBeGreaterThan(200);
	});

	it("includes user-assigned missing codes (e.g. Kosovo / XK)", async () => {
		const es = await namesByLocale("es");
		expect(es.XK).toBe("Kosovo");
	});

	it("returns an empty map for an unsupported locale", async () => {
		expect(await namesByLocale("zz")).toEqual({});
	});

	it("maps every country to its per-locale names", async () => {
		const index: Record<string, Record<string, string>> = await (
			getLocalizedNamesAllByCountry as unknown as HandlerFn
		)({ data: undefined, context: {}, signal: new AbortController().signal });
		// Germany, keyed by locale.
		expect(index.DE.en).toBe("Germany");
		expect(index.DE.es).toBe("Alemania");
		expect(index.DE.fr).toBe("Allemagne");
		expect(Object.keys(index).length).toBeGreaterThan(200);
	});

	it("joins distinct spellings into a search index", async () => {
		const index: Record<string, string> = await (
			getLocalizedSearchByCountry as unknown as HandlerFn
		)({ data: undefined, context: {}, signal: new AbortController().signal });
		// Germany is findable by any language's spelling.
		expect(index.DE).toContain("Germany");
		expect(index.DE).toContain("Alemania");
		expect(index.DE).toContain("Allemagne");
	});

	// The guarantee: the picker-driven column must never disagree with the subrow.
	it("matches the subrow value for the same (locale, country)", async () => {
		for (const locale of ["en", "es", "fr", "de", "ru", "zh"]) {
			const map = await namesByLocale(locale);
			for (const code of ["DE", "ES", "JP", "CI", "TR"]) {
				const fromSubrow = (await subrow(code)).find(
					(n) => n.locale === locale,
				)?.name;
				expect(map[code]).toBe(fromSubrow);
			}
		}
	});
});
