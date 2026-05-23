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
	getLanguageNamesByLocale,
	getLanguages,
	type Language,
} from "../languages";

describe("getLanguages", () => {
	let languages: Language[];

	beforeAll(async () => {
		languages = await (getLanguages as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		});
	});

	it("returns all 184 ISO 639-1 languages", () => {
		expect(Array.isArray(languages)).toBe(true);
		expect(languages.length).toBe(184);
	});

	it("each language has code and name", () => {
		for (const lang of languages) {
			expect(lang.code).toBeDefined();
			expect(typeof lang.code).toBe("string");
			expect(lang.code.length).toBe(2);
			expect(lang.name).toBeDefined();
			expect(typeof lang.name).toBe("string");
		}
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

	it("codes are unique", () => {
		const codes = languages.map((l) => l.code);
		expect(new Set(codes).size).toBe(codes.length);
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
