// Track 1 — semantic matching. A progressive-enhancement pass on top of the
// deterministic diff: it reconciles the leftover Extra ↔ Missing rows (the ones
// no key or lexical-name match caught) using sentence embeddings, so "USA" and
// "United States", or native/translated names, line up. Everything runs in the
// browser via transformers.js, so the upload still never leaves the device.

import type { DatasetConfig } from "./dataset-config";
import { rowDiffs } from "./diff";
import type { CompareResult, CompareSpec, RowComparison } from "./types";

/** Cosine similarity threshold above which two names are considered the same
 *  entity. all-MiniLM normalized embeddings: ~0.6 is a sensible, conservative
 *  cut that pairs paraphrases/translations without merging merely-related names. */
export const SEMANTIC_THRESHOLD = 0.6;

const MODEL = "Xenova/all-MiniLM-L6-v2";

/** A text -> unit-vector embedder. */
export type Embedder = (texts: string[]) => Promise<number[][]>;

// The transformers.js feature-extraction pipeline is heavy (~25 MB model + WASM
// runtime), so it's dynamically imported on first use and memoized. The dynamic
// import also keeps the library out of the SSR bundle and off the initial load.
type FeatureExtractor = (
	texts: string[],
	opts: { pooling: "mean"; normalize: boolean },
) => Promise<{ tolist: () => number[][] }>;

let extractorPromise: Promise<FeatureExtractor> | null = null;

async function getExtractor(): Promise<FeatureExtractor> {
	if (!extractorPromise) {
		extractorPromise = import("@huggingface/transformers").then(
			async ({ pipeline, env }) => {
				// Pull weights from the Hugging Face hub (cached in the browser after the
				// first run); never look for local model files.
				env.allowLocalModels = false;
				return (await pipeline(
					"feature-extraction",
					MODEL,
				)) as unknown as FeatureExtractor;
			},
		);
	}
	return extractorPromise;
}

/** Default embedder: mean-pooled, L2-normalized MiniLM sentence vectors. */
export const embedTexts: Embedder = async (texts) => {
	if (texts.length === 0) return [];
	const extractor = await getExtractor();
	const output = await extractor(texts, { pooling: "mean", normalize: true });
	return output.tolist();
};

/** Dot product of two equal-length vectors. With normalized inputs this is the
 *  cosine similarity. */
export function cosine(a: number[], b: number[]): number {
	let sum = 0;
	const n = Math.min(a.length, b.length);
	// i < n <= a.length and b.length, so the `?? 0` fallbacks never fire.
	for (let i = 0; i < n; i++) sum += (a[i] ?? 0) * (b[i] ?? 0);
	return sum;
}

export interface SemanticPair {
	their: number; // index into the "theirs" vectors
	our: number; // index into the "ours" vectors
	score: number;
}

/**
 * Greedily pair their-vectors to our-vectors: take the highest-scoring pair
 * above the threshold, then the next that reuses neither side, and so on. Pure
 * and deterministic — the unit-testable core of the semantic pass.
 */
export function bestSemanticPairs(
	theirVecs: number[][],
	ourVecs: number[][],
	threshold: number,
): SemanticPair[] {
	const candidates: SemanticPair[] = [];
	for (let t = 0; t < theirVecs.length; t++) {
		for (let o = 0; o < ourVecs.length; o++) {
			// t and o are bounded by the loop conditions, so both lookups are present.
			const theirVec = theirVecs[t];
			const ourVec = ourVecs[o];
			if (!theirVec || !ourVec) continue;
			const score = cosine(theirVec, ourVec);
			if (score >= threshold) candidates.push({ their: t, our: o, score });
		}
	}
	// Highest score first; ties broken by index for stable, deterministic output.
	candidates.sort(
		(a, b) => b.score - a.score || a.their - b.their || a.our - b.our,
	);
	const usedTheir = new Set<number>();
	const usedOur = new Set<number>();
	const pairs: SemanticPair[] = [];
	for (const c of candidates) {
		if (usedTheir.has(c.their) || usedOur.has(c.our)) continue;
		usedTheir.add(c.their);
		usedOur.add(c.our);
		pairs.push(c);
	}
	return pairs;
}

export interface ReconcileOptions {
	threshold?: number;
	signal?: AbortSignal;
	/** Injectable for tests; defaults to the real in-browser embedder. */
	embed?: Embedder;
}

/**
 * Reconcile a deterministic result's leftover rows by name similarity. Each
 * Extra row that semantically matches a Missing row is merged into a single
 * Identical/Different row (matchedBy: "semantic"); everything else is untouched.
 * Returns the original result unchanged when there's nothing to gain.
 */
export async function reconcileSemantically(
	result: CompareResult,
	config: DatasetConfig,
	spec: CompareSpec,
	options: ReconcileOptions = {},
): Promise<CompareResult> {
	const threshold = options.threshold ?? SEMANTIC_THRESHOLD;
	const embed = options.embed ?? embedTexts;

	const missing = result.rows.filter((r) => r.status === "missing");
	const extra = result.rows.filter((r) => r.status === "extra");
	if (missing.length === 0 || extra.length === 0) return result;

	const [theirVecs, ourVecs] = await Promise.all([
		embed(extra.map((r) => r.name)),
		embed(missing.map((r) => r.name)),
	]);
	if (options.signal?.aborted) return result;

	const pairs = bestSemanticPairs(theirVecs, ourVecs, threshold);
	if (pairs.length === 0) return result;

	// Build the reconciled rows and remember which originals they replace.
	const replacedMissingId = new Map<string, RowComparison>();
	const consumedExtra = new Set<RowComparison>();
	for (const { our, their } of pairs) {
		const missingRow = missing[our];
		const extraRow = extra[their];
		if (!missingRow || !extraRow) continue;
		const ourRow = missingRow.ourRow;
		const theirRow = extraRow.theirRow;
		if (!ourRow || !theirRow) continue;
		const diffs = rowDiffs(ourRow, theirRow, spec, config);
		replacedMissingId.set(missingRow.id, {
			id: missingRow.id,
			status: diffs.length > 0 ? "changed" : "identical",
			key: missingRow.key,
			name: missingRow.name,
			matchedBy: "semantic",
			matchedField: config.nameField,
			diffs,
			ourRow,
			theirRow,
		});
		consumedExtra.add(extraRow);
	}

	// Rebuild rows in place: swap each matched Missing (keyed by its unique
	// primary-key id) for its reconciled row and drop the Extra it absorbed;
	// leave canonical ordering otherwise intact.
	const rows: RowComparison[] = [];
	for (const row of result.rows) {
		if (row.status === "missing" && replacedMissingId.has(row.id)) {
			const reconciled = replacedMissingId.get(row.id);
			if (reconciled) rows.push(reconciled);
		} else if (row.status === "extra" && consumedExtra.has(row)) {
			// merged into a reconciled row — drop it
		} else {
			rows.push(row);
		}
	}

	const count = (status: RowComparison["status"]) =>
		rows.reduce((n, r) => (r.status === status ? n + 1 : n), 0);

	return {
		...result,
		rows,
		summary: {
			...result.summary,
			total: rows.length,
			identical: count("identical"),
			changed: count("changed"),
			missing: count("missing"),
			extra: count("extra"),
		},
	};
}
