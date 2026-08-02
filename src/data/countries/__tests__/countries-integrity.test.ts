import { describe, expect, it } from "vitest";
import { aircraftRegistrationPrefixes } from "../reference/aircraft-registration";
import { getCcTLD } from "../reference/cctld";
import { fifaCodes } from "../reference/fifa";
import { iocCodes } from "../reference/ioc";
import { missingCountries } from "../reference/missing";
import { phonePrefixes } from "../reference/phone";
import { regionMap } from "../reference/region-map";
import { subdivisionsData } from "../reference/subdivisions";
import { unM49Data } from "../reference/un-m49";
import { euMembers, sovereignStates } from "../reference/un-membership";
import { vehicleCodes } from "../reference/vehicle";

// The canonical set of country codes the app knows about: every ISO 3166-1
// alpha-2 in the UN M49 list plus the user-assigned "missing" codes (e.g. XK).
// Every lookup table is keyed by alpha-2, so any key NOT in this set is a typo
// or a stale entry that would silently resolve to `undefined` in the UI.
const knownCodes = new Set<string>([
	...unM49Data.map((c) => c.code),
	...missingCountries.map((c) => c.code),
]);

const keyedTables: Record<string, Record<string, unknown>> = {
	iocCodes,
	fifaCodes,
	vehicleCodes,
	phonePrefixes,
	regionMap,
	sovereignStates,
	subdivisionsData,
	aircraftRegistrationPrefixes,
};

describe("countries reference-data integrity", () => {
	it("every lookup key resolves to a known country code", () => {
		const orphans: string[] = [];
		for (const [table, record] of Object.entries(keyedTables)) {
			for (const code of Object.keys(record)) {
				if (!knownCodes.has(code)) orphans.push(`${table}["${code}"]`);
			}
		}
		expect(orphans).toEqual([]);
	});

	it("every EU member is a known country code", () => {
		const orphans = [...euMembers].filter((code) => !knownCodes.has(code));
		expect(orphans).toEqual([]);
	});

	it("UN M49 alpha-2 codes are unique", () => {
		const codes = unM49Data.map((c) => c.code);
		expect(new Set(codes).size).toBe(codes.length);
	});

	// The Numeric column renders `numericCode` directly and sorts it as a string,
	// which only orders correctly while every code is zero-padded to the same width.
	// These three checks were verified against the ISO OBP country pages (all 249
	// numeric codes matched), so a future edit that drops the padding, duplicates a
	// code, or leaves one blank is a regression, not new data.
	it("every UN M49 country has a 3-digit numeric code", () => {
		const bad = unM49Data
			.filter((c) => !/^\d{3}$/.test(c.numericCode))
			.map((c) => `${c.code}="${c.numericCode}"`);
		expect(bad).toEqual([]);
	});

	it("UN M49 numeric codes are unique", () => {
		const byNumeric = new Map<string, string>();
		const dupes: string[] = [];
		for (const c of unM49Data) {
			const prev = byNumeric.get(c.numericCode);
			if (prev) dupes.push(`${c.numericCode}: ${prev} / ${c.code}`);
			byNumeric.set(c.numericCode, c.code);
		}
		expect(dupes).toEqual([]);
	});

	it("matches known ISO 3166-1 numeric assignments", () => {
		const numericFor = (code: string) =>
			unM49Data.find((c) => c.code === code)?.numericCode;
		expect(numericFor("AD")).toBe("020");
		expect(numericFor("AF")).toBe("004");
		expect(numericFor("ES")).toBe("724");
		expect(numericFor("GB")).toBe("826");
		expect(numericFor("US")).toBe("840");
		expect(numericFor("ZW")).toBe("716");
	});

	it("derives a ccTLD for a normal code and honours documented gaps", () => {
		expect(getCcTLD("ES")).toBe(".es");
		expect(getCcTLD("GB")).toBe(".uk");
		expect(getCcTLD("EH")).toBeUndefined();
	});
});
