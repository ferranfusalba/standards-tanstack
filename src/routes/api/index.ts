import { createFileRoute } from "@tanstack/react-router";
import { API_ENDPOINTS, jsonApi } from "@/lib/api";

// Self-documenting index for the public JSON API: lists every endpoint and the
// standard(s) it sources, so a consumer can discover the surface from `/api`.
export const Route = createFileRoute("/api/")({
	server: {
		handlers: {
			GET: async () =>
				jsonApi({
					name: "Standards API",
					description:
						"Read-only JSON access to the international-standards reference data this site browses.",
					endpoints: API_ENDPOINTS,
				}),
		},
	},
});
