import type { Country } from "../types";

// UN membership status
// Source: https://www.un.org/en/about-us/member-states (193 members)
// Observers: Holy See (VA) since 1964, Palestine (PS) since 2012
// Non-members: Niue (NU) — self-governing but not admitted
//              Taiwan (TW) — seat held by PRC since 1971
//              Kosovo (XK) — blocked by Russia & China veto
// Territories (blank): dependent/non-sovereign entities
const unObservers = new Set(["VA", "PS"]);
const unNonMembers = new Set(["NU", "TW", "XK"]);
const unTerritories = new Set([
	"AX",
	"AI",
	"AQ",
	"AS",
	"AW",
	"BL",
	"BM",
	"BQ",
	"BV",
	"CC",
	"CW",
	"CX",
	"EH",
	"FK",
	"FO",
	"GF",
	"GG",
	"GI",
	"GL",
	"GP",
	"GS",
	"GU",
	"HK",
	"HM",
	"IM",
	"IO",
	"JE",
	"KY",
	"MF",
	"MO",
	"MP",
	"MQ",
	"MS",
	"NC",
	"NF",
	"PM",
	"PN",
	"PR",
	"RE",
	"SH",
	"SJ",
	"SX",
	"TC",
	"TF",
	"TK",
	"UM",
	"VG",
	"VI",
	"WF",
	"YT",
]);

// Administering/sovereign state for each territory (alpha-2 of the sovereign country).
//
// ISO 3166-1 publishes an independence flag but no parent code, so there is no one
// table to copy this from. Two published sources corroborate 33 of the 51 entries:
//   1. ISO 3166-2, where the territory is also a subdivision of its parent (e.g.
//      FR-PF → PF, US-VI → VI) — 22 entries. The integrity test checks this table
//      against `subdivisionsData`, so a wrong or missing parent fails there rather
//      than shipping. https://www.iso.org/obp/ui/#search/code/
//   2. The UN list of Non-Self-Governing Territories, which names an administering
//      Power for 16 of these (EH, its 17th, has none and is left unparented) —
//      11 of them not covered by (1), chiefly the UK's Caribbean and South
//      Atlantic territories. https://www.un.org/dppa/decolonization/en/nsgt
//
// The remaining 18 are backed by neither and rest on the administering state's own
// constitutional arrangements, which is a weaker footing — they are the Crown
// Dependencies and other UK territories (GG, IM, JE, GS, IO), the Dutch Caribbean
// (AW, BQ, CW, SX), the Australian external territories (CC, CX, HM, NF), the
// Danish realm (FO, GL), BV, and the NZ freely associated states (CK, NU). None is
// contested, but none is copied from a published parent table either.
//
// Deliberately absent:
//   AQ (Antarctica), EH (Western Sahara) — no single sovereign.
//   TW — ISO 3166-2 lists it under CN, but the mapping is contested, so the field
//        stays blank and TW keeps its own ISO 3166-1 entry.
//   PS — a non-member observer State, not an administered territory.
export const sovereignStates: Record<string, string> = {
	AX: "FI", // Åland Islands → Finland
	AI: "GB",
	BM: "GB",
	FK: "GB", // UK territories
	GG: "GB",
	GI: "GB",
	GS: "GB",
	IM: "GB",
	IO: "GB",
	JE: "GB",
	KY: "GB",
	MS: "GB",
	PN: "GB",
	SH: "GB",
	TC: "GB",
	VG: "GB",
	AS: "US",
	GU: "US",
	MP: "US", // US territories
	PR: "US",
	UM: "US",
	VI: "US",
	AW: "NL",
	BQ: "NL",
	CW: "NL", // Dutch territories
	SX: "NL",
	BL: "FR",
	GF: "FR",
	GP: "FR", // French territories
	MF: "FR",
	MQ: "FR",
	NC: "FR",
	PF: "FR", // French Polynesia → France (ISO 3166-2 FR-PF; UN NSGT since 2013)
	PM: "FR",
	RE: "FR",
	TF: "FR",
	WF: "FR",
	YT: "FR",
	BV: "NO",
	SJ: "NO", // Norwegian territories
	CC: "AU",
	CX: "AU", // Australian territories
	HM: "AU",
	NF: "AU",
	HK: "CN",
	MO: "CN", // Chinese SARs
	FO: "DK",
	GL: "DK", // Danish territories
	// New Zealand realm. Tokelau is a dependent territory; CK and NU are
	// self-governing states in free association, so NZ administers their external
	// affairs on request rather than governing them. Their UN standing is a
	// separate question from their parent code and is not recorded here.
	TK: "NZ",
	CK: "NZ",
	NU: "NZ",
};

export function getUnMembership(code: string): Country["unMembership"] {
	if (unObservers.has(code)) return "observer";
	if (unNonMembers.has(code)) return "non-member";
	if (unTerritories.has(code)) return undefined;
	return "member";
}

// EU membership — 27 current members (as of 2020, post-Brexit)
// Source: https://european-union.europa.eu/principles-countries-history/country-profiles_en
export const euMembers = new Set([
	"AT",
	"BE",
	"BG",
	"HR",
	"CY",
	"CZ",
	"DK",
	"EE",
	"FI",
	"FR",
	"DE",
	"GR",
	"HU",
	"IE",
	"IT",
	"LV",
	"LT",
	"LU",
	"MT",
	"NL",
	"PL",
	"PT",
	"RO",
	"SK",
	"SI",
	"ES",
	"SE",
]);

// Vienna Convention vehicle registration codes (UNECE)
// Official Source: https://unece.org/DAM/trans/conventn/Distsigns.pdf
