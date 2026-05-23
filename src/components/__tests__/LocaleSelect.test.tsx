// biome-ignore-all lint/correctness/useUniqueElementIds: fixed ids are fine in isolated, cleaned-up component tests
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleSelect } from "../LocaleSelect";

afterEach(cleanup);

const options = [
	{ locale: "ar", language: "Arabic" },
	{ locale: "ca", language: "Catalan" },
	{ locale: "en", language: "English" },
	{ locale: "es", language: "Spanish" },
];

const optionValues = (group: Element) =>
	[...group.querySelectorAll("option")].map(
		(o) => (o as HTMLOptionElement).value,
	);

describe("LocaleSelect", () => {
	it("groups detected locales first, then the rest (no duplicates)", () => {
		render(
			<LocaleSelect
				id="x"
				value="ca"
				onChange={() => {}}
				options={options}
				detectedLocales={["ca", "es"]}
			/>,
		);
		const groups = screen.getByRole("combobox").querySelectorAll("optgroup");
		expect([...groups].map((g) => (g as HTMLOptGroupElement).label)).toEqual([
			"Detected",
			"All locales",
		]);
		expect(optionValues(groups[0])).toEqual(["ca", "es"]);
		expect(optionValues(groups[1])).toEqual(["ar", "en"]);
	});

	it("renders a flat list when nothing is detected", () => {
		render(
			<LocaleSelect
				id="x"
				value="en"
				onChange={() => {}}
				options={options}
				detectedLocales={[]}
			/>,
		);
		expect(
			screen.getByRole("combobox").querySelectorAll("optgroup"),
		).toHaveLength(0);
		expect(screen.getAllByRole("option")).toHaveLength(options.length);
	});

	it("labels options as 'Language (code)' and reflects the value", () => {
		render(
			<LocaleSelect
				id="x"
				value="es"
				onChange={() => {}}
				options={options}
				detectedLocales={[]}
			/>,
		);
		expect(screen.getByRole("option", { name: "Spanish (es)" })).toBeDefined();
		expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe(
			"es",
		);
	});

	it("calls onChange with the picked locale", () => {
		const onChange = vi.fn();
		render(
			<LocaleSelect
				id="x"
				value="en"
				onChange={onChange}
				options={options}
				detectedLocales={[]}
			/>,
		);
		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "ca" },
		});
		expect(onChange).toHaveBeenCalledWith("ca");
	});

	it("associates the 'Show names in:' label with the select via id", () => {
		render(
			<LocaleSelect
				id="my-picker"
				value="en"
				onChange={() => {}}
				options={options}
				detectedLocales={[]}
			/>,
		);
		expect(screen.getByLabelText("Show names in:").id).toBe("my-picker");
	});
});
