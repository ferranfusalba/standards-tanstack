import React from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, FilterFn, SortingFn } from "@tanstack/react-table";
import {
  getTimezonesFromIntl,
  getTimezonesFromIANA,
  type Timezone,
  type TimezoneIANA,
  type TimezoneIntl,
} from "@/data/timezones";
import { fuzzyFilter } from "@/lib/fuzzy-filter";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { ColumnVisibility } from "@/components/ColumnVisibility";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getVisibleKeys<TData>(
  table: { getVisibleLeafColumns: () => { id: string }[] },
  rows: TData[],
): string[] {
  const cols = table.getVisibleLeafColumns().map((c) => c.id);
  if (rows.length === 0) return cols;
  const dataKeys = new Set(Object.keys(rows[0] as Record<string, unknown>));
  return cols.filter((c) => dataKeys.has(c));
}

function exportTableCSV<TData extends Record<string, unknown>>(
  table: { getVisibleLeafColumns: () => { id: string }[] },
  rows: TData[],
  filename: string,
) {
  const keys = getVisibleKeys(table, rows);
  const header = keys.join(",");
  const lines = rows.map((row) =>
    keys
      .map((k) => {
        const val = row[k];
        if (Array.isArray(val)) return `"${val.join(",")}"`;
        if (val === null || val === undefined) return '""';
        return `"${String(val)}"`;
      })
      .join(","),
  );
  downloadFile([header, ...lines].join("\n"), filename, "text/csv");
}

function exportTableJSON<TData extends Record<string, unknown>>(
  table: { getVisibleLeafColumns: () => { id: string }[] },
  rows: TData[],
  filename: string,
) {
  const keys = getVisibleKeys(table, rows);
  const filtered = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const k of keys) obj[k] = row[k];
    return obj;
  });
  downloadFile(JSON.stringify(filtered, null, 2), filename, "application/json");
}

// biome-ignore lint/suspicious/noExplicitAny: FilterFn generics are contravariant, making typed versions incompatible across table types
const facetedFilter: FilterFn<any> = (row, columnId, filterValue) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  return filterValue.includes(row.getValue(columnId));
};

function parseOffset(offset: string): number {
  const match = offset.match(/UTC([+-]?\d+)(?::(\d+))?/);
  if (!match) return 0;
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2] || "0", 10);
  return hours * 60 + (hours < 0 ? -minutes : minutes);
}

const offsetSortingFn: SortingFn<any> = (rowA, rowB, columnId) => {
  return parseOffset(rowA.getValue(columnId)) - parseOffset(rowB.getValue(columnId));
};

export const Route = createFileRoute("/timezones/")({
  component: Timezones,
  validateSearch: (search: Record<string, unknown>): { highlight?: string } => ({
    highlight: (search.highlight as string) || undefined,
  }),
  loader: async () => {
    const [timezonesIntl, timezonesIANA] = await Promise.all([
      getTimezonesFromIntl(),
      getTimezonesFromIANA(),
    ]);
    return {
      timezonesIntl,
      timezonesIANA,
    };
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
});

function Timezones() {
  const { timezonesIntl, timezonesIANA } = Route.useLoaderData();
  const { highlight } = Route.useSearch();
  const [globalFilter, setGlobalFilter] = React.useState("");

  const [selectedRegions, setSelectedRegions] = React.useState<string[]>([]);

  const allRegions = React.useMemo(() => {
    const regions = new Set<string>();
    for (const tz of timezonesIntl) if (tz.region) regions.add(tz.region);
    for (const tz of timezonesIANA) if (tz.region) regions.add(tz.region);
    return Array.from(regions).sort();
  }, [timezonesIntl, timezonesIANA]);

  const regionColumnFilter = React.useMemo(
    () =>
      selectedRegions.length > 0
        ? [{ id: "region", value: selectedRegions }]
        : [],
    [selectedRegions],
  );

  // IANA table uses only the shared region filter
  const columnFiltersIANA = regionColumnFilter;

  // Intl table merges region filter with its own column filters (e.g. DST)
  const [intlOwnFilters, setIntlOwnFilters] = React.useState<
    { id: string; value: unknown }[]
  >([]);

  const columnFiltersIntl = React.useMemo(
    () => [
      ...regionColumnFilter,
      ...intlOwnFilters.filter((f) => f.id !== "region"),
    ],
    [regionColumnFilter, intlOwnFilters],
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

  const columnsIntl = React.useMemo<ColumnDef<TimezoneIntl>[]>(
    () => [
      {
        accessorKey: "offset",
        header: "Offset",
        size: 110,
        maxSize: 110,
        sortingFn: offsetSortingFn,
      },
      {
        accessorKey: "id",
        header: "ID",
        size: 250,
        maxSize: 250,
      },
      {
        accessorKey: "name",
        header: "Name",
        size: 250,
        maxSize: 250,
      },
      {
        accessorKey: "region",
        header: "Region",
        filterFn: facetedFilter,
      },
      {
        accessorKey: "longName",
        header: "Long Name",
        size: 400,
        maxSize: 400,
      },
      {
        accessorKey: "shortName",
        header: "Abbr.",
        size: 90,
        maxSize: 90,
        filterFn: facetedFilter,
        meta: { filterable: true },
      },
      {
        accessorKey: "longGeneric",
        header: "Generic Name",
        size: 400,
        maxSize: 400,
      },
      {
        accessorKey: "shortGeneric",
        header: "Generic Short",
        size: 140,
        maxSize: 140,
      },
      {
        accessorKey: "isDST",
        header: "DST",
        size: 80,
        maxSize: 80,
        cell: ({ getValue }) => (getValue() ? "Yes" : "No"),
        filterFn: facetedFilter,
        meta: { filterable: true },
      },
      {
        accessorKey: "standardOffset",
        header: "Std Offset",
        size: 120,
        maxSize: 120,
      },
      {
        accessorKey: "dstOffset",
        header: "DST Offset",
        size: 120,
        maxSize: 120,
        cell: ({ getValue }) => (getValue() as string) ?? "—",
      },
    ],
    [],
  );

  const columnsIANA = React.useMemo<ColumnDef<TimezoneIANA>[]>(
    () => [
      {
        accessorKey: "offset",
        header: "Offset",
        size: 110,
        maxSize: 110,
        sortingFn: offsetSortingFn,
      },
      {
        accessorKey: "id",
        header: "ID",
        size: 250,
        maxSize: 250,
      },
      {
        accessorKey: "name",
        header: "Name",
        size: 250,
        maxSize: 250,
      },
      {
        accessorKey: "region",
        header: "Region",
        filterFn: facetedFilter,
      },
      {
        accessorKey: "countryCodes",
        header: "Countries",
        cell: ({ getValue }) => {
          const codes = getValue() as string[];
          return (
            <span className="flex flex-wrap gap-1">
              {codes.map((code) => (
                <Link
                  key={code}
                  to="/countries"
                  search={{ highlight: code, expandTz: true }}
                  title={code}
                  className="cursor-pointer hover:opacity-70 transition-opacity"
                >
                  {code
                    .toUpperCase()
                    .split("")
                    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
                    .join("")}
                </Link>
              ))}
            </span>
          );
        },
        size: 120,
        maxSize: 120,
      },
      {
        accessorKey: "comment",
        header: "Comment",
        cell: ({ getValue }) => (getValue() as string) ?? "—",
        size: 200,
        maxSize: 200,
      },
    ],
    [],
  );

  const tableIntl = useReactTable({
    data: timezonesIntl,
    columns: columnsIntl,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "fuzzy",
    state: { globalFilter, columnFilters: columnFiltersIntl },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(columnFiltersIntl) : updater;
      setIntlOwnFilters(next.filter((f) => f.id !== "region"));
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
  });

  const tableIANA = useReactTable({
    data: timezonesIANA,
    columns: columnsIANA,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "fuzzy",
    state: { globalFilter, columnFilters: columnFiltersIANA },
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

  // Navigate to the correct page and scroll to highlighted row
  React.useEffect(() => {
    if (!highlight) return;
    // Jump each table to the page containing the highlighted timezone
    for (const table of [tableIANA, tableIntl]) {
      const rows = table.getFilteredRowModel().rows;
      const idx = rows.findIndex((r) => (r.original as Timezone).id === highlight);
      if (idx >= 0) {
        const pageSize = table.getState().pagination.pageSize;
        table.setPageIndex(Math.floor(idx / pageSize));
      }
    }
    const timer = setTimeout(() => {
      const el = document.querySelector(".bg-blue-100");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
    return () => clearTimeout(timer);
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="inline-block w-8 h-3 rounded bg-yellow-100 dark:bg-yellow-950" />
          Not present in the other table
        </span>
        {highlight && (
          <span className="flex items-center gap-2">
            <span className="inline-block w-8 h-3 rounded bg-blue-100 dark:bg-blue-950" />
            Linked timezone
          </span>
        )}
      </div>

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
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Total: {timezonesIntl.length} timezones (
              {timezonesIntl.filter((tz) => !ianaIds.has(tz.id)).length} not in
              IANA)
              {tableIntl.getFilteredRowModel().rows.length !==
                timezonesIntl.length && (
                <span>
                  {" "}
                  | Filtered: {tableIntl.getFilteredRowModel().rows.length}
                </span>
              )}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() =>
                  exportTableCSV(
                    tableIntl,
                    tableIntl.getFilteredRowModel().rows.map((r) => r.original as unknown as Record<string, unknown>),
                    "timezones-intl.csv",
                  )
                }
                className="px-2 py-1 text-xs bg-secondary text-secondary-foreground border border-border rounded hover:bg-accent"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() =>
                  exportTableJSON(
                    tableIntl,
                    tableIntl.getFilteredRowModel().rows.map((r) => r.original as unknown as Record<string, unknown>),
                    "timezones-intl.json",
                  )
                }
                className="px-2 py-1 text-xs bg-secondary text-secondary-foreground border border-border rounded hover:bg-accent"
              >
                JSON
              </button>
            </div>
          </div>
          <DataTable
            table={tableIntl}
            cellClassName={(_col, row) => {
              const id = (row.original as Timezone).id;
              if (highlight === id)
                return "bg-blue-100 dark:bg-blue-950";
              if (!ianaIds.has(id))
                return "bg-yellow-100 dark:bg-yellow-950";
              return "";
            }}
          />
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
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Total: {timezonesIANA.length} timezones (
              {timezonesIANA.filter((tz) => !intlIds.has(tz.id)).length} not in
              Intl)
              {tableIANA.getFilteredRowModel().rows.length !==
                timezonesIANA.length && (
                <span>
                  {" "}
                  | Filtered: {tableIANA.getFilteredRowModel().rows.length}
                </span>
              )}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() =>
                  exportTableCSV(
                    tableIANA,
                    tableIANA.getFilteredRowModel().rows.map((r) => r.original as unknown as Record<string, unknown>),
                    "timezones-iana.csv",
                  )
                }
                className="px-2 py-1 text-xs bg-secondary text-secondary-foreground border border-border rounded hover:bg-accent"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() =>
                  exportTableJSON(
                    tableIANA,
                    tableIANA.getFilteredRowModel().rows.map((r) => r.original as unknown as Record<string, unknown>),
                    "timezones-iana.json",
                  )
                }
                className="px-2 py-1 text-xs bg-secondary text-secondary-foreground border border-border rounded hover:bg-accent"
              >
                JSON
              </button>
            </div>
          </div>
          <DataTable
            table={tableIANA}
            cellClassName={(_col, row) => {
              const id = (row.original as Timezone).id;
              if (highlight === id)
                return "bg-blue-100 dark:bg-blue-950";
              if (!intlIds.has(id))
                return "bg-yellow-100 dark:bg-yellow-950";
              return "";
            }}
          />
          <Pagination table={tableIANA} totalItems={timezonesIANA.length} />
        </div>
      </div>
    </div>
  );
}
