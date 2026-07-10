import { createServerFn } from "@tanstack/react-start";
import { localizedNamesFor } from "./localized-names";
import { aircraftRegistrationPrefixes } from "./reference/aircraft-registration";
import { getCcTLD } from "./reference/cctld";
import { fifaCodes } from "./reference/fifa";
import { intlRegionCodes } from "./reference/intl-region-codes";
import { iocCodes } from "./reference/ioc";
import { localShortNames } from "./reference/local-short-names";
import { missingCountries } from "./reference/missing";
import { getMrzCode } from "./reference/mrz";
import { phonePrefixes } from "./reference/phone";
import { regionMap } from "./reference/region-map";
import { subdivisionsData } from "./reference/subdivisions";
import { unM49Data } from "./reference/un-m49";
import {
	euMembers,
	getUnMembership,
	sovereignStates,
} from "./reference/un-membership";
import { vehicleCodes } from "./reference/vehicle";
import type { Country, SubdivisionData } from "./types";

// Helper function to convert country code to emoji flag
function getEmojiFlag(countryCode: string): string {
	const codePoints = countryCode
		.toUpperCase()
		.split("")
		.map((char) => 127397 + char.charCodeAt(0));
	return String.fromCodePoint(...codePoints);
}

// Get countries from Intl API
export const getCountries = createServerFn({
	method: "GET",
}).handler(async () => {
	const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

	const countries: Country[] = intlRegionCodes.map((code) => ({
		flag: getEmojiFlag(code),
		alpha2Code: code,
		name: regionNames.of(code) || code,
	}));

	return countries;
});

// Get countries from UN M49 standard (official UN source)
export const getCountriesFromUN = createServerFn({
	method: "GET",
}).handler(async () => {
	const countries: Country[] = unM49Data.map((country) => {
		const vc = vehicleCodes[country.code];
		return {
			flag: getEmojiFlag(country.code),
			alpha2Code: country.code,
			alpha3Code: country.code3,
			icaoCode: getMrzCode(
				country.code,
				country.code3,
				!!sovereignStates[country.code],
			),
			dsitCode: vc,
			iocCode: iocCodes[country.code],
			fifaCode: fifaCodes[country.code],
			aircraftRegPrefixes: aircraftRegistrationPrefixes[country.code],
			ccTLD: getCcTLD(country.code),
			phonePrefix: phonePrefixes[country.code],
			unMembership: getUnMembership(country.code),
			sovereignState: sovereignStates[country.code],
			euMember: euMembers.has(country.code) || undefined,
			region: regionMap[country.code],
			unCode: country.unCode,
			subdivisionCount: subdivisionsData[country.code]?.length,
			name: country.name,
			fullName: country.fullName,
			localShortNames: localShortNames[country.code],
			independent: country.independent,
		};
	});

	return countries;
});

export const getMissingCountries = createServerFn({
	method: "GET",
}).handler(async () => {
	// CLDR carries display names for these user-assigned codes (e.g. XK → "Kosovo")
	// even though they're absent from unM49Data, so derive them the same way as the
	// official table: English name + localized-name count via Intl.DisplayNames.
	const enRegionNames = new Intl.DisplayNames(["en"], { type: "region" });
	const countries: Array<
		Country & {
			cldrName?: string | undefined;
			localizedNameCount?: number;
			cellNotes?: Record<string, string> | undefined;
		}
	> = missingCountries.map((country) => {
		const vc = vehicleCodes[country.code];
		return {
			flag: getEmojiFlag(country.code),
			alpha2Code: country.code,
			alpha3Code: country.code3,
			icaoCode: getMrzCode(country.code, country.code3 ?? "", false),
			dsitCode: vc,
			iocCode: iocCodes[country.code],
			fifaCode: fifaCodes[country.code],
			aircraftRegPrefixes: aircraftRegistrationPrefixes[country.code],
			phonePrefix: phonePrefixes[country.code],
			unMembership: getUnMembership(country.code),
			euMember: euMembers.has(country.code) || undefined,
			region: regionMap[country.code],
			notes: country.notes,
			cellNotes: country.cellNotes,
			// ISO has no name for these codes, so the Name column shows "-"; the
			// CLDR name (below) carries the display name (e.g. "Kosovo").
			name: country.name ?? "",
			cldrName: enRegionNames.of(country.code) || undefined,
			localizedNameCount: localizedNamesFor(country.code).length,
		};
	});

	return countries;
});

export const getSubdivisions = createServerFn({
	method: "GET",
})
	.inputValidator((data: { code: string }) => data)
	.handler(async ({ data }) => {
		const subs = subdivisionsData[data.code];
		return (subs ?? []) as SubdivisionData[];
	});

export const getSubdivisionsByCountry = createServerFn({
	method: "GET",
}).handler(async () => {
	return subdivisionsData as Record<string, SubdivisionData[]>;
});
