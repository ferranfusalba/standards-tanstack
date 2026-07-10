import { describe, expect, it } from "vitest";
import {
	nextSubSort,
	type SubdivisionLike,
	type SubSort,
	sortSubdivisions,
} from "@/lib/subdivision-sort";
import { nonNull } from "@/lib/test-utils";

describe("nextSubSort", () => {
	it("starts a fresh column ascending", () => {
		expect(nextSubSort(null, "code")).toEqual({ key: "code", dir: "asc" });
		expect(nextSubSort({ key: "code", dir: "asc" }, "name:fr")).toEqual({
			key: "name:fr",
			dir: "asc",
		});
	});

	it("cycles the active column asc → desc → unsorted", () => {
		const asc: SubSort = { key: "code", dir: "asc" };
		const desc = nextSubSort(asc, "code");
		expect(desc).toEqual({ key: "code", dir: "desc" });
		expect(nextSubSort(desc, "code")).toBeNull();
	});
});

describe("sortSubdivisions", () => {
	const flagOf = (s: SubdivisionLike) => s.flag ?? "";
	const subs: SubdivisionLike[] = [
		{
			code: "CA-ON",
			names: { en: "Ontario", fr: "Ontario" },
			type: { en: "province", fr: "province" },
		},
		{
			code: "CA-AB",
			names: { en: "Alberta", fr: "Alberta" },
			type: { en: "province", fr: "province" },
		},
		{
			code: "CA-NT",
			names: { en: "Northwest Territories", fr: "Territoires du Nord-Ouest" },
			type: { en: "territory", fr: "territoire" },
		},
		{
			code: "CA-QC",
			flag: "🇶",
			names: { en: "Quebec", fr: "Québec" },
			type: { en: "province", fr: "province" },
		},
	];

	it("returns the input untouched when unsorted", () => {
		expect(sortSubdivisions(subs, null, flagOf)).toBe(subs);
	});

	it("does not mutate the input array", () => {
		const before = subs.map((s) => s.code);
		sortSubdivisions(subs, { key: "code", dir: "asc" }, flagOf);
		expect(subs.map((s) => s.code)).toEqual(before);
	});

	it("sorts ascending and descending by code", () => {
		const asc = sortSubdivisions(subs, { key: "code", dir: "asc" }, flagOf);
		expect(asc.map((s) => s.code)).toEqual([
			"CA-AB",
			"CA-NT",
			"CA-ON",
			"CA-QC",
		]);
		const desc = sortSubdivisions(subs, { key: "code", dir: "desc" }, flagOf);
		expect(desc.map((s) => s.code)).toEqual([
			"CA-QC",
			"CA-ON",
			"CA-NT",
			"CA-AB",
		]);
	});

	it("sorts by a language-specific value column (name:<lang>)", () => {
		// Québec (fr, diacritic) sorts case/diacritic-insensitively near "Q".
		const fr = sortSubdivisions(subs, { key: "name:fr", dir: "asc" }, flagOf);
		expect(fr.map((s) => s.names.fr)).toEqual([
			"Alberta",
			"Ontario",
			"Québec",
			"Territoires du Nord-Ouest",
		]);
	});

	it("sorts by a type column, grouping ties stably in source order", () => {
		const byType = sortSubdivisions(
			subs,
			{ key: "type:en", dir: "asc" },
			flagOf,
		);
		// "province" rows precede the lone "territory", and the three provinces
		// keep their original relative order (Ontario, Alberta, Quebec).
		expect(byType.map((s) => s.code)).toEqual([
			"CA-ON",
			"CA-AB",
			"CA-QC",
			"CA-NT",
		]);
	});

	it("sorts by the flag column via the supplied resolver", () => {
		const byFlag = sortSubdivisions(subs, { key: "flag", dir: "desc" }, flagOf);
		// Only Quebec has a flag, so it leads when sorting flags descending.
		expect(nonNull(byFlag[0], "byFlag[0]").code).toBe("CA-QC");
	});
});
