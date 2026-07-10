// ICAO 9303 MRZ passport codes that differ from ISO 3166-1 Alpha-3
// Official Source: https://www.icao.int/publications/doc-series/doc-9303 (Part 3, Annex C)
// Only entries where the MRZ code differs from the ISO Alpha-3 are listed here
const mrzExceptions: Record<string, string> = {
	DE: "D", // Germany: D (from Deutsch) instead of DEU
	XK: "RKS", // Kosovo: RKS (from Republika e Kosovës) — user-assigned codes are XK/XKX; ICAO defines its own KS/RKS
};

// Entities with ISO 3166-1 codes but no passport-issuing authority
// AQ: Antarctica — governed by Antarctic Treaty, no state issues passports
// EH: Western Sahara — disputed territory, no internationally recognised passport authority
const noPassportEntities = new Set(["AQ", "EH"]);

// Returns the MRZ code for a country, or undefined if it doesn't issue passports
export function getMrzCode(
	alpha2: string,
	alpha3: string,
	hasSovereignState: boolean,
): string | undefined {
	if (hasSovereignState || noPassportEntities.has(alpha2)) return undefined;
	return mrzExceptions[alpha2] ?? alpha3;
}
