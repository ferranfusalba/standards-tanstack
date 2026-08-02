import { describe, expect, it } from "vitest";
import { DATASET_CONFIGS } from "../dataset-config";
import { buildColumnMapping, compareDataset, proposeSpec } from "../diff";
import { parseJSONRecords } from "../parse";
import type { CompareSpec, RowComparison } from "../types";

const currencies = DATASET_CONFIGS.currencies;
const countries = DATASET_CONFIGS.countries;

const OUR_CURRENCIES = [
	{
		code: "USD",
		numericCode: "840",
		name: "US Dollar",
		minorUnit: 2,
		type: "currency",
	},
	{
		code: "EUR",
		numericCode: "978",
		name: "Euro",
		minorUnit: 2,
		type: "currency",
	},
];

function byKey(rows: RowComparison[], key: string): RowComparison | undefined {
	return rows.find((r) => r.key === key);
}

describe("compareDataset — key matching", () => {
	it("marks a row identical when every provided field agrees", () => {
		const { rows, summary } = compareDataset(currencies, OUR_CURRENCIES, [
			{ code: "USD", name: "US Dollar" },
		]);
		expect(byKey(rows, "USD")?.status).toBe("identical");
		expect(summary.identical).toBe(1);
		expect(summary.missing).toBe(1); // EUR
	});

	it("flags only the fields that differ", () => {
		const { rows } = compareDataset(currencies, OUR_CURRENCIES, [
			{ code: "USD", name: "American Dollar" },
		]);
		const usd = byKey(rows, "USD");
		expect(usd?.status).toBe("changed");
		expect(usd?.diffs).toEqual([
			{
				field: "name",
				label: "Name",
				ours: "US Dollar",
				theirs: "American Dollar",
			},
		]);
	});

	it("normalizes case and numbers so they are not false positives", () => {
		const { rows } = compareDataset(currencies, OUR_CURRENCIES, [
			{ code: "usd", numericCode: "840", minorUnit: "2" },
		]);
		expect(byKey(rows, "USD")?.status).toBe("identical");
	});

	it("ignores blank cells instead of asserting a difference", () => {
		const { rows } = compareDataset(currencies, OUR_CURRENCIES, [
			{ code: "USD", name: "" },
		]);
		expect(byKey(rows, "USD")?.status).toBe("identical");
	});

	it("matches on a secondary key field when the primary is absent", () => {
		const { rows } = compareDataset(currencies, OUR_CURRENCIES, [
			{ numericCode: "840", name: "Buck" },
		]);
		const usd = byKey(rows, "USD");
		expect(usd?.status).toBe("changed");
		expect(usd?.matchedBy).toBe("key");
		expect(usd?.matchedField).toBe("numericCode");
	});

	it("reports records we have but they don't as missing", () => {
		const { rows } = compareDataset(currencies, OUR_CURRENCIES, [
			{ code: "USD", name: "US Dollar" },
		]);
		expect(byKey(rows, "EUR")?.status).toBe("missing");
	});

	it("reports records they have but we don't as extra", () => {
		const { rows, summary } = compareDataset(currencies, OUR_CURRENCIES, [
			{ code: "XYZ", name: "Mystery" },
		]);
		expect(rows.find((r) => r.status === "extra")?.name).toBe("Mystery");
		expect(summary.extra).toBe(1);
	});
});

describe("compareDataset — column mapping", () => {
	it("recognizes aliased headers and lists unmapped ones", () => {
		const { rows, columns } = compareDataset(currencies, OUR_CURRENCIES, [
			{ "Currency Code": "USD", Currency: "US Dollar", foo: "bar" },
		]);
		expect(byKey(rows, "USD")?.status).toBe("identical");
		expect(columns.mapped["Currency Code"]).toBe("code");
		expect(columns.mapped.Currency).toBe("name");
		expect(columns.unmapped).toContain("foo");
	});

	it("buildColumnMapping never lets an alias hijack a real field name", () => {
		const mapping = buildColumnMapping(["code", "numericCode"], currencies);
		expect(mapping.mapped.code).toBe("code");
		expect(mapping.mapped.numericCode).toBe("numericCode");
	});

	it("detects a key column by its contents when the header is unrecognized", () => {
		// Header is `id` (not in any alias list); its values are alpha-2 codes.
		const ours = [
			{ alpha2Code: "US", name: "United States" },
			{ alpha2Code: "FR", name: "France" },
			{ alpha2Code: "DE", name: "Germany" },
		];
		const { rows, columns } = compareDataset(countries, ours, [
			{ id: "US", name: "United States" },
			{ id: "FR", name: "France" },
			{ id: "DE", name: "Germany" },
		]);
		expect(columns.mapped.id).toBe("alpha2Code");
		expect(columns.unmapped).not.toContain("id");
		expect(rows.every((r) => r.status === "identical")).toBe(true);
	});

	it("does not mistake an unrelated column for the key", () => {
		const ours = [{ alpha2Code: "US", name: "United States" }];
		const { columns } = compareDataset(countries, ours, [
			{ ref: "row-0001", name: "United States" },
		]);
		expect(columns.mapped.ref).toBeUndefined();
		expect(columns.unmapped).toContain("ref");
	});
});

describe("proposeSpec — name-agnostic first guess", () => {
	const OUR_COUNTRIES = [
		{ alpha2Code: "US", name: "United States" },
		{ alpha2Code: "FR", name: "France" },
		{ alpha2Code: "DE", name: "Germany" },
	];

	it("detects the key column by content when its header is unknown", () => {
		const spec = proposeSpec(countries, OUR_COUNTRIES, [
			{ id: "US" },
			{ id: "FR" },
			{ id: "DE" },
		]);
		expect(spec.mapping.alpha2Code).toBe("id");
		expect(spec.primary).toEqual({ field: "alpha2Code", mode: "exact" });
	});

	it("falls back to fuzzy name matching when nothing key-like is found", () => {
		const spec = proposeSpec(countries, OUR_COUNTRIES, [
			{ label: "France" },
			{ label: "Germany" },
		]);
		expect(spec.primary.mode).toBe("fuzzy");
		expect(spec.primary.field).toBe("name");
	});
});

describe("compareDataset — keyed dictionary upload (timezones)", () => {
	it("matches a { id: label } dictionary to IANA ids by content", () => {
		const ours = [
			{ id: "America/New_York", name: "New York" },
			{ id: "Europe/Paris", name: "Paris" },
		];
		const records = parseJSONRecords(
			'{"America/New_York":"(UTC-05:00) Eastern","Europe/Paris":"(UTC+01:00) CET"}',
		);
		const tz = DATASET_CONFIGS.timezones;
		const spec = proposeSpec(tz, ours, records);
		// The dictionary key column ("key") is recognized as the IANA id.
		expect(spec.mapping.id).toBe("key");
		const { rows, columns } = compareDataset(tz, ours, records, spec);
		expect(rows.filter((r) => r.status === "identical")).toHaveLength(2);
		// The label column carries no canonical field, so it's ignored, not diffed.
		expect(columns.unmapped).toContain("value");
	});
});

describe("compareDataset — explicit user spec", () => {
	it("matches on a user-chosen column regardless of its name", () => {
		const spec: CompareSpec = {
			mapping: { code: "ticker", name: "title" },
			primary: { field: "code", mode: "exact" },
		};
		const { rows } = compareDataset(
			currencies,
			OUR_CURRENCIES,
			[{ ticker: "USD", title: "US Dollar" }],
			spec,
		);
		expect(byKey(rows, "USD")?.status).toBe("identical");
		expect(byKey(rows, "USD")?.matchedField).toBe("code");
	});

	it("changing the match field changes which rows reconcile", () => {
		const ours = [
			{ code: "USD", numericCode: "840", name: "US Dollar" },
			{ code: "EUR", numericCode: "978", name: "Euro" },
		];
		// Their `key` column holds numeric codes, not alphabetic ones.
		const records = [{ key: "840", title: "Greenback" }];

		const onCode: CompareSpec = {
			mapping: { code: "key", name: "title" },
			primary: { field: "code", mode: "exact" },
		};
		// Matching the numeric value as if it were an alpha code finds nothing.
		expect(
			compareDataset(currencies, ours, records, onCode).summary.identical +
				compareDataset(currencies, ours, records, onCode).summary.changed,
		).toBe(0);

		const onNumeric: CompareSpec = {
			mapping: { numericCode: "key", name: "title" },
			primary: { field: "numericCode", mode: "exact" },
		};
		// Pointing the same column at the numeric field matches USD.
		expect(
			byKey(compareDataset(currencies, ours, records, onNumeric).rows, "USD")
				?.status,
		).toBe("changed");
	});
});

describe("compareDataset — fuzzy name fallback", () => {
	const OUR_COUNTRIES = [
		{
			alpha2Code: "US",
			alpha3Code: "USA",
			numericCode: "840",
			name: "United States",
			euMember: false,
			region: "Americas",
		},
	];

	it("reconciles by name when no key matches, surfacing the key difference", () => {
		const { rows } = compareDataset(countries, OUR_COUNTRIES, [
			{ iso2: "XX", country: "United States of America" },
		]);
		const us = byKey(rows, "US");
		expect(us?.status).toBe("changed");
		expect(us?.matchedBy).toBe("name");
		expect(us?.diffs.map((d) => d.field)).toContain("alpha2Code");
	});

	it("normalizes booleans from yes/no strings", () => {
		const same = compareDataset(countries, OUR_COUNTRIES, [
			{ alpha2Code: "US", eu: "no" },
		]);
		expect(byKey(same.rows, "US")?.status).toBe("identical");

		const diff = compareDataset(countries, OUR_COUNTRIES, [
			{ alpha2Code: "US", eu: "yes" },
		]);
		expect(byKey(diff.rows, "US")?.diffs.map((d) => d.field)).toContain(
			"euMember",
		);
	});
});
