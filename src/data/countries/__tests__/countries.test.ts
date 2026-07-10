import { beforeAll, describe, expect, it, vi } from "vitest";
import { nonNull } from "@/lib/test-utils";

// biome-ignore lint/suspicious/noExplicitAny: mock factory for createServerFn
type HandlerFn = (...args: any[]) => any;

vi.mock("@tanstack/react-start", () => ({
	createServerFn: () => ({
		handler: (fn: HandlerFn) => fn,
		validator: (_validator: HandlerFn) => ({
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
} from "..";

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
		expect(nonNull(byCode.ES, "byCode.ES").ccTLD).toBe(".es");
		expect(nonNull(byCode.DE, "byCode.DE").ccTLD).toBe(".de");
		expect(nonNull(byCode.JP, "byCode.JP").ccTLD).toBe(".jp");
		// GB uses .uk, not .gb
		expect(nonNull(byCode.GB, "byCode.GB").ccTLD).toBe(".uk");
	});

	it("uses the UNECE vehicle distinguishing signs (dsitCode)", () => {
		expect(nonNull(byCode.ES, "byCode.ES").dsitCode).toBe("E");
		expect(nonNull(byCode.US, "byCode.US").dsitCode).toBe("USA");
		// UK changed its sign from "GB" to "UK" on 28 Sep 2021
		expect(nonNull(byCode.GB, "byCode.GB").dsitCode).toBe("UK");
	});

	it("carries ISO 3166-1 admin languages (alpha-2/alpha-3) + local short names", () => {
		// Single-language country: one entry with both ISO code forms.
		expect(nonNull(byCode.ES, "byCode.ES").localShortNames).toEqual([
			{ a2: "es", a3: "spa", name: "España" },
		]);
		// Multi-language country: one entry per admin language, in ISO order.
		expect(nonNull(byCode.CH, "byCode.CH").localShortNames).toEqual([
			{ a2: "de", a3: "deu", name: "Schweiz (die)" },
			{ a2: "fr", a3: "fra", name: "Suisse (la)" },
			{ a2: "it", a3: "ita", name: "Svizzera (la)" },
			{ a2: "rm", a3: "roh", name: "Svizra (la)" },
		]);
		// A language with no ISO 639-1 code has an empty a2 but keeps its 639-2 a3.
		expect(nonNull(byCode.ZA, "byCode.ZA").localShortNames).toHaveLength(11);
		expect(nonNull(byCode.ZA, "byCode.ZA").localShortNames).toContainEqual({
			a2: "",
			a3: "nso",
			name: "Afrika-Borwa",
		});
		// Antarctica has no administrative language → no local short name.
		expect(nonNull(byCode.AQ, "byCode.AQ").localShortNames).toBeUndefined();
	});

	it("omits ccTLDs for reserved-but-undelegated codes", () => {
		for (const code of ["EH", "BL", "MF", "BQ", "UM"]) {
			expect(byCode[code]?.ccTLD).toBeUndefined();
		}
	});

	it("assigns ITU E.164 dialing codes", () => {
		expect(nonNull(byCode.ES, "byCode.ES").phonePrefix).toBe("+34");
		expect(nonNull(byCode.GB, "byCode.GB").phonePrefix).toBe("+44");
		expect(nonNull(byCode.FR, "byCode.FR").phonePrefix).toBe("+33");
		// NANP members share country code +1
		expect(nonNull(byCode.US, "byCode.US").phonePrefix).toBe("+1");
		expect(nonNull(byCode.CA, "byCode.CA").phonePrefix).toBe("+1");
		expect(nonNull(byCode.BB, "byCode.BB").phonePrefix).toBe("+1");
		// Russia and Kazakhstan share +7
		expect(nonNull(byCode.RU, "byCode.RU").phonePrefix).toBe("+7");
		expect(nonNull(byCode.KZ, "byCode.KZ").phonePrefix).toBe("+7");
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

	it("assigns FIFA codes, validated against FIFA's official association list", () => {
		// Codes identical to the ISO 3166-1 alpha-3.
		expect(nonNull(byCode.BR, "byCode.BR").fifaCode).toBe("BRA");
		expect(nonNull(byCode.ES, "byCode.ES").fifaCode).toBe("ESP");
		expect(nonNull(byCode.US, "byCode.US").fifaCode).toBe("USA");
		// Codes that differ from alpha-3 (these get the ISO-mismatch highlight).
		expect(nonNull(byCode.DE, "byCode.DE").fifaCode).toBe("GER");
		expect(nonNull(byCode.CH, "byCode.CH").fifaCode).toBe("SUI");
		expect(nonNull(byCode.NL, "byCode.NL").fifaCode).toBe("NED");
		// Non-sovereign territories that field their own FIFA side.
		expect(nonNull(byCode.FO, "byCode.FO").fifaCode).toBe("FRO"); // Faroe Islands
		expect(nonNull(byCode.TW, "byCode.TW").fifaCode).toBe("TPE"); // Chinese Taipei
		expect(nonNull(byCode.PF, "byCode.PF").fifaCode).toBe("TAH"); // Tahiti / French Polynesia
	});

	it("uses FIFA's current code where the sources disagreed", () => {
		// footballsquads.co.uk still lists pre-rename codes; FIFA, Wikipedia and RSSSF
		// agree on the current ones, confirmed against inside.fifa.com/associations.
		expect(nonNull(byCode.LB, "byCode.LB").fifaCode).toBe("LBN"); // not LIB
		expect(nonNull(byCode.MN, "byCode.MN").fifaCode).toBe("MNG"); // not MGL
		expect(nonNull(byCode.SG, "byCode.SG").fifaCode).toBe("SGP"); // not SIN
		expect(nonNull(byCode.SD, "byCode.SD").fifaCode).toBe("SDN"); // not SUD
		expect(nonNull(byCode.PS, "byCode.PS").fifaCode).toBe("PLE"); // not RSSSF's PAL
	});

	it("omits FIFA codes for non-members", () => {
		// Great Britain fields four home nations, so GB itself has no FIFA code.
		expect(nonNull(byCode.GB, "byCode.GB").fifaCode).toBeUndefined();
		// IOC members that are not (yet) FIFA members.
		for (const code of ["FM", "MC", "NR", "PW", "MH", "VA", "KI", "TV"]) {
			expect(byCode[code]?.fifaCode).toBeUndefined();
		}
	});

	it("covers the 206 FIFA members that have an ISO alpha-2", () => {
		// 211 FIFA members − 4 UK home nations (no alpha-2) − Kosovo (XK, in the
		// missing-countries table) = 206 in the UN M49 table.
		const withFifa = countries.filter((c) => c.fifaCode);
		expect(withFifa.length).toBe(206);
		for (const c of withFifa) {
			expect(c.fifaCode).toMatch(/^[A-Z]{3}$/);
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
		expect(counts.IO).toBeLessThan(nonNull(counts.DE, "counts.DE"));
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
		// FIFA's official code for Kosovo is KOS (inside.fifa.com/associations/KOS),
		// not the KVX used by some football-stats sources.
		expect(kosovo?.fifaCode).toBe("KOS");
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
		expect(nonNull(index.DE, "index.DE").en).toBe("Germany");
		expect(nonNull(index.DE, "index.DE").es).toBe("Alemania");
		expect(nonNull(index.DE, "index.DE").fr).toBe("Allemagne");
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
