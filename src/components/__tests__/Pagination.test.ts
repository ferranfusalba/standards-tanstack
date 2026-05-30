import { describe, expect, it } from "vitest";
import { getPageSizeOptions, SHOW_ALL_SIZE } from "@/components/Pagination";

describe("getPageSizeOptions", () => {
	it("offers the presets below the total plus an All option", () => {
		const { showingAll, pageSizeOptions } = getPageSizeOptions(20, 250);
		expect(showingAll).toBe(false);
		expect(pageSizeOptions).toEqual([10, 20, 50, 100]);
	});

	it("drops presets that exceed the row count", () => {
		const { pageSizeOptions } = getPageSizeOptions(20, 60);
		expect(pageSizeOptions).toEqual([10, 20, 50]);
	});

	it("treats a size at or above the total as Show All", () => {
		// A sibling table picked "Show All" (the shared sentinel size), so this
		// smaller table shows every row and its dropdown must read "Show All" too.
		expect(getPageSizeOptions(400, 250).showingAll).toBe(true);
		expect(getPageSizeOptions(SHOW_ALL_SIZE, 250).showingAll).toBe(true);
	});

	it("keeps a propagated non-preset size selectable instead of falling back", () => {
		// Legacy/shared case: a 180-row sibling's size lands on this 600-row table.
		// 180 isn't a preset, so it must be added rather than reset to "Show 10".
		const { showingAll, pageSizeOptions } = getPageSizeOptions(180, 600);
		expect(showingAll).toBe(false);
		expect(pageSizeOptions).toEqual([10, 20, 50, 100, 180]);
	});
});
