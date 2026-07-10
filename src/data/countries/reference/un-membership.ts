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

// Administering/sovereign state for each territory (alpha-2 of the sovereign country)
// AQ (Antarctica) and EH (Western Sahara) intentionally excluded — no single sovereign
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
	TK: "NZ", // Tokelau → New Zealand
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
