import React from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, FilterFn, SortingFn } from "@tanstack/react-table";
import {
	getTimezonesFromIntl,
	getTimezonesFromIANA,
	type Timezone,
	type TimezoneIANA,
	type TimezoneIntl,
} from "@/data/timezones";
import { fuzzyFilter } from "@/lib/fuzzy-filter";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { ColumnVisibility } from "@/components/ColumnVisibility";

import { ExportButtons } from "@/components/ExportButtons";
import { asNumber, asString, asStringArray } from "@/lib/url-state";
import {
	useGlobalFilterSync,
	useTableUrlState,
} from "@/lib/use-table-url-state";

// biome-ignore lint/suspicious/noExplicitAny: FilterFn generics are contravariant, making typed versions incompatible across table types
const facetedFilter: FilterFn<any> = (row, columnId, filterValue) => {
	if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
	return filterValue.includes(row.getValue(columnId));
};

function parseOffset(offset: string): number {
	const match = offset.match(/UTC([+-]?\d+)(?::(\d+))?/);
	if (!match) return 0;
	const hours = Number.parseInt(match[1], 10);
	const minutes = Number.parseInt(match[2] || "0", 10);
	return hours * 60 + (hours < 0 ? -minutes : minutes);
}

const offsetSortingFn: SortingFn<any> = (rowA, rowB, columnId) => {
	return (
		parseOffset(rowA.getValue(columnId)) - parseOffset(rowB.getValue(columnId))
	);
};

interface TimezonesSearch {
	highlight?: string;
	q?: string;
	regions?: string[];
	intl_sort?: string;
	intl_page?: number;
	intl_size?: number;
	intl_f?: string;
	iana_sort?: string;
	iana_page?: number;
	iana_size?: number;
}

export const Route = createFileRoute("/timezones/")({
	component: Timezones,
	validateSearch: (search: Record<string, unknown>): TimezonesSearch => ({
		highlight: asString(search.highlight),
		q: asString(search.q),
		regions: asStringArray(search.regions),
		intl_sort: asString(search.intl_sort),
		intl_page: asNumber(search.intl_page),
		intl_size: asNumber(search.intl_size),
		intl_f: asString(search.intl_f),
		iana_sort: asString(search.iana_sort),
		iana_page: asNumber(search.iana_page),
		iana_size: asNumber(search.iana_size),
	}),
	loader: async () => {
		const [timezonesIntl, timezonesIANA] = await Promise.all([
			getTimezonesFromIntl(),
			getTimezonesFromIANA(),
		]);
		return {
			timezonesIntl,
			timezonesIANA,
		};
	},
	head: () => ({
		meta: [
			{
				title: "Timezones | Standards",
			},
			{
				name: "description",
				content:
					"IANA timezone database identifiers, UTC offsets, and regional groupings. Compare JavaScript Intl API timezones with official IANA tzdata.",
			},
		],
	}),
});

function Timezones() {
	const { timezonesIntl, timezonesIANA } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const { highlight } = search;
	const [globalFilter, setGlobalFilter] = useGlobalFilterSync({
		search,
		navigate,
	});
	const intlUrl = useTableUrlState({
		prefix: "intl",
		search,
		navigate,
		includeColumnFilters: true,
	});
	const ianaUrl = useTableUrlState({
		prefix: "iana",
		search,
		navigate,
	});

	const selectedRegions = React.useMemo(
		() => search.regions ?? [],
		[search.regions],
	);
	const setSelectedRegions = (
		updater: string[] | ((prev: string[]) => string[]),
	) => {
		navigate({
			search: (prev) => {
				const current = (prev.regions as string[] | undefined) ?? [];
				const next = typeof updater === "function" ? updater(current) : updater;
				return {
					...prev,
					regions: next.length > 0 ? next : undefined,
				};
			},
			replace: true,
		});
	};

	const allRegions = React.useMemo(() => {
		const regions = new Set<string>();
		for (const tz of timezonesIntl) if (tz.region) regions.add(tz.region);
		for (const tz of timezonesIANA) if (tz.region) regions.add(tz.region);
		return Array.from(regions).sort();
	}, [timezonesIntl, timezonesIANA]);

	const regionColumnFilter = React.useMemo(
		() =>
			selectedRegions.length > 0
				? [{ id: "region", value: selectedRegions }]
				: [],
		[selectedRegions],
	);

	// IANA table uses only the shared region filter
	const columnFiltersIANA = regionColumnFilter;

	// Intl table merges region filter with its own column filters from URL (e.g. DST)
	const intlOwnFilters = React.useMemo(
		() => intlUrl.columnFilters.filter((f) => f.id !== "region"),
		[intlUrl.columnFilters],
	);

	const columnFiltersIntl = React.useMemo(
		() => [...regionColumnFilter, ...intlOwnFilters],
		[regionColumnFilter, intlOwnFilters],
	);

	const intlIds = React.useMemo(
		() => new Set(timezonesIntl.map((tz) => tz.id)),
		[timezonesIntl],
	);
	const ianaIds = React.useMemo(
		() => new Set(timezonesIANA.map((tz) => tz.id)),
		[timezonesIANA],
	);

	const toggleRegion = (region: string) => {
		setSelectedRegions((prev) =>
			prev.includes(region)
				? prev.filter((r) => r !== region)
				: [...prev, region],
		);
	};

	const columnsIntl = React.useMemo<ColumnDef<TimezoneIntl>[]>(
		() => [
			{
				accessorKey: "offset",
				header: "Offset",
				size: 110,
				maxSize: 110,
				sortingFn: offsetSortingFn,
			},
			{
				accessorKey: "id",
				header: "ID",
				size: 250,
				maxSize: 250,
			},
			{
				accessorKey: "name",
				header: "Name",
				size: 250,
				maxSize: 250,
			},
			{
				accessorKey: "region",
				header: "Region",
				filterFn: facetedFilter,
			},
			{
				accessorKey: "longName",
				header: "Long Name",
				size: 400,
				maxSize: 400,
			},
			{
				accessorKey: "shortName",
				header: "Abbr.",
				size: 90,
				maxSize: 90,
				filterFn: facetedFilter,
				meta: { filterable: true },
			},
			{
				accessorKey: "longGeneric",
				header: "Generic Name",
				size: 400,
				maxSize: 400,
			},
			{
				accessorKey: "shortGeneric",
				header: "Generic Short",
				size: 140,
				maxSize: 140,
			},
			{
				accessorKey: "isDST",
				header: "DST",
				size: 80,
				maxSize: 80,
				cell: ({ getValue }) => (getValue() ? "Yes" : "No"),
				filterFn: facetedFilter,
				meta: { filterable: true },
			},
			{
				accessorKey: "standardOffset",
				header: "Std Offset",
				size: 120,
				maxSize: 120,
			},
			{
				accessorKey: "dstOffset",
				header: "DST Offset",
				size: 120,
				maxSize: 120,
				cell: ({ getValue }) => (getValue() as string) ?? "—",
			},
		],
		[],
	);

	const columnsIANA = React.useMemo<ColumnDef<TimezoneIANA>[]>(
		() => [
			{
				accessorKey: "offset",
				header: "Offset",
				size: 110,
				maxSize: 110,
				sortingFn: offsetSortingFn,
			},
			{
				accessorKey: "id",
				header: "ID",
				size: 250,
				maxSize: 250,
			},
			{
				accessorKey: "name",
				header: "Name",
				size: 250,
				maxSize: 250,
			},
			{
				accessorKey: "region",
				header: "Region",
				filterFn: facetedFilter,
			},
			{
				accessorKey: "countryCodes",
				header: "Countries",
				cell: ({ getValue }) => {
					const codes = getValue() as string[];
					return (
						<span className="flex flex-wrap gap-1">
							{codes.map((code) => (
								<Link
									key={code}
									to="/countries"
									search={{ highlight: code, expandTz: true }}
									title={code}
									className="cursor-pointer hover:opacity-70 transition-opacity"
								>
									{code
										.toUpperCase()
										.split("")
										.map((c) =>
											String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65),
										)
										.join("")}
								</Link>
							))}
						</span>
					);
				},
				size: 120,
				maxSize: 120,
			},
			{
				accessorKey: "comment",
				header: "Comment",
				cell: ({ getValue }) => (getValue() as string) ?? "—",
				size: 200,
				maxSize: 200,
			},
		],
		[],
	);

	const tableIntl = useReactTable({
		data: timezonesIntl,
		columns: columnsIntl,
		getCoreRowModel: getCoreRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		globalFilterFn: "fuzzy",
		state: {
			globalFilter,
			columnFilters: columnFiltersIntl,
			sorting: intlUrl.sorting,
			pagination: intlUrl.pagination,
		},
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: intlUrl.onSortingChange,
		onPaginationChange: intlUrl.onPaginationChange,
		onColumnFiltersChange: (updater) => {
			const next =
				typeof updater === "function" ? updater(columnFiltersIntl) : updater;
			// Drop the region filter — that's controlled by the shared regions param
			intlUrl.onColumnFiltersChange(next.filter((f) => f.id !== "region"));
		},
		filterFns: {
			fuzzy: fuzzyFilter,
		},
	});

	const tableIANA = useReactTable({
		data: timezonesIANA,
		columns: columnsIANA,
		getCoreRowModel: getCoreRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		globalFilterFn: "fuzzy",
		state: {
			globalFilter,
			columnFilters: columnFiltersIANA,
			sorting: ianaUrl.sorting,
			pagination: ianaUrl.pagination,
		},
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: ianaUrl.onSortingChange,
		onPaginationChange: ianaUrl.onPaginationChange,
		filterFns: {
			fuzzy: fuzzyFilter,
		},
	});

	// Navigate to the correct page and scroll to highlighted row
	React.useEffect(() => {
		if (!highlight) return;
		// Jump each table to the page containing the highlighted timezone
		for (const table of [tableIANA, tableIntl]) {
			const rows = table.getFilteredRowModel().rows;
			const idx = rows.findIndex(
				(r) => (r.original as Timezone).id === highlight,
			);
			if (idx >= 0) {
				const pageSize = table.getState().pagination.pageSize;
				table.setPageIndex(Math.floor(idx / pageSize));
			}
		}
		const timer = setTimeout(() => {
			const el = document.querySelector(".bg-blue-100");
			if (el) {
				el.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}, 100);
		return () => clearTimeout(timer);
		// Only run on mount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="min-h-screen p-6">
			<h1 className="text-3xl font-bold mb-6" data-view-title="Timezones">Timezones</h1>
			<input
				type="text"
				value={globalFilter}
				onChange={(e) => setGlobalFilter(e.target.value)}
				placeholder="Search by name, ID or region…"
				aria-label="Search timezones"
				className="w-full px-3 py-2 mb-6 bg-secondary border border-border rounded text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-ring"
			/>

			{allRegions.length > 0 && (
				<div className="mb-6">
					<h3 className="text-sm font-semibold mb-2">Filters</h3>
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-sm text-muted-foreground">Region:</span>
						{allRegions.map((region) => (
							<button
								key={region}
								type="button"
								onClick={() => toggleRegion(region)}
								className={`px-2 py-1 text-xs rounded border transition-colors ${
									selectedRegions.includes(region)
										? "bg-foreground text-background border-foreground"
										: "bg-secondary text-secondary-foreground border-border hover:bg-accent"
								}`}
							>
								{region}
							</button>
						))}
						{selectedRegions.length > 0 && (
							<button
								type="button"
								onClick={() => setSelectedRegions([])}
								className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
							>
								Clear
							</button>
						)}
					</div>
				</div>
			)}

			<h3 className="text-sm font-semibold mb-2">Cross-check data</h3>
			<div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
				<span className="flex items-center gap-2">
					<span className="inline-block w-8 h-3 rounded bg-yellow-100 dark:bg-yellow-950" />
					Not present in the other table
				</span>
				{highlight && (
					<span className="flex items-center gap-2">
						<span className="inline-block w-8 h-3 rounded bg-blue-100 dark:bg-blue-950" />
						Linked timezone
					</span>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Left: Intl API */}
				<div>
					<div className="flex items-center justify-between mb-2">
						<h2 className="text-xl font-semibold">Intl API (Built-in)</h2>
						<ColumnVisibility table={tableIntl} />
					</div>
					<ul className="text-xs text-muted-foreground mb-3 space-y-1">
						<li>• Source: JavaScript runtime's built-in database</li>
						<li>• Updates: Tied to Node.js version updates</li>
						<li>• Coverage: Only timezones supported by runtime</li>
						<li>• Performance: Instant (no network call)</li>
						<li>• Includes canonical zones + common aliases</li>
					</ul>
					<div className="flex items-center justify-between mb-4">
						<p className="text-sm text-muted-foreground">
							Total: {timezonesIntl.length} timezones (
							{timezonesIntl.filter((tz) => !ianaIds.has(tz.id)).length} not in
							IANA)
							{tableIntl.getFilteredRowModel().rows.length !==
								timezonesIntl.length && (
								<span>
									{" "}
									| Filtered: {tableIntl.getFilteredRowModel().rows.length}
								</span>
							)}
						</p>
						<ExportButtons table={tableIntl} filename="timezones-intl" />
					</div>
					<DataTable
						table={tableIntl}
						cellClassName={(_col, row) => {
							const id = (row.original as Timezone).id;
							if (highlight === id) return "bg-blue-100 dark:bg-blue-950";
							if (!ianaIds.has(id)) return "bg-yellow-100 dark:bg-yellow-950";
							return "";
						}}
					/>
					<Pagination table={tableIntl} totalItems={timezonesIntl.length} />
				</div>

				{/* Right: IANA Official */}
				<div>
					<div className="flex items-center justify-between mb-2">
						<h2 className="text-xl font-semibold">IANA Official Data</h2>
						<ColumnVisibility table={tableIANA} />
					</div>
					<ul className="text-xs text-muted-foreground mb-3 space-y-1">
						<li>• Source: Official IANA tzdata repository</li>
						<li>• Updates: Real-time from authoritative source</li>
						<li>• Coverage: All canonical zones (inhabited since 1970)</li>
						<li>• Performance: Requires network fetch</li>
						<li>• Only canonical zones (no aliases)</li>
					</ul>
					<div className="flex items-center justify-between mb-4">
						<p className="text-sm text-muted-foreground">
							Total: {timezonesIANA.length} timezones (
							{timezonesIANA.filter((tz) => !intlIds.has(tz.id)).length} not in
							Intl)
							{tableIANA.getFilteredRowModel().rows.length !==
								timezonesIANA.length && (
								<span>
									{" "}
									| Filtered: {tableIANA.getFilteredRowModel().rows.length}
								</span>
							)}
						</p>
						<ExportButtons table={tableIANA} filename="timezones-iana" />
					</div>
					<DataTable
						table={tableIANA}
						cellClassName={(_col, row) => {
							const id = (row.original as Timezone).id;
							if (highlight === id) return "bg-blue-100 dark:bg-blue-950";
							if (!intlIds.has(id)) return "bg-yellow-100 dark:bg-yellow-950";
							return "";
						}}
					/>
					<Pagination table={tableIANA} totalItems={timezonesIANA.length} />
				</div>
			</div>
		</div>
	);
}
