import type { DatasetKey } from "./types";

/** A field that gets compared when a row matches one of ours. */
export interface FieldConfig {
	field: string;
	label: string;
	/** Compare case-insensitively (codes, e.g. "us" === "US"). */
	caseInsensitive?: boolean;
	/** Compare as a number so "020" === "20" and "2" === 2. */
	numeric?: boolean;
	/** Compare as a boolean so "yes"/"1"/true all collapse to "true". */
	bool?: boolean;
}

export interface DatasetConfig {
	key: DatasetKey;
	label: string;
	/** Canonical primary-key field. Used as the row identity. */
	primaryKey: string;
	/** Fields tried in order to match a their-row to one of ours. All code-like. */
	keyFields: string[];
	/** Field used for the fuzzy name fallback and for display. */
	nameField: string;
	/** Fields diffed when a row matches (only those the user actually provided). */
	compareFields: FieldConfig[];
	/**
	 * Canonical field -> accepted header aliases. Aliases are matched after
	 * normalization (lowercased, non-alphanumerics stripped), so "Alpha-2 Code",
	 * "alpha2_code" and "alpha2Code" all collapse to the same token. A field's own
	 * name is always accepted; it never has to be listed here.
	 */
	aliases: Record<string, string[]>;
}

/** Collapse a header to a comparable token: lowercased, alphanumerics only. */
export function normalizeHeader(header: string): string {
	return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Build a `normalizedHeader -> canonicalField` lookup for a dataset. Each field's
 * own (normalized) name is registered first so an alias can never hijack a real
 * field name; explicit aliases fill in only where nothing already claims them.
 */
export function aliasLookup(config: DatasetConfig): Map<string, string> {
	const lookup = new Map<string, string>();
	for (const fc of config.compareFields) {
		lookup.set(normalizeHeader(fc.field), fc.field);
	}
	for (const [field, aliases] of Object.entries(config.aliases)) {
		const self = normalizeHeader(field);
		if (!lookup.has(self)) lookup.set(self, field);
		for (const alias of aliases) {
			const token = normalizeHeader(alias);
			if (!lookup.has(token)) lookup.set(token, field);
		}
	}
	return lookup;
}

const countries: DatasetConfig = {
	key: "countries",
	label: "Countries",
	primaryKey: "alpha2Code",
	keyFields: ["alpha2Code", "alpha3Code", "unCode"],
	nameField: "name",
	compareFields: [
		{ field: "name", label: "Name" },
		{ field: "alpha2Code", label: "Alpha-2", caseInsensitive: true },
		{ field: "alpha3Code", label: "Alpha-3", caseInsensitive: true },
		{ field: "unCode", label: "Numeric (M49)", numeric: true },
		{ field: "fullName", label: "Full name" },
		{ field: "ccTLD", label: "ccTLD", caseInsensitive: true },
		{ field: "phonePrefix", label: "Phone code" },
		{ field: "region", label: "Region" },
		{ field: "unMembership", label: "UN membership", caseInsensitive: true },
		{ field: "euMember", label: "EU member", bool: true },
		{ field: "independent", label: "Independent", bool: true },
		{ field: "iocCode", label: "IOC", caseInsensitive: true },
		{ field: "icaoCode", label: "ICAO", caseInsensitive: true },
	],
	aliases: {
		alpha2Code: [
			"alpha2",
			"iso2",
			"iso31661alpha2",
			"cca2",
			"countrycode",
			"code",
			"twoletter",
		],
		alpha3Code: ["alpha3", "iso3", "iso31661alpha3", "cca3", "threeletter"],
		unCode: ["numeric", "numericcode", "ccn3", "m49", "unm49", "isonumeric"],
		name: ["countryname", "official", "commonname", "country", "label"],
		fullName: ["officialname", "formalname", "longname"],
		ccTLD: ["tld", "domain", "internettld"],
		phonePrefix: [
			"phonecode",
			"callingcode",
			"dialcode",
			"dialingcode",
			"idd",
			"phone",
		],
		region: ["continent", "unregion", "macroregion"],
		unMembership: ["unmember", "un"],
		euMember: ["eu", "iseu", "europeanunion"],
		independent: ["isindependent", "sovereign"],
		iocCode: ["ioc", "olympiccode", "noc"],
		icaoCode: ["icao"],
	},
};

const currencies: DatasetConfig = {
	key: "currencies",
	label: "Currencies",
	primaryKey: "code",
	keyFields: ["code", "numericCode"],
	nameField: "name",
	compareFields: [
		{ field: "code", label: "Code", caseInsensitive: true },
		{ field: "numericCode", label: "Numeric", numeric: true },
		{ field: "name", label: "Name" },
		{ field: "minorUnit", label: "Minor unit", numeric: true },
		{ field: "type", label: "Type", caseInsensitive: true },
	],
	aliases: {
		code: [
			"currencycode",
			"alphabeticcode",
			"iso4217",
			"alpha",
			"ccy",
			"alphacode",
		],
		numericCode: ["numeric", "number", "iso4217numeric"],
		name: ["currencyname", "currency", "label"],
		minorUnit: [
			"decimals",
			"decimaldigits",
			"exponent",
			"minorunits",
			"fractiondigits",
		],
		type: ["category"],
	},
};

const languages: DatasetConfig = {
	key: "languages",
	label: "Languages",
	primaryKey: "code",
	keyFields: ["code"],
	nameField: "name",
	compareFields: [
		{ field: "code", label: "Code", caseInsensitive: true },
		{ field: "name", label: "Name" },
		{ field: "nativeName", label: "Native name" },
	],
	aliases: {
		code: ["languagecode", "iso6391", "iso639", "alpha2", "langcode", "lang"],
		name: ["languagename", "language", "englishname", "label"],
		nativeName: ["native", "endonym", "localname"],
	},
};

const timezones: DatasetConfig = {
	key: "timezones",
	label: "Timezones",
	primaryKey: "id",
	keyFields: ["id"],
	nameField: "name",
	compareFields: [
		{ field: "id", label: "IANA ID", caseInsensitive: true },
		{ field: "name", label: "Name" },
		{ field: "offset", label: "UTC offset", caseInsensitive: true },
		{ field: "region", label: "Region", caseInsensitive: true },
	],
	aliases: {
		id: [
			"timezone",
			"tz",
			"ianaid",
			"zone",
			"tzid",
			"iananame",
			"ianatimezone",
			"iana",
		],
		name: ["label", "city", "displayname", "friendlyname"],
		offset: ["utcoffset", "gmtoffset", "rawoffset"],
		region: ["area", "continent"],
	},
};

export const DATASET_CONFIGS: Record<DatasetKey, DatasetConfig> = {
	countries,
	currencies,
	languages,
	timezones,
};

export const DATASET_ORDER: DatasetKey[] = [
	"countries",
	"currencies",
	"languages",
	"timezones",
];
