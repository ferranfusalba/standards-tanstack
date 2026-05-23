import { describe, expect, it } from "vitest";
import {
	groupLocaleOptions,
	localizedNameDiffers,
	normalizeTypography,
} from "../localized-names";

describe("normalizeTypography", () => {
	it("folds curly/straight apostrophe variants", () => {
		// U+2019 (curly), U+02BC (modifier), U+2018 (left) all → ASCII '
		expect(normalizeTypography("d’Ivoire")).toBe("d'Ivoire");
		expect(normalizeTypography("dʼIvoire")).toBe("d'Ivoire");
		expect(normalizeTypography("‘x’")).toBe("'x'");
	});

	it("folds curly double quotes", () => {
		expect(normalizeTypography("“x”")).toBe('"x"');
	});

	it("treats composed and decomposed accents as equal (NFC)", () => {
		const composed = "Côte"; // ô as one codepoint
		const decomposed = "Côte"; // o + combining circumflex
		expect(normalizeTypography(composed)).toBe(normalizeTypography(decomposed));
	});

	it("preserves accents, letters, and case", () => {
		expect(normalizeTypography("España")).toBe("España");
		expect(normalizeTypography("Spain")).not.toBe(
			normalizeTypography("España"),
		);
		expect(normalizeTypography("Spain")).not.toBe(normalizeTypography("spain"));
	});
});

describe("localizedNameDiffers", () => {
	it("is false when there is no localized name", () => {
		expect(localizedNameDiffers("Spain", undefined)).toBe(false);
	});

	it("ignores apostrophe-only (glyph) differences", () => {
		// Official ASCII apostrophe vs CLDR curly apostrophe — same name.
		expect(localizedNameDiffers("Côte d'Ivoire", "Côte d’Ivoire")).toBe(false);
	});

	it("flags real differences (letters/accents)", () => {
		expect(localizedNameDiffers("Spain", "España")).toBe(true);
		expect(localizedNameDiffers("Germany", "Alemania")).toBe(true);
	});
});

describe("groupLocaleOptions", () => {
	const options = [
		{ locale: "ar", language: "Arabic" },
		{ locale: "ca", language: "Catalan" },
		{ locale: "en", language: "English" },
		{ locale: "es", language: "Spanish" },
	];

	it("puts detected locales first (in order) and excludes them from the rest", () => {
		const { detected, rest } = groupLocaleOptions(options, ["ca", "es"]);
		expect(detected.map((o) => o.locale)).toEqual(["ca", "es"]);
		expect(rest.map((o) => o.locale)).toEqual(["ar", "en"]);
	});

	it("returns no detected and the full rest when nothing is detected", () => {
		const { detected, rest } = groupLocaleOptions(options, []);
		expect(detected).toEqual([]);
		expect(rest).toHaveLength(options.length);
	});

	it("skips detected codes that aren't in the options", () => {
		const { detected } = groupLocaleOptions(options, ["zz", "en"]);
		expect(detected.map((o) => o.locale)).toEqual(["en"]);
	});
});
