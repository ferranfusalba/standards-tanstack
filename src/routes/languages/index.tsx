import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { ColumnVisibility } from "@/components/ColumnVisibility";
import { DataTable } from "@/components/DataTable";
import { LocaleSelect } from "@/components/LocaleSelect";
import { Pagination } from "@/components/Pagination";
import { getRegionNameLocales } from "@/data/countries";
import {
	getLanguageNamesByLocale,
	getLanguages,
	type Language,
} from "@/data/languages";
import { getDetectedLocales, getPreferredLocale } from "@/data/locale";
import { fuzzyFilterAcronym } from "@/lib/fuzzy-filter";
import { asNumber, asString } from "@/lib/url-state";
import {
	useGlobalFilterSync,
	useTableUrlState,
} from "@/lib/use-table-url-state";

interface LanguagesSearch {
	q?: string;
	sort?: string;
	page?: number;
	size?: number;
	locale?: string;
}

export const Route = createFileRoute("/languages/")({
	component: Languages,
	validateSearch: (search: Record<string, unknown>): LanguagesSearch => ({
		q: asString(search.q),
		sort: asString(search.sort),
		page: asNumber(search.page),
		size: asNumber(search.size),
		locale: asString(search.locale),
	}),
	loaderDeps: ({ search }) => ({ locale: search.locale }),
	loader: async ({ deps }) => {
		// No explicit picker choice → fall back to the visitor's detected locale.
		const displayLocale = deps.locale ?? (await getPreferredLocale());
		const [languages, localeOptions, localizedNames, detectedLocales] =
			await Promise.all([
				getLanguages(),
				getRegionNameLocales(),
				getLanguageNamesByLocale({ data: { locale: displayLocale } }),
				getDetectedLocales(),
			]);
		// Localized name comes server-side (single CLDR source), matching countries.
		const languagesLocalized = languages.map((l) => ({
			...l,
			localizedName: localizedNames[l.code],
		}));
		return {
			languages: languagesLocalized,
			displayLocale,
			localeOptions,
			detectedLocales,
		};
	},
	head: () => ({
		meta: [
			{
				title: "Languages | Standards",
			},
			{
				name: "description",
				content:
					"ISO 639-1 language codes, native names, BCP 47 variants, and Unicode CLDR locale data. Browse 184 languages with localized names via Intl.DisplayNames.",
			},
		],
	}),
});

function LanguageExpandedRow({ row }: { row: Row<Language> }) {
	return (
		<tr className="bg-accent/50">
			{/* Code column - empty */}
			<td className="px-4 py-3" />
			{/* Name column - empty */}
			<td className="px-4 py-3" />
			{/* Native Name column - empty */}
			<td className="px-4 py-3" />
			{/* Localized Name column - empty */}
			<td className="px-4 py-3" />

			{/* BCP 47 Variants column */}
			<td className="px-4 py-3">
				<div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
					{row.original.bcp47Variants?.length ? (
						row.original.bcp47Variants.map((variant) => (
							<span
								key={variant}
								className="px-2 py-1 bg-blue-700 text-white rounded text-xs whitespace-nowrap"
							>
								{variant}
							</span>
						))
					) : (
						<span className="text-xs text-muted-foreground">
							No official variants
						</span>
					)}
				</div>
			</td>

			{/* CLDR column */}
			<td className="px-4 py-3">
				<div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
					{row.original.cldrVariants?.length ? (
						row.original.cldrVariants.map((variant) => (
							<span
								key={variant}
								className="px-2 py-1 bg-purple-700 text-white rounded text-xs whitespace-nowrap"
							>
								{variant}
							</span>
						))
					) : (
						<span className="text-xs text-muted-foreground">No CLDR data</span>
					)}
				</div>
			</td>

			{/* Intl Supported column */}
			<td className="px-4 py-3">
				<div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
					{row.original.intlVariants?.length ? (
						row.original.intlVariants.map((variant) => (
							<span
								key={variant}
								className="px-2 py-1 bg-green-700 text-white rounded text-xs whitespace-nowrap"
							>
								{variant}
							</span>
						))
					) : (
						<span className="text-xs text-muted-foreground">
							No Intl support
						</span>
					)}
				</div>
			</td>

			{/* Expander column - empty */}
			<td className="px-4 py-3" />
		</tr>
	);
}

function Languages() {
	const { languages, displayLocale, localeOptions, detectedLocales } =
		Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	// `displayLocale` comes resolved from the loader (URL value, else detected),
	// and each row's `localizedName` is already server-computed from one CLDR source.
	const setDisplayLocale = (next: string) => {
		navigate({
			search: (prev) => ({ ...prev, locale: next }),
			replace: true,
		});
	};
	const [globalFilter, setGlobalFilter] = useGlobalFilterSync({
		search,
		navigate,
	});
	const tableUrl = useTableUrlState({ prefix: "", search, navigate });

	const columns = React.useMemo<ColumnDef<Language>[]>(
		() => [
			{
				accessorKey: "code",
				header: "Code",
				size: 50,
				maxSize: 50,
				enableHiding: false,
			},
			{
				accessorKey: "name",
				header: "Name",
				size: 150,
				enableHiding: false,
			},
			{
				accessorKey: "nativeName",
				header: "Native Name",
				size: 150,
			},
			{
				accessorKey: "localizedName",
				header: "Localized Name",
				size: 150,
			},
			{
				accessorKey: "bcp47Variants",
				header: "BCP 47 Variants",
				cell: (info) => {
					const variants = info.getValue<string[] | undefined>();
					return variants ? (
						<span className="text-xs">
							{variants.length} variant{variants.length > 1 ? "s" : ""}
						</span>
					) : (
						<span className="text-muted-foreground">-</span>
					);
				},
				size: 120,
			},
			{
				accessorKey: "cldrVariants",
				header: "CLDR",
				cell: (info) => {
					const variants = info.getValue<string[] | undefined>();
					return variants ? (
						<span className="text-xs">
							{variants.length} variant{variants.length > 1 ? "s" : ""}
						</span>
					) : (
						<span className="text-muted-foreground">-</span>
					);
				},
				size: 100,
			},
			{
				accessorKey: "intlVariants",
				header: "Intl Supported",
				cell: (info) => {
					const variants = info.getValue<string[] | undefined>();
					return variants ? (
						<span className="text-xs">
							{variants.length} variant{variants.length > 1 ? "s" : ""}
						</span>
					) : (
						<span className="text-muted-foreground">-</span>
					);
				},
				size: 120,
			},
			{
				id: "expander",
				header: () => null,
				cell: ({ row, table: t }) => {
					const variantColsVisible =
						t.getColumn("bcp47Variants")?.getIsVisible() ||
						t.getColumn("cldrVariants")?.getIsVisible() ||
						t.getColumn("intlVariants")?.getIsVisible();
					const hasVariants =
						variantColsVisible &&
						row.original.cldrVariants &&
						row.original.cldrVariants.length > 0;
					return hasVariants ? (
						<button
							onClick={(e) => {
								e.stopPropagation();
								row.toggleExpanded();
							}}
							className="cursor-pointer hover:bg-accent px-2 py-1 rounded"
							type="button"
						>
							{row.getIsExpanded() ? "\u25B2" : "\u25BC"}
						</button>
					) : null;
				},
				size: 40,
				maxSize: 40,
				enableHiding: false,
			},
		],
		[],
	);

	const table = useReactTable({
		data: languages,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getRowCanExpand: (row) => {
			return !!(
				row.original.cldrVariants && row.original.cldrVariants.length > 0
			);
		},
		globalFilterFn: "fuzzy",
		state: {
			globalFilter,
			sorting: tableUrl.sorting,
			pagination: tableUrl.pagination,
		},
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: tableUrl.onSortingChange,
		onPaginationChange: tableUrl.onPaginationChange,
		filterFns: {
			fuzzy: fuzzyFilterAcronym,
		},
	});

	return (
		<div className="min-h-screen p-6">
			<h1 className="text-3xl font-bold mb-6" data-view-title="Languages">
				Languages
			</h1>
			<input
				type="text"
				value={globalFilter}
				onChange={(e) => setGlobalFilter(e.target.value)}
				placeholder="Search by name or code…"
				aria-label="Search languages"
				className="w-full px-3 py-2 mb-6 bg-secondary border border-border rounded text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-ring"
			/>

			<div className="grid grid-cols-1 gap-6">
				<div>
					<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-4">
						<h2 className="text-xl font-semibold">ISO 639-1 Language Codes</h2>
						<div className="flex items-center gap-2">
							<LocaleSelect
								id="displayLocale"
								value={displayLocale}
								onChange={setDisplayLocale}
								options={localeOptions}
								detectedLocales={detectedLocales}
							/>
							<ColumnVisibility table={table} />
						</div>
					</div>
					<ul className="text-xs text-muted-foreground mb-3 space-y-1">
						<li>• Source: IANA Language Subtag Registry + Unicode CLDR 48</li>
						<li>• Standard: ISO 639-1 (2-letter codes)</li>
						<li>• Coverage: 184 major languages</li>
						<li>
							• Native names & Localized names: Generated via Intl.DisplayNames
							(use dropdown to change display language)
						</li>
						<li>
							•{" "}
							<strong className="text-blue-600 dark:text-blue-400">
								BCP 47 Variants
							</strong>
							: Official dialect/orthography variants from IANA
						</li>
						<li>
							•{" "}
							<strong className="text-purple-600 dark:text-purple-400">
								CLDR
							</strong>
							: All locale data from Unicode (includes regions, scripts,
							variants)
						</li>
						<li>
							•{" "}
							<strong className="text-green-600 dark:text-green-400">
								Intl
							</strong>
							: What your JavaScript runtime actually supports
						</li>
					</ul>
					<p className="text-sm text-muted-foreground mb-4">
						Total: {languages.length} languages
					</p>
					<DataTable
						table={table}
						renderExpandedRow={(row) => <LanguageExpandedRow row={row} />}
					/>
					<Pagination table={table} totalItems={languages.length} />
				</div>
			</div>
		</div>
	);
}
