// Several ITU-T E.164 calling codes are shared by more than one territory
// (most famously +1, the North American Numbering Plan). When exporting a
// "country + name + dial code" list for, say, a phone-input dropdown, those
// duplicates pile up — 26 rows all reading "+1". `collapseSharedPhoneCodes`
// folds each shared code down to a single primary entry and lists the rest
// under `otherCountries`, so the consumer can still surface every territory.

// The primary territory kept for each shared code, following libphonenumber's
// "main country for calling code" convention. Codes not listed here fall back
// to the first row that carries them (see `collapseSharedPhoneCodes`).
export const PRIMARY_COUNTRY_BY_CODE: Record<string, string> = {
	"+1": "US", // North American Numbering Plan
	"+7": "RU", // shared with Kazakhstan
	"+44": "GB", // shared with Guernsey, Isle of Man, Jersey
	"+47": "NO", // shared with Svalbard & Jan Mayen
	"+61": "AU", // shared with Cocos (Keeling) & Christmas Islands
	"+64": "NZ", // shared with Pitcairn
	"+212": "MA", // shared with Western Sahara
	"+262": "RE", // shared with Mayotte, French Southern Territories
	"+358": "FI", // shared with the Åland Islands
	"+500": "FK", // shared with South Georgia & the South Sandwich Islands
	"+590": "GP", // shared with Saint Barthélemy, Saint Martin
	"+599": "CW", // shared with Bonaire/Sint Eustatius/Saba (the former NL Antilles)
};

// A lightweight reference to one of the other territories that share a code.
// Fields are optional because the export only carries columns the user has
// chosen to show (e.g. the Flag/Name columns may be hidden).
export interface SharedCountryRef {
	flag?: string;
	alpha2Code?: string;
	name?: string;
}

function toRef(row: Record<string, unknown>): SharedCountryRef {
	const ref: SharedCountryRef = {};
	if (typeof row.flag === "string") ref.flag = row.flag;
	if (typeof row.alpha2Code === "string") ref.alpha2Code = row.alpha2Code;
	if (typeof row.name === "string") ref.name = row.name;
	return ref;
}

/**
 * Collapse rows that share a `phonePrefix` into a single primary entry, moving
 * the remaining territories into an `otherCountries` array on that entry.
 *
 * - Rows with no `phonePrefix`, or the sole holder of their code, pass through
 *   untouched.
 * - The collapsed entry takes the position of the group's first row, but keeps
 *   the *primary* territory's data (per `PRIMARY_COUNTRY_BY_CODE`, falling back
 *   to the first row when the preferred primary isn't in the set).
 */
export function collapseSharedPhoneCodes<T extends Record<string, unknown>>(
	rows: T[],
): Array<T & { otherCountries?: SharedCountryRef[] }> {
	// Bucket every row by its (defined) calling code.
	const groups = new Map<string, T[]>();
	for (const row of rows) {
		const code = row.phonePrefix;
		if (typeof code === "string" && code) {
			const group = groups.get(code);
			if (group) group.push(row);
			else groups.set(code, [row]);
		}
	}

	const emitted = new Set<string>();
	const out: Array<T & { otherCountries?: SharedCountryRef[] }> = [];
	for (const row of rows) {
		const code = row.phonePrefix;
		const group = typeof code === "string" && code ? groups.get(code) : null;
		// No code, or unique code → keep as-is.
		if (!group || group.length === 1) {
			out.push(row);
			continue;
		}
		// Shared code → emit one collapsed entry at the group's first position.
		if (emitted.has(code as string)) continue;
		emitted.add(code as string);
		const primaryCode = PRIMARY_COUNTRY_BY_CODE[code as string];
		const primary = group.find((g) => g.alpha2Code === primaryCode) ?? group[0];
		const otherCountries = group.filter((g) => g !== primary).map(toRef);
		out.push({ ...primary, otherCountries });
	}
	return out;
}
