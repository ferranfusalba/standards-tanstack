import { describe, expect, it } from "vitest";
import type { Country } from "../../data/countries";
import { codeChecks, codeDiverges, hasCodeDivergence } from "../country-codes";

// Minimal Country fixture — only the fields the divergence logic reads.
function country(partial: Partial<Country>): Country {
	return { flag: "", alpha2Code: "XX", name: "Test", ...partial };
}

const byId = Object.fromEntries(codeChecks.map((c) => [c.colId, c]));

describe("codeChecks", () => {
	it("covers the four cross-checked code columns", () => {
		expect(codeChecks.map((c) => c.colId)).toEqual([
			"icaoCode",
			"dsitCode",
			"iocCode",
			"fifaCode",
		]);
	});
});

describe("codeDiverges", () => {
	it("flags a code that differs from alpha-3", () => {
		expect(
			codeDiverges(
				byId.fifaCode,
				country({ alpha3Code: "CHE", fifaCode: "SUI" }),
			),
		).toBe(true);
		expect(
			codeDiverges(
				byId.iocCode,
				country({ alpha3Code: "DEU", iocCode: "GER" }),
			),
		).toBe(true);
	});

	it("does not flag a code equal to alpha-3", () => {
		const c = country({
			alpha3Code: "BRA",
			icaoCode: "BRA",
			iocCode: "BRA",
			fifaCode: "BRA",
		});
		expect(codeDiverges(byId.icaoCode, c)).toBe(false);
		expect(codeDiverges(byId.iocCode, c)).toBe(false);
		expect(codeDiverges(byId.fifaCode, c)).toBe(false);
	});

	it("treats the vehicle sign as matching either alpha-2 or alpha-3", () => {
		// Matches alpha-2 → not a divergence.
		expect(
			codeDiverges(
				byId.dsitCode,
				country({ alpha2Code: "BR", alpha3Code: "BRA", dsitCode: "BR" }),
			),
		).toBe(false);
		// Matches alpha-3 → not a divergence.
		expect(
			codeDiverges(
				byId.dsitCode,
				country({ alpha2Code: "US", alpha3Code: "USA", dsitCode: "USA" }),
			),
		).toBe(false);
		// Matches neither → divergence (e.g. Spain's "E").
		expect(
			codeDiverges(
				byId.dsitCode,
				country({ alpha2Code: "ES", alpha3Code: "ESP", dsitCode: "E" }),
			),
		).toBe(true);
	});

	it("never flags an absent code", () => {
		const c = country({
			alpha3Code: "GBR",
			fifaCode: undefined,
			iocCode: undefined,
		});
		expect(codeDiverges(byId.fifaCode, c)).toBe(false);
		expect(codeDiverges(byId.iocCode, c)).toBe(false);
	});
});

describe("hasCodeDivergence", () => {
	it("is true when any single code diverges", () => {
		// Only the Olympic and FIFA codes differ (SUI vs CHE).
		expect(
			hasCodeDivergence(
				country({
					alpha2Code: "CH",
					alpha3Code: "CHE",
					icaoCode: "CHE",
					dsitCode: "CH",
					iocCode: "SUI",
					fifaCode: "SUI",
				}),
			),
		).toBe(true);
	});

	it("is false when every present code matches ISO 3166-1", () => {
		expect(
			hasCodeDivergence(
				country({
					alpha2Code: "BR",
					alpha3Code: "BRA",
					icaoCode: "BRA",
					dsitCode: "BR",
					iocCode: "BRA",
					fifaCode: "BRA",
				}),
			),
		).toBe(false);
	});

	it("is false for a country with no codes at all", () => {
		expect(
			hasCodeDivergence(country({ alpha2Code: "AQ", alpha3Code: "ATA" })),
		).toBe(false);
	});
});
