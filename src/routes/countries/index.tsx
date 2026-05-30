import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef, SortingFn } from "@tanstack/react-table";
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
import { Info, SquareArrowOutUpRight } from "lucide-react";
import React from "react";
import { ColumnVisibility } from "@/components/ColumnVisibility";
import { DataTable } from "@/components/DataTable";
import { ExportButtons } from "@/components/ExportButtons";
import { LocaleSelect } from "@/components/LocaleSelect";
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
  getRegionNameLocales,
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
import { getDetectedLocales, getPreferredLocale } from "@/data/locale";
import { type CountryTimezone, getTimezonesByCountry } from "@/data/timezones";
import { fuzzyFilter } from "@/lib/fuzzy-filter";
import { localizedNameDiffers } from "@/lib/localized-names";
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
  nameLocale?: string;
  size?: number;
  intl_sort?: string;
  intl_page?: number;
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
    nameLocale: asString(search.nameLocale),
    size: asNumber(search.size),
    intl_sort: asString(search.intl_sort),
    intl_page: asNumber(search.intl_page),
    un_sort: asString(search.un_sort),
    un_page: asNumber(search.un_page),
    un_f: asString(search.un_f),
    missing_sort: asString(search.missing_sort),
    missing_page: asNumber(search.missing_page),
  }),
  // `nameLocale` is intentionally NOT a loaderDep: switching the picker should
  // refetch only the small per-locale name map (done in the component), not this
  // whole heavy loader. We still read it from the URL for a correct first render.
  loader: async ({ location }) => {
    const nameLocale =
      (location.search as CountriesSearch).nameLocale ??
      (await getPreferredLocale());
    const [
      countriesIntl,
      countriesUN,
      countriesMissing,
      timezoneMap,
      currencyMap,
      historicalCurrencyMap,
      subdivisionMap,
      localizedNameCounts,
      regionNameLocales,
      localizedNames,
      localizedSearch,
      detectedLocales,
    ] = await Promise.all([
      getCountries(),
      getCountriesFromUN(),
      getMissingCountries(),
      getTimezonesByCountry(),
      getCurrenciesByCountry(),
      getHistoricalCurrenciesByCountry(),
      getSubdivisionsByCountry(),
      getLocalizedNameCountsByCountry(),
      getRegionNameLocales(),
      getCountryNamesByLocale({ data: { locale: nameLocale } }),
      getLocalizedSearchByCountry(),
      getDetectedLocales(),
    ]);
    // Locale-independent enrichments (counts). The picked-locale name and the
    // search blob are applied in the component so the loader needn't re-run.
    const countriesUNWithTz = countriesUN.map((c) => ({
      ...c,
      timezoneCount: timezoneMap[c.alpha2Code]?.length ?? 0,
      currencyCount: currencyMap[c.alpha2Code]?.length ?? 0,
      localizedNameCount: localizedNameCounts[c.alpha2Code] ?? 0,
    }));
    return {
      countriesIntl,
      countriesUN: countriesUNWithTz,
      countriesMissing,
      timezoneMap,
      currencyMap,
      historicalCurrencyMap,
      subdivisionMap,
      regionNameLocales,
      nameLocale,
      localizedNames,
      localizedSearch,
      detectedLocales,
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
          "ISO 3166-1 country codes, UN M49 regions, ICAO passport codes, IOC Olympic codes, and ISO 3166-2 subdivisions. Compare Intl API data with official UN sources.",
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
    <tr className="bg-accent/50">
      <td colSpan={colSpan} className="px-6 py-3">
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
              const flag =
                sub.flag ?? (sub.iso1 ? toFlag(sub.iso1) : undefined);
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
      </td>
    </tr>
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
      <tr className="bg-accent/50">
        <td
          colSpan={colSpan}
          className="px-6 py-3 text-sm text-muted-foreground"
        >
          Loading names...
        </td>
      </tr>
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
    <tr className="bg-accent/50">
      <td colSpan={colSpan} className="px-6 py-3">
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
      </td>
    </tr>
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
      <tr className="bg-accent/50">
        <td
          colSpan={colSpan}
          className="px-6 py-3 text-sm text-muted-foreground"
        >
          Loading...
        </td>
      </tr>
    );
  }

  if (!showTimezones && !showCurrencies && !showSubdivisions && !loading)
    return null;

  return (
    <>
      {showTimezones && (
        <tr className="bg-accent/50">
          <td colSpan={colSpan} className="px-6 py-3">
            <div className="text-xs font-semibold mb-2">
              Timezones ({timezones.length})
            </div>
            <table className="w-full text-xs">
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
          </td>
        </tr>
      )}
      {showCurrencies && (
        <tr className="bg-accent/50">
          <td colSpan={colSpan} className="px-6 py-3">
            <div className="text-xs font-semibold mb-2">
              Currencies ({currencies.length})
            </div>
            <table className="w-full text-xs">
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
                <table className="w-full text-xs opacity-70">
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
          </td>
        </tr>
      )}
      {loading && (
        <tr className="bg-accent/50">
          <td
            colSpan={colSpan}
            className="px-6 py-3 text-sm text-muted-foreground"
          >
            Loading subdivisions...
          </td>
        </tr>
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
    countriesIntl,
    countriesUN,
    countriesMissing,
    timezoneMap,
    currencyMap,
    historicalCurrencyMap,
    subdivisionMap,
    regionNameLocales,
    nameLocale: initialNameLocale,
    localizedNames: initialLocalizedNames,
    localizedSearch,
    detectedLocales,
  } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { highlight, expandTz, expandCcy } = search;
  // The loader resolved the initial locale (URL value, else detected). The picker
  // value follows the URL, falling back to that resolved default.
  const nameLocale = search.nameLocale ?? initialNameLocale;
  const setNameLocale = (next: string) => {
    navigate({
      search: (prev) => ({ ...prev, nameLocale: next }),
      replace: true,
    });
  };
  // Localized-name map for the picked locale. Seeded from the loader (SSR), then
  // refetched on its own (small) when the picker changes — without re-running the
  // heavy loader. Always server-sourced, so it stays in sync with the subrow.
  const [localizedNames, setLocalizedNames] = React.useState(
    initialLocalizedNames,
  );
  const loadedNameLocale = React.useRef(initialNameLocale);
  React.useEffect(() => {
    if (nameLocale === loadedNameLocale.current) return;
    let cancelled = false;
    getCountryNamesByLocale({ data: { locale: nameLocale } }).then((map) => {
      if (!cancelled) {
        setLocalizedNames(map);
        loadedNameLocale.current = nameLocale;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [nameLocale]);
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
  const [globalFilter, setGlobalFilter] = useGlobalFilterSync({
    search,
    navigate,
  });
  const intlUrl = useTableUrlState({
    prefix: "intl",
    search,
    navigate,
    sizeKey: "size",
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
  const [showCrossCheck, setShowCrossCheck] = React.useState(true);
  const [showLocalizedDiff, setShowLocalizedDiff] = React.useState(true);
  const [showCodeMismatch, setShowCodeMismatch] = React.useState(true);

  // Cross-check: names present in one source table but not the other
  const intlNames = React.useMemo(
    () => new Set(countriesIntl.map((c) => normalizeName(c.name))),
    [countriesIntl],
  );
  const unNames = React.useMemo(
    () => new Set(countriesUN.map((c) => normalizeName(c.name))),
    [countriesUN],
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

  const columnsIntl = React.useMemo<ColumnDef<Country>[]>(
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
        size: 80,
        maxSize: 80,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
        maxSize: 200,
        enableHiding: false,
      },
    ],
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
        header: "3166-2",
        size: 100,
        maxSize: 100,
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
        header: "ICAO",
        size: 90,
        maxSize: 90,
        cell: (info) => info.getValue<string>() ?? "-",
        filterFn: presenceFilter,
        meta: { filterable: true, filterMode: "presence" },
      },
      {
        accessorKey: "dsitCode",
        header: "DSIT",
        size: 90,
        maxSize: 90,
        cell: (info) => info.getValue<string>() ?? "-",
        filterFn: presenceFilter,
        meta: { filterable: true, filterMode: "presence" },
      },
      {
        accessorKey: "iocCode",
        header: "IOC",
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
        header: "Ind.",
        size: 80,
        maxSize: 80,
        cell: () => "",
        enableGlobalFilter: false,
        filterFn: facetedFilter,
        meta: { filterable: true },
      },
      {
        accessorKey: "unMembership",
        header: "\u{1F1FA}\u{1F1F3}",
        size: 80,
        maxSize: 80,
        cell: (info) => info.row.original.sovereignState ?? "",
        enableGlobalFilter: false,
        filterFn: facetedFilter,
        meta: { filterable: true },
      },
      {
        accessorKey: "euMember",
        header: "\u{1F1EA}\u{1F1FA}",
        size: 80,
        maxSize: 80,
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
        accessorKey: "fullName",
        header: "Full Name",
        size: 300,
        maxSize: 300,
        cell: (info) => info.getValue<string>() ?? "",
      },
      {
        accessorKey: "localizedName",
        header: "Localized Name",
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
        size: 90,
        maxSize: 90,
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
        header: "Timezones",
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
        header: "Currencies",
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

  const tableIntl = useReactTable({
    data: countriesIntl,
    columns: columnsIntl,
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
    filterFns: { fuzzy: fuzzyFilter },
  });

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

  const columnsMissing = React.useMemo<ColumnDef<Country>[]>(
    () => [
      {
        accessorKey: "flag",
        header: "Flag",
        cell: (info) => (
          <span className="text-2xl leading-none">
            {info.getValue<string>()}
          </span>
        ),
        size: 50,
        maxSize: 50,
        enableHiding: false,
        enableGlobalFilter: false,
      },
      {
        accessorKey: "alpha2Code",
        header: "Alpha-2",
        size: 80,
        maxSize: 80,
        enableHiding: false,
      },
      {
        accessorKey: "alpha3Code",
        header: "Alpha-3",
        size: 80,
        maxSize: 80,
        enableHiding: false,
      },
      {
        accessorKey: "icaoCode",
        header: "ICAO",
        size: 90,
        maxSize: 90,
        cell: (info) => info.getValue<string>() ?? "-",
      },
      {
        accessorKey: "dsitCode",
        header: "DSIT",
        size: 80,
        maxSize: 80,
        cell: (info) => info.getValue<string>() ?? "-",
      },
      {
        accessorKey: "iocCode",
        header: "IOC",
        size: 70,
        maxSize: 70,
        cell: (info) => info.getValue<string>() ?? "-",
      },
      {
        accessorKey: "aircraftRegPrefixes",
        header: "Aircraft",
        size: 100,
        maxSize: 100,
        cell: (info) => {
          const prefixes = info.getValue<string[]>();
          return prefixes ? prefixes.join(", ") : "-";
        },
        enableGlobalFilter: false,
      },
      {
        accessorKey: "unMembership",
        header: "\u{1F1FA}\u{1F1F3}",
        size: 50,
        maxSize: 50,
        cell: (info) => info.row.original.sovereignState ?? "",
        enableGlobalFilter: false,
      },
      {
        accessorKey: "euMember",
        header: "\u{1F1EA}\u{1F1FA}",
        size: 50,
        maxSize: 50,
        cell: () => "",
        enableGlobalFilter: false,
      },
      {
        accessorKey: "region",
        header: "Region",
        size: 100,
        maxSize: 100,
      },
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
        maxSize: 200,
        enableHiding: false,
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: (info) => info.getValue<string>() ?? "",
      },
    ],
    [],
  );

  const tableMissing = useReactTable({
    data: countriesMissing,
    columns: columnsMissing,
    getCoreRowModel: getCoreRowModel(),
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
      <h1 className="text-3xl font-bold mb-6" data-view-title="Countries">
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
            Name not present in the other table
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left: Intl API */}
        <div className="md:col-span-1">
          <div className="flex items-center justify-between mb-2 h-8">
            <h2 className="text-xl font-semibold">Intl API (Built-in)</h2>
            <ColumnVisibility table={tableIntl} />
          </div>
          <ul className="text-xs text-muted-foreground mb-3 space-y-1 min-h-28">
            <li>• Source: JavaScript runtime's built-in database</li>
            <li>• Standard: ISO 3166-1 Alpha-2 codes</li>
            <li>• Updates: Tied to Node.js version updates</li>
            <li>• Coverage: All ISO country codes</li>
            <li>• Addons: None</li>
          </ul>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Total: {countriesIntl.length} countries
              {tableIntl.getFilteredRowModel().rows.length !==
                countriesIntl.length && (
                <span>
                  {" "}
                  | Filtered: {tableIntl.getFilteredRowModel().rows.length}
                </span>
              )}
            </p>
            <ExportButtons table={tableIntl} filename="countries-intl" />
          </div>
          <DataTable
            table={tableIntl}
            cellClassName={(colId, row) =>
              showCrossCheck &&
              colId === "name" &&
              !unNames.has(normalizeName(row.original.name))
                ? "bg-yellow-100 dark:bg-yellow-950"
                : ""
            }
          />
          <Pagination table={tableIntl} totalItems={countriesIntl.length} />
        </div>

        {/* Right: UN M49 */}
        <div className="md:col-span-3">
          <div className="flex flex-col gap-2 mb-2 md:h-8 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">
              UN M49 Standard (Official)
            </h2>
            <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
              <ColumnVisibility
                table={tableUN}
                extraItems={[
                  {
                    afterColumnId: "currencyCount",
                    render: () => {
                      // Withdrawn is a sub-option of Currencies: only active
                      // (and exported) when the Currencies column is shown.
                      const currenciesVisible =
                        tableUN.getColumn("currencyCount")?.getIsVisible() ??
                        false;
                      return (
                        <label
                          key="historicalCurrencies"
                          className={`flex items-center gap-2 pl-6 pr-2 py-1 rounded text-sm text-muted-foreground ${currenciesVisible ? "hover:bg-accent cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              showHistoricalCurrencies && currenciesVisible
                            }
                            disabled={!currenciesVisible}
                            onChange={() =>
                              setShowHistoricalCurrencies((v) => !v)
                            }
                            className="rounded"
                          />
                          <span className="truncate">Withdrawn</span>
                        </label>
                      );
                    },
                  },
                ]}
              />
              <LocaleSelect
                id="nameLocale"
                value={nameLocale}
                onChange={setNameLocale}
                options={regionNameLocales}
                detectedLocales={detectedLocales}
              />
            </div>
          </div>
          <ul className="text-xs text-muted-foreground mb-3 space-y-1 min-h-28">
            <li>• Source: United Nations Statistics Division</li>
            <li>
              • Standard: ISO 3166-1 Alpha-2/Alpha-3 + UN M49 numeric codes
            </li>
            <li>• Updates: Manually updated from official UN source</li>
            <li>
              • Coverage: All 249 officially assigned countries and territories
            </li>
            <li>
              • Addons: ICAO 9303 passport codes, DSIT vehicle codes, IOC
              Olympic codes, ITU aircraft registration prefixes, IANA ccTLDs,
              ITU E.164 dialing codes, UN &amp; EU membership
            </li>
          </ul>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Total: {countriesUN.length} countries
              {tableUN.getFilteredRowModel().rows.length !==
                countriesUN.length && (
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
                  tableUN.getColumn("localizedNameCount")?.getIsVisible() ??
                  false;
                const allNames: Record<
                  string,
                  Record<string, string>
                > = wantNames ? await getLocalizedNamesAllByCountry() : {};
                return rows.map((row) => {
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
                      localizedName: { [nameLocale]: localizedName },
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
                        ({ comment, ...tz }) =>
                          comment ? { ...tz, comment } : tz,
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
              }}
            />
          </div>
          <DataTable
            table={tableUN}
            cellClassName={(colId, row) => {
              const localizedName = (
                row.original as Country & { localizedName?: string }
              ).localizedName;
              let base: string;
              if (highlight === row.original.alpha2Code) {
                base = "bg-blue-100 dark:bg-blue-950";
              } else if (
                showCrossCheck &&
                colId === "name" &&
                !intlNames.has(normalizeName(row.original.name))
              ) {
                base = "bg-yellow-100 dark:bg-yellow-950";
              } else if (
                showLocalizedDiff &&
                colId === "localizedName" &&
                localizedNameDiffers(row.original.name, localizedName)
              ) {
                base = "bg-purple-100 dark:bg-purple-950";
              } else {
                base = getCellHighlight(
                  colId,
                  row.original,
                  showCodeMismatch,
                );
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
                    section === "subdivisions" &&
                    !!row.original.subdivisionCount
                  }
                />
              );
            }}
          />
          <Pagination table={tableUN} totalItems={countriesUN.length} />
        </div>
      </div>

      {/* Missing Countries Section */}
      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1" />
          <div className="md:col-span-3">
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
              <ExportButtons
                table={tableMissing}
                filename="countries-missing"
              />
            </div>
            <DataTable
              table={tableMissing}
              cellClassName={(colId, row) =>
                getCellHighlight(colId, row.original, showCodeMismatch)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
