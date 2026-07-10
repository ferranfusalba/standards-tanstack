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
import { Pagination } from "@/components/Pagination";
import {
	getLanguageNamesByLocale,
	getLanguages,
	type Language,
} from "@/data/languages";
import { getPreferredLocale } from "@/data/locale";
import { fuzzyFilterAcronym } from "@/lib/fuzzy-filter";
import { useLocale } from "@/lib/locale";
import { asNumber, asString } from "@/lib/url-state";
import {
	useDeepLinkPage,
	useGlobalFilterSync,
	useTableUrlState,
} from "@/lib/use-table-url-state";

interface LanguagesSearch {
	q?: string | undefined;
	sort?: string | undefined;
	page?: number | undefined;
	size?: number | undefined;
	highlight?: string | undefined; // deep-link a language row (by 639-1 or 639-3 code), e.g. from the countries view
}

export const Route = createFileRoute("/languages/")({
	component: Languages,
	validateSearch: (search: Record<string, unknown>): LanguagesSearch => ({
		q: asString(search.q),
		sort: asString(search.sort),
		page: asNumber(search.page),
		size: asNumber(search.size),
		highlight: asString(search.highlight),
	}),
	loader: async () => {
		// The global locale picker lives in the header (localStorage-backed), so we
		// SSR names in the visitor's detected locale; the component swaps in the
		// stored locale's name map on mount, matching the countries view.
		const displayLocale = await getPreferredLocale();
		const [languages, localizedNames] = await Promise.all([
			getLanguages(),
			getLanguageNamesByLocale({ data: { locale: displayLocale } }),
		]);
		return { languages, localizedNames, displayLocale };
	},
	head: () => ({
		meta: [
			{
				title: "Languages | Standards",
			},
			{
				name: "description",
				content:
					"ISO 639 language codes (639-1 and 639-3), native names, BCP 47 variants, and Unicode CLDR locale data. Browse 247 languages with localized names via Intl.DisplayNames.",
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
	const {
		languages,
		localizedNames: initialLocalizedNames,
		displayLocale: initialLocale,
	} = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	// Display locale is the app-wide choice from the header picker (shared with the
	// countries view, persisted in localStorage). Each row's localized name comes
	// server-side (single CLDR source): seeded from the loader for the detected
	// locale, then refetched when the chosen locale changes.
	const { locale } = useLocale();
	const [localizedNames, setLocalizedNames] = React.useState(
		initialLocalizedNames,
	);
	const loadedLocale = React.useRef(initialLocale);
	React.useEffect(() => {
		if (locale === loadedLocale.current) return;
		let cancelled = false;
		getLanguageNamesByLocale({ data: { locale } }).then((map) => {
			if (!cancelled) {
				setLocalizedNames(map);
				loadedLocale.current = locale;
			}
		});
		return () => {
			cancelled = true;
		};
	}, [locale]);
	const languagesLocalized = React.useMemo(
		() =>
			languages.map((l) => ({
				...l,
				localizedName: localizedNames[l.code],
			})),
		[languages, localizedNames],
	);
	const [globalFilter, setGlobalFilter] = useGlobalFilterSync({
		search,
		navigate,
	});
	const tableUrl = useTableUrlState({ prefix: "", search, navigate });
	// Deep link (e.g. from countries): open the table on the page holding the
	// highlighted language (matched by 639-1 or, for 639-3-only entries, 639-3).
	// Derived state, so the page jump survives the URL round-trip.
	const deepLinkIndex = React.useMemo(
		() =>
			search.highlight != null && search.page == null && !globalFilter
				? languagesLocalized.findIndex(
						(l) =>
							l.code === search.highlight || l.iso639_3 === search.highlight,
					)
				: -1,
		[search.highlight, search.page, languagesLocalized, globalFilter],
	);
	const tableState = useDeepLinkPage(tableUrl, deepLinkIndex);

	const columns = React.useMemo<ColumnDef<Language>[]>(
		() => [
			{
				accessorKey: "code",
				header: "639-1",
				size: 60,
				maxSize: 60,
				enableHiding: false,
				cell: (info) =>
					info.getValue<string>() || (
						<span className="text-muted-foreground">-</span>
					),
			},
			{
				accessorKey: "iso639_3",
				header: "639-3",
				size: 60,
				maxSize: 60,
				cell: (info) =>
					info.getValue<string | undefined>() ?? (
						<span className="text-muted-foreground">-</span>
					),
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
		data: languagesLocalized,
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
		// autoReset off only while a deep-link override forces a page, so a
		// mount-time row-model recompute can't snap us back to page 1. Restored to
		// default once the override yields. See countries route for the full note.
		...(tableState !== tableUrl && { autoResetPageIndex: false }),
		globalFilterFn: "fuzzy",
		state: {
			globalFilter,
			sorting: tableUrl.sorting,
			pagination: tableState.pagination,
		},
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: tableUrl.onSortingChange,
		onPaginationChange: tableState.onPaginationChange,
		filterFns: {
			fuzzy: fuzzyFilterAcronym,
		},
	});

	// Deep-link (e.g. from the countries view): the highlighted language's page is
	// handled declaratively (see tableState); here we just scroll it into view.
	const highlight = search.highlight;
	// biome-ignore lint/correctness/useExhaustiveDependencies: highlight applies once on mount; re-running would fight the user's paging
	React.useEffect(() => {
		if (!highlight) return;
		const timer = setTimeout(() => {
			document
				.querySelector(".bg-blue-100")
				?.scrollIntoView({ behavior: "smooth", block: "center" });
		}, 100);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div className="p-6">
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
						<h2 className="text-xl font-semibold">ISO 639 Language Codes</h2>
						<ColumnVisibility table={table} />
					</div>
					<ul className="text-xs text-muted-foreground mb-3 space-y-1">
						<li>• Source: IANA Language Subtag Registry + Unicode CLDR 48</li>
						<li>• Standard: ISO 639-1 (2-letter) + ISO 639-3 (3-letter)</li>
						<li>
							• Coverage: 184 ISO 639-1 languages + 63 that are official
							somewhere but have no 639-1 code (e.g. Swiss German, Filipino)
						</li>
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
						cellClassName={(_colId, row) =>
							highlight &&
							(row.original.code === highlight ||
								row.original.iso639_3 === highlight)
								? "bg-blue-100 dark:bg-blue-950"
								: ""
						}
						renderExpandedRow={(row) => <LanguageExpandedRow row={row} />}
					/>
					<Pagination table={table} totalItems={languages.length} />
				</div>
			</div>
		</div>
	);
}
