/**
 * Shared helpers for the public read-only JSON API under `/api`.
 *
 * Every dataset the app browses is static international-standards reference data
 * (ISO/UN/IANA/CLDR tables baked into the repo), so it's genuinely useful to
 * expose it as a plain HTTP JSON API that anything can consume — not just the UI.
 * Each endpoint is therefore a cacheable GET with permissive CORS: safe for any
 * origin to fetch, and cacheable hard at the browser and CDN since the data only
 * changes when the repo is redeployed.
 */

const API_HEADERS: Record<string, string> = {
	// Read-only public reference data — safe for any origin to GET.
	"Access-Control-Allow-Origin": "*",
	// Static standards data: cache 1h in the browser, 1d at the CDN, and keep
	// serving stale for a week while revalidating in the background.
	"Cache-Control":
		"public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

/** JSON `Response` for an API endpoint, with the shared CORS + cache headers.
 *  Caller-supplied `init.headers` win over the defaults. */
export function jsonApi(data: unknown, init?: ResponseInit): Response {
	return Response.json(data, {
		...init,
		headers: { ...API_HEADERS, ...init?.headers },
	});
}

export interface ApiEndpoint {
	path: string;
	description: string;
	/** The standard(s) the dataset is sourced from, for self-documentation. */
	standards: string[];
}

/** The API surface, served as-is from the `/api` index so the endpoint is
 *  self-documenting. Keep in sync with the route files under `src/routes/api/`. */
export const API_ENDPOINTS: ApiEndpoint[] = [
	{
		path: "/api/countries",
		description:
			"Countries from the UN M49 standard with their ISO 3166-1 codes, plus passport (ICAO), vehicle (UNECE), Olympic (IOC), FIFA, aircraft, ccTLD, phone and membership data.",
		standards: ["UN M49", "ISO 3166-1", "ICAO Doc 9303", "IOC", "FIFA"],
	},
	{
		path: "/api/currencies",
		description:
			"Active ISO 4217 currencies with their code, numeric code, minor units, symbol and name.",
		standards: ["ISO 4217"],
	},
	{
		path: "/api/languages",
		description:
			"Languages with their ISO 639-1 / 639-3 codes and English names.",
		standards: ["ISO 639-1", "ISO 639-3", "Unicode CLDR"],
	},
	{
		path: "/api/timezones",
		description:
			"IANA tzdata timezones with their canonical id and UTC offset.",
		standards: ["IANA tzdata"],
	},
];
