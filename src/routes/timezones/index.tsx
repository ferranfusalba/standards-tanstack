import React from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import type { ColumnDef } from "@tanstack/react-table"
import {
	getTimezonesFromIntl,
	getTimezonesFromIANA,
	type Timezone,
} from "@/data/timezones"
import { fuzzyFilter } from "@/lib/fuzzy-filter"
import { DataTable } from "@/components/DataTable"
import { Pagination } from "@/components/Pagination"
import { ColumnVisibility } from "@/components/ColumnVisibility"

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
		state: { globalFilter },
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
		state: { globalFilter },
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
					<p className="text-sm text-muted-foreground mb-4">
						Total: {timezonesIntl.length} timezones
					</p>
					<DataTable table={tableIntl} />
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
					<p className="text-sm text-muted-foreground mb-4">
						Total: {timezonesIANA.length} timezones
					</p>
					<DataTable table={tableIANA} />
					<Pagination table={tableIANA} totalItems={timezonesIANA.length} />
				</div>
			</div>
		</div>
	)
}
