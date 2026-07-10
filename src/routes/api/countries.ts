import { createFileRoute } from "@tanstack/react-router";
import { getCountriesFromUN } from "@/data/countries";
import { jsonApi } from "@/lib/api";

// GET /api/countries — the UN M49 country list with all cross-referenced codes.
// Reuses the same server function that powers the countries view, so the API and
// the UI never drift.
export const Route = createFileRoute("/api/countries")({
	server: {
		handlers: {
			GET: async () => jsonApi(await getCountriesFromUN()),
		},
	},
});
