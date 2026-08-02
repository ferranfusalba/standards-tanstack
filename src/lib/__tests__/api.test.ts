import { describe, expect, it, vi } from "vitest";

// Chainable createServerFn mock: the data modules define functions with both
// `.handler()` and `.validator().handler()`, so the builder must support
// both and collapse to the handler fn. (See src/data/__tests__ for the pattern.)
// biome-ignore lint/suspicious/noExplicitAny: mock factory for createServerFn
type HandlerFn = (...args: any[]) => any;
vi.mock("@tanstack/react-start", () => {
	const makeBuilder = () => {
		const b = {
			validator: () => b,
			middleware: () => b,
			handler: (fn: HandlerFn) => fn,
		};
		return b;
	};
	return { createServerFn: () => makeBuilder() };
});

import { API_ENDPOINTS, jsonApi } from "../api";

describe("jsonApi", () => {
	it("serializes data as JSON with a 200 status by default", async () => {
		const res = jsonApi({ hello: "world" });
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("application/json");
		expect(await res.json()).toEqual({ hello: "world" });
	});

	it("sets permissive CORS and a cacheable Cache-Control header", () => {
		const res = jsonApi([1, 2, 3]);
		expect(res.headers.get("access-control-allow-origin")).toBe("*");
		const cache = res.headers.get("cache-control") ?? "";
		expect(cache).toContain("public");
		expect(cache).toContain("max-age=");
		expect(cache).toContain("s-maxage=");
	});

	it("lets caller-supplied init override the defaults", async () => {
		const res = jsonApi({ error: "nope" }, { status: 404 });
		expect(res.status).toBe(404);
		// Default headers still apply alongside the overridden status.
		expect(res.headers.get("access-control-allow-origin")).toBe("*");
		expect(await res.json()).toEqual({ error: "nope" });
	});
});

describe("API_ENDPOINTS", () => {
	it("every entry is well-formed and under /api", () => {
		expect(API_ENDPOINTS.length).toBeGreaterThan(0);
		for (const e of API_ENDPOINTS) {
			expect(e.path.startsWith("/api/")).toBe(true);
			expect(e.description.length).toBeGreaterThan(0);
			expect(e.standards.length).toBeGreaterThan(0);
		}
	});

	it("has unique paths", () => {
		const paths = API_ENDPOINTS.map((e) => e.path);
		expect(new Set(paths).size).toBe(paths.length);
	});
});

describe("api route handlers", () => {
	// Smoke-test the actual route wiring: import a route file and invoke its GET
	// handler, asserting it returns a JSON Response built by jsonApi over the
	// dataset's (mocked) server function.
	it("GET /api/countries returns a non-empty JSON array with API headers", async () => {
		const { Route } = await import("../../routes/api/countries");
		const handler = (
			Route.options as {
				server: { handlers: { GET: (ctx: unknown) => Promise<Response> } };
			}
		).server.handlers.GET;
		const res = await handler({
			request: new Request("http://localhost/api/countries"),
			params: {},
		});
		expect(res.status).toBe(200);
		expect(res.headers.get("access-control-allow-origin")).toBe("*");
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
		expect(body.length).toBeGreaterThan(0);
		expect(body[0]).toHaveProperty("alpha2Code");
	});

	// The ISO 3166-1 numeric code is exposed as `numericCode` and under no other
	// name. It was `unCode` from the original country-data commit until 2026-08-02 —
	// a name that read as "one of the UN codes" next to `unMembership` and the M49
	// `region`, when it is in fact the ISO code (ISO adopted the M49 numbers
	// verbatim). The old key was dropped outright rather than aliased, so this pins
	// the public contract to exactly one spelling.
	it("GET /api/countries exposes the numeric code as numericCode only", async () => {
		const { Route } = await import("../../routes/api/countries");
		const handler = (
			Route.options as {
				server: { handlers: { GET: (ctx: unknown) => Promise<Response> } };
			}
		).server.handlers.GET;
		const res = await handler({
			request: new Request("http://localhost/api/countries"),
			params: {},
		});
		const body = (await res.json()) as Array<Record<string, unknown>>;
		expect(body.find((c) => c.alpha2Code === "ES")?.numericCode).toBe("724");
		expect(body.filter((c) => !c.numericCode)).toEqual([]);
		expect(body.filter((c) => "unCode" in c)).toEqual([]);
	});
});
