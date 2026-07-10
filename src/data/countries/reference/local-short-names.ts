import type { Country } from "../types";
import localShortNamesJson from "./local-short-names.json";

// ISO 3166-1 "Local short name" per administrative language, sourced from the OBP
// "Additional information" table. Keyed by alpha-2; absent for codes with none.
export const localShortNames = localShortNamesJson as Record<
	string,
	NonNullable<Country["localShortNames"]>
>;
