import { createFileRoute } from "@tanstack/react-router";
import { getTimezonesFromIANA } from "@/data/timezones";
import { jsonApi } from "@/lib/api";

// GET /api/timezones — the IANA tzdata timezone list (the canonical timezone
// standard), each with its id and UTC offset.
export const Route = createFileRoute("/api/timezones")({
	server: {
		handlers: {
			GET: async () => jsonApi(await getTimezonesFromIANA()),
		},
	},
});
