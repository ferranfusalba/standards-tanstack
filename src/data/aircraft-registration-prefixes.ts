/**
 * ICAO Aircraft Registration Nationality Marks (Annex 7)
 * mapped to ISO 3166-1 alpha-2 country codes.
 *
 * Source: ICAO — Aircraft Nationality Marks, National Emblems and Common Marks
 * https://www.icao.int/sites/default/files/airnavigation/NationalityMarks/Nationality_Marks_en.pdf
 * Document dated 1/12/25
 *
 * Keys are ISO 3166-1 alpha-2 codes.
 * Values are arrays of prefix strings (some countries have multiple prefix blocks).
 *
 * Notes:
 * - Liechtenstein and Switzerland both use "HB" distinguished by national emblem.
 * - Mexico uses "XA, XB, XC" plus national emblem.
 * - UK territories are listed under their own ISO alpha-2 codes.
 * - Netherlands territories: Aruba has its own mark (P4); Curaçao and Sint Maarten share PJ.
 * - States with no notified mark (per §2–3): Andorra, Kiribati, Timor-Leste, Tuvalu, Holy See.
 * - Common marks (§5): 4YB = Arab Air Cargo (Jordan/Iraq) — not included here.
 */
export const aircraftRegistrationPrefixes: Record<string, string[]> = {
	AE: ["A6"], // United Arab Emirates
	AF: ["YA"], // Afghanistan
	AG: ["V2"], // Antigua and Barbuda
	AI: ["VP-A"], // Anguilla (United Kingdom)
	AL: ["ZA"], // Albania
	AM: ["EK"], // Armenia
	AO: ["D2"], // Angola
	AR: ["LQ", "LV"], // Argentina
	AT: ["OE"], // Austria
	AU: ["VH"], // Australia
	AW: ["P4"], // Aruba (Netherlands)
	AZ: ["4K"], // Azerbaijan
	BA: ["E7"], // Bosnia and Herzegovina
	BB: ["8P"], // Barbados
	BD: ["S2"], // Bangladesh
	BE: ["OO"], // Belgium
	BF: ["XT"], // Burkina Faso
	BG: ["LZ"], // Bulgaria
	BH: ["A9C"], // Bahrain
	BI: ["9U"], // Burundi
	BJ: ["TY"], // Benin
	BM: ["VP-B", "VQ-B"], // Bermuda (United Kingdom)
	BN: ["V8"], // Brunei Darussalam
	BO: ["CP"], // Bolivia (Plurinational State of)
	BR: ["PP", "PR", "PS", "PT", "PU"], // Brazil
	BS: ["C6"], // Bahamas
	BT: ["A5"], // Bhutan
	BW: ["A2"], // Botswana
	BY: ["EW"], // Belarus
	BZ: ["V3"], // Belize
	CA: ["C", "CF"], // Canada
	CD: ["9Q"], // Democratic Republic of the Congo
	CF: ["TL"], // Central African Republic
	CG: ["TN"], // Congo
	CH: ["HB"], // Switzerland (plus national emblem)
	CI: ["TU"], // Côte d'Ivoire
	CK: ["E5"], // Cook Islands
	CL: ["CC"], // Chile
	CM: ["TJ"], // Cameroon
	CN: ["B"], // China (including Hong Kong SAR and Macao SAR)
	CO: ["HJ", "HK"], // Colombia
	CR: ["TI"], // Costa Rica
	CU: ["CU"], // Cuba
	CV: ["D4"], // Cabo Verde
	CW: ["PJ"], // Curaçao (Netherlands)
	CY: ["5B"], // Cyprus
	CZ: ["OK"], // Czechia
	DE: ["D"], // Germany
	DJ: ["J2"], // Djibouti
	DK: ["OY"], // Denmark
	DM: ["J7"], // Dominica
	DO: ["HI"], // Dominican Republic
	DZ: ["7T"], // Algeria
	EC: ["HC"], // Ecuador
	EE: ["ES"], // Estonia
	EG: ["SU"], // Egypt
	ER: ["E3"], // Eritrea
	ES: ["EC"], // Spain
	ET: ["ET"], // Ethiopia
	FI: ["OH"], // Finland
	FJ: ["DQ"], // Fiji
	FK: ["VP-F"], // Falkland Islands (Malvinas) (United Kingdom)
	FM: ["V6"], // Micronesia (Federated States of)
	FR: ["F"], // France
	GA: ["TR"], // Gabon
	GB: ["G"], // United Kingdom
	GD: ["J3"], // Grenada
	GE: ["4L"], // Georgia
	GG: ["2"], // Bailiwick of Guernsey (United Kingdom)
	GH: ["9G", "9GR"], // Ghana
	GI: ["VP-G"], // Gibraltar (United Kingdom)
	GM: ["C5"], // Gambia
	GN: ["3X"], // Guinea
	GQ: ["3C"], // Equatorial Guinea
	GR: ["SX"], // Greece
	GT: ["TG"], // Guatemala
	GW: ["J5"], // Guinea-Bissau
	GY: ["8R"], // Guyana
	HN: ["HR"], // Honduras
	HR: ["9A"], // Croatia
	HT: ["HH"], // Haiti
	HU: ["HA"], // Hungary
	ID: ["PK"], // Indonesia
	IE: ["EI", "EJ"], // Ireland
	IL: ["4X", "4Z"], // Israel
	IM: ["M"], // Isle of Man (United Kingdom)
	IN: ["VT"], // India
	IQ: ["YI"], // Iraq
	IR: ["EP"], // Iran (Islamic Republic of)
	IS: ["TF"], // Iceland
	IT: ["I"], // Italy
	JM: ["6Y"], // Jamaica
	JO: ["JY"], // Jordan
	JP: ["JA"], // Japan
	KE: ["5Y"], // Kenya
	KG: ["EX"], // Kyrgyzstan
	KH: ["XU"], // Cambodia
	KM: ["D6"], // Comoros
	KN: ["V4"], // Saint Kitts and Nevis
	KP: ["P"], // Democratic People's Republic of Korea
	KR: ["HL"], // Republic of Korea
	KW: ["9K"], // Kuwait
	KY: ["VP-C", "VQ-C"], // Cayman Islands (United Kingdom)
	KZ: ["UP"], // Kazakhstan
	LA: ["RDPL"], // Lao People's Democratic Republic
	LB: ["OD"], // Lebanon
	LC: ["J6"], // Saint Lucia
	LI: ["HB"], // Liechtenstein (plus national emblem)
	LK: ["4R"], // Sri Lanka
	LR: ["A8"], // Liberia
	LS: ["7P"], // Lesotho
	LT: ["LY"], // Lithuania
	LU: ["LX"], // Luxembourg
	LV: ["YL"], // Latvia
	LY: ["5A"], // Libya
	MA: ["CN"], // Morocco
	MC: ["3A"], // Monaco
	MD: ["ER"], // Republic of Moldova
	ME: ["4O"], // Montenegro
	MG: ["5R"], // Madagascar
	MH: ["V7"], // Marshall Islands
	MK: ["Z3"], // North Macedonia
	ML: ["TZ"], // Mali
	MM: ["XY", "XZ"], // Myanmar
	MN: ["JU"], // Mongolia
	MR: ["5T"], // Mauritania
	MS: ["VP-M"], // Montserrat (United Kingdom)
	MT: ["9H"], // Malta
	MU: ["3B"], // Mauritius
	MV: ["8Q"], // Maldives
	MW: ["7Q"], // Malawi
	MX: ["XA", "XB", "XC"], // Mexico (plus national emblem)
	MY: ["9M"], // Malaysia
	MZ: ["C9"], // Mozambique
	NA: ["V5"], // Namibia
	NE: ["5U"], // Niger
	NG: ["5N"], // Nigeria
	NI: ["YN"], // Nicaragua
	NL: ["PH"], // Netherlands
	NO: ["LN"], // Norway
	NP: ["9N"], // Nepal
	NR: ["C2"], // Nauru
	NZ: ["ZK", "ZL", "ZM"], // New Zealand
	OM: ["A4O"], // Oman
	PA: ["HP"], // Panama
	PE: ["OB"], // Peru
	PG: ["P2"], // Papua New Guinea
	PH: ["RP"], // Philippines
	PK: ["AP"], // Pakistan
	PL: ["SP"], // Poland
	PT: ["CR", "CS"], // Portugal
	PW: ["T8"], // Palau
	PY: ["ZP"], // Paraguay
	QA: ["A7"], // Qatar
	RO: ["YR"], // Romania
	RS: ["YU"], // Serbia
	RU: ["RA"], // Russian Federation
	RW: ["9XR"], // Rwanda
	SA: ["HZ"], // Saudi Arabia
	SB: ["H4"], // Solomon Islands
	SC: ["S7"], // Seychelles
	SD: ["ST"], // Sudan
	SE: ["SE"], // Sweden
	SG: ["9V"], // Singapore
	SH: ["VQ-H"], // St. Helena/Ascension (United Kingdom)
	SI: ["S5"], // Slovenia
	SK: ["OM"], // Slovakia
	SL: ["9L"], // Sierra Leone
	SM: ["T7"], // San Marino
	SN: ["6V", "6W"], // Senegal
	SO: ["6O"], // Somalia
	SR: ["PZ"], // Suriname
	SS: ["Z8"], // South Sudan
	ST: ["S9"], // Sao Tome and Principe
	SV: ["YS"], // El Salvador
	SX: ["PJ"], // Sint Maarten (Netherlands)
	SY: ["YK"], // Syrian Arab Republic
	SZ: ["3DC"], // Eswatini
	TC: ["VQ-T"], // Turks and Caicos (United Kingdom)
	TD: ["TT"], // Chad
	TG: ["5V"], // Togo
	TH: ["HS"], // Thailand
	TJ: ["EY"], // Tajikistan
	TM: ["EZ"], // Turkmenistan
	TN: ["TS"], // Tunisia
	TO: ["A3"], // Tonga
	TR: ["TC"], // Türkiye
	TT: ["9Y"], // Trinidad and Tobago
	TZ: ["5H"], // United Republic of Tanzania
	UA: ["UR"], // Ukraine
	UG: ["5X"], // Uganda
	US: ["N"], // United States
	UY: ["CX"], // Uruguay
	UZ: ["UK"], // Uzbekistan
	VC: ["J8"], // Saint Vincent and the Grenadines
	VE: ["YV"], // Venezuela (Bolivarian Republic of)
	VG: ["VP-L"], // Virgin Islands (United Kingdom)
	VN: ["XV"], // Viet Nam
	VU: ["YJ"], // Vanuatu
	WS: ["5W"], // Samoa
	YE: ["7O"], // Yemen
	ZA: ["ZS", "ZT", "ZU"], // South Africa
	ZM: ["9I", "9J"], // Zambia
	ZW: ["Z"], // Zimbabwe
};
