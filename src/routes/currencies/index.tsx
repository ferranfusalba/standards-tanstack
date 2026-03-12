import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { ColumnVisibility } from "@/components/ColumnVisibility";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { type Currency, getCurrencies } from "@/data/currencies";
import { fuzzyFilter } from "@/lib/fuzzy-filter";

export const Route = createFileRoute("/currencies/")({
	component: Currencies,
	loader: async () => {
		const currencies = await getCurrencies();
		return { currencies };
	},
	head: () => ({
		meta: [
			{
				title: "Currencies | Standards",
			},
			{
				name: "description",
				content:
					"ISO 4217 currency codes, symbols, numeric codes, and minor units. Browse active currencies worldwide from the SIX Group List One.",
			},
		],
	}),
});

function Currencies() {
	const { currencies } = Route.useLoaderData();
	const [globalFilter, setGlobalFilter] = React.useState("");

	const columns = React.useMemo<ColumnDef<Currency>[]>(
		() => [
			{
				accessorKey: "code",
				header: "Code",
				size: 80,
				maxSize: 80,
				enableHiding: false,
			},
			{
				accessorKey: "symbolUnicode",
				header: "Symbol (Unicode)",
			},
			{
				accessorKey: "symbolIntl",
				header: "Symbol (Intl)",
			},
			{
				accessorKey: "numericCode",
				header: "Numeric Code",
			},
			{
				accessorKey: "type",
				header: "Type",
			},
			{
				accessorKey: "name",
				header: "Name",
				enableHiding: false,
			},
			{
				accessorKey: "minorUnit",
				header: "Minor Unit",
			},
			{
				accessorKey: "countries",
				header: "Countries",
				cell: (info) => info.getValue<string[]>()?.join(", ") || "-",
			},
			{
				accessorKey: "status",
				header: "Status",
			},
			{
				accessorKey: "introducedDate",
				header: "Introduced",
			},
			{
				accessorKey: "withdrawnDate",
				header: "Withdrawn",
			},
			{
				accessorKey: "namePlural",
				header: "Plural Name",
			},
			{
				accessorKey: "definitions",
				header: "Definitions of the fund types",
			},
		],
		[],
	);

	const table = useReactTable({
		data: currencies,
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
	});

	return (
		<div className="min-h-screen p-6">
			<h1 className="text-3xl font-bold mb-6">Currencies</h1>
			<input
				type="text"
				value={globalFilter}
				onChange={(e) => setGlobalFilter(e.target.value)}
				placeholder="Search by name, code or symbol…"
				aria-label="Search currencies"
				className="w-full px-3 py-2 mb-6 bg-secondary border border-border rounded text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-ring"
			/>

			<div>
				<div className="flex items-center justify-between mb-2">
					<h2 className="text-xl font-semibold">
						ISO 4217 (SIX Group List One)
					</h2>
					<ColumnVisibility table={table} />
				</div>
				<ul className="text-xs text-muted-foreground mb-3 space-y-1">
					<li>• Source: SIX Group on behalf of ISO</li>
					<li>• Standard: ISO 4217 currency codes</li>
					<li>• Includes: Alphabetic codes, numeric codes, minor units</li>
					<li>• Coverage: Active currencies worldwide</li>
				</ul>
				<p className="text-sm text-muted-foreground mb-4">
					Total: {currencies.length} currencies
				</p>
				<DataTable table={table} />
				<Pagination table={table} totalItems={currencies.length} />
			</div>
		</div>
	);
}
