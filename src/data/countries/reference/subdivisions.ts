import type { SubdivisionData } from "../types";

// ISO 3166-2 subdivision data per country.
// Official Source: https://www.iso.org/obp/ui/#search/code/ (ISO Online Browsing Platform)
// iso1: subdivisions that also carry their own ISO 3166-1 alpha-2 code
// See: https://en.wikipedia.org/wiki/ISO_3166-2#Subdivisions_included_in_ISO_3166-1
//
// Every `./subdivisions/<ALPHA2>.json` file is wired up automatically via
// import.meta.glob — dropping a new country file into that directory adds it to
// the dataset with no manual import/map entry to keep in sync.
const modules = import.meta.glob<{ default: unknown[] }>(
	"./subdivisions/*.json",
	{ eager: true },
);

export const subdivisionsData: Record<string, SubdivisionData[]> =
	Object.fromEntries(
		Object.entries(modules).map(([path, mod]) => {
			// "../subdivisions/AD.json" -> "AD"
			const alpha2 = path
				.slice(path.lastIndexOf("/") + 1)
				.replace(/\.json$/, "")
				.toUpperCase();
			return [alpha2, mod.default as SubdivisionData[]];
		}),
	);
