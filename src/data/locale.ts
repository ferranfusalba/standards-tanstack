import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

/** A locale is usable if Intl renders region names in it (not just a fallback). */
function isSupportedRegionLocale(code: string): boolean {
	try {
		const dn = new Intl.DisplayNames([code], {
			type: "region",
			fallback: "none",
		});
		return dn.resolvedOptions().locale.split("-")[0] === code;
	} catch {
		return false;
	}
}

/** Base language codes from an Accept-Language header, highest q-value first. */
export function parseAcceptLanguage(header: string | undefined): string[] {
	if (!header) return [];
	return header
		.split(",")
		.map((part) => {
			const [tag, ...params] = part.trim().split(";");
			const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
			return {
				code: tag.trim().toLowerCase().split("-")[0],
				q: q ? Number.parseFloat(q.slice(2)) : 1,
			};
		})
		.filter((x) => x.code && x.code !== "*" && !Number.isNaN(x.q))
		.sort((a, b) => b.q - a.q)
		.map((x) => x.code);
}

/** Visitor's Accept-Language locales, in order, narrowed to renderable ones. */
function detectedSupportedLocales(header: string | undefined): string[] {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const code of parseAcceptLanguage(header)) {
		if (!seen.has(code) && isSupportedRegionLocale(code)) {
			seen.add(code);
			result.push(code);
		}
	}
	return result;
}

/**
 * The visitor's preferred locale, detected from the Accept-Language header and
 * narrowed to one that Intl can actually render names in. Falls back to English.
 * Shared default for the localized-name pickers across the app (countries,
 * languages, …).
 */
export const getPreferredLocale = createServerFn({ method: "GET" }).handler(
	async (): Promise<string> =>
		detectedSupportedLocales(getRequestHeader("accept-language"))[0] ?? "en",
);

/**
 * All of the visitor's Accept-Language locales that Intl can render, in priority
 * order. Used to surface the user's languages at the top of locale pickers.
 */
export const getDetectedLocales = createServerFn({ method: "GET" }).handler(
	async (): Promise<string[]> =>
		detectedSupportedLocales(getRequestHeader("accept-language")),
);
