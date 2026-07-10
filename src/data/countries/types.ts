export interface Country {
	flag: string;
	alpha2Code: string;
	name: string;
	fullName?: string; // ISO 3166 full name (e.g. "the Principality of Andorra")
	localShortNames?: Array<{ a2: string; a3: string; name: string }>; // ISO 3166-1 administrative language(s) + the country's local short name in each (e.g. CH → de/deu "Schweiz", fr/fra "Suisse", …). a2 = ISO 639-1 ("" when none), a3 = ISO 639-2
	alpha3Code?: string; // Alpha-3 code (optional, only from UN/World Bank)
	icaoCode?: string; // ICAO 9303 MRZ code; undefined = territory or no passport-issuing authority
	dsitCode?: string; // Distinguishing Sign in International Traffic (DSIT), only set when differs from Alpha-3
	iocCode?: string; // IOC/NOC Olympic code; undefined = no NOC membership
	fifaCode?: string; // FIFA member-association code; undefined = no FIFA membership
	aircraftRegPrefixes?: string[]; // ICAO Annex 7 aircraft registration nationality marks; undefined = no allocation
	ccTLD?: string; // IANA country-code top-level domain (e.g. ".es"); undefined = no ccTLD delegated in the DNS root
	phonePrefix?: string; // ITU-T E.164 assigned country calling code (e.g. "+34"); undefined = no assignment
	independent?: boolean; // ISO 3166 independence status
	unMembership?: "member" | "observer" | "non-member"; // undefined = territory/not applicable
	sovereignState?: string; // Alpha-2 of administering country, only for territories
	euMember?: boolean; // true = current EU member; undefined = not a member or N/A
	region?: string; // UN M49 macro-geographic region
	unCode?: string; // UN M49 numeric code
	notes?: string; // Additional notes, used for non-standard entries
	subdivisionCount?: number; // Number of ISO 3166-2 subdivisions (lazy-loaded on demand)
	subdivisions?: Array<{
		code: string;
		type?: Record<string, string>;
		iso1?: string;
		flag?: string;
		parent?: string;
		names: Record<string, string>;
	}>; // ISO 3166-2 subdivisions; type = ISO subdivision category keyed by language (e.g. { en: "parish", fr: "paroisse", ca: "parròquia" }); iso1 = ISO 3166-1 alpha-2 if subdivision has one; flag = emoji for non-standard sequences; parent = ISO 3166-2 code of parent subdivision; names = official names keyed by ISO 639-1 language code
}

/** A single ISO 3166-2 subdivision entry (one element of `Country.subdivisions`). */
export type SubdivisionData = NonNullable<Country["subdivisions"]>[number];
