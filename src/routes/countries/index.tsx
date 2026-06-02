import { createFileRoute, Link } from "@tanstack/react-router";
import type { CellContext, ColumnDef, SortingFn } from "@tanstack/react-table";
import {
	getCoreRowModel,
	getExpandedRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	Coins,
	Info,
	Map as MapIcon,
	SquareArrowOutUpRight,
} from "lucide-react";
import React from "react";
import { ColumnVisibility } from "@/components/ColumnVisibility";
import { DataTable } from "@/components/DataTable";
import { ExportButtons } from "@/components/ExportButtons";
import { Pagination } from "@/components/Pagination";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	type Country,
	getCountries,
	getCountriesFromUN,
	getCountryNames,
	getCountryNamesByLocale,
	getLocalizedNameCountsByCountry,
	getLocalizedNamesAllByCountry,
	getLocalizedSearchByCountry,
	getMissingCountries,
	getSubdivisions,
	getSubdivisionsByCountry,
	type LocalizedName,
	type SubdivisionData,
} from "@/data/countries";
import {
	type CountryCurrency,
	getCurrenciesByCountry,
	getHistoricalCurrenciesByCountry,
	type HistoricalCountryCurrency,
} from "@/data/currencies";
import { getPreferredLocale } from "@/data/locale";
import { type CountryTimezone, getTimezonesByCountry } from "@/data/timezones";
import { fuzzyFilter } from "@/lib/fuzzy-filter";
import { useLocale } from "@/lib/locale";
import { localizedNameDiffers } from "@/lib/localized-names";
import { collapseSharedPhoneCodes } from "@/lib/phone-codes";
import { facetedFilter, presenceFilter } from "@/lib/table-filters";
import { asNumber, asString } from "@/lib/url-state";
import {
	useGlobalFilterSync,
	useTableUrlState,
} from "@/lib/use-table-url-state";

type ExpandSection = "subdivisions" | "timezones" | "currencies" | "names";

interface CountriesSearch {
	highlight?: string;
	expandTz?: boolean;
	expandCcy?: boolean;
	q?: string;
	size?: number;
	un_sort?: string;
	un_page?: number;
	un_f?: string;
	missing_sort?: string;
	missing_page?: number;
}

export const Route = createFileRoute("/countries/")({
	component: Countries,
	validateSearch: (search: Record<string, unknown>): CountriesSearch => ({
		highlight: asString(search.highlight),
		expandTz:
			search.expandTz === true || search.expandTz === "true" || undefined,
		expandCcy:
			search.expandCcy === true || search.expandCcy === "true" || undefined,
		q: asString(search.q),
		size: asNumber(search.size),
		un_sort: asString(search.un_sort),
		un_page: asNumber(search.un_page),
		un_f: asString(search.un_f),
		missing_sort: asString(search.missing_sort),
		missing_page: asNumber(search.missing_page),
	}),
	// The global locale picker lives in the header (localStorage-backed), so it's
	// not in the URL and can't drive the loader. We SSR names in the visitor's
	// detected locale; the component swaps in the stored locale's (small) name map
	// on mount without re-running this whole heavy loader.
	loader: async () => {
		const nameLocale = await getPreferredLocale();
		const [
			countriesIntl,
			countriesUN,
			countriesMissing,
			timezoneMap,
			currencyMap,
			historicalCurrencyMap,
			subdivisionMap,
			localizedNameCounts,
			localizedNames,
			localizedSearch,
		] = await Promise.all([
			getCountries(),
			getCountriesFromUN(),
			getMissingCountries(),
			getTimezonesByCountry(),
			getCurrenciesByCountry(),
			getHistoricalCurrenciesByCountry(),
			getSubdivisionsByCountry(),
			getLocalizedNameCountsByCountry(),
			getCountryNamesByLocale({ data: { locale: nameLocale } }),
			getLocalizedSearchByCountry(),
		]);
		// Locale-independent enrichments (counts). The picked-locale name and the
		// search blob are applied in the component so the loader needn't re-run.
		// English CLDR name per code (from Intl.DisplayNames), kept only to flag
		// where the runtime's name diverges from the official ISO/UN name.
		const cldrNameByCode: Record<string, string> = {};
		for (const c of countriesIntl) {
			cldrNameByCode[c.alpha2Code] = c.name;
		}
		const countriesUNWithTz = countriesUN.map((c) => ({
			...c,
			timezoneCount: timezoneMap[c.alpha2Code]?.length ?? 0,
			currencyCount: currencyMap[c.alpha2Code]?.length ?? 0,
			localizedNameCount: localizedNameCounts[c.alpha2Code] ?? 0,
			cldrName: cldrNameByCode[c.alpha2Code],
		}));
		return {
			countriesUN: countriesUNWithTz,
			countriesMissing,
			timezoneMap,
			currencyMap,
			historicalCurrencyMap,
			subdivisionMap,
			nameLocale,
			localizedNames,
			localizedSearch,
		};
	},
	head: () => ({
		meta: [
			{
				title: "Countries | Standards",
			},
			{
				name: "description",
				content:
					"ISO 3166-1 country codes, UN M49 regions, ICAO passport codes, IOC Olympic codes, and ISO 3166-2 subdivisions, with runtime CLDR names flagged where they diverge from the official names.",
			},
		],
	}),
});

type Subdivision = NonNullable<Country["subdivisions"]>[number];

function toFlag(alpha2: string): string {
	return [...alpha2.toUpperCase()]
		.map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
		.join("");
}

// Normalize a country name for cross-table comparison (trim + case-insensitive)
function normalizeName(name: string): string {
	return name.trim().toLowerCase();
}

// Sort E.164 dialing codes by numeric value ("+7" < "+34" < "+212") rather than
// as strings, which would mis-order "+212" before "+30". Missing codes sort last.
const phonePrefixSortingFn: SortingFn<Country> = (rowA, rowB, columnId) => {
	const parse = (v: unknown) => {
		const n = Number.parseInt(String(v ?? "").replace(/\D/g, ""), 10);
		return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n;
	};
	return parse(rowA.getValue(columnId)) - parse(rowB.getValue(columnId));
};

// Inline code chip for the literal glyphs called out in the legend.
function Code({ children }: { children: React.ReactNode }) {
	return (
		<code className="font-mono rounded bg-secondary px-1 text-foreground">
			{children}
		</code>
	);
}

// One-line note describing what the "differs" cross-check ignores. Kept in sync
// with normalizeTypography above.
function NotCountedNote() {
	return (
		<span className="text-muted-foreground">
			Not counted: Unicode NFC (composed vs decomposed accents treated as equal
			— e.g. <Code>é</Code> as one codepoint vs <Code>e</Code> + combining
			accent); apostrophe-likes <Code>‘</Code> (U+2018), <Code>’</Code>{" "}
			(U+2019), <Code>ʼ</Code> (U+02BC) → ASCII <Code>{"'"}</Code>; curly double
			quotes <Code>“</Code> (U+201C), <Code>”</Code> (U+201D) → ASCII{" "}
			<Code>{'"'}</Code>
		</span>
	);
}

// Expanded-row shell. The cell spans the full (often wider-than-viewport) table,
// so its content is wrapped in a `sticky left-0` panel that stays pinned to the
// visible left edge during horizontal scroll — otherwise the left of the panel
// (e.g. the timezone Offset column) scrolls out of view. Same sticky mechanism
// as DataTable's pinned first column.
function ExpandedRow({
	colSpan,
	children,
}: {
	colSpan: number;
	children: React.ReactNode;
}) {
	return (
		<tr className="bg-accent/50">
			<td colSpan={colSpan} className="p-0">
				<div className="sticky left-0 w-fit px-6 py-3">{children}</div>
			</td>
		</tr>
	);
}

function SubdivisionsExpandedRow({
	subs,
	colSpan,
}: {
	subs: Subdivision[];
	colSpan: number;
}) {
	const langCodes = [...new Set(subs.flatMap((sub) => Object.keys(sub.names)))];
	const hasType = subs.some((sub) => sub.type !== undefined);
	return (
		<ExpandedRow colSpan={colSpan}>
			<table className="text-xs w-auto">
				<thead>
					<tr className="text-muted-foreground">
						<th className="pr-4 pb-1 text-left font-normal">Flag</th>
						<th className="pr-6 pb-1 text-left font-normal">Code</th>
						{hasType && (
							<th className="pr-6 pb-1 text-left font-normal">Type</th>
						)}
						{langCodes.map((lang) => (
							<th key={lang} className="pr-6 pb-1 text-left font-normal">
								{lang}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{subs.map((sub) => {
						const flag = sub.flag ?? (sub.iso1 ? toFlag(sub.iso1) : undefined);
						return (
							<tr key={sub.code}>
								<td className="pr-4 py-0.5">{flag ?? ""}</td>
								<td className="pr-6 py-0.5 font-mono">
									{sub.code}
									{sub.iso1 && (
										<span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded">
											{sub.iso1}
										</span>
									)}
								</td>
								{hasType && (
									<td className="pr-6 py-0.5 text-muted-foreground">
										{sub.type
											? Object.entries(sub.type)
													.map(([lang, name]) => `${name} (${lang})`)
													.join(", ")
											: ""}
									</td>
								)}
								{langCodes.map((lang) => (
									<td key={lang} className="pr-6 py-0.5">
										{sub.names[lang] ?? ""}
									</td>
								))}
							</tr>
						);
					})}
				</tbody>
			</table>
		</ExpandedRow>
	);
}

function LocalizedNamesExpandedRow({
	alpha2Code,
	colSpan,
}: {
	alpha2Code: string;
	colSpan: number;
}) {
	const [names, setNames] = React.useState<LocalizedName[] | null>(null);

	React.useEffect(() => {
		let cancelled = false;
		setNames(null);
		getCountryNames({ data: { code: alpha2Code } }).then((data) => {
			if (!cancelled) setNames(data);
		});
		return () => {
			cancelled = true;
		};
	}, [alpha2Code]);

	if (!names) {
		return (
			<ExpandedRow colSpan={colSpan}>
				<div className="text-sm text-muted-foreground">Loading names...</div>
			</ExpandedRow>
		);
	}

	// Lay out column-major (read top-to-bottom within a column) across 4 columns,
	// rendered as one table so code / language / value line up vertically.
	const COLUMNS = 4;
	const rowsPerCol = Math.ceil(names.length / COLUMNS);
	const grid = Array.from({ length: rowsPerCol }, (_, r) =>
		Array.from({ length: COLUMNS }, (_, c) => names[c * rowsPerCol + r]),
	);

	return (
		<ExpandedRow colSpan={colSpan}>
			<div className="text-xs font-semibold mb-2">
				Localized names ({names.length})
			</div>
			<table className="text-xs border-collapse">
				<tbody>
					{grid.map((cells) => {
						const real = cells.filter((n): n is LocalizedName => n != null);
						// Pad the ragged last row with one spanning cell so columns align.
						const padCols = (COLUMNS - real.length) * 3;
						return (
							<tr key={real[0].locale}>
								{real.map((n, c) => (
									<React.Fragment key={n.locale}>
										<td
											className={`py-0.5 pr-3 font-mono text-muted-foreground ${c > 0 ? "pl-16" : ""}`}
										>
											{n.locale}
										</td>
										<td className="py-0.5 pr-8 text-muted-foreground">
											{n.language}
										</td>
										<td className="py-0.5 pl-4 border-l border-border">
											{n.name}
										</td>
									</React.Fragment>
								))}
								{padCols > 0 && <td colSpan={padCols} />}
							</tr>
						);
					})}
				</tbody>
			</table>
		</ExpandedRow>
	);
}

function getCellHighlight(
	colId: string,
	original: Country,
	showCodeMismatch = true,
): string {
	if (
		showCodeMismatch &&
		colId === "icaoCode" &&
		original.icaoCode &&
		original.icaoCode !== original.alpha3Code
	)
		return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
	if (
		showCodeMismatch &&
		colId === "dsitCode" &&
		original.dsitCode &&
		original.dsitCode !== original.alpha2Code &&
		original.dsitCode !== original.alpha3Code
	)
		return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
	if (
		showCodeMismatch &&
		colId === "iocCode" &&
		original.iocCode &&
		original.iocCode !== original.alpha3Code
	)
		return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
	if (colId === "unMembership") {
		if (original.unMembership === "member")
			return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
		if (original.unMembership === "observer")
			return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
		if (original.unMembership === "non-member")
			return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
		if (original.sovereignState) return "bg-secondary text-muted-foreground";
	}
	if (colId === "independent") {
		if (original.independent === true)
			return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
		if (original.independent === false)
			return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
	}
	if (colId === "euMember" && original.euMember)
		return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
	return "";
}

const borderLeftCols = new Set(["icaoCode", "independent", "name"]);
function getColumnBorder(colId: string) {
	return borderLeftCols.has(colId) ? "border-l border-border" : "";
}

// Maps each count column to the section its toggle opens, so the cell that
// opened the active subrow can be painted — anchoring the expanded panel to the
// value it came from.
const sectionByColumn: Record<string, ExpandSection> = {
	subdivisionCount: "subdivisions",
	localizedNameCount: "names",
	timezoneCount: "timezones",
	currencyCount: "currencies",
};

// Data source (issuing standard / organization) for each column in the UN M49
// table, keyed by column id. Rendered as a second header row by <DataTable>.
// The column title above says *what* the value is; this says *where it comes from*
// — which is why the two ICAO columns are disambiguated by their document.
const countrySources: Record<string, string> = {
	flag: "Unicode",
	alpha2Code: "ISO 3166-1",
	alpha3Code: "ISO 3166-1",
	subdivisionCount: "ISO 3166-2",
	icaoCode: "ICAO · Doc 9303",
	dsitCode: "UNECE · DSIT",
	iocCode: "IOC",
	aircraftRegPrefixes: "ICAO · Annex 7",
	ccTLD: "IANA · Root Zone",
	phonePrefix: "ITU-T · E.164",
	independent: "ISO 3166-1",
	unMembership: "UN",
	euMember: "EU",
	region: "UN M49",
	name: "ISO 3166-1",
	cldrName: "Unicode CLDR",
	fullName: "ISO 3166-1",
	localizedName: "Unicode CLDR",
	localizedNameCount: "Unicode CLDR",
	timezoneCount: "IANA · tzdata",
	currencyCount: "ISO 4217",
};

// Authoritative reference per source label (from `countrySources`). `href` makes
// the label a link in the source header row; `note` adds an info-tooltip beside
// it. Keyed by label so a standard shared by several columns is defined once;
// labels not listed here stay plain text.
// Deliberately NOT linked: ICAO · Annex 7 (aircraft marks) — that document isn't
// officially/freely published online, so there's no canonical public URL to point
// at. Leave it as plain text.
const countrySourceMeta: Record<string, { href?: string; note?: string }> = {
	Unicode: {
		href: "https://unicode.org/emoji/charts/full-emoji-list.html#country-flag",
	},
	"ISO 3166-1": { href: "https://www.iso.org/obp/ui/#iso:pub:PUB500001:en" },
	"ISO 3166-2": { href: "https://www.iso.org/obp/ui/#iso:pub:PUB500001:en" },
	"ICAO · Doc 9303": {
		href: "https://www.icao.int/publications/doc-series/doc-9303",
		note: "Country codes are listed in Doc 9303 Part 3, page 21.",
	},
	"IANA · Root Zone": { href: "https://www.iana.org/domains/root/db" },
	"ITU-T · E.164": {
		href: "https://www.itu.int/dms_pub/itu-t/opb/sp/T-SP-E.164D-11-2011-PDF-E.pdf",
	},
	UN: { href: "https://www.un.org/en/about-us/member-states" },
	EU: {
		href: "https://european-union.europa.eu/principles-countries-history/eu-countries_en",
	},
	"UN M49": { href: "https://unstats.un.org/unsd/methodology/m49/" },
	IOC: { href: "https://www.olympics.com/ioc/national-olympic-committees" },
	"UNECE · DSIT": {
		href: "https://unece.org/DAM/trans/conventn/Distsigns.pdf",
	},
	"Unicode CLDR": {
		href: "https://cldr.unicode.org/translation/displaynames/countryregion-territory-names",
		note: "Resolved at runtime via Intl.DisplayNames.",
	},
};

function ExpandedCountryRow({
	alpha2Code,
	colSpan,
	timezones,
	currencies,
	historicalCurrencies,
	hasSubdivisions,
}: {
	alpha2Code: string;
	colSpan: number;
	timezones: CountryTimezone[];
	currencies: CountryCurrency[];
	historicalCurrencies: HistoricalCountryCurrency[];
	hasSubdivisions: boolean;
}) {
	const [subs, setSubs] = React.useState<SubdivisionData[] | null>(null);
	const [loading, setLoading] = React.useState(hasSubdivisions);

	React.useEffect(() => {
		if (!hasSubdivisions) return;
		let cancelled = false;
		setLoading(true);
		getSubdivisions({ data: { code: alpha2Code } }).then((data) => {
			if (!cancelled) {
				setSubs(data);
				setLoading(false);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [alpha2Code, hasSubdivisions]);

	const showTimezones = timezones.length > 0;
	const showCurrencies = currencies.length > 0;
	const showSubdivisions = subs && subs.length > 0;

	if (loading && !showTimezones && !showCurrencies) {
		return (
			<ExpandedRow colSpan={colSpan}>
				<div className="text-sm text-muted-foreground">Loading...</div>
			</ExpandedRow>
		);
	}

	if (!showTimezones && !showCurrencies && !showSubdivisions && !loading)
		return null;

	return (
		<>
			{showTimezones && (
				<ExpandedRow colSpan={colSpan}>
					<div className="text-xs font-semibold mb-2">
						Timezones ({timezones.length})
					</div>
					<table className="w-auto text-xs">
						<thead>
							<tr className="text-muted-foreground">
								<th className="text-left py-1 pr-4">Offset</th>
								<th className="text-left py-1 pr-4">ID</th>
								<th className="text-left py-1 pr-4">Name</th>
								<th className="text-left py-1">Comment</th>
							</tr>
						</thead>
						<tbody>
							{timezones.map((tz) => (
								<tr key={tz.id}>
									<td className="py-1 pr-4 text-muted-foreground">
										{tz.offset}
									</td>
									<td className="py-1 pr-4 font-mono">
										<Link
											to="/timezones"
											search={{ highlight: tz.id }}
											className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
										>
											{tz.id}
											<SquareArrowOutUpRight className="size-3 text-muted-foreground" />
										</Link>
									</td>
									<td className="py-1 pr-4">{tz.name}</td>
									<td className="py-1 text-muted-foreground">
										{tz.comment ?? ""}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</ExpandedRow>
			)}
			{showCurrencies && (
				<ExpandedRow colSpan={colSpan}>
					<div className="text-xs font-semibold mb-2">
						Currencies ({currencies.length})
					</div>
					<table className="w-auto text-xs">
						<thead>
							<tr className="text-muted-foreground">
								<th className="text-left py-1 pr-4">Code</th>
								<th className="text-left py-1 pr-4">Symbol</th>
								<th className="text-left py-1 pr-4">Name</th>
								<th className="text-left py-1">Type</th>
							</tr>
						</thead>
						<tbody>
							{currencies.map((ccy) => (
								<tr key={ccy.code}>
									<td className="py-1 pr-4 font-mono">
										<Link
											to="/currencies"
											search={{ highlight: ccy.code }}
											className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
										>
											{ccy.code}
											<SquareArrowOutUpRight className="size-3 text-muted-foreground" />
										</Link>
									</td>
									<td className="py-1 pr-4">{ccy.symbol ?? "-"}</td>
									<td className="py-1 pr-4">{ccy.name}</td>
									<td className="py-1 text-muted-foreground">
										{ccy.type ?? "currency"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{historicalCurrencies.length > 0 && (
						<div className="mt-3 pt-3 border-t border-dashed border-border">
							<div className="text-xs font-semibold mb-2 text-muted-foreground">
								Historical Currencies ({historicalCurrencies.length})
							</div>
							<table className="w-auto text-xs opacity-70">
								<thead>
									<tr className="text-muted-foreground">
										<th className="text-left py-1 pr-4">Code</th>
										<th className="text-left py-1 pr-4">Name</th>
										<th className="text-left py-1">Withdrawal Date</th>
									</tr>
								</thead>
								<tbody>
									{historicalCurrencies.map((ccy, i) => (
										<tr key={`${ccy.code}-${ccy.withdrawalDate}-${i}`}>
											<td className="py-1 pr-4 font-mono">
												<Link
													to="/currencies"
													search={{ highlight: ccy.code }}
													className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
												>
													{ccy.code}
													<SquareArrowOutUpRight className="size-3 text-muted-foreground" />
												</Link>
											</td>
											<td className="py-1 pr-4">{ccy.name}</td>
											<td className="py-1 text-muted-foreground">
												{ccy.withdrawalDate}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</ExpandedRow>
			)}
			{loading && (
				<ExpandedRow colSpan={colSpan}>
					<div className="text-sm text-muted-foreground">
						Loading subdivisions...
					</div>
				</ExpandedRow>
			)}
			{showSubdivisions && (
				<SubdivisionsExpandedRow subs={subs} colSpan={colSpan} />
			)}
		</>
	);
}

function formatFilterValue(value: unknown): string {
	if (value === "has-value") return "Has value";
	if (value === "empty") return "(empty)";
	if (value === null || value === undefined || value === "") return "(empty)";
	if (value === true) return "Yes";
	if (value === false) return "No";
	return String(value);
}

function ActiveFilters<TData>({
	table,
}: {
	table: ReturnType<typeof useReactTable<TData>>;
}) {
	const columnFilters = table.getState().columnFilters;
	if (columnFilters.length === 0) return null;

	const tags: { label: string; values: string }[] = [];
	for (const filter of columnFilters) {
		const col = table.getColumn(filter.id);
		if (!col) continue;
		const header = col.columnDef.header;
		const headerStr = typeof header === "string" ? header : filter.id;
		const vals = Array.isArray(filter.value)
			? (filter.value as unknown[]).map(formatFilterValue).join(", ")
			: formatFilterValue(filter.value);
		tags.push({ label: headerStr, values: vals });
	}

	if (tags.length === 0) return null;

	return (
		<span className="text-xs">
			{" "}
			({tags.map((t) => `${t.label}: ${t.values}`).join(" · ")})
			<button
				type="button"
				onClick={() => table.resetColumnFilters()}
				className="ml-2 px-1.5 py-0.5 rounded text-xs bg-secondary hover:bg-accent text-muted-foreground"
			>
				Clear all
			</button>
		</span>
	);
}

function Countries() {
	const {
		countriesUN,
		countriesMissing,
		timezoneMap,
		currencyMap,
		historicalCurrencyMap,
		subdivisionMap,
		nameLocale: initialNameLocale,
		localizedNames: initialLocalizedNames,
		localizedSearch,
	} = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const { highlight, expandTz, expandCcy } = search;
	// The display locale is the app-wide choice from the header picker (shared with
	// the languages view, persisted in localStorage).
	const { locale } = useLocale();
	// Localized-name map for the chosen locale. Seeded from the loader (SSR for the
	// detected locale), then refetched on its own (small) when the locale changes —
	// without re-running the heavy loader. Always server-sourced, so it stays in
	// sync with the subrow.
	const [localizedNames, setLocalizedNames] = React.useState(
		initialLocalizedNames,
	);
	const loadedNameLocale = React.useRef(initialNameLocale);
	React.useEffect(() => {
		if (locale === loadedNameLocale.current) return;
		let cancelled = false;
		getCountryNamesByLocale({ data: { locale } }).then((map) => {
			if (!cancelled) {
				setLocalizedNames(map);
				loadedNameLocale.current = locale;
			}
		});
		return () => {
			cancelled = true;
		};
	}, [locale]);
	// Merge the picked-locale name + the (shipped) search blob onto the rows.
	const countriesUNLocalized = React.useMemo(
		() =>
			countriesUN.map((c) => ({
				...c,
				localizedName: localizedNames[c.alpha2Code],
				localizedSearch: localizedSearch[c.alpha2Code],
			})),
		[countriesUN, localizedNames, localizedSearch],
	);
	// Missing countries carry cldrName + localizedNameCount from the loader; add the
	// picked-locale name here so their localized-name column matches the main table.
	const countriesMissingLocalized = React.useMemo(
		() =>
			countriesMissing.map((c) => ({
				...c,
				localizedName: localizedNames[c.alpha2Code],
			})),
		[countriesMissing, localizedNames],
	);
	const [globalFilter, setGlobalFilter] = useGlobalFilterSync({
		search,
		navigate,
	});
	const unUrl = useTableUrlState({
		prefix: "un",
		search,
		navigate,
		includeColumnFilters: true,
		sizeKey: "size",
	});
	const missingUrl = useTableUrlState({
		prefix: "missing",
		search,
		navigate,
		sizeKey: "size",
	});
	const [expandedSection, setExpandedSection] = React.useState<
		Record<string, ExpandSection>
	>({});
	const [expandedRows, setExpandedRows] = React.useState<
		Record<string, boolean>
	>({});
	const [showHistoricalCurrencies, setShowHistoricalCurrencies] =
		React.useState(true);
	// Export-only: fold shared calling codes (e.g. +1) down to one primary entry.
	const [collapseSharedCodes, setCollapseSharedCodes] = React.useState(false);
	const [showCrossCheck, setShowCrossCheck] = React.useState(true);
	const [showLocalizedDiff, setShowLocalizedDiff] = React.useState(true);
	const [showCodeMismatch, setShowCodeMismatch] = React.useState(true);

	const toggleSection = React.useCallback(
		(alpha2Code: string, rowIndex: string, section: ExpandSection) => {
			setExpandedSection((prev) => {
				if (prev[alpha2Code] === section) {
					const next = { ...prev };
					delete next[alpha2Code];
					setExpandedRows((er) => {
						const n = { ...er };
						delete n[rowIndex];
						return n;
					});
					return next;
				}
				setExpandedRows((er) => ({ ...er, [rowIndex]: true }));
				return { ...prev, [alpha2Code]: section };
			});
		},
		[],
	);

	const columnsUN = React.useMemo<ColumnDef<Country>[]>(
		() => [
			{
				accessorKey: "flag",
				header: "Flag",
				cell: (info) => (
					<span className="text-2xl leading-none">
						{info.getValue<string>()}
					</span>
				),
				size: 60,
				maxSize: 60,
				enableHiding: false,
				enableGlobalFilter: false,
			},
			{
				accessorKey: "alpha2Code",
				header: "Alpha-2",
				size: 100,
				maxSize: 100,
				enableHiding: false,
				cell: (info) => {
					const code = info.getValue<string>();
					return (
						<span className="inline-flex items-center gap-1">
							{code}
							<a
								href={`https://www.iso.org/obp/ui/en/#iso:code:3166:${code}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								<SquareArrowOutUpRight className="size-3 text-muted-foreground hover:text-foreground transition-colors" />
							</a>
						</span>
					);
				},
			},
			{
				accessorKey: "alpha3Code",
				header: "Alpha-3",
				size: 100,
				maxSize: 100,
				enableHiding: false,
			},
			{
				accessorKey: "subdivisionCount",
				header: "Subdivisions",
				size: 110,
				maxSize: 110,
				cell: ({ row }) => {
					const count = row.original.subdivisionCount;
					if (!count) return <span className="text-muted-foreground">-</span>;
					const isOpen =
						expandedSection[row.original.alpha2Code] === "subdivisions";
					return (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								toggleSection(row.original.alpha2Code, row.id, "subdivisions");
							}}
							className="cursor-pointer hover:bg-accent px-2 py-1 rounded flex items-center gap-1"
						>
							<span>{count}</span>
							<span className="text-xs">{isOpen ? "\u25B2" : "\u25BC"}</span>
						</button>
					);
				},
				enableGlobalFilter: false,
			},
			{
				accessorKey: "icaoCode",
				header: "Passport",
				size: 120,
				maxSize: 120,
				cell: (info) => info.getValue<string>() ?? "-",
				filterFn: presenceFilter,
				meta: { filterable: true, filterMode: "presence" },
			},
			{
				accessorKey: "dsitCode",
				header: "Vehicle plate",
				size: 130,
				maxSize: 130,
				cell: (info) => info.getValue<string>() ?? "-",
				filterFn: presenceFilter,
				meta: { filterable: true, filterMode: "presence" },
			},
			{
				accessorKey: "iocCode",
				header: "Olympic",
				size: 90,
				maxSize: 90,
				cell: (info) => info.getValue<string>() ?? "-",
				filterFn: presenceFilter,
				meta: { filterable: true, filterMode: "presence" },
			},
			{
				accessorKey: "aircraftRegPrefixes",
				header: "Aircraft",
				size: 110,
				maxSize: 110,
				cell: (info) => {
					const prefixes = info.getValue<string[]>();
					return prefixes ? prefixes.join(", ") : "-";
				},
				filterFn: presenceFilter,
				meta: { filterable: true, filterMode: "presence" },
				enableGlobalFilter: false,
			},
			{
				accessorKey: "ccTLD",
				header: "Domain",
				size: 110,
				maxSize: 110,
				cell: (info) => info.getValue<string>() ?? "-",
				filterFn: presenceFilter,
				meta: { filterable: true, filterMode: "presence" },
			},
			{
				accessorKey: "phonePrefix",
				header: "Phone",
				size: 110,
				maxSize: 110,
				cell: (info) => info.getValue<string>() ?? "-",
				sortingFn: phonePrefixSortingFn,
				filterFn: presenceFilter,
				meta: { filterable: true, filterMode: "presence" },
			},
			{
				accessorKey: "independent",
				header: "Independent",
				size: 130,
				maxSize: 130,
				cell: () => "",
				enableGlobalFilter: false,
				filterFn: facetedFilter,
				meta: { filterable: true },
			},
			{
				accessorKey: "unMembership",
				header: "UN member",
				size: 120,
				maxSize: 120,
				cell: (info) => info.row.original.sovereignState ?? "",
				enableGlobalFilter: false,
				filterFn: facetedFilter,
				meta: { filterable: true },
			},
			{
				accessorKey: "euMember",
				header: "EU member",
				size: 120,
				maxSize: 120,
				cell: () => "",
				enableGlobalFilter: false,
				filterFn: facetedFilter,
				meta: { filterable: true },
			},
			{
				accessorKey: "region",
				header: "Region",
				size: 100,
				maxSize: 100,
				filterFn: facetedFilter,
				meta: { filterable: true },
			},
			{
				accessorKey: "name",
				header: "Name",
				size: 200,
				maxSize: 200,
				enableHiding: false,
			},
			{
				accessorKey: "cldrName",
				header: "CLDR name",
				size: 200,
				maxSize: 200,
				cell: (info) => {
					const value = info.getValue<string | undefined>();
					return value ? (
						value
					) : (
						<span className="text-muted-foreground">-</span>
					);
				},
			},
			{
				accessorKey: "fullName",
				header: "Full name",
				size: 300,
				maxSize: 300,
				cell: (info) => info.getValue<string>() ?? "",
			},
			{
				accessorKey: "localizedName",
				header: "Localized name",
				size: 200,
				maxSize: 200,
				cell: (info) => {
					const value = info.getValue<string | undefined>();
					return value ? (
						value
					) : (
						<span className="text-muted-foreground">-</span>
					);
				},
			},
			{
				accessorKey: "localizedNameCount",
				header: "Names",
				size: 120,
				maxSize: 120,
				enableGlobalFilter: false,
				cell: ({ row }) => {
					const count = (
						row.original as Country & { localizedNameCount?: number }
					).localizedNameCount;
					if (!count) return <span className="text-muted-foreground">-</span>;
					const isOpen = expandedSection[row.original.alpha2Code] === "names";
					return (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								toggleSection(row.original.alpha2Code, row.id, "names");
							}}
							className="cursor-pointer hover:bg-accent px-2 py-1 rounded flex items-center gap-1"
							aria-label="Show localized names"
						>
							<span>{count}</span>
							<span className="text-xs">{isOpen ? "▲" : "▼"}</span>
						</button>
					);
				},
			},
			{
				accessorKey: "timezoneCount",
				header: () => (
					<span className="inline-flex items-center gap-1.5">
						Timezones
						<Link
							to="/timezones"
							onClick={(e) => e.stopPropagation()}
							aria-label="Open Timezones view"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<MapIcon className="size-3.5" />
						</Link>
					</span>
				),
				size: 120,
				maxSize: 120,
				cell: ({ row }) => {
					const count = (row.original as Country & { timezoneCount?: number })
						.timezoneCount;
					if (!count) return <span className="text-muted-foreground">-</span>;
					const isOpen =
						expandedSection[row.original.alpha2Code] === "timezones";
					return (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								toggleSection(row.original.alpha2Code, row.id, "timezones");
							}}
							className="cursor-pointer hover:bg-accent px-2 py-1 rounded flex items-center gap-1"
						>
							<span>{count}</span>
							<span className="text-xs">{isOpen ? "\u25B2" : "\u25BC"}</span>
						</button>
					);
				},
				enableGlobalFilter: false,
			},
			{
				accessorKey: "currencyCount",
				header: () => (
					<span className="inline-flex items-center gap-1.5">
						Currencies
						<Link
							to="/currencies"
							onClick={(e) => e.stopPropagation()}
							aria-label="Open Currencies view"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<Coins className="size-3.5" />
						</Link>
					</span>
				),
				size: 120,
				maxSize: 120,
				cell: ({ row }) => {
					const count = (row.original as Country & { currencyCount?: number })
						.currencyCount;
					if (!count) return <span className="text-muted-foreground">-</span>;
					const isOpen =
						expandedSection[row.original.alpha2Code] === "currencies";
					return (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								toggleSection(row.original.alpha2Code, row.id, "currencies");
							}}
							className="cursor-pointer hover:bg-accent px-2 py-1 rounded flex items-center gap-1"
						>
							<span>{count}</span>
							<span className="text-xs">{isOpen ? "\u25B2" : "\u25BC"}</span>
						</button>
					);
				},
				enableGlobalFilter: false,
			},
			{
				// Hidden: indexes every localized spelling so global search matches a
				// country by its name in any language. Excluded from the Columns menu.
				id: "localizedSearch",
				accessorFn: (row) =>
					(row as Country & { localizedSearch?: string }).localizedSearch ?? "",
				header: "Localized search",
				enableHiding: false,
				enableSorting: false,
			},
		],
		[expandedSection, toggleSection],
	);

	const tableUN = useReactTable({
		data: countriesUNLocalized,
		columns: columnsUN,
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getRowCanExpand: () => true,
		// Hidden, search-only column that indexes every localized spelling.
		initialState: { columnVisibility: { localizedSearch: false } },
		globalFilterFn: "fuzzy",
		state: {
			globalFilter,
			expanded: expandedRows,
			sorting: unUrl.sorting,
			pagination: unUrl.pagination,
			columnFilters: unUrl.columnFilters,
		},
		onExpandedChange: (updater) => {
			setExpandedRows((prev) => {
				const next = typeof updater === "function" ? updater(prev) : updater;
				if (typeof next === "boolean") return {};
				return next;
			});
		},
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: unUrl.onSortingChange,
		onPaginationChange: unUrl.onPaginationChange,
		onColumnFiltersChange: unUrl.onColumnFiltersChange,
		filterFns: { fuzzy: fuzzyFilter },
	});

	// Mirror the ISO 3166 table's columns (same order, headers, sizes) so the two
	// stacked tables line up. Most cells render the value or "-"; the flag keeps its
	// glyph, the membership / independent columns stay blank to match the main table,
	// and the Names count opens a localized-names subrow. Notes is appended.
	const columnsMissing = React.useMemo<ColumnDef<Country>[]>(() => {
		const valueOrDash = (info: CellContext<Country, unknown>) => {
			const value = info.getValue();
			let rendered: React.ReactNode;
			if (Array.isArray(value)) {
				rendered = value.length ? (
					value.join(", ")
				) : (
					<span className="text-muted-foreground">-</span>
				);
			} else if (value == null || value === "") {
				rendered = <span className="text-muted-foreground">-</span>;
			} else {
				rendered = String(value);
			}
			// A per-cell note (e.g. "ICAO assigns KS/RKS independently") renders as an
			// info tooltip beside the value, explaining a de-facto / non-ISO assignment.
			const note = (
				info.row.original as Country & { cellNotes?: Record<string, string> }
			).cellNotes?.[info.column.id];
			if (!note) return rendered;
			return (
				<span className="inline-flex items-center gap-1">
					{rendered}
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								aria-label="Source note"
								className="text-muted-foreground/60 hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
							>
								<Info className="size-3" />
							</button>
						</TooltipTrigger>
						<TooltipContent className="max-w-xs text-xs">{note}</TooltipContent>
					</Tooltip>
				</span>
			);
		};
		// The Names count opens a localized-names subrow — the only expandable
		// section here, since the other counts are absent for missing countries.
		const namesCell = ({ row }: CellContext<Country, unknown>) => {
			const count = (row.original as Country & { localizedNameCount?: number })
				.localizedNameCount;
			if (!count) return <span className="text-muted-foreground">-</span>;
			const isOpen = row.getIsExpanded();
			return (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						row.toggleExpanded();
					}}
					className="cursor-pointer hover:bg-accent px-2 py-1 rounded flex items-center gap-1"
					aria-label="Show localized names"
				>
					<span>{count}</span>
					<span className="text-xs">{isOpen ? "▲" : "▼"}</span>
				</button>
			);
		};
		// Columns whose main-table cell renders something other than a plain value
		// (the large flag glyph; the filter-only blank membership/independent cells).
		const keepCell = new Set([
			"flag",
			"unMembership",
			"euMember",
			"independent",
		]);
		const mirrored = columnsUN
			.filter(
				(c): c is ColumnDef<Country> & { accessorKey: string } =>
					"accessorKey" in c && c.accessorKey !== "localizedSearch",
			)
			.map((c): ColumnDef<Country> => {
				let cell: ColumnDef<Country>["cell"];
				if (c.accessorKey === "localizedNameCount") cell = namesCell;
				else if (keepCell.has(c.accessorKey)) cell = c.cell;
				else cell = valueOrDash;
				return {
					accessorKey: c.accessorKey,
					header: c.header,
					size: c.size,
					maxSize: c.maxSize,
					enableHiding: c.enableHiding,
					enableGlobalFilter: c.enableGlobalFilter,
					cell,
				};
			});
		return [
			...mirrored,
			{
				accessorKey: "notes",
				header: "Notes",
				cell: (info) => info.getValue<string>() ?? "",
			},
		];
	}, [columnsUN]);

	const tableMissing = useReactTable({
		data: countriesMissingLocalized,
		columns: columnsMissing,
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getRowCanExpand: () => true,
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		globalFilterFn: "fuzzy",
		state: {
			globalFilter,
			sorting: missingUrl.sorting,
			pagination: missingUrl.pagination,
		},
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: missingUrl.onSortingChange,
		onPaginationChange: missingUrl.onPaginationChange,
		filterFns: { fuzzy: fuzzyFilter },
	});

	// Navigate to the correct page and scroll to highlighted country
	// biome-ignore lint/correctness/useExhaustiveDependencies: deep-link highlight/expand applies once on mount; re-running on table/param changes would fight the user's paging
	React.useEffect(() => {
		if (!highlight) return;
		const rows = tableUN.getFilteredRowModel().rows;
		const idx = rows.findIndex((r) => r.original.alpha2Code === highlight);
		if (idx >= 0) {
			const pageSize = tableUN.getState().pagination.pageSize;
			tableUN.setPageIndex(Math.floor(idx / pageSize));
			if (expandTz || expandCcy) {
				const rowId = String(idx);
				const section = expandTz ? "timezones" : "currencies";
				setExpandedSection((prev) => ({ ...prev, [highlight]: section }));
				setExpandedRows((prev) => ({ ...prev, [rowId]: true }));
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
			<div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
				<h1 className="text-3xl font-bold" data-view-title="Countries">
					Countries (ISO 3166)
				</h1>
				<ColumnVisibility
					table={tableUN}
					extraItems={[
						{
							afterColumnId: "phonePrefix",
							render: () => {
								// Shared-code collapsing is a sub-option of Phone: only
								// active (and applied on export) when the Phone column is shown.
								const phoneVisible =
									tableUN.getColumn("phonePrefix")?.getIsVisible() ?? false;
								return (
									<label
										key="collapseSharedCodes"
										className={`flex items-center gap-2 pl-6 pr-2 py-1 rounded text-sm text-muted-foreground ${phoneVisible ? "hover:bg-accent cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
									>
										<input
											type="checkbox"
											checked={collapseSharedCodes && phoneVisible}
											disabled={!phoneVisible}
											onChange={() => setCollapseSharedCodes((v) => !v)}
											className="rounded"
										/>
										<span className="truncate">Collapse shared codes</span>
									</label>
								);
							},
						},
						{
							afterColumnId: "currencyCount",
							render: () => {
								// Withdrawn is a sub-option of Currencies: only active
								// (and exported) when the Currencies column is shown.
								const currenciesVisible =
									tableUN.getColumn("currencyCount")?.getIsVisible() ?? false;
								return (
									<label
										key="historicalCurrencies"
										className={`flex items-center gap-2 pl-6 pr-2 py-1 rounded text-sm text-muted-foreground ${currenciesVisible ? "hover:bg-accent cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
									>
										<input
											type="checkbox"
											checked={showHistoricalCurrencies && currenciesVisible}
											disabled={!currenciesVisible}
											onChange={() => setShowHistoricalCurrencies((v) => !v)}
											className="rounded"
										/>
										<span className="truncate">Withdrawn</span>
									</label>
								);
							},
						},
					]}
				/>
			</div>
			<input
				type="text"
				value={globalFilter}
				onChange={(e) => setGlobalFilter(e.target.value)}
				placeholder="Search by name, code, region…"
				aria-label="Search countries"
				className="w-full px-3 py-2 mb-6 bg-secondary border border-border rounded text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-ring"
			/>

			<div className="mb-6">
				<h3 className="text-sm font-semibold mb-2">Cross-check data</h3>
				<div className="flex flex-col gap-1 w-fit text-xs text-muted-foreground">
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={showCrossCheck}
							onChange={() => setShowCrossCheck((v) => !v)}
							className="rounded"
						/>
						<span className="inline-block w-8 h-3 rounded bg-yellow-100 dark:bg-yellow-950" />
						CLDR name differs from the official name
					</label>
					<div className="flex items-center gap-1.5">
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={showLocalizedDiff}
								onChange={() => setShowLocalizedDiff((v) => !v)}
								className="rounded"
							/>
							<span className="inline-block w-8 h-3 rounded bg-purple-100 dark:bg-purple-950" />
							Localized name differs from name
						</label>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									aria-label="What name normalization is ignored"
									className="text-muted-foreground/60 hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
								>
									<Info className="w-3.5 h-3.5" />
								</button>
							</TooltipTrigger>
							<TooltipContent className="max-w-sm text-xs">
								<NotCountedNote />
							</TooltipContent>
						</Tooltip>
					</div>
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={showCodeMismatch}
							onChange={() => setShowCodeMismatch((v) => !v)}
							className="rounded"
						/>
						<span className="inline-block w-8 h-3 rounded bg-red-100 dark:bg-red-950" />
						Code differs from ISO 3166-1 standard
					</label>
				</div>
			</div>

			<div className="flex items-center justify-between mb-4">
				<p className="text-sm text-muted-foreground">
					Total: {countriesUN.length} countries
					{tableUN.getFilteredRowModel().rows.length !== countriesUN.length && (
						<span>
							{" "}
							| Filtered: {tableUN.getFilteredRowModel().rows.length}
							<ActiveFilters table={tableUN} />
						</span>
					)}
				</p>
				<ExportButtons
					table={tableUN}
					filename="countries-un"
					transformRows={async (rows) => {
						// Only when the "Names" column is shown — and fetched only then,
						// not shipped with every page load.
						const wantNames =
							tableUN.getColumn("localizedNameCount")?.getIsVisible() ?? false;
						const allNames: Record<string, Record<string, string>> = wantNames
							? await getLocalizedNamesAllByCountry()
							: {};
						const enriched = rows.map((row) => {
							const { localizedName, ...rest } = row;
							// Drop the display-only counts; their data is added below.
							for (const k of [
								"timezoneCount",
								"currencyCount",
								"subdivisionCount",
								"localizedNameCount",
							]) {
								delete rest[k];
							}
							const alpha2 = rest.alpha2Code as string;
							return {
								...rest,
								// Picked-locale name, keyed by its locale.
								...(typeof localizedName === "string" && {
									localizedName: { [locale]: localizedName },
								}),
								// Every locale's name for this country.
								...(allNames[alpha2] && {
									localizedNames: allNames[alpha2],
								}),
								...("subdivisionCount" in row && {
									subdivisions: (subdivisionMap[alpha2] ?? []).map(
										({ code, flag, type, names }) => ({
											code,
											...(flag ? { flag } : {}),
											...(type ? { type } : {}),
											...names,
										}),
									),
								}),
								...("timezoneCount" in row && {
									timezones: (timezoneMap[alpha2] ?? []).map(
										({ comment, ...tz }) => (comment ? { ...tz, comment } : tz),
									),
								}),
								...("currencyCount" in row && {
									currencies: (currencyMap[alpha2] ?? []).map(
										({ type, ...ccy }) => (type ? { ...ccy, type } : ccy),
									),
									...(showHistoricalCurrencies &&
										(historicalCurrencyMap[alpha2] ?? []).length > 0 && {
											historicalCurrencies: historicalCurrencyMap[alpha2],
										}),
								}),
							};
						});
						// Fold shared calling codes (e.g. +1) into one primary entry,
						// only when the Phone column is shown and the option is enabled.
						const phoneVisible =
							tableUN.getColumn("phonePrefix")?.getIsVisible() ?? false;
						return phoneVisible && collapseSharedCodes
							? collapseSharedPhoneCodes(enriched)
							: enriched;
					}}
				/>
			</div>
			<DataTable
				table={tableUN}
				columnSources={countrySources}
				sourceMeta={countrySourceMeta}
				cellClassName={(colId, row) => {
					const localizedName = (
						row.original as Country & { localizedName?: string }
					).localizedName;
					const cldrName = (row.original as Country & { cldrName?: string })
						.cldrName;
					let base: string;
					if (highlight === row.original.alpha2Code) {
						base = "bg-blue-100 dark:bg-blue-950";
					} else if (
						sectionByColumn[colId] !== undefined &&
						expandedSection[row.original.alpha2Code] === sectionByColumn[colId]
					) {
						// The count cell whose toggle opened the current subrow —
						// painted the same dark grey as the bg-accent/50 panel it anchors,
						// rather than the row's full-opacity bg-accent hover color.
						base = "bg-accent/50";
					} else if (
						showCrossCheck &&
						colId === "cldrName" &&
						!!cldrName &&
						normalizeName(cldrName) !== normalizeName(row.original.name)
					) {
						base = "bg-yellow-100 dark:bg-yellow-950";
					} else if (
						showLocalizedDiff &&
						colId === "localizedName" &&
						localizedNameDiffers(row.original.name, localizedName)
					) {
						base = "bg-purple-100 dark:bg-purple-950";
					} else {
						base = getCellHighlight(colId, row.original, showCodeMismatch);
					}
					return `${base} ${getColumnBorder(colId)}`;
				}}
				headerClassName={(colId) => getColumnBorder(colId)}
				renderExpandedRow={(row) => {
					const section = expandedSection[row.original.alpha2Code];
					if (!section) return null;
					if (section === "names") {
						return (
							<LocalizedNamesExpandedRow
								alpha2Code={row.original.alpha2Code}
								colSpan={row.getVisibleCells().length}
							/>
						);
					}
					return (
						<ExpandedCountryRow
							alpha2Code={row.original.alpha2Code}
							colSpan={row.getVisibleCells().length}
							timezones={
								section === "timezones"
									? (timezoneMap[row.original.alpha2Code] ?? [])
									: []
							}
							currencies={
								section === "currencies"
									? (currencyMap[row.original.alpha2Code] ?? [])
									: []
							}
							historicalCurrencies={
								section === "currencies" && showHistoricalCurrencies
									? (historicalCurrencyMap[row.original.alpha2Code] ?? [])
									: []
							}
							hasSubdivisions={
								section === "subdivisions" && !!row.original.subdivisionCount
							}
						/>
					);
				}}
			/>
			<Pagination table={tableUN} totalItems={countriesUN.length} />

			{/* Missing Countries Section */}
			<div className="mt-6">
				<div className="flex items-center justify-between mb-2 h-8">
					<h2 className="text-xl font-semibold">
						Missing Countries (Not in Official Standards)
					</h2>
					<ColumnVisibility table={tableMissing} />
				</div>
				<div className="flex items-center justify-between mb-4">
					<p className="text-sm text-muted-foreground">
						Total: {countriesMissing.length} countries
						{tableMissing.getFilteredRowModel().rows.length !==
							countriesMissing.length && (
							<span>
								{" "}
								| Filtered: {tableMissing.getFilteredRowModel().rows.length}
							</span>
						)}
					</p>
					<ExportButtons table={tableMissing} filename="countries-missing" />
				</div>
				<DataTable
					table={tableMissing}
					columnSources={countrySources}
					sourceMeta={countrySourceMeta}
					cellClassName={(colId, row) =>
						`${getCellHighlight(colId, row.original, showCodeMismatch)} ${getColumnBorder(colId)}`
					}
					headerClassName={(colId) => getColumnBorder(colId)}
					renderExpandedRow={(row) => (
						<LocalizedNamesExpandedRow
							alpha2Code={row.original.alpha2Code}
							colSpan={row.getVisibleCells().length}
						/>
					)}
				/>
			</div>
		</div>
	);
}
