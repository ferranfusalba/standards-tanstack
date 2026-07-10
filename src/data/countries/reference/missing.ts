// Missing countries not in UN M49 (user-assigned and exceptionally reserved codes)
export const missingCountries: Array<{
	code: string;
	code3?: string;
	// No ISO 3166-1 name (these aren't in ISO) — the displayed name comes from CLDR.
	name?: string;
	notes?: string;
	// Per-column tooltip notes for the missing table, keyed by column id (e.g. why
	// XK isn't in ISO, or that ICAO / IOC / ITU assign their own codes for it).
	cellNotes?: Record<string, string>;
}> = [
	{
		code: "XK",
		code3: "XKX",
		notes: "Partially recognised state.",
		cellNotes: {
			alpha2Code:
				"ISO has not assigned a code due to political dispute. XK/XKX are user-assigned de facto codes used by the EU, IMF, and SWIFT.",
			alpha3Code:
				"ISO has not assigned a code due to political dispute. XK/XKX are user-assigned de facto codes used by the EU, IMF, and SWIFT.",
		},
	},
];
