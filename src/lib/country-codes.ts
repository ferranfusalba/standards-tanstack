import type { Country } from "@/data/countries";

// Each code column cross-checked against ISO 3166-1: a code "diverges" when it is
// present and differs from every ISO field it's compared against (alpha-3 for the
// passport / Olympic / FIFA codes; both alpha-2 and alpha-3 for the vehicle sign,
// which legitimately matches either). Single source of truth for the red highlight,
// the divergence count/filter, and the per-country detail panel.
export const codeChecks: ReadonlyArray<{
	colId: string;
	get: (c: Country) => string | undefined;
	against: ReadonlyArray<(c: Country) => string | undefined>;
}> = [
	{ colId: "icaoCode", get: (c) => c.icaoCode, against: [(c) => c.alpha3Code] },
	{
		colId: "dsitCode",
		get: (c) => c.dsitCode,
		against: [(c) => c.alpha2Code, (c) => c.alpha3Code],
	},
	{ colId: "iocCode", get: (c) => c.iocCode, against: [(c) => c.alpha3Code] },
	{ colId: "fifaCode", get: (c) => c.fifaCode, against: [(c) => c.alpha3Code] },
];

/** True when this specific code is present and differs from its ISO 3166-1 field(s). */
export function codeDiverges(
	check: (typeof codeChecks)[number],
	c: Country,
): boolean {
	const value = check.get(c);
	if (!value) return false;
	return check.against.every((iso) => value !== iso(c));
}

/** True when any of the country's codes differs from the ISO 3166-1 standard. */
export function hasCodeDivergence(c: Country): boolean {
	return codeChecks.some((check) => codeDiverges(check, c));
}
