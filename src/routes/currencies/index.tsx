import { createFileRoute, Link } from "@tanstack/react-router";
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
import { ExportButtons } from "@/components/ExportButtons";
import { Pagination } from "@/components/Pagination";
import {
	type Currency,
	getCurrencies,
	getHistoricalCurrencies,
	type HistoricalCurrency,
} from "@/data/currencies";
import { fuzzyFilter } from "@/lib/fuzzy-filter";
import { asNumber, asString } from "@/lib/url-state";
import {
	useGlobalFilterSync,
	useTableUrlState,
} from "@/lib/use-table-url-state";

interface CurrenciesSearch {
	highlight?: string;
	q?: string;
	intl_sort?: string;
	intl_page?: number;
	intl_size?: number;
	hist_sort?: string;
	hist_page?: number;
	hist_size?: number;
}

export const Route = createFileRoute("/currencies/")({
	component: Currencies,
	validateSearch: (search: Record<string, unknown>): CurrenciesSearch => ({
		highlight: asString(search.highlight),
		q: asString(search.q),
		intl_sort: asString(search.intl_sort),
		intl_page: asNumber(search.intl_page),
		intl_size: asNumber(search.intl_size),
		hist_sort: asString(search.hist_sort),
		hist_page: asNumber(search.hist_page),
		hist_size: asNumber(search.hist_size),
	}),
	loader: async () => {
		const [currencies, historicalCurrencies] = await Promise.all([
			getCurrencies(),
			getHistoricalCurrencies(),
		]);
		return { currencies, historicalCurrencies };
	},
	head: () => ({
		meta: [
			{
				title: "Currencies | Standards",
			},
			{
				name: "description",
				content:
					"ISO 4217 currency codes, symbols, numeric codes, and minor units. Browse active and historical currencies worldwide from the SIX Group.",
			},
		],
	}),
});

function Currencies() {
	const { currencies, historicalCurrencies } = Route.useLoaderData();
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
	});
	const histUrl = useTableUrlState({
		prefix: "hist",
		search,
		navigate,
	});

	const columns = React.useMemo<ColumnDef<Currency>[]>(
		() => [
			{
				accessorKey: "code",
				header: "Code",
				size: 60,
				maxSize: 60,
				enableHiding: false,
			},
			{
				accessorKey: "symbolUnicode",
				header: "Symbol (Unicode)",
				size: 60,
				maxSize: 60,
			},
			{
				accessorKey: "symbolIntl",
				header: "Symbol (Intl)",
				size: 60,
				maxSize: 60,
			},
			{
				accessorKey: "numericCode",
				header: "Numeric Code",
				size: 60,
				maxSize: 60,
			},
			{
				accessorKey: "type",
				header: "Type",
				size: 60,
				maxSize: 60,
			},
			{
				accessorKey: "name",
				header: "Name",
				enableHiding: false,
				size: 150,
				maxSize: 150,
			},
			{
				accessorKey: "minorUnit",
				header: "Minor Unit",
				size: 60,
				maxSize: 60,
			},
			{
				accessorKey: "countries",
				header: "Countries",
				size: 150,
				maxSize: 150,
				cell: (info) => {
					const codes = info.getValue<string[]>();
					if (!codes?.length) return "-";
					return (
						<span className="flex flex-wrap gap-1">
							{codes.map((code) => (
								<Link
									key={code}
									to="/countries"
									search={{ highlight: code, expandCcy: true }}
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
			},
			{
				accessorKey: "definitions",
				header: "Definitions of the fund types",
				size: 300,
				maxSize: 300,
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
		state: {
			globalFilter,
			sorting: intlUrl.sorting,
			pagination: intlUrl.pagination,
		},
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: intlUrl.onSortingChange,
		onPaginationChange: intlUrl.onPaginationChange,
		filterFns: {
			fuzzy: fuzzyFilter,
		},
	});

	const historicalColumns = React.useMemo<ColumnDef<HistoricalCurrency>[]>(
		() => [
			{
				accessorKey: "code",
				header: "Alphabetic Code",
				size: 80,
				maxSize: 80,
				enableHiding: false,
			},
			{
				accessorKey: "numericCode",
				header: "Numeric Code",
				size: 80,
				maxSize: 80,
			},
			{
				accessorKey: "name",
				header: "Historic currency",
				enableHiding: false,
				size: 200,
				maxSize: 200,
			},
			{
				accessorKey: "country",
				header: "Entity",
				size: 200,
				maxSize: 200,
				cell: (info) => {
					const row = info.row.original;
					if (row.countryCode) {
						return (
							<span className="flex items-center gap-1.5">
								<Link
									to="/countries"
									search={{ highlight: row.countryCode }}
									title={row.countryCode}
									className="cursor-pointer hover:opacity-70 transition-opacity"
								>
									{row.countryCode
										.toUpperCase()
										.split("")
										.map((c) =>
											String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65),
										)
										.join("")}
								</Link>
								<span className="text-muted-foreground">{row.country}</span>
							</span>
						);
					}
					return <span className="text-muted-foreground">{row.country}</span>;
				},
			},
			{
				accessorKey: "withdrawalDate",
				header: "Withdrawal Date",
				size: 120,
				maxSize: 120,
			},
			{
				accessorKey: "isFund",
				header: "Funds",
				size: 60,
				maxSize: 60,
				cell: (info) =>
					info.getValue() ? (
						<span className="text-xs text-muted-foreground">WAHR</span>
					) : null,
			},
		],
		[],
	);

	const historicalTable = useReactTable({
		data: historicalCurrencies,
		columns: historicalColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		globalFilterFn: "fuzzy",
		state: {
			globalFilter,
			sorting: histUrl.sorting,
			pagination: histUrl.pagination,
		},
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: histUrl.onSortingChange,
		onPaginationChange: histUrl.onPaginationChange,
		filterFns: {
			fuzzy: fuzzyFilter,
		},
	});

	// Navigate to the correct page and scroll to highlighted currency
	React.useEffect(() => {
		if (!highlight) return;
		// Try active table first, then historical
		const activeRows = table.getFilteredRowModel().rows;
		const activeIdx = activeRows.findIndex(
			(r) => r.original.code === highlight,
		);
		if (activeIdx >= 0) {
			const pageSize = table.getState().pagination.pageSize;
			table.setPageIndex(Math.floor(activeIdx / pageSize));
		} else {
			const histRows = historicalTable.getFilteredRowModel().rows;
			const histIdx = histRows.findIndex((r) => r.original.code === highlight);
			if (histIdx >= 0) {
				const pageSize = historicalTable.getState().pagination.pageSize;
				historicalTable.setPageIndex(Math.floor(histIdx / pageSize));
			}
		}
		const timer = setTimeout(() => {
			const el = document.querySelector(".bg-blue-100");
			if (el) {
				el.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}, 100);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="min-h-screen p-6">
			<h1 className="text-3xl font-bold mb-6" data-view-title="Currencies">Currencies</h1>
			<input
				type="text"
				value={globalFilter}
				onChange={(e) => setGlobalFilter(e.target.value)}
				placeholder="Search by name, code or symbol…"
				aria-label="Search currencies"
				className="w-full px-3 py-2 mb-6 bg-secondary border border-border rounded text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-ring"
			/>

			<div className="grid gap-8">
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
					<div className="flex items-center justify-between mb-4">
						<p className="text-sm text-muted-foreground">
							Total: {currencies.length} currencies
						</p>
						<ExportButtons table={table} filename="currencies" />
					</div>
					<DataTable
						table={table}
						cellClassName={(_col, row) =>
							highlight === row.original.code
								? "bg-blue-100 dark:bg-blue-950"
								: ""
						}
					/>
					<Pagination table={table} totalItems={currencies.length} />
				</div>

				<div>
					<div className="flex items-center justify-between mb-2">
						<h2 className="text-xl font-semibold">
							ISO 4217 (SIX Group List Three — Historical)
						</h2>
						<ColumnVisibility table={historicalTable} />
					</div>
					<ul className="text-xs text-muted-foreground mb-3 space-y-1">
						<li>• Source: SIX Group on behalf of ISO</li>
						<li>• Standard: ISO 4217 historical currency codes</li>
						<li>
							• Includes: Withdrawn alphabetic codes with withdrawal dates
						</li>
						<li>• Coverage: Currencies no longer in active use</li>
					</ul>
					<div className="flex items-center justify-between mb-4">
						<p className="text-sm text-muted-foreground">
							Total: {historicalCurrencies.length} historical currencies
						</p>
						<ExportButtons
							table={historicalTable}
							filename="currencies-historical"
						/>
					</div>
					<DataTable
						table={historicalTable}
						cellClassName={(_col, row) =>
							highlight === row.original.code
								? "bg-blue-100 dark:bg-blue-950"
								: ""
						}
					/>
					<Pagination
						table={historicalTable}
						totalItems={historicalCurrencies.length}
					/>
				</div>
			</div>
		</div>
	);
}
