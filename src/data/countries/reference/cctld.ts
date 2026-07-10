// Country-code top-level domains (ccTLDs)
// Official Source: IANA Root Zone Database — https://www.iana.org/domains/root/db
// Every ISO 3166-1 alpha-2 maps to its lowercase form as a delegated ccTLD, with
// two documented deviations:
//  - GB: the United Kingdom uses .uk (the .gb domain is reserved but not in use).
//  - The codes below are reserved by ISO/IANA but have NO delegation in the DNS
//    root, so they get no ccTLD: EH (Western Sahara), BL (Saint Barthélemy),
//    MF (Saint Martin), BQ (Bonaire/Sint Eustatius/Saba), UM (US Minor Outlying
//    Islands — its .um delegation was removed in 2008).
const ccTLDOverrides: Record<string, string> = {
	GB: ".uk",
};
const noCcTLD = new Set(["EH", "BL", "MF", "BQ", "UM"]);

export function getCcTLD(alpha2: string): string | undefined {
	if (noCcTLD.has(alpha2)) return undefined;
	return ccTLDOverrides[alpha2] ?? `.${alpha2.toLowerCase()}`;
}
