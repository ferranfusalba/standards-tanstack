import { Link, createFileRoute } from "@tanstack/react-router";
import { ExportButtons } from "@/components/ExportButtons";
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
  validateSearch: (
    search: Record<string, unknown>,
  ): { highlight?: string } => ({
    highlight: (search.highlight as string) || undefined,
  }),
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
  const { highlight } = Route.useSearch();
  const [globalFilter, setGlobalFilter] = React.useState("");

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

  // Navigate to the correct page and scroll to highlighted currency
  React.useEffect(() => {
    if (!highlight) return;
    const rows = table.getFilteredRowModel().rows;
    const idx = rows.findIndex((r) => r.original.code === highlight);
    if (idx >= 0) {
      const pageSize = table.getState().pagination.pageSize;
      table.setPageIndex(Math.floor(idx / pageSize));
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
    </div>
  );
}
