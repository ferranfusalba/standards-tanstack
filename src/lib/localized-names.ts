import type { RegionNameLocale } from "@/data/countries";

/**
 * Fold typographic punctuation (curly vs straight apostrophes/quotes) and Unicode
 * form so a glyph-only difference like "d'Ivoire" vs "d'Ivoire" isn't treated as a
 * real name difference. Letters and accents are preserved, so those still count.
 */
export function normalizeTypography(name: string): string {
	return name.normalize("NFC").replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"');
}

/**
 * Whether a localized name is a real (letter/accent-level) difference from the
 * official name — ignoring glyph-only apostrophe/quote variations. Returns false
 * when there is no localized name to compare.
 */
export function localizedNameDiffers(
	name: string,
	localized: string | undefined,
): boolean {
	if (!localized) return false;
	return normalizeTypography(localized) !== normalizeTypography(name);
}

/**
 * Split locale options into the visitor's detected locales (in priority order)
 * and everything else, with no duplicates — for a "Detected / All" picker.
 */
export function groupLocaleOptions(
	options: RegionNameLocale[],
	detectedLocales: string[],
): { detected: RegionNameLocale[]; rest: RegionNameLocale[] } {
	const detected = detectedLocales
		.map((loc) => options.find((o) => o.locale === loc))
		.filter((o): o is RegionNameLocale => o != null);
	const detectedSet = new Set(detectedLocales);
	const rest = options.filter((o) => !detectedSet.has(o.locale));
	return { detected, rest };
}
