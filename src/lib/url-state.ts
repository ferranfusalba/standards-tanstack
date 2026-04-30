import type {
	ColumnFiltersState,
	PaginationState,
	SortingState,
} from "@tanstack/react-table";

export const DEFAULT_PAGE_SIZE = 20;

export function asString(v: unknown): string | undefined {
	return typeof v === "string" && v.length > 0 ? v : undefined;
}

export function asNumber(v: unknown): number | undefined {
	if (typeof v === "number" && !Number.isNaN(v)) return v;
	if (typeof v === "string") {
		const n = Number.parseInt(v, 10);
		return Number.isNaN(n) ? undefined : n;
	}
	return undefined;
}

export function asStringArray(v: unknown): string[] | undefined {
	if (Array.isArray(v)) {
		const arr = v.filter((x): x is string => typeof x === "string");
		return arr.length > 0 ? arr : undefined;
	}
	if (typeof v === "string" && v.length > 0) return v.split(",");
	return undefined;
}

export function parseSorting(value: string | undefined): SortingState {
	if (!value) return [];
	return value
		.split(",")
		.map((part) => {
			const [id, dir] = part.split(":");
			return { id, desc: dir === "desc" };
		})
		.filter((s) => !!s.id);
}

export function serializeSorting(sorting: SortingState): string | undefined {
	if (sorting.length === 0) return undefined;
	return sorting.map((s) => (s.desc ? `${s.id}:desc` : s.id)).join(",");
}

export function parsePage(value: unknown): number {
	const n = asNumber(value);
	if (!n || n < 1) return 0;
	return n - 1;
}

export function serializePage(pageIndex: number): number | undefined {
	return pageIndex === 0 ? undefined : pageIndex + 1;
}

export function parseSize(
	value: unknown,
	fallback = DEFAULT_PAGE_SIZE,
): number {
	const n = asNumber(value);
	if (!n || n < 1) return fallback;
	return n;
}

export function serializeSize(
	size: number,
	fallback = DEFAULT_PAGE_SIZE,
): number | undefined {
	return size === fallback ? undefined : size;
}

export function parsePagination(
	page: unknown,
	size: unknown,
	fallback = DEFAULT_PAGE_SIZE,
): PaginationState {
	return {
		pageIndex: parsePage(page),
		pageSize: parseSize(size, fallback),
	};
}

export function parseColumnFilters(value: unknown): ColumnFiltersState {
	if (typeof value !== "string" || value.length === 0) return [];
	try {
		const obj = JSON.parse(value) as Record<string, unknown>;
		if (!obj || typeof obj !== "object") return [];
		return Object.entries(obj)
			.filter(
				([, v]) =>
					v !== undefined && v !== null && (!Array.isArray(v) || v.length > 0),
			)
			.map(([id, v]) => ({ id, value: v }));
	} catch {
		return [];
	}
}

export function serializeColumnFilters(
	filters: ColumnFiltersState,
): string | undefined {
	if (filters.length === 0) return undefined;
	const obj: Record<string, unknown> = {};
	for (const f of filters) {
		if (Array.isArray(f.value) && f.value.length === 0) continue;
		obj[f.id] = f.value;
	}
	if (Object.keys(obj).length === 0) return undefined;
	return JSON.stringify(obj);
}
