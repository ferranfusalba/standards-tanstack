import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider, useLocale } from "../locale";

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const OPTIONS = [
	{ locale: "ca", language: "Catalan" },
	{ locale: "en", language: "English" },
];

function Probe() {
	const { locale, setLocale, options, detectedLocales } = useLocale();
	return (
		<div>
			<span data-testid="locale">{locale}</span>
			<span data-testid="options">
				{options.map((o) => o.locale).join(",")}
			</span>
			<span data-testid="detected">{detectedLocales.join(",")}</span>
			<button type="button" onClick={() => setLocale("ca")}>
				set-ca
			</button>
		</div>
	);
}

function renderProvider(preferredLocale = "en") {
	return render(
		<LocaleProvider
			preferredLocale={preferredLocale}
			options={OPTIONS}
			detectedLocales={["en"]}
		>
			<Probe />
		</LocaleProvider>,
	);
}

describe("LocaleProvider", () => {
	it("seeds the locale from the server-detected preferred locale", () => {
		renderProvider("en");
		expect(screen.getByTestId("locale").textContent).toBe("en");
	});

	it("applies a stored locale on mount, overriding the seed", () => {
		localStorage.setItem("nameLocale", "ca");
		renderProvider("en");
		expect(screen.getByTestId("locale").textContent).toBe("ca");
	});

	it("persists the picked locale to localStorage and updates context", () => {
		renderProvider("en");
		fireEvent.click(screen.getByText("set-ca"));
		expect(screen.getByTestId("locale").textContent).toBe("ca");
		expect(localStorage.getItem("nameLocale")).toBe("ca");
	});

	it("exposes the picker options and detected locales", () => {
		renderProvider("en");
		expect(screen.getByTestId("options").textContent).toBe("ca,en");
		expect(screen.getByTestId("detected").textContent).toBe("en");
	});
});
