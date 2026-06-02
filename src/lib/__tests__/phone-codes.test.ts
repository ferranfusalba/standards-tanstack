import { describe, expect, it } from "vitest";
import {
	collapseSharedPhoneCodes,
	PRIMARY_COUNTRY_BY_CODE,
} from "../phone-codes";

type Row = {
	flag: string;
	alpha2Code: string;
	name: string;
	phonePrefix?: string;
};

const row = (
	alpha2Code: string,
	name: string,
	phonePrefix?: string,
	flag = `flag:${alpha2Code}`,
): Row => ({ flag, alpha2Code, name, phonePrefix });

describe("collapseSharedPhoneCodes", () => {
	it("collapses a shared code to its libphonenumber primary", () => {
		const out = collapseSharedPhoneCodes([
			row("CA", "Canada", "+1"),
			row("US", "United States", "+1"),
			row("JM", "Jamaica", "+1"),
		]);

		expect(out).toHaveLength(1);
		expect(out[0].alpha2Code).toBe("US"); // primary, not first
		expect(out[0].otherCountries).toEqual([
			{ flag: "flag:CA", alpha2Code: "CA", name: "Canada" },
			{ flag: "flag:JM", alpha2Code: "JM", name: "Jamaica" },
		]);
	});

	it("keeps the collapsed entry at the group's first position", () => {
		const out = collapseSharedPhoneCodes([
			row("ES", "Spain", "+34"),
			row("CA", "Canada", "+1"),
			row("US", "United States", "+1"),
			row("FR", "France", "+33"),
		]);

		// +1 collapses into a single entry where CA (its first member) sat.
		expect(out.map((r) => r.alpha2Code)).toEqual(["ES", "US", "FR"]);
	});

	it("leaves unique codes untouched and without otherCountries", () => {
		const out = collapseSharedPhoneCodes([row("ES", "Spain", "+34")]);
		expect(out).toHaveLength(1);
		expect(out[0]).not.toHaveProperty("otherCountries");
	});

	it("passes through rows that have no phonePrefix", () => {
		const out = collapseSharedPhoneCodes([
			row("AQ", "Antarctica", undefined),
			row("XX", "Nowhere", ""),
		]);
		expect(out).toHaveLength(2);
		expect(out[0]).not.toHaveProperty("otherCountries");
		expect(out[1]).not.toHaveProperty("otherCountries");
	});

	it("falls back to the first row when the preferred primary is absent", () => {
		// +1 with US filtered out → first remaining row (BB) becomes primary.
		const out = collapseSharedPhoneCodes([
			row("BB", "Barbados", "+1"),
			row("JM", "Jamaica", "+1"),
		]);
		expect(out).toHaveLength(1);
		expect(out[0].alpha2Code).toBe("BB");
		expect(out[0].otherCountries).toEqual([
			{ flag: "flag:JM", alpha2Code: "JM", name: "Jamaica" },
		]);
	});

	it("only includes the columns present on the source rows", () => {
		// Flag/Name columns hidden on export → refs carry just what exists.
		const out = collapseSharedPhoneCodes([
			{ alpha2Code: "US", phonePrefix: "+1" },
			{ alpha2Code: "CA", phonePrefix: "+1" },
		]);
		expect(out[0].otherCountries).toEqual([{ alpha2Code: "CA" }]);
	});

	it("has a primary defined for every currently shared code", () => {
		for (const code of Object.keys(PRIMARY_COUNTRY_BY_CODE)) {
			expect(PRIMARY_COUNTRY_BY_CODE[code]).toMatch(/^[A-Z]{2}$/);
		}
	});
});
