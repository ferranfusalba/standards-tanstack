// Public API for the countries data layer. Consumers import from
// "@/data/countries" (this barrel); the folder's internal split — reference
// tables under ./reference, the assembly/server functions in ./server, and the
// CLDR name helpers in ./localized-names — is not part of the surface.

export type { LocalizedName, RegionNameLocale } from "./localized-names";
export {
	getCountryNames,
	getCountryNamesByLocale,
	getLocalizedNameCountsByCountry,
	getLocalizedNamesAllByCountry,
	getLocalizedSearchByCountry,
	getRegionNameLocales,
} from "./localized-names";
export { fifaHomeNations } from "./reference/fifa";
export {
	getCountries,
	getCountriesFromUN,
	getMissingCountries,
	getSubdivisions,
	getSubdivisionsByCountry,
} from "./server";
export type { Country, SubdivisionData } from "./types";
