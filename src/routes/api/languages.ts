import { createFileRoute } from "@tanstack/react-router";
import { getLanguages } from "@/data/languages";
import { jsonApi } from "@/lib/api";

// GET /api/languages — ISO 639 languages with English names.
export const Route = createFileRoute("/api/languages")({
	server: {
		handlers: {
			GET: async () => jsonApi(await getLanguages()),
		},
	},
});
