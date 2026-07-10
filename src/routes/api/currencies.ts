import { createFileRoute } from "@tanstack/react-router";
import { getCurrencies } from "@/data/currencies";
import { jsonApi } from "@/lib/api";

// GET /api/currencies — active ISO 4217 currencies.
export const Route = createFileRoute("/api/currencies")({
	server: {
		handlers: {
			GET: async () => jsonApi(await getCurrencies()),
		},
	},
});
