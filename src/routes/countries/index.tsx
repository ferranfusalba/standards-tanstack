import { Link, createFileRoute } from "@tanstack/react-router";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";
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
import React from "react";
import { ColumnVisibility } from "@/components/ColumnVisibility";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import {
  type Country,
  getCountries,
  getCountriesFromUN,
  getMissingCountries,
  getSubdivisions,
  type SubdivisionData,
} from "@/data/countries";
import { type CountryTimezone, getTimezonesByCountry } from "@/data/timezones";
import { fuzzyFilter } from "@/lib/fuzzy-filter";

const facetedFilter: FilterFn<Country> = (row, columnId, filterValue) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  return filterValue.includes(row.getValue(columnId));
};

const presenceFilter: FilterFn<Country> = (row, columnId, filterValue) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  const val = row.getValue(columnId);
  const isEmpty = val === null || val === undefined || val === "";
  if (filterValue.includes("has-value") && !isEmpty) return true;
  if (filterValue.includes("empty") && isEmpty) return true;
  return false;
};

export const Route = createFileRoute("/countries/")({
  component: Countries,
  validateSearch: (
    search: Record<string, unknown>,
  ): { highlight?: string } => ({
    highlight: (search.highlight as string) || undefined,
  }),
  loader: async () => {
    const [countriesIntl, countriesUN, countriesMissing, timezoneMap] =
      await Promise.all([
        getCountries(),
        getCountriesFromUN(),
        getMissingCountries(),
        getTimezonesByCountry(),
      ]);
    // Enrich UN countries with timezone counts
    const countriesUNWithTz = countriesUN.map((c) => ({
      ...c,
      timezoneCount: timezoneMap[c.alpha2Code]?.length ?? 0,
    }));
    return {
      countriesIntl,
      countriesUN: countriesUNWithTz,
      countriesMissing,
      timezoneMap,
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
                      <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded">
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

function getCellHighlight(colId: string, original: Country): string {
  if (
    colId === "icaoCode" &&
    original.icaoCode &&
    original.icaoCode !== original.alpha3Code
  )
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  if (
    colId === "dsitCode" &&
    original.dsitCode &&
    original.dsitCode !== original.alpha2Code &&
    original.dsitCode !== original.alpha3Code
  )
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  if (
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
  hasSubdivisions,
}: {
  alpha2Code: string;
  colSpan: number;
  timezones: CountryTimezone[];
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
  const showSubdivisions = subs && subs.length > 0;

  if (loading && !showTimezones) {
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

  if (!showTimezones && !showSubdivisions && !loading) return null;

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
                        className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                      >
                        {tz.id}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="text-muted-foreground"
                        >
                          <path d="M6 3H3v10h10v-3M9 2h5v5M14 2L7 9" />
                        </svg>
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
  if (value === "empty") return "Empty";
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
  const { countriesIntl, countriesUN, countriesMissing, timezoneMap } =
    Route.useLoaderData();
  const { highlight } = Route.useSearch();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [expandedSection, setExpandedSection] = React.useState<
    Record<string, "subdivisions" | "timezones">
  >({});
  const [expandedRows, setExpandedRows] = React.useState<
    Record<string, boolean>
  >({});

  const toggleSection = (
    alpha2Code: string,
    rowIndex: string,
    section: "subdivisions" | "timezones",
  ) => {
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
  };

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
        accessorKey: "timezoneCount",
        header: "TZ",
        size: 80,
        maxSize: 80,
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
    ],
    [],
  );

  const tableIntl = useReactTable({
    data: countriesIntl,
    columns: columnsIntl,
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
    filterFns: { fuzzy: fuzzyFilter },
  });

  const tableUN = useReactTable({
    data: countriesUN,
    columns: columnsUN,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: () => true,
    globalFilterFn: "fuzzy",
    state: { globalFilter, expanded: expandedRows },
    onExpandedChange: (updater) => {
      setExpandedRows((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (typeof next === "boolean") return {};
        return next;
      });
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
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
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
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
      // Auto-expand timezones section for the highlighted country
      const rowId = String(idx);
      setExpandedSection((prev) => ({ ...prev, [highlight]: "timezones" }));
      setExpandedRows((prev) => ({ ...prev, [rowId]: true }));
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
      <h1 className="text-3xl font-bold mb-6">Countries</h1>
      <input
        type="text"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search by name, code, region…"
        aria-label="Search countries"
        className="w-full px-3 py-2 mb-6 bg-secondary border border-border rounded text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-ring"
      />

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
          <p className="text-sm text-muted-foreground mb-4">
            Total: {countriesIntl.length} countries
            {tableIntl.getFilteredRowModel().rows.length !==
              countriesIntl.length && (
              <span>
                {" "}
                | Filtered: {tableIntl.getFilteredRowModel().rows.length}
              </span>
            )}
          </p>
          <DataTable table={tableIntl} />
          <Pagination table={tableIntl} totalItems={countriesIntl.length} />
        </div>

        {/* Right: UN M49 */}
        <div className="md:col-span-3">
          <div className="flex items-center justify-between mb-2 h-8">
            <h2 className="text-xl font-semibold">
              UN M49 Standard (Official)
            </h2>
            <ColumnVisibility table={tableUN} />
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
              Olympic codes, UN &amp; EU membership
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mb-4">
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
          <DataTable
            table={tableUN}
            cellClassName={(colId, row) =>
              `${highlight === row.original.alpha2Code ? "bg-blue-100 dark:bg-blue-950" : getCellHighlight(colId, row.original)} ${getColumnBorder(colId)}`
            }
            headerClassName={(colId) => getColumnBorder(colId)}
            renderExpandedRow={(row) => {
              const section = expandedSection[row.original.alpha2Code];
              if (!section) return null;
              return (
                <ExpandedCountryRow
                  alpha2Code={row.original.alpha2Code}
                  colSpan={row.getVisibleCells().length}
                  timezones={
                    section === "timezones"
                      ? (timezoneMap[row.original.alpha2Code] ?? [])
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
            <p className="text-sm text-muted-foreground mb-4">
              Total: {countriesMissing.length} countries
              {tableMissing.getFilteredRowModel().rows.length !==
                countriesMissing.length && (
                <span>
                  {" "}
                  | Filtered: {tableMissing.getFilteredRowModel().rows.length}
                </span>
              )}
            </p>
            <DataTable
              table={tableMissing}
              cellClassName={(colId, row) =>
                getCellHighlight(colId, row.original)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
