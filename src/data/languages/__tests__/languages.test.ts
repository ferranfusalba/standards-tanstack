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

import { nonNull } from "@/lib/test-utils";
import {
	type CountryLanguage,
	getLanguageNamesByLocale,
	getLanguages,
	getLanguagesByCountry,
	type Language,
} from "..";

describe("getLanguages", () => {
	let languages: Language[];

	beforeAll(async () => {
		languages = await (getLanguages as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		});
	});

	it("returns the 184 ISO 639-1 languages plus 63 with only a 639-3 code", () => {
		expect(Array.isArray(languages)).toBe(true);
		expect(languages.length).toBe(247);
		expect(languages.filter((l) => l.code).length).toBe(184);
		expect(languages.filter((l) => !l.code).length).toBe(63);
	});

	it("each language has a name and either a 639-1 or 639-3 code", () => {
		for (const lang of languages) {
			expect(typeof lang.name).toBe("string");
			expect(lang.name.length).toBeGreaterThan(0);
			if (lang.code) {
				expect(lang.code.length).toBe(2);
			} else {
				// 639-3-only languages carry a 3-letter code instead of a 639-1 one
				expect(lang.iso639_3?.length).toBe(3);
			}
		}
	});

	it("carries ISO 639-3 codes (and omits it only for the 'bh' collective)", () => {
		const byCode = new Map(languages.map((l) => [l.code, l]));
		expect(byCode.get("en")?.iso639_3).toBe("eng");
		expect(byCode.get("de")?.iso639_3).toBe("deu");
		expect(byCode.get("ca")?.iso639_3).toBe("cat");
		// "bh" (Bihari languages) is a 639-2 collective with no single 639-3 code
		expect(byCode.get("bh")?.iso639_3).toBeUndefined();
		// 639-3-only language: no 639-1 code, name resolved from the 639-3 dataset
		const gsw = languages.find((l) => l.iso639_3 === "gsw");
		expect(gsw?.code).toBe("");
		expect(gsw?.name).toBe("Swiss German");
	});

	it("includes well-known languages", () => {
		const codes = languages.map((l) => l.code);
		expect(codes).toContain("en");
		expect(codes).toContain("es");
		expect(codes).toContain("fr");
		expect(codes).toContain("zh");
		expect(codes).toContain("ca");
	});

	it("has native names for major languages", () => {
		const en = languages.find((l) => l.code === "en");
		expect(en?.nativeName).toBeDefined();
		expect(typeof en?.nativeName).toBe("string");
	});

	it("uses the real native form, not the English name", () => {
		const byCode = new Map(languages.map((l) => [l.code, l]));
		expect(byCode.get("de")?.nativeName).toBe("Deutsch");
		expect(byCode.get("es")?.nativeName).toBe("español");
		expect(byCode.get("fr")?.nativeName).toBe("français");
		expect(byCode.get("nl")?.nativeName).toBe("Nederlands");
	});

	it("never falls back to the English name for an unrenderable locale", () => {
		// If Intl can't actually render a language in its own locale, the field must
		// be undefined rather than silently echo the English name (e.g. "Latin").
		for (const lang of languages) {
			const code = lang.code || lang.iso639_3;
			if (!code) continue;
			const resolved = new Intl.DisplayNames([code], {
				type: "language",
				fallback: "none",
			})
				.resolvedOptions()
				.locale.split("-")[0];
			if (resolved !== code) {
				expect(lang.nativeName).toBeUndefined();
			}
		}
	});

	it("BCP 47 variants are arrays when present", () => {
		const withVariants = languages.filter((l) => l.bcp47Variants);
		expect(withVariants.length).toBeGreaterThan(0);
		for (const lang of withVariants) {
			expect(Array.isArray(lang.bcp47Variants)).toBe(true);
			expect(lang.bcp47Variants?.length).toBeGreaterThan(0);
		}
	});

	it("CLDR variants are arrays when present", () => {
		const withCldr = languages.filter((l) => l.cldrVariants);
		expect(withCldr.length).toBeGreaterThan(0);
		for (const lang of withCldr) {
			expect(Array.isArray(lang.cldrVariants)).toBe(true);
			expect(lang.cldrVariants?.length).toBeGreaterThan(0);
		}
	});

	it("639-1 and 639-3 codes are each unique", () => {
		const codes1 = languages.map((l) => l.code).filter(Boolean);
		expect(new Set(codes1).size).toBe(codes1.length);
		const codes3 = languages
			.map((l) => l.iso639_3)
			.filter((c): c is string => Boolean(c));
		expect(new Set(codes3).size).toBe(codes3.length);
	});
});

describe("getLanguageNamesByLocale", () => {
	const call = (locale: string): Promise<Record<string, string>> =>
		(getLanguageNamesByLocale as unknown as HandlerFn)({
			data: { locale },
			context: {},
			signal: new AbortController().signal,
		});

	it("returns language names in the requested locale", async () => {
		const es = await call("es");
		expect(es.de).toBe("alemán");
		expect(es.en).toBe("inglés");
		expect(es.fr).toBe("francés");
		expect(Object.keys(es).length).toBeGreaterThan(100);
	});

	it("omits bare-code echoes", async () => {
		const es = await call("es");
		for (const [code, name] of Object.entries(es)) {
			expect(name).not.toBe(code);
		}
	});
});

describe("getLanguagesByCountry", () => {
	let map: Record<string, CountryLanguage[]>;

	beforeAll(async () => {
		map = await (getLanguagesByCountry as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		});
	});

	it("captures regional co-official languages ISO omits (Spain)", () => {
		const codes = nonNull(map.ES, "map.ES").map((l) => l.lang);
		// es official + ca/gl/eu regional — none of which ISO 3166 records for ES
		expect(codes).toEqual(expect.arrayContaining(["es", "ca", "gl", "eu"]));
		expect(nonNull(map.ES, "map.ES").find((l) => l.lang === "es")?.status).toBe(
			"official",
		);
		expect(nonNull(map.ES, "map.ES").find((l) => l.lang === "ca")?.status).toBe(
			"regional",
		);
	});

	it("resolves names, including 639-3-only languages", () => {
		// Switzerland's de-facto Swiss German has only a 639-3 code
		const gsw = nonNull(map.CH, "map.CH").find((l) => l.lang === "gsw");
		expect(gsw?.name).toBe("Swiss German");
		expect(gsw?.status).toBe("de_facto");
		expect(nonNull(map.CH, "map.CH").find((l) => l.lang === "de")?.name).toBe(
			"German",
		);
	});

	it("every referenced language code resolves to a name", () => {
		for (const langs of Object.values(map)) {
			for (const l of langs) {
				expect(l.name).toBeTruthy();
				expect(l.name).not.toBe(l.lang); // not just echoing the code
			}
		}
	});
});
