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
	fifaHomeNations,
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
import {
	codeChecks,
	codeDiverges,
	hasCodeDivergence,
} from "@/lib/country-codes";
import { fuzzyFilter } from "@/lib/fuzzy-filter";
import { useLocale } from "@/lib/locale";
import { localizedNameDiffers } from "@/lib/localized-names";
import { collapseSharedPhoneCodes } from "@/lib/phone-codes";
import {
	nextSubSort,
	type SubSort,
	sortSubdivisions,
} from "@/lib/subdivision-sort";
import { facetedFilter, presenceFilter } from "@/lib/table-filters";
import { asNumber, asString } from "@/lib/url-state";
import {
	useGlobalFilterSync,
	useTableUrlState,
} from "@/lib/use-table-url-state";

type ExpandSection =
	| "subdivisions"
	| "timezones"
	| "currencies"
	| "names"
	| "details";

interface CountriesSearch {
	highlight?: string;
	expandTz?: boolean;
	expandCcy?: boolean;
	q?: string;
	size?: number;
	un_sort?: string;
	un_page?: number;
	un_f?: string;
	un_mismatch?: boolean;
	missing_sort?: string;
	missing_page?: number;
}

/** Unwrap a settled result, or log and fall back. Lets the countries loader
 *  fetch its data with `Promise.allSettled` so one flaky, non-critical call
 *  degrades a column instead of erroring the whole route. */
function settledOr<T>(
	result: PromiseSettledResult<T>,
	fallback: NoInfer<T>,
	label: string,
): T {
	if (result.status === "fulfilled") return result.value;
	console.error(
		`countries loader: ${label} unavailable, using fallback`,
		result.reason,
	);
	return fallback;
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
		un_mismatch:
			search.un_mismatch === true || search.un_mismatch === "true" || undefined,
		missing_sort: asString(search.missing_sort),
		missing_page: asNumber(search.missing_page),
	}),
	// The global locale picker lives in the header (localStorage-backed), so it's
	// not in the URL and can't drive the loader. We SSR names in the visitor's
	// detected locale; the component swaps in the stored locale's (small) name map
	// on mount without re-running this whole heavy loader.
	loader: async () => {
		// Detected locale drives the SSR'd names; fall back to English if the
		// lookup itself flakes rather than failing the whole route.
		const nameLocale = await getPreferredLocale().catch(() => "en");
		// Non-critical enrichments fail soft (Promise.allSettled): one flaky
		// call degrades its column(s) instead of erroring the page. Only the
		// main UN country list is treated as required.
		const [
			countriesIntlR,
			countriesUNR,
			countriesMissingR,
			timezoneMapR,
			currencyMapR,
			historicalCurrencyMapR,
			subdivisionMapR,
			localizedNameCountsR,
			localizedNamesR,
			localizedSearchR,
		] = await Promise.allSettled([
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
		// The main country list is the page's reason for existing — if it can't
		// load, surface the error rather than render an empty table.
		if (countriesUNR.status === "rejected") throw countriesUNR.reason;
		const countriesUN = countriesUNR.value;
		const countriesIntl = settledOr(countriesIntlR, [], "CLDR names");
		const countriesMissing = settledOr(
			countriesMissingR,
			[],
			"missing countries",
		);
		const timezoneMap = settledOr(timezoneMapR, {}, "timezones");
		const currencyMap = settledOr(currencyMapR, {}, "currencies");
		const historicalCurrencyMap = settledOr(
			historicalCurrencyMapR,
			{},
			"historical currencies",
		);
		const subdivisionMap = settledOr(subdivisionMapR, {}, "subdivisions");
		const localizedNameCounts = settledOr(
			localizedNameCountsR,
			{},
			"localized name counts",
		);
		const localizedNames = settledOr(localizedNamesR, {}, "localized names");
		const localizedSearch = settledOr(localizedSearchR, {}, "localized search");
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

/** Clickable sort header for the hand-rolled subdivisions table. Mirrors the
 *  🔼/🔽 indicators DataTable uses; the button inherits the surrounding <th>
 *  font/color via Tailwind preflight. */
function SubSortHeader({
	label,
	sortKey,
	sort,
	onSort,
}: {
	label: React.ReactNode;
	sortKey: string;
	sort: SubSort;
	onSort: (key: string) => void;
}) {
	const indicator =
		sort && sort.key === sortKey
			? sort.dir === "asc"
				? "\u{1F53C}"
				: "\u{1F53D}"
			: null;
	return (
		<button
			type="button"
			onClick={() => onSort(sortKey)}
			className="inline-flex items-center gap-1 cursor-pointer select-none whitespace-nowrap hover:text-foreground"
		>
			{label}
			{indicator && <span>{indicator}</span>}
		</button>
	);
}

function SubdivisionsExpandedRow({
	subs,
	colSpan,
}: {
	subs: Subdivision[];
	colSpan: number;
}) {
	const nameLangs = [...new Set(subs.flatMap((sub) => Object.keys(sub.names)))];
	const typeLangs = [
		...new Set(subs.flatMap((sub) => Object.keys(sub.type ?? {}))),
	];
	// Union of every language in either `names` or `type`, names-first so the
	// columns that carry an actual localized value sit next to Code and the
	// type-only languages (commonly en/fr) trail at the right.
	const langCodes = [
		...nameLangs,
		...typeLangs.filter((lang) => !nameLangs.includes(lang)),
	];
	const hasType = typeLangs.length > 0;

	const flagOf = (sub: Subdivision) =>
		sub.flag ?? (sub.iso1 ? toFlag(sub.iso1) : undefined);
	const renderCode = (sub: Subdivision) => (
		<>
			{sub.code}
			{sub.iso1 && (
				<span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded">
					{sub.iso1}
				</span>
			)}
		</>
	);

	const [sort, setSort] = React.useState<SubSort>(null);
	const onSort = (key: string) =>
		setSort((current) => nextSubSort(current, key));
	const ariaSort = (key: string): "ascending" | "descending" | "none" => {
		if (!sort || sort.key !== key) return "none";
		return sort.dir === "asc" ? "ascending" : "descending";
	};

	// Sort by the clicked column's accessor; unsorted falls back to source order.
	const sortedSubs = React.useMemo(
		() =>
			sortSubdivisions(
				subs,
				sort,
				(s) => s.flag ?? (s.iso1 ? toFlag(s.iso1) : ""),
			),
		[subs, sort],
	);

	// No type data anywhere → one plain column per language (the localized name).
	if (!hasType) {
		return (
			<ExpandedRow colSpan={colSpan}>
				<table className="text-xs w-auto">
					<thead>
						<tr className="text-muted-foreground">
							<th
								aria-sort={ariaSort("flag")}
								className="pr-4 pb-1 text-left font-normal"
							>
								<SubSortHeader
									label="Flag"
									sortKey="flag"
									sort={sort}
									onSort={onSort}
								/>
							</th>
							<th
								aria-sort={ariaSort("code")}
								className="pr-6 pb-1 text-left font-normal"
							>
								<SubSortHeader
									label="Code"
									sortKey="code"
									sort={sort}
									onSort={onSort}
								/>
							</th>
							{langCodes.map((lang) => (
								<th
									key={lang}
									aria-sort={ariaSort(`name:${lang}`)}
									className="pr-6 pb-1 text-left font-normal"
								>
									<SubSortHeader
										label={lang}
										sortKey={`name:${lang}`}
										sort={sort}
										onSort={onSort}
									/>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{sortedSubs.map((sub) => (
							<tr key={sub.code}>
								<td className="pr-4 py-0.5">{flagOf(sub) ?? ""}</td>
								<td className="pr-6 py-0.5 font-mono">{renderCode(sub)}</td>
								{langCodes.map((lang) => (
									<td key={lang} className="pr-6 py-0.5">
										{sub.names[lang] ?? ""}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</ExpandedRow>
		);
	}

	// Grouped layout: two header rows. Flag/Code span both; each language is a
	// `colspan=2` group header over its own (type | value) pair.
	return (
		<ExpandedRow colSpan={colSpan}>
			<table className="text-xs w-auto">
				<thead className="text-muted-foreground">
					<tr>
						<th
							rowSpan={2}
							aria-sort={ariaSort("flag")}
							className="pr-4 pb-1 align-bottom text-left font-normal"
						>
							<SubSortHeader
								label="Flag"
								sortKey="flag"
								sort={sort}
								onSort={onSort}
							/>
						</th>
						<th
							rowSpan={2}
							aria-sort={ariaSort("code")}
							className="pr-6 pb-1 align-bottom text-left font-normal"
						>
							<SubSortHeader
								label="Code"
								sortKey="code"
								sort={sort}
								onSort={onSort}
							/>
						</th>
						{langCodes.map((lang) => (
							<th
								key={lang}
								colSpan={2}
								className="border-l border-border pb-1 pl-4 pr-4 text-center font-medium text-foreground"
							>
								{lang}
							</th>
						))}
					</tr>
					<tr>
						{langCodes.map((lang) => (
							<React.Fragment key={lang}>
								<th
									aria-sort={ariaSort(`type:${lang}`)}
									className="border-l border-border pb-1 pl-4 pr-3 text-left font-normal"
								>
									<SubSortHeader
										label="type"
										sortKey={`type:${lang}`}
										sort={sort}
										onSort={onSort}
									/>
								</th>
								<th
									aria-sort={ariaSort(`name:${lang}`)}
									className="pr-4 pb-1 text-left font-normal"
								>
									<SubSortHeader
										label="value"
										sortKey={`name:${lang}`}
										sort={sort}
										onSort={onSort}
									/>
								</th>
							</React.Fragment>
						))}
					</tr>
				</thead>
				<tbody>
					{sortedSubs.map((sub) => (
						<tr key={sub.code}>
							<td className="pr-4 py-0.5">{flagOf(sub) ?? ""}</td>
							<td className="pr-6 py-0.5 font-mono">{renderCode(sub)}</td>
							{langCodes.map((lang) => (
								<React.Fragment key={lang}>
									<td className="border-l border-border pl-4 pr-3 py-0.5 text-muted-foreground">
										{sub.type?.[lang] ?? ""}
									</td>
									<td className="pr-4 py-0.5">{sub.names[lang] ?? ""}</td>
								</React.Fragment>
							))}
						</tr>
					))}
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
	const codeCheck = codeChecks.find((ck) => ck.colId === colId);
	if (showCodeMismatch && codeCheck && codeDiverges(codeCheck, original))
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

// Maps each opener cell to the section it toggles, so the cell that opened the active
// subrow can be painted — anchoring the expanded panel to the value (or, for the full
// detail panel, the flag) it came from.
const sectionByColumn: Record<string, ExpandSection> = {
	flag: "details",
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
	fifaCode: "FIFA",
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
	FIFA: { href: "https://inside.fifa.com/associations" },
	"UNECE · DSIT": {
		href: "https://unece.org/DAM/trans/conventn/Distsigns.pdf",
	},
	"Unicode CLDR": {
		href: "https://cldr.unicode.org/translation/displaynames/countryregion-territory-names",
		note: "Resolved at runtime via Intl.DisplayNames.",
	},
};

function DetailField({
	label,
	source,
	children,
}: {
	label: string;
	source?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-0.5">
			<dt className="text-xs text-muted-foreground">
				{label}
				{source && (
					<span className="ml-1 text-muted-foreground/60">· {source}</span>
				)}
			</dt>
			<dd className="text-sm">{children}</dd>
		</div>
	);
}

function DetailGroup({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col gap-2">
			<h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
				{title}
			</h4>
			<dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
				{children}
			</dl>
		</section>
	);
}

// Full vertical breakdown of one country's standards — every code, status and count
// in one readable place, so you don't have to scroll a wide table. Display-only; the
// code rows reuse codeChecks to flag where a value diverges from ISO 3166-1.
function CountryDetailPanel({
	country,
	colSpan,
}: {
	country: Country & {
		cldrName?: string;
		localizedName?: string;
		timezoneCount?: number;
		currencyCount?: number;
		localizedNameCount?: number;
	};
	colSpan: number;
}) {
	const c = country;
	const dash = <span className="text-muted-foreground">—</span>;
	const text = (v?: string | number | null) =>
		v === undefined || v === null || v === "" ? dash : <span>{v}</span>;
	const yesNo = (v?: boolean) => (v === undefined ? dash : v ? "Yes" : "No");
	const src = (colId: string) => countrySources[colId];

	// A code value that flags divergence from ISO 3166-1 (and lists the UK's four
	// home-nation associations, since GB itself has no single FIFA code).
	const code = (colId: string) => {
		if (colId === "fifaCode" && c.alpha2Code === "GB") {
			return (
				<span className="font-mono">
					{fifaHomeNations.map((n) => n.code).join(", ")}
				</span>
			);
		}
		const check = codeChecks.find((ck) => ck.colId === colId);
		const value = check?.get(c);
		if (!value) return dash;
		const diverges = check ? codeDiverges(check, c) : false;
		return (
			<span className={diverges ? "text-red-700 dark:text-red-300" : undefined}>
				<span className="font-mono">{value}</span>
				{diverges && <span className="ml-1 text-xs">≠ ISO 3166-1</span>}
			</span>
		);
	};

	return (
		<ExpandedRow colSpan={colSpan}>
			<div className="flex max-w-3xl flex-col gap-5">
				<div className="flex items-center gap-3">
					<span className="text-3xl leading-none">{c.flag}</span>
					<div>
						<div className="text-base font-semibold">
							{c.name || c.cldrName || c.alpha2Code}
						</div>
						{c.fullName && (
							<div className="text-xs text-muted-foreground">{c.fullName}</div>
						)}
					</div>
				</div>

				<DetailGroup title="ISO 3166-1">
					<DetailField label="Alpha-2" source={src("alpha2Code")}>
						<span className="font-mono">{c.alpha2Code}</span>
					</DetailField>
					<DetailField label="Alpha-3" source={src("alpha3Code")}>
						{c.alpha3Code ? (
							<span className="font-mono">{c.alpha3Code}</span>
						) : (
							dash
						)}
					</DetailField>
					<DetailField label="Numeric" source="UN M49">
						{text(c.unCode)}
					</DetailField>
					<DetailField label="Independent" source={src("independent")}>
						{yesNo(c.independent)}
					</DetailField>
				</DetailGroup>

				<DetailGroup title="Codes cross-checked against ISO 3166-1">
					<DetailField label="Passport" source={src("icaoCode")}>
						{code("icaoCode")}
					</DetailField>
					<DetailField label="Vehicle plate" source={src("dsitCode")}>
						{code("dsitCode")}
					</DetailField>
					<DetailField label="Olympic" source={src("iocCode")}>
						{code("iocCode")}
					</DetailField>
					<DetailField label="FIFA" source={src("fifaCode")}>
						{code("fifaCode")}
					</DetailField>
				</DetailGroup>

				<DetailGroup title="Identifiers">
					<DetailField label="Aircraft" source={src("aircraftRegPrefixes")}>
						{c.aircraftRegPrefixes?.length
							? c.aircraftRegPrefixes.join(", ")
							: dash}
					</DetailField>
					<DetailField label="Domain" source={src("ccTLD")}>
						{text(c.ccTLD)}
					</DetailField>
					<DetailField label="Phone" source={src("phonePrefix")}>
						{text(c.phonePrefix)}
					</DetailField>
				</DetailGroup>

				<DetailGroup title="Status & geography">
					<DetailField label="UN membership" source={src("unMembership")}>
						{text(c.unMembership)}
					</DetailField>
					<DetailField label="EU member" source={src("euMember")}>
						{yesNo(c.euMember)}
					</DetailField>
					<DetailField label="Region" source={src("region")}>
						{text(c.region)}
					</DetailField>
					{c.sovereignState && (
						<DetailField label="Sovereign state" source="ISO 3166-1">
							<span className="font-mono">{c.sovereignState}</span>
						</DetailField>
					)}
				</DetailGroup>

				<DetailGroup title="Counts">
					<DetailField label="Subdivisions" source={src("subdivisionCount")}>
						{text(c.subdivisionCount ?? 0)}
					</DetailField>
					<DetailField label="Currencies" source={src("currencyCount")}>
						{text(c.currencyCount ?? 0)}
					</DetailField>
					<DetailField label="Timezones" source={src("timezoneCount")}>
						{text(c.timezoneCount ?? 0)}
					</DetailField>
					<DetailField
						label="Localized names"
						source={src("localizedNameCount")}
					>
						{text(c.localizedNameCount ?? 0)}
					</DetailField>
				</DetailGroup>
			</div>
		</ExpandedRow>
	);
}

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
	// The missing-countries table keeps its own expansion state so its flag / Names
	// triggers never collide with the main table's (both use index-based row ids).
	const [missingSection, setMissingSection] = React.useState<
		Record<string, ExpandSection>
	>({});
	const [missingExpanded, setMissingExpanded] = React.useState<
		Record<string, boolean>
	>({});
	const [showHistoricalCurrencies, setShowHistoricalCurrencies] =
		React.useState(true);
	// Export-only: fold shared calling codes (e.g. +1) down to one primary entry.
	const [collapseSharedCodes, setCollapseSharedCodes] = React.useState(false);
	const [showCrossCheck, setShowCrossCheck] = React.useState(true);
	const [showLocalizedDiff, setShowLocalizedDiff] = React.useState(true);
	const [showCodeMismatch, setShowCodeMismatch] = React.useState(true);
	// Row filter (not a highlight): narrow the ISO 3166 table to only the countries
	// whose passport / vehicle / Olympic / FIFA code differs from ISO 3166-1. Synced
	// to the URL so the filtered view survives a refresh and is shareable.
	const showOnlyMismatches = search.un_mismatch === true;
	const setShowOnlyMismatches = React.useCallback(
		(next: boolean) =>
			navigate({
				search: (prev) => ({ ...prev, un_mismatch: next || undefined }),
				replace: true,
			}),
		[navigate],
	);
	// Count over the full table, not the filtered view ("134 of 249 diverge").
	const codeMismatchCount = React.useMemo(
		() => countriesUN.filter(hasCodeDivergence).length,
		[countriesUN],
	);
	const countriesUNRows = React.useMemo(
		() =>
			showOnlyMismatches
				? countriesUNLocalized.filter(hasCodeDivergence)
				: countriesUNLocalized,
		[countriesUNLocalized, showOnlyMismatches],
	);

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

	// Same toggle behaviour as the main table, on the missing table's own state.
	const toggleMissingSection = React.useCallback(
		(alpha2Code: string, rowIndex: string, section: ExpandSection) => {
			setMissingSection((prev) => {
				if (prev[alpha2Code] === section) {
					const next = { ...prev };
					delete next[alpha2Code];
					setMissingExpanded((er) => {
						const n = { ...er };
						delete n[rowIndex];
						return n;
					});
					return next;
				}
				setMissingExpanded((er) => ({ ...er, [rowIndex]: true }));
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
				cell: ({ row, getValue }) => {
					const isOpen = expandedSection[row.original.alpha2Code] === "details";
					return (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								toggleSection(row.original.alpha2Code, row.id, "details");
							}}
							aria-label={`Show all codes for ${row.original.name || row.original.alpha2Code}`}
							aria-expanded={isOpen}
							title="Show all codes"
							className="cursor-pointer rounded px-1 text-2xl leading-none hover:bg-accent"
						>
							{getValue<string>()}
						</button>
					);
				},
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
				cell: (info) => {
					const value = info.getValue<string>();
					if (!value) return "-";
					// The UK's distinguishing sign changed from "GB" to "UK" on
					// 28 Sep 2021; an info tooltip explains the change (cf. FIFA cell).
					if (info.row.original.alpha2Code === "GB") {
						return (
							<span className="inline-flex items-center gap-1">
								{value}
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											aria-label="UK vehicle code changed from GB to UK in 2021"
											className="opacity-60 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
										>
											<Info className="size-3" />
										</button>
									</TooltipTrigger>
									<TooltipContent className="max-w-xs text-xs">
										Changed from <span className="font-mono">GB</span> to{" "}
										<span className="font-mono">UK</span> on 28 September 2021.
									</TooltipContent>
								</Tooltip>
							</span>
						);
					}
					return value;
				},
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
				accessorKey: "fifaCode",
				header: "FIFA",
				size: 90,
				maxSize: 90,
				cell: (info) => {
					const value = info.getValue<string>();
					if (value) return value;
					// The UK (GB) has no single FIFA code; its four home-nation
					// associations are shown in a tooltip instead of a bare "-".
					if (info.row.original.alpha2Code === "GB") {
						return (
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										aria-label="FIFA codes for the UK home nations"
										className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
									>
										4<Info className="size-3" />
									</button>
								</TooltipTrigger>
								<TooltipContent className="text-xs">
									<ul className="space-y-0.5">
										{fifaHomeNations.map((n) => (
											<li key={n.code}>
												<span className="font-mono">{n.code}</span> {n.name}
											</li>
										))}
									</ul>
								</TooltipContent>
							</Tooltip>
						);
					}
					return "-";
				},
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
				header: "UN member 🇺🇳",
				size: 120,
				maxSize: 120,
				cell: (info) => info.row.original.sovereignState ?? "",
				enableGlobalFilter: false,
				filterFn: facetedFilter,
				meta: { filterable: true },
			},
			{
				accessorKey: "euMember",
				header: "EU member 🇪🇺",
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
		data: countriesUNRows,
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
			const isOpen = missingSection[row.original.alpha2Code] === "names";
			return (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						toggleMissingSection(row.original.alpha2Code, row.id, "names");
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
		const keepCell = new Set(["unMembership", "euMember", "independent"]);
		const mirrored = columnsUN
			.filter(
				(c): c is ColumnDef<Country> & { accessorKey: string } =>
					"accessorKey" in c && c.accessorKey !== "localizedSearch",
			)
			.map((c): ColumnDef<Country> => {
				let cell: ColumnDef<Country>["cell"];
				if (c.accessorKey === "localizedNameCount") cell = namesCell;
				// Mirror the main table's flag → "details" trigger, on this table's own
				// expansion state (so it never collides with the main table's rows).
				else if (c.accessorKey === "flag")
					cell = ({ row, getValue }) => {
						const isOpen =
							missingSection[row.original.alpha2Code] === "details";
						return (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									toggleMissingSection(
										row.original.alpha2Code,
										row.id,
										"details",
									);
								}}
								aria-label={`Show all codes for ${row.original.name || row.original.alpha2Code}`}
								aria-expanded={isOpen}
								title="Show all codes"
								className="cursor-pointer rounded px-1 text-2xl leading-none hover:bg-accent"
							>
								{getValue<string>()}
							</button>
						);
					};
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
	}, [columnsUN, missingSection, toggleMissingSection]);

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
			expanded: missingExpanded,
			sorting: missingUrl.sorting,
			pagination: missingUrl.pagination,
		},
		onExpandedChange: (updater) => {
			setMissingExpanded((prev) => {
				const next = typeof updater === "function" ? updater(prev) : updater;
				if (typeof next === "boolean") return {};
				return next;
			});
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
			<h1 className="text-3xl font-bold mb-4" data-view-title="Countries">
				Countries
			</h1>
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
						<span className="text-muted-foreground/70">
							({codeMismatchCount})
						</span>
					</label>
					<label className="flex items-center gap-2 cursor-pointer pl-10">
						<input
							type="checkbox"
							checked={showOnlyMismatches}
							onChange={() => setShowOnlyMismatches(!showOnlyMismatches)}
							className="rounded"
						/>
						Show only the {codeMismatchCount} countries with a code mismatch
					</label>
				</div>
			</div>

			<div className="flex items-center justify-between mb-2 h-8">
				<h2 className="text-xl font-semibold">ISO 3166</h2>
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
								// The UK has no single FIFA code; surface its four home-nation
								// associations so the export carries them (display-only in the
								// table — see the FIFA column cell). Only when FIFA is visible.
								...(alpha2 === "GB" &&
									"fifaCode" in rest && {
										fifaCode: fifaHomeNations.map((n) => n.code).join(", "),
									}),
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
					if (section === "details") {
						return (
							<CountryDetailPanel
								country={row.original}
								colSpan={row.getVisibleCells().length}
							/>
						);
					}
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
						Missing Countries (Not in ISO 3166)
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
					renderExpandedRow={(row) => {
						if (missingSection[row.original.alpha2Code] === "details") {
							return (
								<CountryDetailPanel
									country={row.original}
									colSpan={row.getVisibleCells().length}
								/>
							);
						}
						return (
							<LocalizedNamesExpandedRow
								alpha2Code={row.original.alpha2Code}
								colSpan={row.getVisibleCells().length}
							/>
						);
					}}
				/>
			</div>
		</div>
	);
}
