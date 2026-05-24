import { createServerFn } from "@tanstack/react-start";
import { aircraftRegistrationPrefixes } from "./aircraft-registration-prefixes";
import { iso639_1Codes } from "./languages";
import adSubdivisions from "./subdivisions/AD.json";
import aeSubdivisions from "./subdivisions/AE.json";
import afSubdivisions from "./subdivisions/AF.json";
import agSubdivisions from "./subdivisions/AG.json";
import alSubdivisions from "./subdivisions/AL.json";
import amSubdivisions from "./subdivisions/AM.json";
import aoSubdivisions from "./subdivisions/AO.json";
import arSubdivisions from "./subdivisions/AR.json";
import atSubdivisions from "./subdivisions/AT.json";
import auSubdivisions from "./subdivisions/AU.json";
import azSubdivisions from "./subdivisions/AZ.json";
import baSubdivisions from "./subdivisions/BA.json";
import bbSubdivisions from "./subdivisions/BB.json";
import bdSubdivisions from "./subdivisions/BD.json";
import beSubdivisions from "./subdivisions/BE.json";
import bfSubdivisions from "./subdivisions/BF.json";
import bgSubdivisions from "./subdivisions/BG.json";
import bhSubdivisions from "./subdivisions/BH.json";
import biSubdivisions from "./subdivisions/BI.json";
import bjSubdivisions from "./subdivisions/BJ.json";
import bnSubdivisions from "./subdivisions/BN.json";
import boSubdivisions from "./subdivisions/BO.json";
import bqSubdivisions from "./subdivisions/BQ.json";
import brSubdivisions from "./subdivisions/BR.json";
import bsSubdivisions from "./subdivisions/BS.json";
import btSubdivisions from "./subdivisions/BT.json";
import bwSubdivisions from "./subdivisions/BW.json";
import bySubdivisions from "./subdivisions/BY.json";
import bzSubdivisions from "./subdivisions/BZ.json";
import caSubdivisions from "./subdivisions/CA.json";
import cdSubdivisions from "./subdivisions/CD.json";
import cfSubdivisions from "./subdivisions/CF.json";
import cgSubdivisions from "./subdivisions/CG.json";
import chSubdivisions from "./subdivisions/CH.json";
import ciSubdivisions from "./subdivisions/CI.json";
import clSubdivisions from "./subdivisions/CL.json";
import cmSubdivisions from "./subdivisions/CM.json";
import cnSubdivisions from "./subdivisions/CN.json";
import coSubdivisions from "./subdivisions/CO.json";
import crSubdivisions from "./subdivisions/CR.json";
import cuSubdivisions from "./subdivisions/CU.json";
import cvSubdivisions from "./subdivisions/CV.json";
import cySubdivisions from "./subdivisions/CY.json";
import czSubdivisions from "./subdivisions/CZ.json";
import deSubdivisions from "./subdivisions/DE.json";
import djSubdivisions from "./subdivisions/DJ.json";
import dkSubdivisions from "./subdivisions/DK.json";
import dmSubdivisions from "./subdivisions/DM.json";
import doSubdivisions from "./subdivisions/DO.json";
import dzSubdivisions from "./subdivisions/DZ.json";
import ecSubdivisions from "./subdivisions/EC.json";
import eeSubdivisions from "./subdivisions/EE.json";
import egSubdivisions from "./subdivisions/EG.json";
import erSubdivisions from "./subdivisions/ER.json";
import esSubdivisions from "./subdivisions/ES.json";
import etSubdivisions from "./subdivisions/ET.json";
import fiSubdivisions from "./subdivisions/FI.json";
import fjSubdivisions from "./subdivisions/FJ.json";
import fmSubdivisions from "./subdivisions/FM.json";
import frSubdivisions from "./subdivisions/FR.json";
import gaSubdivisions from "./subdivisions/GA.json";
import gbSubdivisions from "./subdivisions/GB.json";
import gdSubdivisions from "./subdivisions/GD.json";
import geSubdivisions from "./subdivisions/GE.json";
import ghSubdivisions from "./subdivisions/GH.json";
import glSubdivisions from "./subdivisions/GL.json";
import gmSubdivisions from "./subdivisions/GM.json";
import gnSubdivisions from "./subdivisions/GN.json";
import gqSubdivisions from "./subdivisions/GQ.json";
import grSubdivisions from "./subdivisions/GR.json";
import gtSubdivisions from "./subdivisions/GT.json";
import gwSubdivisions from "./subdivisions/GW.json";
import gySubdivisions from "./subdivisions/GY.json";
import hkSubdivisions from "./subdivisions/HK.json";
import hnSubdivisions from "./subdivisions/HN.json";
import hrSubdivisions from "./subdivisions/HR.json";
import htSubdivisions from "./subdivisions/HT.json";
import huSubdivisions from "./subdivisions/HU.json";
import idSubdivisions from "./subdivisions/ID.json";
import ieSubdivisions from "./subdivisions/IE.json";
import ilSubdivisions from "./subdivisions/IL.json";
import inSubdivisions from "./subdivisions/IN.json";
import iqSubdivisions from "./subdivisions/IQ.json";
import irSubdivisions from "./subdivisions/IR.json";
import isSubdivisions from "./subdivisions/IS.json";
import itSubdivisions from "./subdivisions/IT.json";
import jmSubdivisions from "./subdivisions/JM.json";
import joSubdivisions from "./subdivisions/JO.json";
import jpSubdivisions from "./subdivisions/JP.json";
import keSubdivisions from "./subdivisions/KE.json";
import kgSubdivisions from "./subdivisions/KG.json";
import khSubdivisions from "./subdivisions/KH.json";
import kiSubdivisions from "./subdivisions/KI.json";
import kmSubdivisions from "./subdivisions/KM.json";
import knSubdivisions from "./subdivisions/KN.json";
import kpSubdivisions from "./subdivisions/KP.json";
import krSubdivisions from "./subdivisions/KR.json";
import kwSubdivisions from "./subdivisions/KW.json";
import kzSubdivisions from "./subdivisions/KZ.json";
import laSubdivisions from "./subdivisions/LA.json";
import lbSubdivisions from "./subdivisions/LB.json";
import lcSubdivisions from "./subdivisions/LC.json";
import liSubdivisions from "./subdivisions/LI.json";
import lkSubdivisions from "./subdivisions/LK.json";
import lrSubdivisions from "./subdivisions/LR.json";
import lsSubdivisions from "./subdivisions/LS.json";
import ltSubdivisions from "./subdivisions/LT.json";
import luSubdivisions from "./subdivisions/LU.json";
import lvSubdivisions from "./subdivisions/LV.json";
import lySubdivisions from "./subdivisions/LY.json";
import maSubdivisions from "./subdivisions/MA.json";
import mdSubdivisions from "./subdivisions/MD.json";
import meSubdivisions from "./subdivisions/ME.json";
import mgSubdivisions from "./subdivisions/MG.json";
import mhSubdivisions from "./subdivisions/MH.json";
import mkSubdivisions from "./subdivisions/MK.json";
import mlSubdivisions from "./subdivisions/ML.json";
import mmSubdivisions from "./subdivisions/MM.json";
import mnSubdivisions from "./subdivisions/MN.json";
import mrSubdivisions from "./subdivisions/MR.json";
import mtSubdivisions from "./subdivisions/MT.json";
import muSubdivisions from "./subdivisions/MU.json";
import mvSubdivisions from "./subdivisions/MV.json";
import mwSubdivisions from "./subdivisions/MW.json";
import mxSubdivisions from "./subdivisions/MX.json";
import mySubdivisions from "./subdivisions/MY.json";
import mzSubdivisions from "./subdivisions/MZ.json";
import naSubdivisions from "./subdivisions/NA.json";
import ncSubdivisions from "./subdivisions/NC.json";
import neSubdivisions from "./subdivisions/NE.json";
import ngSubdivisions from "./subdivisions/NG.json";
import niSubdivisions from "./subdivisions/NI.json";
import nlSubdivisions from "./subdivisions/NL.json";
import noSubdivisions from "./subdivisions/NO.json";
import npSubdivisions from "./subdivisions/NP.json";
import nrSubdivisions from "./subdivisions/NR.json";
import nzSubdivisions from "./subdivisions/NZ.json";
import omSubdivisions from "./subdivisions/OM.json";
import paSubdivisions from "./subdivisions/PA.json";
import peSubdivisions from "./subdivisions/PE.json";
import pgSubdivisions from "./subdivisions/PG.json";
import phSubdivisions from "./subdivisions/PH.json";
import pkSubdivisions from "./subdivisions/PK.json";
import plSubdivisions from "./subdivisions/PL.json";
import psSubdivisions from "./subdivisions/PS.json";
import ptSubdivisions from "./subdivisions/PT.json";
import pwSubdivisions from "./subdivisions/PW.json";
import pySubdivisions from "./subdivisions/PY.json";
import qaSubdivisions from "./subdivisions/QA.json";
import roSubdivisions from "./subdivisions/RO.json";
import rsSubdivisions from "./subdivisions/RS.json";
import ruSubdivisions from "./subdivisions/RU.json";
import rwSubdivisions from "./subdivisions/RW.json";
import saSubdivisions from "./subdivisions/SA.json";
import sbSubdivisions from "./subdivisions/SB.json";
import scSubdivisions from "./subdivisions/SC.json";
import sdSubdivisions from "./subdivisions/SD.json";
import seSubdivisions from "./subdivisions/SE.json";
import shSubdivisions from "./subdivisions/SH.json";
import siSubdivisions from "./subdivisions/SI.json";
import skSubdivisions from "./subdivisions/SK.json";
import slSubdivisions from "./subdivisions/SL.json";
import smSubdivisions from "./subdivisions/SM.json";
import snSubdivisions from "./subdivisions/SN.json";
import soSubdivisions from "./subdivisions/SO.json";
import srSubdivisions from "./subdivisions/SR.json";
import ssSubdivisions from "./subdivisions/SS.json";
import stSubdivisions from "./subdivisions/ST.json";
import svSubdivisions from "./subdivisions/SV.json";
import sySubdivisions from "./subdivisions/SY.json";
import szSubdivisions from "./subdivisions/SZ.json";
import tdSubdivisions from "./subdivisions/TD.json";
import tgSubdivisions from "./subdivisions/TG.json";
import thSubdivisions from "./subdivisions/TH.json";
import tjSubdivisions from "./subdivisions/TJ.json";
import tlSubdivisions from "./subdivisions/TL.json";
import tmSubdivisions from "./subdivisions/TM.json";
import tnSubdivisions from "./subdivisions/TN.json";
import toSubdivisions from "./subdivisions/TO.json";
import trSubdivisions from "./subdivisions/TR.json";
import ttSubdivisions from "./subdivisions/TT.json";
import tvSubdivisions from "./subdivisions/TV.json";
import twSubdivisions from "./subdivisions/TW.json";
import tzSubdivisions from "./subdivisions/TZ.json";
import uaSubdivisions from "./subdivisions/UA.json";
import ugSubdivisions from "./subdivisions/UG.json";
import usSubdivisions from "./subdivisions/US.json";
import uySubdivisions from "./subdivisions/UY.json";
import uzSubdivisions from "./subdivisions/UZ.json";
import vcSubdivisions from "./subdivisions/VC.json";
import veSubdivisions from "./subdivisions/VE.json";
import vnSubdivisions from "./subdivisions/VN.json";
import vuSubdivisions from "./subdivisions/VU.json";
import wsSubdivisions from "./subdivisions/WS.json";
import yeSubdivisions from "./subdivisions/YE.json";
import zaSubdivisions from "./subdivisions/ZA.json";
import zmSubdivisions from "./subdivisions/ZM.json";
import zwSubdivisions from "./subdivisions/ZW.json";

export interface Country {
	flag: string;
	alpha2Code: string;
	name: string;
	fullName?: string; // ISO 3166 full name (e.g. "the Principality of Andorra")
	alpha3Code?: string; // Alpha-3 code (optional, only from UN/World Bank)
	icaoCode?: string; // ICAO 9303 MRZ code; undefined = territory or no passport-issuing authority
	dsitCode?: string; // Distinguishing Sign in International Traffic (DSIT), only set when differs from Alpha-3
	iocCode?: string; // IOC/NOC Olympic code; undefined = no NOC membership
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

// Helper function to convert country code to emoji flag
function getEmojiFlag(countryCode: string): string {
	const codePoints = countryCode
		.toUpperCase()
		.split("")
		.map((char) => 127397 + char.charCodeAt(0));
	return String.fromCodePoint(...codePoints);
}

// ICAO 9303 MRZ passport codes that differ from ISO 3166-1 Alpha-3
// Official Source: https://www.icao.int/publications/doc-series/doc-9303 (Part 3, Annex C)
// Only entries where the MRZ code differs from the ISO Alpha-3 are listed here
const mrzExceptions: Record<string, string> = {
	DE: "D", // Germany: D (from Deutsch) instead of DEU
	XK: "RKS", // Kosovo: RKS (from Republika e Kosovës) — user-assigned codes are XK/XKX; ICAO defines its own KS/RKS
};

// Entities with ISO 3166-1 codes but no passport-issuing authority
// AQ: Antarctica — governed by Antarctic Treaty, no state issues passports
// EH: Western Sahara — disputed territory, no internationally recognised passport authority
const noPassportEntities = new Set(["AQ", "EH"]);

// Returns the MRZ code for a country, or undefined if it doesn't issue passports
function getMrzCode(
	alpha2: string,
	alpha3: string,
	hasSovereignState: boolean,
): string | undefined {
	if (hasSovereignState || noPassportEntities.has(alpha2)) return undefined;
	return mrzExceptions[alpha2] ?? alpha3;
}

// IOC (International Olympic Committee) / NOC country codes
// Official Source: https://www.olympic.org/national-olympic-committees
// Complete list — undefined means the country has no NOC
const iocCodes: Record<string, string> = {
	AD: "AND",
	AE: "UAE",
	AF: "AFG",
	AG: "ANT",
	AL: "ALB",
	AM: "ARM",
	AO: "ANG",
	AR: "ARG",
	AS: "ASA",
	AT: "AUT",
	AU: "AUS",
	AW: "ARU",
	AZ: "AZE",
	BA: "BIH",
	BB: "BAR",
	BD: "BAN",
	BE: "BEL",
	BF: "BUR",
	BG: "BUL",
	BH: "BRN",
	BI: "BDI",
	BJ: "BEN",
	BM: "BER",
	BN: "BRU",
	BO: "BOL",
	BR: "BRA",
	BS: "BAH",
	BT: "BHU",
	BW: "BOT",
	BY: "BLR",
	BZ: "BIZ",
	CA: "CAN",
	CD: "COD",
	CF: "CAF",
	CG: "CGO",
	CH: "SUI",
	CI: "CIV",
	CK: "COK",
	CL: "CHI",
	CM: "CMR",
	CN: "CHN",
	CO: "COL",
	CR: "CRC",
	CU: "CUB",
	CV: "CPV",
	CY: "CYP",
	CZ: "CZE",
	DE: "GER",
	DJ: "DJI",
	DK: "DEN",
	DM: "DMA",
	DO: "DOM",
	DZ: "ALG",
	EC: "ECU",
	EE: "EST",
	EG: "EGY",
	ER: "ERI",
	ES: "ESP",
	ET: "ETH",
	FI: "FIN",
	FJ: "FIJ",
	FM: "FSM",
	FR: "FRA",
	GA: "GAB",
	GB: "GBR",
	GD: "GRN",
	GE: "GEO",
	GH: "GHA",
	GM: "GAM",
	GN: "GUI",
	GQ: "GEQ",
	GR: "GRE",
	GT: "GUA",
	GU: "GUM",
	GW: "GBS",
	GY: "GUY",
	HK: "HKG",
	HN: "HON",
	HR: "CRO",
	HT: "HAI",
	HU: "HUN",
	ID: "INA",
	IE: "IRL",
	IL: "ISR",
	IN: "IND",
	IQ: "IRQ",
	IR: "IRI",
	IS: "ISL",
	IT: "ITA",
	JM: "JAM",
	JO: "JOR",
	JP: "JPN",
	KE: "KEN",
	KG: "KGZ",
	KH: "CAM",
	KI: "KIR",
	KM: "COM",
	KN: "SKN",
	KP: "PRK",
	KR: "KOR",
	KW: "KUW",
	KY: "CAY",
	KZ: "KAZ",
	LA: "LAO",
	LB: "LBN",
	LC: "LCA",
	LI: "LIE",
	LK: "SRI",
	LR: "LBR",
	LS: "LES",
	LT: "LTU",
	LU: "LUX",
	LV: "LAT",
	LY: "LBA",
	MA: "MAR",
	MC: "MON",
	MD: "MDA",
	ME: "MNE",
	MG: "MAD",
	MH: "MHL",
	MK: "MKD",
	ML: "MLI",
	MM: "MYA",
	MN: "MGL",
	MR: "MTN",
	MT: "MLT",
	MU: "MRI",
	MV: "MDV",
	MW: "MAW",
	MX: "MEX",
	MY: "MAS",
	MZ: "MOZ",
	NA: "NAM",
	NE: "NIG",
	NG: "NGR",
	NI: "NCA",
	NL: "NED",
	NO: "NOR",
	NP: "NEP",
	NR: "NRU",
	NZ: "NZL",
	OM: "OMA",
	PA: "PAN",
	PE: "PER",
	PG: "PNG",
	PH: "PHI",
	PK: "PAK",
	PL: "POL",
	PR: "PUR",
	PS: "PLE",
	PT: "POR",
	PW: "PLW",
	PY: "PAR",
	QA: "QAT",
	RO: "ROU",
	RS: "SRB",
	RU: "RUS",
	RW: "RWA",
	SA: "KSA",
	SB: "SOL",
	SC: "SEY",
	SD: "SUD",
	SE: "SWE",
	SG: "SGP",
	SI: "SLO",
	SK: "SVK",
	SL: "SLE",
	SM: "SMR",
	SN: "SEN",
	SO: "SOM",
	SR: "SUR",
	SS: "SSD",
	ST: "STP",
	SV: "ESA",
	SY: "SYR",
	SZ: "SWZ",
	TD: "CHA",
	TG: "TOG",
	TH: "THA",
	TJ: "TJK",
	TL: "TLS",
	TM: "TKM",
	TN: "TUN",
	TO: "TGA",
	TR: "TUR",
	TT: "TTO",
	TV: "TUV",
	TW: "TPE",
	TZ: "TAN",
	UA: "UKR",
	UG: "UGA",
	US: "USA",
	UY: "URU",
	UZ: "UZB",
	VC: "VIN",
	VE: "VEN",
	VG: "IVB",
	VI: "ISV",
	VN: "VIE",
	VU: "VAN",
	WS: "SAM",
	XK: "KOS",
	YE: "YEM",
	ZA: "RSA",
	ZM: "ZAM",
	ZW: "ZIM",
};

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
const sovereignStates: Record<string, string> = {
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

function getUnMembership(code: string): Country["unMembership"] {
	if (unObservers.has(code)) return "observer";
	if (unNonMembers.has(code)) return "non-member";
	if (unTerritories.has(code)) return undefined;
	return "member";
}

// EU membership — 27 current members (as of 2020, post-Brexit)
// Source: https://european-union.europa.eu/principles-countries-history/country-profiles_en
const euMembers = new Set([
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
// Vienna Convention on Road Traffic (1968) - Distinguishing Signs
const vehicleCodes: Record<string, string> = {
	AF: "AFG",
	AL: "AL",
	DZ: "DZ",
	AD: "AND",
	AR: "RA",
	AM: "AM",
	AU: "AUS",
	AT: "A",
	AZ: "AZ",
	BS: "BS",
	BH: "BRN",
	BD: "BD",
	BB: "BDS",
	BY: "BY",
	BE: "B",
	BZ: "BH",
	BJ: "DY",
	BO: "BOL",
	BA: "BIH",
	BW: "BW",
	BR: "BR",
	BN: "BRU",
	BG: "BG",
	BF: "BF",
	BI: "RU",
	KH: "KH",
	CM: "CAM",
	CA: "CDN",
	CF: "RCA",
	TD: "TCH",
	CL: "RCH",
	CO: "CO",
	CG: "RCB",
	CD: "ZRE",
	CR: "CR",
	CI: "CI",
	HR: "HR",
	CU: "CU",
	CY: "CY",
	CZ: "CZ",
	DK: "DK",
	DO: "DOM",
	EC: "EC",
	EG: "ET",
	SV: "ES",
	ER: "ER",
	EE: "EST",
	ET: "ETH",
	FJ: "FJI",
	FI: "FIN",
	FR: "F",
	GA: "G",
	GM: "WAG",
	GE: "GE",
	DE: "D",
	GH: "GH",
	GR: "GR",
	GD: "WG",
	GT: "GCA",
	GN: "RG",
	GY: "GUY",
	HT: "RH",
	HU: "H",
	IS: "IS",
	IN: "IND",
	ID: "RI",
	IR: "IR",
	IQ: "IRQ",
	IE: "IRL",
	IL: "IL",
	IT: "I",
	JM: "JA",
	JP: "J",
	JO: "HKJ",
	KZ: "KZ",
	KE: "EAK",
	KR: "ROK",
	KW: "KWT",
	KG: "KS",
	LA: "LAO",
	LV: "LV",
	LB: "RL",
	LS: "LS",
	LY: "LAR",
	LI: "FL",
	LT: "LT",
	LU: "L",
	MK: "NMK",
	MG: "RM",
	MW: "MW",
	MY: "MAL",
	ML: "RMM",
	MT: "M",
	MR: "RIM",
	MU: "MS",
	MX: "MEX",
	MD: "MD",
	MC: "MC",
	MN: "MGL",
	ME: "MNE",
	MA: "MA",
	MZ: "MOC",
	MM: "BUR",
	NA: "NAM",
	NP: "NEP",
	NL: "NL",
	NZ: "NZ",
	NI: "NIC",
	NE: "RN",
	NG: "WAN",
	NO: "N",
	PK: "PK",
	PA: "PA",
	PG: "PNG",
	PY: "PY",
	PE: "PE",
	PH: "RP",
	PL: "PL",
	PT: "P",
	QA: "Q",
	RO: "RO",
	RU: "RUS",
	RW: "RWA",
	LC: "WL",
	VC: "WV",
	WS: "WS",
	SM: "RSM",
	SA: "SA",
	SN: "SN",
	RS: "SRB",
	SC: "SY",
	SL: "WAL",
	SG: "SGP",
	SK: "SK",
	SI: "SLO",
	SO: "SO",
	ZA: "ZA",
	ES: "E",
	LK: "CL",
	SD: "SUD",
	SR: "SME",
	SZ: "SD",
	SE: "S",
	CH: "CH",
	SY: "SYR",
	TJ: "TJ",
	TZ: "EAT",
	TH: "T",
	TG: "TG",
	TT: "TT",
	TN: "TN",
	TR: "TR",
	TM: "TM",
	UG: "EAU",
	UA: "UA",
	GB: "GB",
	US: "USA",
	UY: "ROU",
	UZ: "UZ",
	VA: "V",
	VE: "YV",
	VN: "VN",
	YE: "YAR",
	ZM: "RNR",
	ZW: "ZW",
	// Territories and special cases listed in the PDF
	DM: "WD",
	FO: "FO",
	GG: "GBG",
	IM: "GBM",
	JE: "GBJ",
	NR: "NAU",
	TW: "RC",
	VG: "BVI",
};

// UN M49 macro-geographic regions (continent level)
// Official Source: https://unstats.un.org/unsd/methodology/m49/
const regionMap: Record<string, string> = {
	// Africa
	DZ: "Africa",
	AO: "Africa",
	BJ: "Africa",
	BW: "Africa",
	BF: "Africa",
	BI: "Africa",
	CV: "Africa",
	CM: "Africa",
	CF: "Africa",
	TD: "Africa",
	KM: "Africa",
	CG: "Africa",
	CD: "Africa",
	CI: "Africa",
	DJ: "Africa",
	EG: "Africa",
	GQ: "Africa",
	ER: "Africa",
	ET: "Africa",
	GA: "Africa",
	GM: "Africa",
	GH: "Africa",
	GN: "Africa",
	GW: "Africa",
	KE: "Africa",
	LS: "Africa",
	LR: "Africa",
	LY: "Africa",
	MG: "Africa",
	MW: "Africa",
	ML: "Africa",
	MR: "Africa",
	MU: "Africa",
	YT: "Africa",
	MA: "Africa",
	MZ: "Africa",
	NA: "Africa",
	NE: "Africa",
	NG: "Africa",
	RE: "Africa",
	RW: "Africa",
	SH: "Africa",
	ST: "Africa",
	SN: "Africa",
	SC: "Africa",
	SL: "Africa",
	SO: "Africa",
	ZA: "Africa",
	SS: "Africa",
	SD: "Africa",
	SZ: "Africa",
	TZ: "Africa",
	TG: "Africa",
	TN: "Africa",
	UG: "Africa",
	EH: "Africa",
	ZM: "Africa",
	ZW: "Africa",
	// Americas
	AI: "Americas",
	AG: "Americas",
	AR: "Americas",
	AW: "Americas",
	BS: "Americas",
	BB: "Americas",
	BZ: "Americas",
	BM: "Americas",
	BO: "Americas",
	BQ: "Americas",
	BR: "Americas",
	CA: "Americas",
	KY: "Americas",
	CL: "Americas",
	CO: "Americas",
	CR: "Americas",
	CU: "Americas",
	CW: "Americas",
	DM: "Americas",
	DO: "Americas",
	EC: "Americas",
	SV: "Americas",
	FK: "Americas",
	GF: "Americas",
	GD: "Americas",
	GL: "Americas",
	GP: "Americas",
	GT: "Americas",
	GY: "Americas",
	HT: "Americas",
	HN: "Americas",
	JM: "Americas",
	MQ: "Americas",
	MX: "Americas",
	MS: "Americas",
	NI: "Americas",
	PA: "Americas",
	PY: "Americas",
	PE: "Americas",
	PR: "Americas",
	BL: "Americas",
	KN: "Americas",
	LC: "Americas",
	MF: "Americas",
	PM: "Americas",
	VC: "Americas",
	SR: "Americas",
	SX: "Americas",
	TT: "Americas",
	TC: "Americas",
	US: "Americas",
	UY: "Americas",
	VE: "Americas",
	VG: "Americas",
	VI: "Americas",
	// Asia
	AF: "Asia",
	AM: "Asia",
	AZ: "Asia",
	BH: "Asia",
	BD: "Asia",
	BT: "Asia",
	IO: "Asia",
	BN: "Asia",
	KH: "Asia",
	CN: "Asia",
	CY: "Asia",
	GE: "Asia",
	HK: "Asia",
	IN: "Asia",
	ID: "Asia",
	IR: "Asia",
	IQ: "Asia",
	IL: "Asia",
	JP: "Asia",
	JO: "Asia",
	KZ: "Asia",
	KW: "Asia",
	KG: "Asia",
	LA: "Asia",
	LB: "Asia",
	MO: "Asia",
	MY: "Asia",
	MV: "Asia",
	MN: "Asia",
	MM: "Asia",
	NP: "Asia",
	KP: "Asia",
	KR: "Asia",
	OM: "Asia",
	PK: "Asia",
	PS: "Asia",
	PH: "Asia",
	QA: "Asia",
	SA: "Asia",
	SG: "Asia",
	LK: "Asia",
	SY: "Asia",
	TW: "Asia",
	TJ: "Asia",
	TH: "Asia",
	TL: "Asia",
	TR: "Asia",
	TM: "Asia",
	AE: "Asia",
	UZ: "Asia",
	VN: "Asia",
	YE: "Asia",
	// Europe
	AX: "Europe",
	AL: "Europe",
	AD: "Europe",
	AT: "Europe",
	BY: "Europe",
	BE: "Europe",
	BA: "Europe",
	BG: "Europe",
	HR: "Europe",
	CZ: "Europe",
	DK: "Europe",
	EE: "Europe",
	FO: "Europe",
	FI: "Europe",
	FR: "Europe",
	DE: "Europe",
	GI: "Europe",
	GR: "Europe",
	GG: "Europe",
	HU: "Europe",
	IS: "Europe",
	IE: "Europe",
	IM: "Europe",
	IT: "Europe",
	JE: "Europe",
	LV: "Europe",
	LI: "Europe",
	LT: "Europe",
	LU: "Europe",
	MT: "Europe",
	MD: "Europe",
	MC: "Europe",
	ME: "Europe",
	NL: "Europe",
	MK: "Europe",
	NO: "Europe",
	PL: "Europe",
	PT: "Europe",
	RO: "Europe",
	RU: "Europe",
	SM: "Europe",
	RS: "Europe",
	SK: "Europe",
	SI: "Europe",
	ES: "Europe",
	SJ: "Europe",
	SE: "Europe",
	CH: "Europe",
	UA: "Europe",
	GB: "Europe",
	VA: "Europe",
	XK: "Europe",
	// Oceania
	AS: "Oceania",
	AU: "Oceania",
	CC: "Oceania",
	CK: "Oceania",
	CX: "Oceania",
	FJ: "Oceania",
	PF: "Oceania",
	GU: "Oceania",
	KI: "Oceania",
	MH: "Oceania",
	FM: "Oceania",
	NR: "Oceania",
	NC: "Oceania",
	NZ: "Oceania",
	NU: "Oceania",
	NF: "Oceania",
	MP: "Oceania",
	PW: "Oceania",
	PG: "Oceania",
	PN: "Oceania",
	WS: "Oceania",
	SB: "Oceania",
	TK: "Oceania",
	TO: "Oceania",
	TV: "Oceania",
	UM: "Oceania",
	VU: "Oceania",
	WF: "Oceania",
	// Antarctica
	AQ: "Antarctica",
	BV: "Antarctica",
	TF: "Antarctica",
	HM: "Antarctica",
	GS: "Antarctica",
};

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

function getCcTLD(alpha2: string): string | undefined {
	if (noCcTLD.has(alpha2)) return undefined;
	return ccTLDOverrides[alpha2] ?? `.${alpha2.toLowerCase()}`;
}

// ITU-T E.164 assigned country calling codes
// Official Source: ITU-T Recommendation E.164 — List of ITU-T Recommendation
// E.164 assigned country codes
// (https://www.itu.int/dms_pub/itu-t/opb/sp/T-SP-E.164D-11-2011-PDF-E.pdf)
// All North American Numbering Plan members share country code +1; the national
// destination (area) code is part of the national number, not the country code.
// VA (Vatican City State) is assigned +379 by the ITU, though calls are commonly
// routed via Italy's +39 06698 prefix in practice.
const phonePrefixes: Record<string, string> = {
	AD: "+376",
	AE: "+971",
	AF: "+93",
	AG: "+1",
	AI: "+1",
	AL: "+355",
	AM: "+374",
	AO: "+244",
	AR: "+54",
	AS: "+1",
	AT: "+43",
	AU: "+61",
	AW: "+297",
	AX: "+358",
	AZ: "+994",
	BA: "+387",
	BB: "+1",
	BD: "+880",
	BE: "+32",
	BF: "+226",
	BG: "+359",
	BH: "+973",
	BI: "+257",
	BJ: "+229",
	BL: "+590",
	BM: "+1",
	BN: "+673",
	BO: "+591",
	BQ: "+599",
	BR: "+55",
	BS: "+1",
	BT: "+975",
	BW: "+267",
	BY: "+375",
	BZ: "+501",
	CA: "+1",
	CC: "+61",
	CD: "+243",
	CF: "+236",
	CG: "+242",
	CH: "+41",
	CI: "+225",
	CK: "+682",
	CL: "+56",
	CM: "+237",
	CN: "+86",
	CO: "+57",
	CR: "+506",
	CU: "+53",
	CV: "+238",
	CW: "+599",
	CX: "+61",
	CY: "+357",
	CZ: "+420",
	DE: "+49",
	DJ: "+253",
	DK: "+45",
	DM: "+1",
	DO: "+1",
	DZ: "+213",
	EC: "+593",
	EE: "+372",
	EG: "+20",
	EH: "+212",
	ER: "+291",
	ES: "+34",
	ET: "+251",
	FI: "+358",
	FJ: "+679",
	FK: "+500",
	FM: "+691",
	FO: "+298",
	FR: "+33",
	GA: "+241",
	GB: "+44",
	GD: "+1",
	GE: "+995",
	GF: "+594",
	GG: "+44",
	GH: "+233",
	GI: "+350",
	GL: "+299",
	GM: "+220",
	GN: "+224",
	GP: "+590",
	GQ: "+240",
	GR: "+30",
	GS: "+500",
	GT: "+502",
	GU: "+1",
	GW: "+245",
	GY: "+592",
	HK: "+852",
	HN: "+504",
	HR: "+385",
	HT: "+509",
	HU: "+36",
	ID: "+62",
	IE: "+353",
	IL: "+972",
	IM: "+44",
	IN: "+91",
	IO: "+246",
	IQ: "+964",
	IR: "+98",
	IS: "+354",
	IT: "+39",
	JE: "+44",
	JM: "+1",
	JO: "+962",
	JP: "+81",
	KE: "+254",
	KG: "+996",
	KH: "+855",
	KI: "+686",
	KM: "+269",
	KN: "+1",
	KP: "+850",
	KR: "+82",
	KW: "+965",
	KY: "+1",
	KZ: "+7",
	LA: "+856",
	LB: "+961",
	LC: "+1",
	LI: "+423",
	LK: "+94",
	LR: "+231",
	LS: "+266",
	LT: "+370",
	LU: "+352",
	LV: "+371",
	LY: "+218",
	MA: "+212",
	MC: "+377",
	MD: "+373",
	ME: "+382",
	MF: "+590",
	MG: "+261",
	MH: "+692",
	MK: "+389",
	ML: "+223",
	MM: "+95",
	MN: "+976",
	MO: "+853",
	MP: "+1",
	MQ: "+596",
	MR: "+222",
	MS: "+1",
	MT: "+356",
	MU: "+230",
	MV: "+960",
	MW: "+265",
	MX: "+52",
	MY: "+60",
	MZ: "+258",
	NA: "+264",
	NC: "+687",
	NE: "+227",
	NF: "+672",
	NG: "+234",
	NI: "+505",
	NL: "+31",
	NO: "+47",
	NP: "+977",
	NR: "+674",
	NZ: "+64",
	OM: "+968",
	PA: "+507",
	PE: "+51",
	PF: "+689",
	PG: "+675",
	PH: "+63",
	PK: "+92",
	PL: "+48",
	PM: "+508",
	PN: "+64",
	PR: "+1",
	PS: "+970",
	PT: "+351",
	PW: "+680",
	PY: "+595",
	QA: "+974",
	RE: "+262",
	RO: "+40",
	RS: "+381",
	RU: "+7",
	RW: "+250",
	SA: "+966",
	SB: "+677",
	SC: "+248",
	SD: "+249",
	SE: "+46",
	SG: "+65",
	SH: "+290",
	SI: "+386",
	SJ: "+47",
	SK: "+421",
	SL: "+232",
	SM: "+378",
	SN: "+221",
	SO: "+252",
	SR: "+597",
	SS: "+211",
	ST: "+239",
	SV: "+503",
	SX: "+1",
	SY: "+963",
	SZ: "+268",
	TC: "+1",
	TD: "+235",
	TF: "+262",
	TG: "+228",
	TH: "+66",
	TJ: "+992",
	TK: "+690",
	TL: "+670",
	TM: "+993",
	TN: "+216",
	TO: "+676",
	TR: "+90",
	TT: "+1",
	TV: "+688",
	TW: "+886",
	TZ: "+255",
	UA: "+380",
	UG: "+256",
	UM: "+1",
	US: "+1",
	UY: "+598",
	UZ: "+998",
	VA: "+379",
	VC: "+1",
	VE: "+58",
	VG: "+1",
	VI: "+1",
	VN: "+84",
	VU: "+678",
	WF: "+681",
	WS: "+685",
	YE: "+967",
	YT: "+262",
	ZA: "+27",
	ZM: "+260",
	ZW: "+263",
};

// Get countries from Intl API
export const getCountries = createServerFn({
	method: "GET",
}).handler(async () => {
	// Get all available region codes from Intl API
	const regionCodes = [
		"AD",
		"AE",
		"AF",
		"AG",
		"AI",
		"AL",
		"AM",
		"AO",
		"AQ",
		"AR",
		"AS",
		"AT",
		"AU",
		"AW",
		"AX",
		"AZ",
		"BA",
		"BB",
		"BD",
		"BE",
		"BF",
		"BG",
		"BH",
		"BI",
		"BJ",
		"BL",
		"BM",
		"BN",
		"BO",
		"BQ",
		"BR",
		"BS",
		"BT",
		"BV",
		"BW",
		"BY",
		"BZ",
		"CA",
		"CC",
		"CD",
		"CF",
		"CG",
		"CH",
		"CI",
		"CK",
		"CL",
		"CM",
		"CN",
		"CO",
		"CR",
		"CU",
		"CV",
		"CW",
		"CX",
		"CY",
		"CZ",
		"DE",
		"DJ",
		"DK",
		"DM",
		"DO",
		"DZ",
		"EC",
		"EE",
		"EG",
		"EH",
		"ER",
		"ES",
		"ET",
		"FI",
		"FJ",
		"FK",
		"FM",
		"FO",
		"FR",
		"GA",
		"GB",
		"GD",
		"GE",
		"GF",
		"GG",
		"GH",
		"GI",
		"GL",
		"GM",
		"GN",
		"GP",
		"GQ",
		"GR",
		"GS",
		"GT",
		"GU",
		"GW",
		"GY",
		"HK",
		"HM",
		"HN",
		"HR",
		"HT",
		"HU",
		"ID",
		"IE",
		"IL",
		"IM",
		"IN",
		"IO",
		"IQ",
		"IR",
		"IS",
		"IT",
		"JE",
		"JM",
		"JO",
		"JP",
		"KE",
		"KG",
		"KH",
		"KI",
		"KM",
		"KN",
		"KP",
		"KR",
		"KW",
		"KY",
		"KZ",
		"LA",
		"LB",
		"LC",
		"LI",
		"LK",
		"LR",
		"LS",
		"LT",
		"LU",
		"LV",
		"LY",
		"MA",
		"MC",
		"MD",
		"ME",
		"MF",
		"MG",
		"MH",
		"MK",
		"ML",
		"MM",
		"MN",
		"MO",
		"MP",
		"MQ",
		"MR",
		"MS",
		"MT",
		"MU",
		"MV",
		"MW",
		"MX",
		"MY",
		"MZ",
		"NA",
		"NC",
		"NE",
		"NF",
		"NG",
		"NI",
		"NL",
		"NO",
		"NP",
		"NR",
		"NU",
		"NZ",
		"OM",
		"PA",
		"PE",
		"PF",
		"PG",
		"PH",
		"PK",
		"PL",
		"PM",
		"PN",
		"PR",
		"PS",
		"PT",
		"PW",
		"PY",
		"QA",
		"RE",
		"RO",
		"RS",
		"RU",
		"RW",
		"SA",
		"SB",
		"SC",
		"SD",
		"SE",
		"SG",
		"SH",
		"SI",
		"SJ",
		"SK",
		"SL",
		"SM",
		"SN",
		"SO",
		"SR",
		"SS",
		"ST",
		"SV",
		"SX",
		"SY",
		"SZ",
		"TC",
		"TD",
		"TF",
		"TG",
		"TH",
		"TJ",
		"TK",
		"TL",
		"TM",
		"TN",
		"TO",
		"TR",
		"TT",
		"TV",
		"TW",
		"TZ",
		"UA",
		"UG",
		"UM",
		"US",
		"UY",
		"UZ",
		"VA",
		"VC",
		"VE",
		"VG",
		"VI",
		"VN",
		"VU",
		"WF",
		"WS",
		"YE",
		"YT",
		"ZA",
		"ZM",
		"ZW",
	];

	const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

	const countries: Country[] = regionCodes.map((code) => ({
		flag: getEmojiFlag(code),
		alpha2Code: code,
		name: regionNames.of(code) || code,
	}));

	return countries;
});

// UN M49 country data (ISO 3166-1 codes with Alpha-3 and numeric codes)
// Official Source: https://unstats.un.org/unsd/methodology/m49/
const unM49Data: Array<{
	code: string;
	code3: string;
	unCode: string;
	name: string;
	fullName?: string;
	independent?: boolean;
}> = [
	{
		code: "AD",
		code3: "AND",
		unCode: "020",
		name: "Andorra",
		fullName: "the Principality of Andorra",
		independent: true,
	},
	{
		code: "AE",
		code3: "ARE",
		unCode: "784",
		name: "United Arab Emirates",
		fullName: "the United Arab Emirates",
		independent: true,
	},
	{
		code: "AF",
		code3: "AFG",
		unCode: "004",
		name: "Afghanistan",
		fullName: "the Islamic Republic of Afghanistan",
		independent: true,
	},
	{
		code: "AG",
		code3: "ATG",
		unCode: "028",
		name: "Antigua and Barbuda",
		independent: true,
	},
	{
		code: "AI",
		code3: "AIA",
		unCode: "660",
		name: "Anguilla",
		independent: false,
	},
	{
		code: "AL",
		code3: "ALB",
		unCode: "008",
		name: "Albania",
		fullName: "the Republic of Albania",
		independent: true,
	},
	{
		code: "AM",
		code3: "ARM",
		unCode: "051",
		name: "Armenia",
		fullName: "the Republic of Armenia",
		independent: true,
	},
	{
		code: "AO",
		code3: "AGO",
		unCode: "024",
		name: "Angola",
		fullName: "the Republic of Angola",
		independent: true,
	},
	{
		code: "AQ",
		code3: "ATA",
		unCode: "010",
		name: "Antarctica",
		independent: false,
	},
	{
		code: "AR",
		code3: "ARG",
		unCode: "032",
		name: "Argentina",
		fullName: "the Argentine Republic",
		independent: true,
	},
	{
		code: "AS",
		code3: "ASM",
		unCode: "016",
		name: "American Samoa",
		independent: false,
	},
	{
		code: "AT",
		code3: "AUT",
		unCode: "040",
		name: "Austria",
		fullName: "the Republic of Austria",
		independent: true,
	},
	{
		code: "AU",
		code3: "AUS",
		unCode: "036",
		name: "Australia",
		independent: true,
	},
	{
		code: "AW",
		code3: "ABW",
		unCode: "533",
		name: "Aruba",
		independent: false,
	},
	{
		code: "AX",
		code3: "ALA",
		unCode: "248",
		name: "Åland Islands",
		independent: false,
	},
	{
		code: "AZ",
		code3: "AZE",
		unCode: "031",
		name: "Azerbaijan",
		fullName: "the Republic of Azerbaijan",
		independent: true,
	},
	{
		code: "BA",
		code3: "BIH",
		unCode: "070",
		name: "Bosnia and Herzegovina",
		independent: true,
	},
	{
		code: "BB",
		code3: "BRB",
		unCode: "052",
		name: "Barbados",
		independent: true,
	},
	{
		code: "BD",
		code3: "BGD",
		unCode: "050",
		name: "Bangladesh",
		fullName: "the People's Republic of Bangladesh",
		independent: true,
	},
	{
		code: "BE",
		code3: "BEL",
		unCode: "056",
		name: "Belgium",
		fullName: "the Kingdom of Belgium",
		independent: true,
	},
	{
		code: "BF",
		code3: "BFA",
		unCode: "854",
		name: "Burkina Faso",
		independent: true,
	},
	{
		code: "BG",
		code3: "BGR",
		unCode: "100",
		name: "Bulgaria",
		fullName: "the Republic of Bulgaria",
		independent: true,
	},
	{
		code: "BH",
		code3: "BHR",
		unCode: "048",
		name: "Bahrain",
		fullName: "the Kingdom of Bahrain",
		independent: true,
	},
	{
		code: "BI",
		code3: "BDI",
		unCode: "108",
		name: "Burundi",
		fullName: "the Republic of Burundi",
		independent: true,
	},
	{
		code: "BJ",
		code3: "BEN",
		unCode: "204",
		name: "Benin",
		fullName: "the Republic of Benin",
		independent: true,
	},
	{
		code: "BL",
		code3: "BLM",
		unCode: "652",
		name: "Saint Barthélemy",
		independent: false,
	},
	{
		code: "BM",
		code3: "BMU",
		unCode: "060",
		name: "Bermuda",
		independent: false,
	},
	{
		code: "BN",
		code3: "BRN",
		unCode: "096",
		name: "Brunei Darussalam",
		independent: true,
	},
	{
		code: "BO",
		code3: "BOL",
		unCode: "068",
		name: "Bolivia",
		fullName: "the Plurinational State of Bolivia",
		independent: true,
	},
	{
		code: "BQ",
		code3: "BES",
		unCode: "535",
		name: "Bonaire, Sint Eustatius and Saba",
		independent: false,
	},
	{
		code: "BR",
		code3: "BRA",
		unCode: "076",
		name: "Brazil",
		fullName: "the Federative Republic of Brazil",
		independent: true,
	},
	{
		code: "BS",
		code3: "BHS",
		unCode: "044",
		name: "Bahamas",
		fullName: "the Commonwealth of The Bahamas",
		independent: true,
	},
	{
		code: "BT",
		code3: "BTN",
		unCode: "064",
		name: "Bhutan",
		fullName: "the Kingdom of Bhutan",
		independent: true,
	},
	{
		code: "BV",
		code3: "BVT",
		unCode: "074",
		name: "Bouvet Island",
		independent: false,
	},
	{
		code: "BW",
		code3: "BWA",
		unCode: "072",
		name: "Botswana",
		fullName: "the Republic of Botswana",
		independent: true,
	},
	{
		code: "BY",
		code3: "BLR",
		unCode: "112",
		name: "Belarus",
		fullName: "the Republic of Belarus",
		independent: true,
	},
	{
		code: "BZ",
		code3: "BLZ",
		unCode: "084",
		name: "Belize",
		independent: true,
	},
	{
		code: "CA",
		code3: "CAN",
		unCode: "124",
		name: "Canada",
		independent: true,
	},
	{
		code: "CC",
		code3: "CCK",
		unCode: "166",
		name: "Cocos (Keeling) Islands",
		independent: false,
	},
	{
		code: "CD",
		code3: "COD",
		unCode: "180",
		name: "Congo (Democratic Republic)",
		fullName: "the Democratic Republic of the Congo",
		independent: true,
	},
	{
		code: "CF",
		code3: "CAF",
		unCode: "140",
		name: "Central African Republic",
		fullName: "the Central African Republic",
		independent: true,
	},
	{
		code: "CG",
		code3: "COG",
		unCode: "178",
		name: "Congo",
		fullName: "the Republic of the Congo",
		independent: true,
	},
	{
		code: "CH",
		code3: "CHE",
		unCode: "756",
		name: "Switzerland",
		fullName: "the Swiss Confederation",
		independent: true,
	},
	{
		code: "CI",
		code3: "CIV",
		unCode: "384",
		name: "Côte d'Ivoire",
		fullName: "the Republic of Côte d'Ivoire",
		independent: true,
	},
	{
		code: "CK",
		code3: "COK",
		unCode: "184",
		name: "Cook Islands",
		independent: false,
	},
	{
		code: "CL",
		code3: "CHL",
		unCode: "152",
		name: "Chile",
		fullName: "the Republic of Chile",
		independent: true,
	},
	{
		code: "CM",
		code3: "CMR",
		unCode: "120",
		name: "Cameroon",
		fullName: "the Republic of Cameroon",
		independent: true,
	},
	{
		code: "CN",
		code3: "CHN",
		unCode: "156",
		name: "China",
		fullName: "the People's Republic of China",
		independent: true,
	},
	{
		code: "CO",
		code3: "COL",
		unCode: "170",
		name: "Colombia",
		fullName: "the Republic of Colombia",
		independent: true,
	},
	{
		code: "CR",
		code3: "CRI",
		unCode: "188",
		name: "Costa Rica",
		fullName: "the Republic of Costa Rica",
		independent: true,
	},
	{
		code: "CU",
		code3: "CUB",
		unCode: "192",
		name: "Cuba",
		fullName: "the Republic of Cuba",
		independent: true,
	},
	{
		code: "CV",
		code3: "CPV",
		unCode: "132",
		name: "Cabo Verde",
		fullName: "the Republic of Cabo Verde",
		independent: true,
	},
	{
		code: "CW",
		code3: "CUW",
		unCode: "531",
		name: "Curaçao",
		independent: false,
	},
	{
		code: "CX",
		code3: "CXR",
		unCode: "162",
		name: "Christmas Island",
		independent: false,
	},
	{
		code: "CY",
		code3: "CYP",
		unCode: "196",
		name: "Cyprus",
		fullName: "the Republic of Cyprus",
		independent: true,
	},
	{
		code: "CZ",
		code3: "CZE",
		unCode: "203",
		name: "Czechia",
		fullName: "the Czech Republic",
		independent: true,
	},
	{
		code: "DE",
		code3: "DEU",
		unCode: "276",
		name: "Germany",
		fullName: "the Federal Republic of Germany",
		independent: true,
	},
	{
		code: "DJ",
		code3: "DJI",
		unCode: "262",
		name: "Djibouti",
		fullName: "the Republic of Djibouti",
		independent: true,
	},
	{
		code: "DK",
		code3: "DNK",
		unCode: "208",
		name: "Denmark",
		fullName: "the Kingdom of Denmark",
		independent: true,
	},
	{
		code: "DM",
		code3: "DMA",
		unCode: "212",
		name: "Dominica",
		fullName: "the Commonwealth of Dominica",
		independent: true,
	},
	{
		code: "DO",
		code3: "DOM",
		unCode: "214",
		name: "Dominican Republic",
		fullName: "the Dominican Republic",
		independent: true,
	},
	{
		code: "DZ",
		code3: "DZA",
		unCode: "012",
		name: "Algeria",
		fullName: "the People's Democratic Republic of Algeria",
		independent: true,
	},
	{
		code: "EC",
		code3: "ECU",
		unCode: "218",
		name: "Ecuador",
		fullName: "the Republic of Ecuador",
		independent: true,
	},
	{
		code: "EE",
		code3: "EST",
		unCode: "233",
		name: "Estonia",
		fullName: "the Republic of Estonia",
		independent: true,
	},
	{
		code: "EG",
		code3: "EGY",
		unCode: "818",
		name: "Egypt",
		fullName: "the Arab Republic of Egypt",
		independent: true,
	},
	{ code: "EH", code3: "ESH", unCode: "732", name: "Western Sahara" },
	{
		code: "ER",
		code3: "ERI",
		unCode: "232",
		name: "Eritrea",
		fullName: "the State of Eritrea",
		independent: true,
	},
	{
		code: "ES",
		code3: "ESP",
		unCode: "724",
		name: "Spain",
		fullName: "the Kingdom of Spain",
		independent: true,
	},
	{
		code: "ET",
		code3: "ETH",
		unCode: "231",
		name: "Ethiopia",
		fullName: "the Federal Democratic Republic of Ethiopia",
		independent: true,
	},
	{
		code: "FI",
		code3: "FIN",
		unCode: "246",
		name: "Finland",
		fullName: "the Republic of Finland",
		independent: true,
	},
	{
		code: "FJ",
		code3: "FJI",
		unCode: "242",
		name: "Fiji",
		fullName: "the Republic of Fiji",
		independent: true,
	},
	{
		code: "FK",
		code3: "FLK",
		unCode: "238",
		name: "Falkland Islands",
		independent: false,
	},
	{
		code: "FM",
		code3: "FSM",
		unCode: "583",
		name: "Micronesia",
		fullName: "the Federated States of Micronesia",
		independent: true,
	},
	{
		code: "FO",
		code3: "FRO",
		unCode: "234",
		name: "Faroe Islands",
		independent: false,
	},
	{
		code: "FR",
		code3: "FRA",
		unCode: "250",
		name: "France",
		fullName: "the French Republic",
		independent: true,
	},
	{
		code: "GA",
		code3: "GAB",
		unCode: "266",
		name: "Gabon",
		fullName: "the Gabonese Republic",
		independent: true,
	},
	{
		code: "GB",
		code3: "GBR",
		unCode: "826",
		name: "United Kingdom",
		fullName: "the United Kingdom of Great Britain and Northern Ireland",
		independent: true,
	},
	{
		code: "GD",
		code3: "GRD",
		unCode: "308",
		name: "Grenada",
		independent: true,
	},
	{
		code: "GE",
		code3: "GEO",
		unCode: "268",
		name: "Georgia",
		independent: true,
	},
	{
		code: "GF",
		code3: "GUF",
		unCode: "254",
		name: "French Guiana",
		independent: false,
	},
	{
		code: "GG",
		code3: "GGY",
		unCode: "831",
		name: "Guernsey",
		independent: false,
	},
	{
		code: "GH",
		code3: "GHA",
		unCode: "288",
		name: "Ghana",
		fullName: "the Republic of Ghana",
		independent: true,
	},
	{
		code: "GI",
		code3: "GIB",
		unCode: "292",
		name: "Gibraltar",
		independent: false,
	},
	{
		code: "GL",
		code3: "GRL",
		unCode: "304",
		name: "Greenland",
		independent: false,
	},
	{
		code: "GM",
		code3: "GMB",
		unCode: "270",
		name: "Gambia",
		fullName: "the Republic of the Gambia",
		independent: true,
	},
	{
		code: "GN",
		code3: "GIN",
		unCode: "324",
		name: "Guinea",
		fullName: "the Republic of Guinea",
		independent: true,
	},
	{
		code: "GP",
		code3: "GLP",
		unCode: "312",
		name: "Guadeloupe",
		independent: false,
	},
	{
		code: "GQ",
		code3: "GNQ",
		unCode: "226",
		name: "Equatorial Guinea",
		fullName: "the Republic of Equatorial Guinea",
		independent: true,
	},
	{
		code: "GR",
		code3: "GRC",
		unCode: "300",
		name: "Greece",
		fullName: "the Hellenic Republic",
		independent: true,
	},
	{
		code: "GS",
		code3: "SGS",
		unCode: "239",
		name: "South Georgia and South Sandwich Islands",
		independent: false,
	},
	{
		code: "GT",
		code3: "GTM",
		unCode: "320",
		name: "Guatemala",
		fullName: "the Republic of Guatemala",
		independent: true,
	},
	{ code: "GU", code3: "GUM", unCode: "316", name: "Guam", independent: false },
	{
		code: "GW",
		code3: "GNB",
		unCode: "624",
		name: "Guinea-Bissau",
		fullName: "the Republic of Guinea-Bissau",
		independent: true,
	},
	{
		code: "GY",
		code3: "GUY",
		unCode: "328",
		name: "Guyana",
		fullName: "the Co-operative Republic of Guyana",
		independent: true,
	},
	{
		code: "HK",
		code3: "HKG",
		unCode: "344",
		name: "Hong Kong",
		fullName: "the Hong Kong Special Administrative Region of China",
		independent: false,
	},
	{
		code: "HM",
		code3: "HMD",
		unCode: "334",
		name: "Heard Island and McDonald Islands",
		independent: false,
	},
	{
		code: "HN",
		code3: "HND",
		unCode: "340",
		name: "Honduras",
		fullName: "the Republic of Honduras",
		independent: true,
	},
	{
		code: "HR",
		code3: "HRV",
		unCode: "191",
		name: "Croatia",
		fullName: "the Republic of Croatia",
		independent: true,
	},
	{
		code: "HT",
		code3: "HTI",
		unCode: "332",
		name: "Haiti",
		fullName: "the Republic of Haiti",
		independent: true,
	},
	{
		code: "HU",
		code3: "HUN",
		unCode: "348",
		name: "Hungary",
		independent: true,
	},
	{
		code: "ID",
		code3: "IDN",
		unCode: "360",
		name: "Indonesia",
		fullName: "the Republic of Indonesia",
		independent: true,
	},
	{
		code: "IE",
		code3: "IRL",
		unCode: "372",
		name: "Ireland",
		independent: true,
	},
	{
		code: "IL",
		code3: "ISR",
		unCode: "376",
		name: "Israel",
		fullName: "the State of Israel",
		independent: true,
	},
	{
		code: "IM",
		code3: "IMN",
		unCode: "833",
		name: "Isle of Man",
		independent: false,
	},
	{
		code: "IN",
		code3: "IND",
		unCode: "356",
		name: "India",
		fullName: "the Republic of India",
		independent: true,
	},
	{
		code: "IO",
		code3: "IOT",
		unCode: "086",
		name: "British Indian Ocean Territory",
		independent: false,
	},
	{
		code: "IQ",
		code3: "IRQ",
		unCode: "368",
		name: "Iraq",
		fullName: "the Republic of Iraq",
		independent: true,
	},
	{
		code: "IR",
		code3: "IRN",
		unCode: "364",
		name: "Iran",
		fullName: "the Islamic Republic of Iran",
		independent: true,
	},
	{
		code: "IS",
		code3: "ISL",
		unCode: "352",
		name: "Iceland",
		independent: true,
	},
	{
		code: "IT",
		code3: "ITA",
		unCode: "380",
		name: "Italy",
		fullName: "the Republic of Italy",
		independent: true,
	},
	{
		code: "JE",
		code3: "JEY",
		unCode: "832",
		name: "Jersey",
		independent: false,
	},
	{
		code: "JM",
		code3: "JAM",
		unCode: "388",
		name: "Jamaica",
		independent: true,
	},
	{
		code: "JO",
		code3: "JOR",
		unCode: "400",
		name: "Jordan",
		fullName: "the Hashemite Kingdom of Jordan",
		independent: true,
	},
	{ code: "JP", code3: "JPN", unCode: "392", name: "Japan", independent: true },
	{
		code: "KE",
		code3: "KEN",
		unCode: "404",
		name: "Kenya",
		fullName: "the Republic of Kenya",
		independent: true,
	},
	{
		code: "KG",
		code3: "KGZ",
		unCode: "417",
		name: "Kyrgyzstan",
		fullName: "the Kyrgyz Republic",
		independent: true,
	},
	{
		code: "KH",
		code3: "KHM",
		unCode: "116",
		name: "Cambodia",
		fullName: "the Kingdom of Cambodia",
		independent: true,
	},
	{
		code: "KI",
		code3: "KIR",
		unCode: "296",
		name: "Kiribati",
		fullName: "the Republic of Kiribati",
		independent: true,
	},
	{
		code: "KM",
		code3: "COM",
		unCode: "174",
		name: "Comoros",
		fullName: "the Union of the Comoros",
		independent: true,
	},
	{
		code: "KN",
		code3: "KNA",
		unCode: "659",
		name: "Saint Kitts and Nevis",
		independent: true,
	},
	{
		code: "KP",
		code3: "PRK",
		unCode: "408",
		name: "North Korea",
		fullName: "the Democratic People's Republic of Korea",
		independent: true,
	},
	{
		code: "KR",
		code3: "KOR",
		unCode: "410",
		name: "South Korea",
		fullName: "the Republic of Korea",
		independent: true,
	},
	{
		code: "KW",
		code3: "KWT",
		unCode: "414",
		name: "Kuwait",
		fullName: "the State of Kuwait",
		independent: true,
	},
	{
		code: "KY",
		code3: "CYM",
		unCode: "136",
		name: "Cayman Islands",
		independent: false,
	},
	{
		code: "KZ",
		code3: "KAZ",
		unCode: "398",
		name: "Kazakhstan",
		fullName: "the Republic of Kazakhstan",
		independent: true,
	},
	{
		code: "LA",
		code3: "LAO",
		unCode: "418",
		name: "Laos",
		fullName: "the Lao People's Democratic Republic",
		independent: true,
	},
	{
		code: "LB",
		code3: "LBN",
		unCode: "422",
		name: "Lebanon",
		fullName: "the Lebanese Republic",
		independent: true,
	},
	{
		code: "LC",
		code3: "LCA",
		unCode: "662",
		name: "Saint Lucia",
		independent: true,
	},
	{
		code: "LI",
		code3: "LIE",
		unCode: "438",
		name: "Liechtenstein",
		fullName: "the Principality of Liechtenstein",
		independent: true,
	},
	{
		code: "LK",
		code3: "LKA",
		unCode: "144",
		name: "Sri Lanka",
		fullName: "the Democratic Socialist Republic of Sri Lanka",
		independent: true,
	},
	{
		code: "LR",
		code3: "LBR",
		unCode: "430",
		name: "Liberia",
		fullName: "the Republic of Liberia",
		independent: true,
	},
	{
		code: "LS",
		code3: "LSO",
		unCode: "426",
		name: "Lesotho",
		fullName: "the Kingdom of Lesotho",
		independent: true,
	},
	{
		code: "LT",
		code3: "LTU",
		unCode: "440",
		name: "Lithuania",
		fullName: "the Republic of Lithuania",
		independent: true,
	},
	{
		code: "LU",
		code3: "LUX",
		unCode: "442",
		name: "Luxembourg",
		fullName: "the Grand Duchy of Luxembourg",
		independent: true,
	},
	{
		code: "LV",
		code3: "LVA",
		unCode: "428",
		name: "Latvia",
		fullName: "the Republic of Latvia",
		independent: true,
	},
	{
		code: "LY",
		code3: "LBY",
		unCode: "434",
		name: "Libya",
		fullName: "the State of Libya",
		independent: true,
	},
	{
		code: "MA",
		code3: "MAR",
		unCode: "504",
		name: "Morocco",
		fullName: "the Kingdom of Morocco",
		independent: true,
	},
	{
		code: "MC",
		code3: "MCO",
		unCode: "492",
		name: "Monaco",
		fullName: "the Principality of Monaco",
		independent: true,
	},
	{
		code: "MD",
		code3: "MDA",
		unCode: "498",
		name: "Moldova",
		fullName: "the Republic of Moldova",
		independent: true,
	},
	{
		code: "ME",
		code3: "MNE",
		unCode: "499",
		name: "Montenegro",
		independent: true,
	},
	{
		code: "MF",
		code3: "MAF",
		unCode: "663",
		name: "Saint Martin",
		independent: false,
	},
	{
		code: "MG",
		code3: "MDG",
		unCode: "450",
		name: "Madagascar",
		fullName: "the Republic of Madagascar",
		independent: true,
	},
	{
		code: "MH",
		code3: "MHL",
		unCode: "584",
		name: "Marshall Islands",
		fullName: "the Republic of the Marshall Islands",
		independent: true,
	},
	{
		code: "MK",
		code3: "MKD",
		unCode: "807",
		name: "North Macedonia",
		fullName: "the Republic of North Macedonia",
		independent: true,
	},
	{
		code: "ML",
		code3: "MLI",
		unCode: "466",
		name: "Mali",
		fullName: "the Republic of Mali",
		independent: true,
	},
	{
		code: "MM",
		code3: "MMR",
		unCode: "104",
		name: "Myanmar",
		fullName: "the Republic of the Union of Myanmar",
		independent: true,
	},
	{
		code: "MN",
		code3: "MNG",
		unCode: "496",
		name: "Mongolia",
		independent: true,
	},
	{
		code: "MO",
		code3: "MAC",
		unCode: "446",
		name: "Macao",
		fullName: "Macao Special Administrative Region of China",
		independent: false,
	},
	{
		code: "MP",
		code3: "MNP",
		unCode: "580",
		name: "Northern Mariana Islands",
		fullName: "the Commonwealth of the Northern Mariana Islands",
		independent: false,
	},
	{
		code: "MQ",
		code3: "MTQ",
		unCode: "474",
		name: "Martinique",
		independent: false,
	},
	{
		code: "MR",
		code3: "MRT",
		unCode: "478",
		name: "Mauritania",
		fullName: "the Islamic Republic of Mauritania",
		independent: true,
	},
	{
		code: "MS",
		code3: "MSR",
		unCode: "500",
		name: "Montserrat",
		independent: false,
	},
	{
		code: "MT",
		code3: "MLT",
		unCode: "470",
		name: "Malta",
		fullName: "the Republic of Malta",
		independent: true,
	},
	{
		code: "MU",
		code3: "MUS",
		unCode: "480",
		name: "Mauritius",
		fullName: "the Republic of Mauritius",
		independent: true,
	},
	{
		code: "MV",
		code3: "MDV",
		unCode: "462",
		name: "Maldives",
		fullName: "the Republic of Maldives",
		independent: true,
	},
	{
		code: "MW",
		code3: "MWI",
		unCode: "454",
		name: "Malawi",
		fullName: "the Republic of Malawi",
		independent: true,
	},
	{
		code: "MX",
		code3: "MEX",
		unCode: "484",
		name: "Mexico",
		fullName: "the United Mexican States",
		independent: true,
	},
	{
		code: "MY",
		code3: "MYS",
		unCode: "458",
		name: "Malaysia",
		independent: true,
	},
	{
		code: "MZ",
		code3: "MOZ",
		unCode: "508",
		name: "Mozambique",
		fullName: "the Republic of Mozambique",
		independent: true,
	},
	{
		code: "NA",
		code3: "NAM",
		unCode: "516",
		name: "Namibia",
		fullName: "the Republic of Namibia",
		independent: true,
	},
	{
		code: "NC",
		code3: "NCL",
		unCode: "540",
		name: "New Caledonia",
		independent: false,
	},
	{
		code: "NE",
		code3: "NER",
		unCode: "562",
		name: "Niger",
		fullName: "the Republic of the Niger",
		independent: true,
	},
	{
		code: "NF",
		code3: "NFK",
		unCode: "574",
		name: "Norfolk Island",
		independent: false,
	},
	{
		code: "NG",
		code3: "NGA",
		unCode: "566",
		name: "Nigeria",
		fullName: "the Federal Republic of Nigeria",
		independent: true,
	},
	{
		code: "NI",
		code3: "NIC",
		unCode: "558",
		name: "Nicaragua",
		fullName: "the Republic of Nicaragua",
		independent: true,
	},
	{
		code: "NL",
		code3: "NLD",
		unCode: "528",
		name: "Netherlands",
		fullName: "the Kingdom of the Netherlands",
		independent: true,
	},
	{
		code: "NO",
		code3: "NOR",
		unCode: "578",
		name: "Norway",
		fullName: "the Kingdom of Norway",
		independent: true,
	},
	{ code: "NP", code3: "NPL", unCode: "524", name: "Nepal", independent: true },
	{
		code: "NR",
		code3: "NRU",
		unCode: "520",
		name: "Nauru",
		fullName: "the Republic of Nauru",
		independent: true,
	},
	{ code: "NU", code3: "NIU", unCode: "570", name: "Niue", independent: false },
	{
		code: "NZ",
		code3: "NZL",
		unCode: "554",
		name: "New Zealand",
		independent: true,
	},
	{
		code: "OM",
		code3: "OMN",
		unCode: "512",
		name: "Oman",
		fullName: "the Sultanate of Oman",
		independent: true,
	},
	{
		code: "PA",
		code3: "PAN",
		unCode: "591",
		name: "Panama",
		fullName: "the Republic of Panama",
		independent: true,
	},
	{
		code: "PE",
		code3: "PER",
		unCode: "604",
		name: "Peru",
		fullName: "the Republic of Peru",
		independent: true,
	},
	{
		code: "PF",
		code3: "PYF",
		unCode: "258",
		name: "French Polynesia",
		independent: false,
	},
	{
		code: "PG",
		code3: "PNG",
		unCode: "598",
		name: "Papua New Guinea",
		fullName: "the Independent State of Papua New Guinea",
		independent: true,
	},
	{
		code: "PH",
		code3: "PHL",
		unCode: "608",
		name: "Philippines",
		fullName: "the Republic of the Philippines",
		independent: true,
	},
	{
		code: "PK",
		code3: "PAK",
		unCode: "586",
		name: "Pakistan",
		fullName: "the Islamic Republic of Pakistan",
		independent: true,
	},
	{
		code: "PL",
		code3: "POL",
		unCode: "616",
		name: "Poland",
		fullName: "the Republic of Poland",
		independent: true,
	},
	{
		code: "PM",
		code3: "SPM",
		unCode: "666",
		name: "Saint Pierre and Miquelon",
		independent: false,
	},
	{
		code: "PN",
		code3: "PCN",
		unCode: "612",
		name: "Pitcairn",
		independent: false,
	},
	{
		code: "PR",
		code3: "PRI",
		unCode: "630",
		name: "Puerto Rico",
		independent: false,
	},
	{
		code: "PS",
		code3: "PSE",
		unCode: "275",
		name: "Palestine",
		fullName: "the State of Palestine",
		independent: false,
	},
	{
		code: "PT",
		code3: "PRT",
		unCode: "620",
		name: "Portugal",
		fullName: "the Portuguese Republic",
		independent: true,
	},
	{
		code: "PW",
		code3: "PLW",
		unCode: "585",
		name: "Palau",
		fullName: "the Republic of Palau",
		independent: true,
	},
	{
		code: "PY",
		code3: "PRY",
		unCode: "600",
		name: "Paraguay",
		fullName: "the Republic of Paraguay",
		independent: true,
	},
	{
		code: "QA",
		code3: "QAT",
		unCode: "634",
		name: "Qatar",
		fullName: "the State of Qatar",
		independent: true,
	},
	{
		code: "RE",
		code3: "REU",
		unCode: "638",
		name: "Réunion",
		independent: false,
	},
	{
		code: "RO",
		code3: "ROU",
		unCode: "642",
		name: "Romania",
		independent: true,
	},
	{
		code: "RS",
		code3: "SRB",
		unCode: "688",
		name: "Serbia",
		fullName: "the Republic of Serbia",
		independent: true,
	},
	{
		code: "RU",
		code3: "RUS",
		unCode: "643",
		name: "Russia",
		fullName: "the Russian Federation",
		independent: true,
	},
	{
		code: "RW",
		code3: "RWA",
		unCode: "646",
		name: "Rwanda",
		fullName: "the Republic of Rwanda",
		independent: true,
	},
	{
		code: "SA",
		code3: "SAU",
		unCode: "682",
		name: "Saudi Arabia",
		fullName: "the Kingdom of Saudi Arabia",
		independent: true,
	},
	{
		code: "SB",
		code3: "SLB",
		unCode: "090",
		name: "Solomon Islands",
		independent: true,
	},
	{
		code: "SC",
		code3: "SYC",
		unCode: "690",
		name: "Seychelles",
		fullName: "the Republic of Seychelles",
		independent: true,
	},
	{
		code: "SD",
		code3: "SDN",
		unCode: "729",
		name: "Sudan",
		fullName: "the Republic of the Sudan",
		independent: true,
	},
	{
		code: "SE",
		code3: "SWE",
		unCode: "752",
		name: "Sweden",
		fullName: "the Kingdom of Sweden",
		independent: true,
	},
	{
		code: "SG",
		code3: "SGP",
		unCode: "702",
		name: "Singapore",
		fullName: "the Republic of Singapore",
		independent: true,
	},
	{
		code: "SH",
		code3: "SHN",
		unCode: "654",
		name: "Saint Helena, Ascension and Tristan da Cunha",
		independent: false,
	},
	{
		code: "SI",
		code3: "SVN",
		unCode: "705",
		name: "Slovenia",
		fullName: "the Republic of Slovenia",
		independent: true,
	},
	{
		code: "SJ",
		code3: "SJM",
		unCode: "744",
		name: "Svalbard and Jan Mayen",
		independent: false,
	},
	{
		code: "SK",
		code3: "SVK",
		unCode: "703",
		name: "Slovakia",
		fullName: "the Slovak Republic",
		independent: true,
	},
	{
		code: "SL",
		code3: "SLE",
		unCode: "694",
		name: "Sierra Leone",
		fullName: "the Republic of Sierra Leone",
		independent: true,
	},
	{
		code: "SM",
		code3: "SMR",
		unCode: "674",
		name: "San Marino",
		fullName: "the Republic of San Marino",
		independent: true,
	},
	{
		code: "SN",
		code3: "SEN",
		unCode: "686",
		name: "Senegal",
		fullName: "the Republic of Senegal",
		independent: true,
	},
	{
		code: "SO",
		code3: "SOM",
		unCode: "706",
		name: "Somalia",
		fullName: "the Federal Republic of Somalia",
		independent: true,
	},
	{
		code: "SR",
		code3: "SUR",
		unCode: "740",
		name: "Suriname",
		fullName: "the Republic of Suriname",
		independent: true,
	},
	{
		code: "SS",
		code3: "SSD",
		unCode: "728",
		name: "South Sudan",
		fullName: "the Republic of South Sudan",
		independent: true,
	},
	{
		code: "ST",
		code3: "STP",
		unCode: "678",
		name: "Sao Tome and Principe",
		fullName: "the Democratic Republic of Sao Tome and Principe",
		independent: true,
	},
	{
		code: "SV",
		code3: "SLV",
		unCode: "222",
		name: "El Salvador",
		fullName: "the Republic of El Salvador",
		independent: true,
	},
	{
		code: "SX",
		code3: "SXM",
		unCode: "534",
		name: "Sint Maarten",
		independent: false,
	},
	{
		code: "SY",
		code3: "SYR",
		unCode: "760",
		name: "Syria",
		fullName: "the Syrian Arab Republic",
		independent: true,
	},
	{
		code: "SZ",
		code3: "SWZ",
		unCode: "748",
		name: "Eswatini",
		fullName: "the Kingdom of Eswatini",
		independent: true,
	},
	{
		code: "TC",
		code3: "TCA",
		unCode: "796",
		name: "Turks and Caicos Islands",
		independent: false,
	},
	{
		code: "TD",
		code3: "TCD",
		unCode: "148",
		name: "Chad",
		fullName: "the Republic of Chad",
		independent: true,
	},
	{
		code: "TF",
		code3: "ATF",
		unCode: "260",
		name: "French Southern Territories",
		independent: false,
	},
	{
		code: "TG",
		code3: "TGO",
		unCode: "768",
		name: "Togo",
		fullName: "the Togolese Republic",
		independent: true,
	},
	{
		code: "TH",
		code3: "THA",
		unCode: "764",
		name: "Thailand",
		fullName: "the Kingdom of Thailand",
		independent: true,
	},
	{
		code: "TJ",
		code3: "TJK",
		unCode: "762",
		name: "Tajikistan",
		fullName: "the Republic of Tajikistan",
		independent: true,
	},
	{
		code: "TK",
		code3: "TKL",
		unCode: "772",
		name: "Tokelau",
		independent: false,
	},
	{
		code: "TL",
		code3: "TLS",
		unCode: "626",
		name: "Timor-Leste",
		fullName: "the Democratic Republic of Timor-Leste",
		independent: true,
	},
	{
		code: "TM",
		code3: "TKM",
		unCode: "795",
		name: "Turkmenistan",
		independent: true,
	},
	{
		code: "TN",
		code3: "TUN",
		unCode: "788",
		name: "Tunisia",
		fullName: "the Republic of Tunisia",
		independent: true,
	},
	{
		code: "TO",
		code3: "TON",
		unCode: "776",
		name: "Tonga",
		fullName: "the Kingdom of Tonga",
		independent: true,
	},
	{
		code: "TR",
		code3: "TUR",
		unCode: "792",
		name: "Türkiye",
		fullName: "the Republic of Türkiye",
		independent: true,
	},
	{
		code: "TT",
		code3: "TTO",
		unCode: "780",
		name: "Trinidad and Tobago",
		fullName: "the Republic of Trinidad and Tobago",
		independent: true,
	},
	{
		code: "TV",
		code3: "TUV",
		unCode: "798",
		name: "Tuvalu",
		independent: true,
	},
	{
		code: "TW",
		code3: "TWN",
		unCode: "158",
		name: "Taiwan",
		independent: false,
	},
	{
		code: "TZ",
		code3: "TZA",
		unCode: "834",
		name: "Tanzania",
		fullName: "the United Republic of Tanzania",
		independent: true,
	},
	{
		code: "UA",
		code3: "UKR",
		unCode: "804",
		name: "Ukraine",
		independent: true,
	},
	{
		code: "UG",
		code3: "UGA",
		unCode: "800",
		name: "Uganda",
		fullName: "the Republic of Uganda",
		independent: true,
	},
	{
		code: "UM",
		code3: "UMI",
		unCode: "581",
		name: "United States Minor Outlying Islands",
		independent: false,
	},
	{
		code: "US",
		code3: "USA",
		unCode: "840",
		name: "United States",
		fullName: "the United States of America",
		independent: true,
	},
	{
		code: "UY",
		code3: "URY",
		unCode: "858",
		name: "Uruguay",
		fullName: "the Eastern Republic of Uruguay",
		independent: true,
	},
	{
		code: "UZ",
		code3: "UZB",
		unCode: "860",
		name: "Uzbekistan",
		fullName: "the Republic of Uzbekistan",
		independent: true,
	},
	{
		code: "VA",
		code3: "VAT",
		unCode: "336",
		name: "Holy See",
		independent: true,
	},
	{
		code: "VC",
		code3: "VCT",
		unCode: "670",
		name: "Saint Vincent and the Grenadines",
		independent: true,
	},
	{
		code: "VE",
		code3: "VEN",
		unCode: "862",
		name: "Venezuela",
		fullName: "the Bolivarian Republic of Venezuela",
		independent: true,
	},
	{
		code: "VG",
		code3: "VGB",
		unCode: "092",
		name: "British Virgin Islands",
		independent: false,
	},
	{
		code: "VI",
		code3: "VIR",
		unCode: "850",
		name: "U.S. Virgin Islands",
		independent: false,
	},
	{
		code: "VN",
		code3: "VNM",
		unCode: "704",
		name: "Vietnam",
		fullName: "the Socialist Republic of Viet Nam",
		independent: true,
	},
	{
		code: "VU",
		code3: "VUT",
		unCode: "548",
		name: "Vanuatu",
		fullName: "the Republic of Vanuatu",
		independent: true,
	},
	{
		code: "WF",
		code3: "WLF",
		unCode: "876",
		name: "Wallis and Futuna",
		fullName: "Wallis and Futuna Islands",
		independent: false,
	},
	{
		code: "WS",
		code3: "WSM",
		unCode: "882",
		name: "Samoa",
		fullName: "the Independent State of Samoa",
		independent: true,
	},
	{
		code: "YE",
		code3: "YEM",
		unCode: "887",
		name: "Yemen",
		fullName: "the Republic of Yemen",
		independent: true,
	},
	{
		code: "YT",
		code3: "MYT",
		unCode: "175",
		name: "Mayotte",
		independent: false,
	},
	{
		code: "ZA",
		code3: "ZAF",
		unCode: "710",
		name: "South Africa",
		fullName: "the Republic of South Africa",
		independent: true,
	},
	{
		code: "ZM",
		code3: "ZMB",
		unCode: "894",
		name: "Zambia",
		fullName: "the Republic of Zambia",
		independent: true,
	},
	{
		code: "ZW",
		code3: "ZWE",
		unCode: "716",
		name: "Zimbabwe",
		fullName: "the Republic of Zimbabwe",
		independent: true,
	},
];

// ISO 3166-2 subdivision data per country
// Official Source: https://www.iso.org/obp/ui/#search/code/ (ISO Online Browsing Platform)
// iso1: subdivisions that also carry their own ISO 3166-1 alpha-2 code
// See: https://en.wikipedia.org/wiki/ISO_3166-2#Subdivisions_included_in_ISO_3166-1
type SubdivisionEntry = NonNullable<Country["subdivisions"]>[number];
type JsonObject = Record<string, unknown>;
const toSubs = (data: JsonObject[]) => data as SubdivisionEntry[];
const subdivisionsData: Record<string, SubdivisionEntry[]> = {
	AD: toSubs(adSubdivisions),
	AT: toSubs(atSubdivisions),
	BE: toSubs(beSubdivisions),
	CA: toSubs(caSubdivisions),
	CH: toSubs(chSubdivisions),
	DE: toSubs(deSubdivisions),
	DK: toSubs(dkSubdivisions),
	ES: toSubs(esSubdivisions),
	FI: toSubs(fiSubdivisions),
	FR: toSubs(frSubdivisions),
	GB: toSubs(gbSubdivisions),
	IE: toSubs(ieSubdivisions),
	IS: toSubs(isSubdivisions),
	IT: toSubs(itSubdivisions),
	LU: toSubs(luSubdivisions),
	NL: toSubs(nlSubdivisions),
	NO: toSubs(noSubdivisions),
	PT: toSubs(ptSubdivisions),
	SE: toSubs(seSubdivisions),
	US: toSubs(usSubdivisions),
	AL: toSubs(alSubdivisions),
	BA: toSubs(baSubdivisions),
	BG: toSubs(bgSubdivisions),
	BY: toSubs(bySubdivisions),
	CZ: toSubs(czSubdivisions),
	GR: toSubs(grSubdivisions),
	HR: toSubs(hrSubdivisions),
	HU: toSubs(huSubdivisions),
	MD: toSubs(mdSubdivisions),
	ME: toSubs(meSubdivisions),
	MK: toSubs(mkSubdivisions),
	PL: toSubs(plSubdivisions),
	RO: toSubs(roSubdivisions),
	RS: toSubs(rsSubdivisions),
	SI: toSubs(siSubdivisions),
	SK: toSubs(skSubdivisions),
	UA: toSubs(uaSubdivisions),
	AR: toSubs(arSubdivisions),
	BO: toSubs(boSubdivisions),
	BR: toSubs(brSubdivisions),
	CL: toSubs(clSubdivisions),
	CO: toSubs(coSubdivisions),
	CR: toSubs(crSubdivisions),
	CU: toSubs(cuSubdivisions),
	DO: toSubs(doSubdivisions),
	EC: toSubs(ecSubdivisions),
	GT: toSubs(gtSubdivisions),
	HN: toSubs(hnSubdivisions),
	HT: toSubs(htSubdivisions),
	JM: toSubs(jmSubdivisions),
	MX: toSubs(mxSubdivisions),
	NI: toSubs(niSubdivisions),
	PA: toSubs(paSubdivisions),
	PE: toSubs(peSubdivisions),
	PY: toSubs(pySubdivisions),
	SV: toSubs(svSubdivisions),
	TT: toSubs(ttSubdivisions),
	UY: toSubs(uySubdivisions),
	VE: toSubs(veSubdivisions),
	AU: toSubs(auSubdivisions),
	BD: toSubs(bdSubdivisions),
	CN: toSubs(cnSubdivisions),
	FJ: toSubs(fjSubdivisions),
	ID: toSubs(idSubdivisions),
	IN: toSubs(inSubdivisions),
	JP: toSubs(jpSubdivisions),
	KH: toSubs(khSubdivisions),
	KP: toSubs(kpSubdivisions),
	KR: toSubs(krSubdivisions),
	LA: toSubs(laSubdivisions),
	LK: toSubs(lkSubdivisions),
	MM: toSubs(mmSubdivisions),
	MN: toSubs(mnSubdivisions),
	MY: toSubs(mySubdivisions),
	NP: toSubs(npSubdivisions),
	NZ: toSubs(nzSubdivisions),
	PG: toSubs(pgSubdivisions),
	PH: toSubs(phSubdivisions),
	PK: toSubs(pkSubdivisions),
	TH: toSubs(thSubdivisions),
	TW: toSubs(twSubdivisions),
	VN: toSubs(vnSubdivisions),
	AE: toSubs(aeSubdivisions),
	AF: toSubs(afSubdivisions),
	AM: toSubs(amSubdivisions),
	AZ: toSubs(azSubdivisions),
	BH: toSubs(bhSubdivisions),
	GE: toSubs(geSubdivisions),
	IL: toSubs(ilSubdivisions),
	IQ: toSubs(iqSubdivisions),
	IR: toSubs(irSubdivisions),
	JO: toSubs(joSubdivisions),
	KG: toSubs(kgSubdivisions),
	KW: toSubs(kwSubdivisions),
	KZ: toSubs(kzSubdivisions),
	LB: toSubs(lbSubdivisions),
	OM: toSubs(omSubdivisions),
	PS: toSubs(psSubdivisions),
	QA: toSubs(qaSubdivisions),
	RU: toSubs(ruSubdivisions),
	SA: toSubs(saSubdivisions),
	SY: toSubs(sySubdivisions),
	TJ: toSubs(tjSubdivisions),
	TM: toSubs(tmSubdivisions),
	TR: toSubs(trSubdivisions),
	UZ: toSubs(uzSubdivisions),
	YE: toSubs(yeSubdivisions),
	AO: toSubs(aoSubdivisions),
	BF: toSubs(bfSubdivisions),
	BI: toSubs(biSubdivisions),
	BJ: toSubs(bjSubdivisions),
	BW: toSubs(bwSubdivisions),
	CD: toSubs(cdSubdivisions),
	CF: toSubs(cfSubdivisions),
	CG: toSubs(cgSubdivisions),
	CI: toSubs(ciSubdivisions),
	CM: toSubs(cmSubdivisions),
	DJ: toSubs(djSubdivisions),
	DZ: toSubs(dzSubdivisions),
	EG: toSubs(egSubdivisions),
	ER: toSubs(erSubdivisions),
	ET: toSubs(etSubdivisions),
	GA: toSubs(gaSubdivisions),
	GH: toSubs(ghSubdivisions),
	GN: toSubs(gnSubdivisions),
	GQ: toSubs(gqSubdivisions),
	KE: toSubs(keSubdivisions),
	LR: toSubs(lrSubdivisions),
	LS: toSubs(lsSubdivisions),
	LY: toSubs(lySubdivisions),
	MA: toSubs(maSubdivisions),
	MG: toSubs(mgSubdivisions),
	ML: toSubs(mlSubdivisions),
	MR: toSubs(mrSubdivisions),
	MU: toSubs(muSubdivisions),
	MW: toSubs(mwSubdivisions),
	MZ: toSubs(mzSubdivisions),
	NA: toSubs(naSubdivisions),
	NE: toSubs(neSubdivisions),
	NG: toSubs(ngSubdivisions),
	RW: toSubs(rwSubdivisions),
	SD: toSubs(sdSubdivisions),
	SL: toSubs(slSubdivisions),
	SN: toSubs(snSubdivisions),
	SO: toSubs(soSubdivisions),
	SS: toSubs(ssSubdivisions),
	SZ: toSubs(szSubdivisions),
	TD: toSubs(tdSubdivisions),
	TG: toSubs(tgSubdivisions),
	TN: toSubs(tnSubdivisions),
	TZ: toSubs(tzSubdivisions),
	UG: toSubs(ugSubdivisions),
	ZA: toSubs(zaSubdivisions),
	ZM: toSubs(zmSubdivisions),
	ZW: toSubs(zwSubdivisions),
	CY: toSubs(cySubdivisions),
	EE: toSubs(eeSubdivisions),
	LT: toSubs(ltSubdivisions),
	LV: toSubs(lvSubdivisions),
	MT: toSubs(mtSubdivisions),
	LI: toSubs(liSubdivisions),
	SM: toSubs(smSubdivisions),
	AG: toSubs(agSubdivisions),
	BB: toSubs(bbSubdivisions),
	BS: toSubs(bsSubdivisions),
	BZ: toSubs(bzSubdivisions),
	DM: toSubs(dmSubdivisions),
	GD: toSubs(gdSubdivisions),
	GY: toSubs(gySubdivisions),
	KN: toSubs(knSubdivisions),
	LC: toSubs(lcSubdivisions),
	SR: toSubs(srSubdivisions),
	VC: toSubs(vcSubdivisions),
	BN: toSubs(bnSubdivisions),
	BT: toSubs(btSubdivisions),
	KM: toSubs(kmSubdivisions),
	MV: toSubs(mvSubdivisions),
	TL: toSubs(tlSubdivisions),
	CV: toSubs(cvSubdivisions),
	GM: toSubs(gmSubdivisions),
	GW: toSubs(gwSubdivisions),
	SC: toSubs(scSubdivisions),
	ST: toSubs(stSubdivisions),
	FM: toSubs(fmSubdivisions),
	KI: toSubs(kiSubdivisions),
	MH: toSubs(mhSubdivisions),
	NR: toSubs(nrSubdivisions),
	PW: toSubs(pwSubdivisions),
	SB: toSubs(sbSubdivisions),
	TO: toSubs(toSubdivisions),
	TV: toSubs(tvSubdivisions),
	VU: toSubs(vuSubdivisions),
	WS: toSubs(wsSubdivisions),
	GL: toSubs(glSubdivisions),
	HK: toSubs(hkSubdivisions),
	NC: toSubs(ncSubdivisions),
	SH: toSubs(shSubdivisions),
	BQ: toSubs(bqSubdivisions),
};

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
			independent: country.independent,
		};
	});

	return countries;
});

// Missing countries not in UN M49 (user-assigned and exceptionally reserved codes)
const missingCountries: Array<{
	code: string;
	code3?: string;
	name: string;
	notes?: string;
}> = [
	{
		code: "XK",
		code3: "XKX",
		name: "Kosovo",
		notes:
			"Partially recognised state; ISO has not assigned a code due to political dispute. XK/XKX are user-assigned de facto codes used by the EU, IMF, and SWIFT. ICAO assigns KS/RKS independently; IOC assigns KOS.",
	},
];

export const getMissingCountries = createServerFn({
	method: "GET",
}).handler(async () => {
	const countries: Country[] = missingCountries.map((country) => {
		const vc = vehicleCodes[country.code];
		return {
			flag: getEmojiFlag(country.code),
			alpha2Code: country.code,
			alpha3Code: country.code3,
			icaoCode: getMrzCode(country.code, country.code3 ?? "", false),
			dsitCode: vc,
			iocCode: iocCodes[country.code],
			aircraftRegPrefixes: aircraftRegistrationPrefixes[country.code],
			unMembership: getUnMembership(country.code),
			euMember: euMembers.has(country.code) || undefined,
			region: regionMap[country.code],
			notes: country.notes,
			name: country.name,
		};
	});

	return countries;
});

export type SubdivisionData = NonNullable<Country["subdivisions"]>[number];

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

export interface LocalizedName {
	/** Language locale (ISO 639-1) the name is rendered in. */
	locale: string;
	/** English name of that language, for labelling. */
	language: string;
	/** The country's name in that language. */
	name: string;
}

/**
 * Language locales that actually carry CLDR region-name data in this runtime.
 * Built once at module load: a locale only qualifies if `Intl.DisplayNames`
 * resolves it to itself (rather than falling back to another language), so we
 * skip codes like `la`/`vo` that just echo English. The constructed instances
 * are cached and reused across every country lookup.
 */
const regionNameLocales: Array<{
	locale: string;
	language: string;
	displayNames: Intl.DisplayNames;
}> = (() => {
	const result: Array<{
		locale: string;
		language: string;
		displayNames: Intl.DisplayNames;
	}> = [];
	for (const { code, name } of iso639_1Codes) {
		try {
			const displayNames = new Intl.DisplayNames([code], {
				type: "region",
				fallback: "none",
			});
			const base = displayNames.resolvedOptions().locale.split("-")[0];
			if (base === code) {
				result.push({ locale: code, language: name, displayNames });
			}
		} catch {
			// Locale not supported by the runtime — skip it.
		}
	}
	return result;
})();

export interface RegionNameLocale {
	/** Language locale (ISO 639-1). */
	locale: string;
	/** English name of that language. */
	language: string;
}

// Constant for the lifetime of the process — derived once from regionNameLocales.
const regionNameLocaleList: RegionNameLocale[] = regionNameLocales
	.map(({ locale, language }) => ({ locale, language }))
	.sort((a, b) => a.language.localeCompare(b.language));

/**
 * The language locales that carry CLDR region-name data in this runtime — the
 * full set used by the localized-names subrow. Exposed so the UI can offer them
 * in a "Show names in" picker.
 */
export const getRegionNameLocales = createServerFn({
	method: "GET",
}).handler(async (): Promise<RegionNameLocale[]> => regionNameLocaleList);

/** Localized names for one alpha-2 code, sorted by locale. Shared core. */
function localizedNamesFor(alpha2: string): LocalizedName[] {
	const code = alpha2.toUpperCase();
	const names: LocalizedName[] = [];
	for (const { locale, language, displayNames } of regionNameLocales) {
		const localized = displayNames.of(code);
		// `fallback: "none"` yields undefined for gaps; also drop bare-code echoes.
		if (localized && localized !== code) {
			names.push({ locale, language, name: localized });
		}
	}
	names.sort((a, b) => a.locale.localeCompare(b.locale));
	return names;
}

/**
 * Localized names for a single country, generated on demand from CLDR data via
 * `Intl.DisplayNames`. Locales with no name for the given region are omitted.
 */
export const getCountryNames = createServerFn({
	method: "GET",
})
	.inputValidator((data: { code: string }) => data)
	.handler(async ({ data }) => localizedNamesFor(data.code));

// Counts are locale-independent and expensive (~all countries × all locales),
// so compute them once and reuse across loader runs / picker switches.
let localizedNameCounts: Record<string, number> | null = null;

/**
 * How many localized names each country has — counts vary because CLDR has
 * gaps for some territories in some languages. Sent in the initial load so the
 * collapsed Names column can show the count without expanding the row.
 */
export const getLocalizedNameCountsByCountry = createServerFn({
	method: "GET",
}).handler(async () => {
	if (!localizedNameCounts) {
		const counts: Record<string, number> = {};
		for (const { code } of unM49Data) {
			counts[code] = localizedNamesFor(code).length;
		}
		localizedNameCounts = counts;
	}
	return localizedNameCounts;
});

// Every country's full per-locale name map, `{ alpha2: { locale: name } }`.
// Built and cached once (locale-independent); the canonical source for both the
// search index and the structured export.
let localizedNamesAllIndex: Record<string, Record<string, string>> | null =
	null;
function allLocalizedNames(): Record<string, Record<string, string>> {
	if (!localizedNamesAllIndex) {
		const index: Record<string, Record<string, string>> = {};
		for (const { code } of unM49Data) {
			const names: Record<string, string> = {};
			for (const { locale, displayNames } of regionNameLocales) {
				const v = displayNames.of(code);
				if (v && v !== code) names[locale] = v;
			}
			index[code] = names;
		}
		localizedNamesAllIndex = index;
	}
	return localizedNamesAllIndex;
}

/**
 * `{ alpha2: { locale: name } }` for every country and locale (gaps omitted).
 * Heavy (~all countries × all locales), so fetched on demand — e.g. at export
 * time — rather than shipped with every page load.
 */
export const getLocalizedNamesAllByCountry = createServerFn({
	method: "GET",
}).handler(async () => allLocalizedNames());

// Compact per-country search index: distinct localized spellings joined into one
// string. Small enough to ship with the page so global search matches a country
// by its name in ANY language.
let localizedSearchIndex: Record<string, string> | null = null;

/** `{ alpha2: "<all distinct localized names joined>" }`, derived + cached. */
export const getLocalizedSearchByCountry = createServerFn({
	method: "GET",
}).handler(async () => {
	if (!localizedSearchIndex) {
		const index: Record<string, string> = {};
		for (const [code, names] of Object.entries(allLocalizedNames())) {
			index[code] = [...new Set(Object.values(names))].join(" ");
		}
		localizedSearchIndex = index;
	}
	return localizedSearchIndex;
});

/**
 * Every country's name in a single locale, as `{ alpha2: name }`. Uses the same
 * `Intl.DisplayNames` instance as {@link getCountryNames}, so the value here is
 * guaranteed to match the corresponding row in the localized-names subrow.
 * Computed server-side so the picker-driven column never diverges from the
 * subrow (which could happen if the client's CLDR data differed).
 */
export const getCountryNamesByLocale = createServerFn({
	method: "GET",
})
	.inputValidator((data: { locale: string }) => data)
	.handler(async ({ data }): Promise<Record<string, string>> => {
		const entry = regionNameLocales.find((l) => l.locale === data.locale);
		const names: Record<string, string> = {};
		if (!entry) return names;
		for (const { code } of unM49Data) {
			const localized = entry.displayNames.of(code);
			if (localized && localized !== code) names[code] = localized;
		}
		return names;
	});
