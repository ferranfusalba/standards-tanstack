import React from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import type { ColumnDef, FilterFn } from "@tanstack/react-table"
import {
	getTimezonesFromIntl,
	getTimezonesFromIANA,
	type Timezone,
} from "@/data/timezones"
import { fuzzyFilter } from "@/lib/fuzzy-filter"
import { DataTable } from "@/components/DataTable"
import { Pagination } from "@/components/Pagination"

const facetedFilter: FilterFn<Timezone> = (row, columnId, filterValue) => {
	if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
	return filterValue.includes(row.getValue(columnId));
};

export const Route = createFileRoute("/timezones/")({
	component: Timezones,
	loader: async () => {
		const [timezonesIntl, timezonesIANA] = await Promise.all([
			getTimezonesFromIntl(),
			getTimezonesFromIANA(),
		])
		return {
			timezonesIntl,
			timezonesIANA,
		}
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
})

function Timezones() {
	const { timezonesIntl, timezonesIANA } = Route.useLoaderData()
	const [globalFilter, setGlobalFilter] = React.useState("")
	const [selectedRegions, setSelectedRegions] = React.useState<string[]>([])

	const allRegions = React.useMemo(() => {
		const regions = new Set<string>();
		for (const tz of timezonesIntl) if (tz.region) regions.add(tz.region);
		for (const tz of timezonesIANA) if (tz.region) regions.add(tz.region);
		return Array.from(regions).sort();
	}, [timezonesIntl, timezonesIANA]);

	const columnFilters = React.useMemo(
		() =>
			selectedRegions.length > 0
				? [{ id: "region", value: selectedRegions }]
				: [],
		[selectedRegions],
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

	const columns = React.useMemo<ColumnDef<Timezone>[]>(
		() => [
			{
				accessorKey: "offset",
				header: "Offset",
				size: 110,
				maxSize: 110,
				enableHiding: false,
			},
			{
				accessorKey: "id",
				header: "ID",
				enableHiding: false,
			},
			{
				accessorKey: "name",
				header: "Name",
			},
			{
				accessorKey: "region",
				header: "Region",
				filterFn: facetedFilter,
			},
		],
		[],
	)

	const tableIntl = useReactTable({
		data: timezonesIntl,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		globalFilterFn: "fuzzy",
		state: { globalFilter, columnFilters },
		onGlobalFilterChange: setGlobalFilter,
		initialState: {
			pagination: {
				pageSize: 20,
			},
		},
		filterFns: {
			fuzzy: fuzzyFilter,
		},
	})

	const tableIANA = useReactTable({
		data: timezonesIANA,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		globalFilterFn: "fuzzy",
		state: { globalFilter, columnFilters },
		onGlobalFilterChange: setGlobalFilter,
		initialState: {
			pagination: {
				pageSize: 20,
			},
		},
		filterFns: {
			fuzzy: fuzzyFilter,
		},
	})

	return (
		<div className="min-h-screen p-6">
			<h1 className="text-3xl font-bold mb-6">Timezones</h1>
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
									? "bg-white text-gray-900 border-white"
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
			<div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
				<span className="inline-block w-8 h-3 rounded bg-yellow-50 dark:bg-yellow-950/30" />
				<span>Not present in the other table</span>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Left: Intl API */}
				<div>
					<h2 className="text-xl font-semibold mb-2">Intl API (Built-in)</h2>
					<ul className="text-xs text-muted-foreground mb-3 space-y-1">
						<li>• Source: JavaScript runtime's built-in database</li>
						<li>• Updates: Tied to Node.js version updates</li>
						<li>• Coverage: Only timezones supported by runtime</li>
						<li>• Performance: Instant (no network call)</li>
						<li>• Includes canonical zones + common aliases</li>
					</ul>
					<p className="text-sm text-muted-foreground mb-4">
						Total: {timezonesIntl.length} timezones
						{tableIntl.getFilteredRowModel().rows.length !==
							timezonesIntl.length && (
							<span>
								{" "}
								| Filtered:{" "}
								{tableIntl.getFilteredRowModel().rows.length}
							</span>
						)}
					</p>
					<DataTable
							table={tableIntl}
							cellClassName={(_col, row) =>
								!ianaIds.has((row.original as Timezone).id)
									? "bg-yellow-50 dark:bg-yellow-950/30"
									: ""
							}
						/>
					<Pagination table={tableIntl} totalItems={timezonesIntl.length} />
				</div>

				{/* Right: IANA Official */}
				<div>
					<h2 className="text-xl font-semibold mb-2">IANA Official Data</h2>
					<ul className="text-xs text-muted-foreground mb-3 space-y-1">
						<li>• Source: Official IANA tzdata repository</li>
						<li>• Updates: Real-time from authoritative source</li>
						<li>• Coverage: All canonical zones (inhabited since 1970)</li>
						<li>• Performance: Requires network fetch</li>
						<li>• Only canonical zones (no aliases)</li>
					</ul>
					<p className="text-sm text-muted-foreground mb-4">
						Total: {timezonesIANA.length} timezones
						{tableIANA.getFilteredRowModel().rows.length !==
							timezonesIANA.length && (
							<span>
								{" "}
								| Filtered:{" "}
								{tableIANA.getFilteredRowModel().rows.length}
							</span>
						)}
					</p>
					<DataTable
							table={tableIANA}
							cellClassName={(_col, row) =>
								!intlIds.has((row.original as Timezone).id)
									? "bg-yellow-50 dark:bg-yellow-950/30"
									: ""
							}
						/>
					<Pagination table={tableIANA} totalItems={timezonesIANA.length} />
				</div>
			</div>
		</div>
	)
}
