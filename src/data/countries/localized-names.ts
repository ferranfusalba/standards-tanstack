import { createServerFn } from "@tanstack/react-start";
import { iso639_1Codes } from "../languages";
import { missingCountries } from "./reference/missing";
import { unM49Data } from "./reference/un-m49";

export interface LocalizedName {
	/** Language locale (ISO 639-1) the name is rendered in. */
	locale: string;
	/** English name of that language, for labelling. */
	language: string;
	/** The country's name in that language. */
	name: string;
}

/**
 * Language locales that actually carry CLDR region-name data in this runtime.
 * Built once at module load: a locale only qualifies if `Intl.DisplayNames`
 * resolves it to itself (rather than falling back to another language), so we
 * skip codes like `la`/`vo` that just echo English. The constructed instances
 * are cached and reused across every country lookup.
 */
const regionNameLocales: Array<{
	locale: string;
	language: string;
	displayNames: Intl.DisplayNames;
}> = (() => {
	const result: Array<{
		locale: string;
		language: string;
		displayNames: Intl.DisplayNames;
	}> = [];
	for (const { code, name } of iso639_1Codes) {
		try {
			const displayNames = new Intl.DisplayNames([code], {
				type: "region",
				fallback: "none",
			});
			const base = displayNames.resolvedOptions().locale.split("-")[0];
			if (base === code) {
				result.push({ locale: code, language: name, displayNames });
			}
		} catch {
			// Locale not supported by the runtime — skip it.
		}
	}
	return result;
})();

export interface RegionNameLocale {
	/** Language locale (ISO 639-1). */
	locale: string;
	/** English name of that language. */
	language: string;
}

// Constant for the lifetime of the process — derived once from regionNameLocales.
const regionNameLocaleList: RegionNameLocale[] = regionNameLocales
	.map(({ locale, language }) => ({ locale, language }))
	.sort((a, b) => a.language.localeCompare(b.language));

/**
 * The language locales that carry CLDR region-name data in this runtime — the
 * full set used by the localized-names subrow. Exposed so the UI can offer them
 * in a "Show localized names in" picker.
 */
export const getRegionNameLocales = createServerFn({
	method: "GET",
}).handler(async (): Promise<RegionNameLocale[]> => regionNameLocaleList);

/** Localized names for one alpha-2 code, sorted by locale. Shared core. */
export function localizedNamesFor(alpha2: string): LocalizedName[] {
	const code = alpha2.toUpperCase();
	const names: LocalizedName[] = [];
	for (const { locale, language, displayNames } of regionNameLocales) {
		const localized = displayNames.of(code);
		// `fallback: "none"` yields undefined for gaps; also drop bare-code echoes.
		if (localized && localized !== code) {
			names.push({ locale, language, name: localized });
		}
	}
	names.sort((a, b) => a.locale.localeCompare(b.locale));
	return names;
}

/**
 * Localized names for a single country, generated on demand from CLDR data via
 * `Intl.DisplayNames`. Locales with no name for the given region are omitted.
 */
export const getCountryNames = createServerFn({
	method: "GET",
})
	.inputValidator((data: { code: string }) => data)
	.handler(async ({ data }) => localizedNamesFor(data.code));

// Counts are locale-independent and expensive (~all countries × all locales),
// so compute them once and reuse across loader runs / picker switches.
let localizedNameCounts: Record<string, number> | null = null;

/**
 * How many localized names each country has — counts vary because CLDR has
 * gaps for some territories in some languages. Sent in the initial load so the
 * collapsed Names column can show the count without expanding the row.
 */
export const getLocalizedNameCountsByCountry = createServerFn({
	method: "GET",
}).handler(async () => {
	if (!localizedNameCounts) {
		const counts: Record<string, number> = {};
		for (const { code } of unM49Data) {
			counts[code] = localizedNamesFor(code).length;
		}
		localizedNameCounts = counts;
	}
	return localizedNameCounts;
});

// Every country's full per-locale name map, `{ alpha2: { locale: name } }`.
// Built and cached once (locale-independent); the canonical source for both the
// search index and the structured export.
let localizedNamesAllIndex: Record<string, Record<string, string>> | null =
	null;
function allLocalizedNames(): Record<string, Record<string, string>> {
	if (!localizedNamesAllIndex) {
		const index: Record<string, Record<string, string>> = {};
		for (const { code } of unM49Data) {
			const names: Record<string, string> = {};
			for (const { locale, displayNames } of regionNameLocales) {
				const v = displayNames.of(code);
				if (v && v !== code) names[locale] = v;
			}
			index[code] = names;
		}
		localizedNamesAllIndex = index;
	}
	return localizedNamesAllIndex;
}

/**
 * `{ alpha2: { locale: name } }` for every country and locale (gaps omitted).
 * Heavy (~all countries × all locales), so fetched on demand — e.g. at export
 * time — rather than shipped with every page load.
 */
export const getLocalizedNamesAllByCountry = createServerFn({
	method: "GET",
}).handler(async () => allLocalizedNames());

// Compact per-country search index: distinct localized spellings joined into one
// string. Small enough to ship with the page so global search matches a country
// by its name in ANY language.
let localizedSearchIndex: Record<string, string> | null = null;

/** `{ alpha2: "<all distinct localized names joined>" }`, derived + cached. */
export const getLocalizedSearchByCountry = createServerFn({
	method: "GET",
}).handler(async () => {
	if (!localizedSearchIndex) {
		const index: Record<string, string> = {};
		for (const [code, names] of Object.entries(allLocalizedNames())) {
			index[code] = [...new Set(Object.values(names))].join(" ");
		}
		localizedSearchIndex = index;
	}
	return localizedSearchIndex;
});

/**
 * Every country's name in a single locale, as `{ alpha2: name }`. Uses the same
 * `Intl.DisplayNames` instance as {@link getCountryNames}, so the value here is
 * guaranteed to match the corresponding row in the localized-names subrow.
 * Computed server-side so the picker-driven column never diverges from the
 * subrow (which could happen if the client's CLDR data differed).
 */
export const getCountryNamesByLocale = createServerFn({
	method: "GET",
})
	.inputValidator((data: { locale: string }) => data)
	.handler(async ({ data }): Promise<Record<string, string>> => {
		const entry = regionNameLocales.find((l) => l.locale === data.locale);
		const names: Record<string, string> = {};
		if (!entry) return names;
		// Include the user-assigned "missing" codes (e.g. XK) — CLDR has names
		// for them too, so the Missing table's localized-name column isn't empty.
		for (const { code } of [...unM49Data, ...missingCountries]) {
			const localized = entry.displayNames.of(code);
			if (localized && localized !== code) names[code] = localized;
		}
		return names;
	});
