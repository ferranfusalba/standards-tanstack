import { describe, expect, it } from "vitest";
import { DATASET_CONFIGS } from "../dataset-config";
import { compareDataset } from "../diff";
import {
	bestSemanticPairs,
	cosine,
	type Embedder,
	reconcileSemantically,
} from "../semantic";
import type { CompareSpec, RowComparison } from "../types";

const countries = DATASET_CONFIGS.countries;

function byKey(rows: RowComparison[], key: string): RowComparison | undefined {
	return rows.find((r) => r.key === key);
}

describe("cosine", () => {
	it("is 1 for identical and 0 for orthogonal unit vectors", () => {
		expect(cosine([1, 0, 0], [1, 0, 0])).toBe(1);
		expect(cosine([1, 0, 0], [0, 1, 0])).toBe(0);
	});
});

describe("bestSemanticPairs", () => {
	it("pairs each side at most once, taking the highest scores first", () => {
		const theirs = [
			[1, 0],
			[0, 1],
		];
		const ours = [
			[1, 0],
			[0, 1],
		];
		const pairs = bestSemanticPairs(theirs, ours, 0.6);
		expect(pairs).toHaveLength(2);
		expect(pairs).toContainEqual({ their: 0, our: 0, score: 1 });
		expect(pairs).toContainEqual({ their: 1, our: 1, score: 1 });
	});

	it("drops candidates below the threshold", () => {
		const theirs = [[0.5, 0.5]];
		const ours = [[1, 0]]; // cosine 0.5 < 0.6
		expect(bestSemanticPairs(theirs, ours, 0.6)).toHaveLength(0);
	});

	it("greedily resolves contention without reusing a row", () => {
		// Both their-rows are closest to our-row 0; only the best one wins it.
		const theirs = [
			[1, 0], // score 1.0 with our[0]
			[0.9, 0.1], // score ~0.9 with our[0]
		];
		const ours = [[1, 0]];
		const pairs = bestSemanticPairs(theirs, ours, 0.6);
		expect(pairs).toHaveLength(1);
		expect(pairs[0]).toMatchObject({ their: 0, our: 0 });
	});
});

// A deterministic stand-in for the real in-browser embedder: names map to fixed
// unit vectors so "USA" ~ "United States" and "Deutschland" ~ "Germany".
const VECTORS: Record<string, number[]> = {
	"United States": [1, 0, 0],
	USA: [1, 0, 0],
	Germany: [0, 1, 0],
	Deutschland: [0, 1, 0],
};
const fakeEmbed: Embedder = async (texts) =>
	texts.map((t) => VECTORS[t] ?? [0, 0, 1]);

const OUR_COUNTRIES = [
	{ alpha2Code: "US", name: "United States" },
	{ alpha2Code: "DE", name: "Germany" },
];

const SPEC: CompareSpec = {
	mapping: { alpha2Code: "alpha2Code", name: "name" },
	primary: { field: "alpha2Code", mode: "exact" },
};

describe("reconcileSemantically", () => {
	it("merges Extra ↔ Missing rows that match by meaning", async () => {
		// Codes don't match and the names aren't lexically similar, so the
		// deterministic pass leaves both sides unreconciled.
		const base = compareDataset(
			countries,
			OUR_COUNTRIES,
			[
				{ alpha2Code: "XX", name: "USA" },
				{ alpha2Code: "ZZ", name: "Deutschland" },
			],
			SPEC,
		);
		expect(base.summary.missing).toBe(2);
		expect(base.summary.extra).toBe(2);

		const out = await reconcileSemantically(base, countries, SPEC, {
			embed: fakeEmbed,
		});

		expect(out.summary.missing).toBe(0);
		expect(out.summary.extra).toBe(0);
		expect(out.summary.changed).toBe(2);
		expect(out.summary.total).toBe(2); // four rows collapsed into two

		const us = byKey(out.rows, "US");
		expect(us?.matchedBy).toBe("semantic");
		// The differing code is surfaced as a normal field diff.
		expect(us?.diffs.map((d) => d.field)).toContain("alpha2Code");
	});

	it("leaves rows untouched when nothing clears the threshold", async () => {
		const base = compareDataset(
			countries,
			OUR_COUNTRIES,
			[{ alpha2Code: "ZZ", name: "Totally Unrelated" }],
			SPEC,
		);
		const out = await reconcileSemantically(base, countries, SPEC, {
			embed: fakeEmbed,
		});
		expect(out.summary.extra).toBe(base.summary.extra);
		expect(out.summary.missing).toBe(base.summary.missing);
	});

	it("is a no-op when there are no Extra rows to absorb", async () => {
		const base = compareDataset(
			countries,
			OUR_COUNTRIES,
			[{ alpha2Code: "US", name: "United States" }],
			SPEC,
		);
		expect(base.summary.extra).toBe(0);
		const out = await reconcileSemantically(base, countries, SPEC, {
			embed: fakeEmbed,
		});
		expect(out).toBe(base); // returned unchanged
	});
});
