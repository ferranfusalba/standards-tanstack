import { describe, expect, it, vi } from "vitest";

// biome-ignore lint/suspicious/noExplicitAny: mock factory for createServerFn
type HandlerFn = (...args: any[]) => any;

let mockHeader: string | undefined;

vi.mock("@tanstack/react-start", () => ({
	createServerFn: () => ({
		handler: (fn: HandlerFn) => fn,
	}),
}));

vi.mock("@tanstack/react-start/server", () => ({
	getRequestHeader: () => mockHeader,
}));

import {
	getDetectedLocales,
	getPreferredLocale,
	parseAcceptLanguage,
} from "../locale";

describe("parseAcceptLanguage", () => {
	it("orders by q-value and strips region subtags", () => {
		expect(parseAcceptLanguage("fr-CH;q=0.9,en;q=1.0,de;q=0.8")).toEqual([
			"en",
			"fr",
			"de",
		]);
	});

	it("treats a missing q as 1.0", () => {
		expect(parseAcceptLanguage("es-ES,es;q=0.9,en;q=0.8")).toEqual([
			"es",
			"es",
			"en",
		]);
	});

	it("ignores wildcards and empty input", () => {
		expect(parseAcceptLanguage("*")).toEqual([]);
		expect(parseAcceptLanguage(undefined)).toEqual([]);
		expect(parseAcceptLanguage("")).toEqual([]);
	});
});

describe("getPreferredLocale", () => {
	const call = (): Promise<string> =>
		(getPreferredLocale as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		});

	it("returns the highest-priority supported locale", async () => {
		mockHeader = "es-ES,es;q=0.9,en;q=0.8";
		expect(await call()).toBe("es");
	});

	it("skips locales Intl can't render", async () => {
		mockHeader = "zz,xx;q=0.9,fr;q=0.5";
		expect(await call()).toBe("fr");
	});

	it("falls back to English when there is no header", async () => {
		mockHeader = undefined;
		expect(await call()).toBe("en");
	});
});

describe("getDetectedLocales", () => {
	const call = (): Promise<string[]> =>
		(getDetectedLocales as unknown as HandlerFn)({
			data: undefined,
			context: {},
			signal: new AbortController().signal,
		});

	it("returns all supported locales in priority order", async () => {
		mockHeader = "ca,es;q=0.9,en;q=0.8";
		expect(await call()).toEqual(["ca", "es", "en"]);
	});

	it("drops unsupported locales and de-dupes", async () => {
		mockHeader = "zz,fr-FR,fr;q=0.9,en;q=0.5";
		expect(await call()).toEqual(["fr", "en"]);
	});

	it("returns an empty list with no header", async () => {
		mockHeader = undefined;
		expect(await call()).toEqual([]);
	});
});
