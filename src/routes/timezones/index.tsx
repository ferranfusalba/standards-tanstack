import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { getTimezonesFromIntl, getTimezonesFromIANA, type Timezone } from '@/data/timezones'
import { fuzzyFilter } from '@/lib/fuzzy-filter'

export const Route = createFileRoute('/timezones/')({
  component: Timezones,
  loader: async () => {
    const [timezonesIntl, timezonesIANA] = await Promise.all([
      getTimezonesFromIntl(),
      getTimezonesFromIANA()
    ])
    return {
      timezonesIntl,
      timezonesIANA
    }
  },
  head: () => ({
    meta: [
      {
        title: 'Timezones | Standards',
      },
    ],
  }),
})

function Timezones() {
  const { timezonesIntl, timezonesIANA } = Route.useLoaderData()
  const [globalFilter, setGlobalFilter] = React.useState('')

  const columns = React.useMemo<ColumnDef<Timezone>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'offset',
        header: 'Offset',
      },
      {
        accessorKey: 'region',
        header: 'Region',
      },
    ],
    []
  )

  const tableIntl = useReactTable({
    data: timezonesIntl,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'fuzzy',
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
  })

  const tableIANA = useReactTable({
    data: timezonesIANA,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'fuzzy',
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
  })

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Timezones</h1>
      <input
        type="text"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search by name, ID or region…"
        className="w-full px-3 py-2 mb-6 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-400"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Intl API (Option A) */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Intl API (Built-in)
          </h2>
          <ul className="text-xs text-gray-400 mb-3 space-y-1">
            <li>• Source: JavaScript runtime's built-in database</li>
            <li>• Updates: Tied to Node.js version updates</li>
            <li>• Coverage: Only timezones supported by runtime</li>
            <li>• Performance: Instant (no network call)</li>
            <li>• Includes canonical zones + common aliases</li>
          </ul>
          <p className="text-sm text-gray-400 mb-4">
            Total: {timezonesIntl.length} timezones
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm text-gray-200">
              <thead className="bg-gray-800 text-gray-100">
                {tableIntl.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left">
                        {header.isPlaceholder ? null : (
                          <div
                            className={
                              header.column.getCanSort()
                                ? 'cursor-pointer select-none flex items-center gap-2'
                                : ''
                            }
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-700">
                {tableIntl.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-800 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => tableIntl.setPageIndex(0)}
                disabled={!tableIntl.getCanPreviousPage()}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                {'<<'}
              </button>
              <button
                onClick={() => tableIntl.previousPage()}
                disabled={!tableIntl.getCanPreviousPage()}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                {'<'}
              </button>
              <button
                onClick={() => tableIntl.nextPage()}
                disabled={!tableIntl.getCanNextPage()}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                {'>'}
              </button>
              <button
                onClick={() => tableIntl.setPageIndex(tableIntl.getPageCount() - 1)}
                disabled={!tableIntl.getCanNextPage()}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                {'>>'}
              </button>
            </div>
            <span className="text-sm text-gray-400">
              {tableIntl.getState().pagination.pageIndex + 1}/{tableIntl.getPageCount()}
            </span>
            <select
              value={tableIntl.getState().pagination.pageSize}
              onChange={e => tableIntl.setPageSize(Number(e.target.value))}
              className="px-3 py-1 bg-gray-700 text-white rounded"
            >
              {[10, 20, 50, 100, timezonesIntl.length].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize === timezonesIntl.length ? 'Show All' : `Show ${pageSize}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: IANA Official (Option B) */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">
            IANA Official Data
          </h2>
          <ul className="text-xs text-gray-400 mb-3 space-y-1">
            <li>• Source: Official IANA tzdata repository</li>
            <li>• Updates: Real-time from authoritative source</li>
            <li>• Coverage: All canonical zones (inhabited since 1970)</li>
            <li>• Performance: Requires network fetch</li>
            <li>• Only canonical zones (no aliases)</li>
          </ul>
          <p className="text-sm text-gray-400 mb-4">
            Total: {timezonesIANA.length} timezones
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm text-gray-200">
              <thead className="bg-gray-800 text-gray-100">
                {tableIANA.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left">
                        {header.isPlaceholder ? null : (
                          <div
                            className={
                              header.column.getCanSort()
                                ? 'cursor-pointer select-none flex items-center gap-2'
                                : ''
                            }
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-700">
                {tableIANA.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-800 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => tableIANA.setPageIndex(0)}
                disabled={!tableIANA.getCanPreviousPage()}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                {'<<'}
              </button>
              <button
                onClick={() => tableIANA.previousPage()}
                disabled={!tableIANA.getCanPreviousPage()}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                {'<'}
              </button>
              <button
                onClick={() => tableIANA.nextPage()}
                disabled={!tableIANA.getCanNextPage()}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                {'>'}
              </button>
              <button
                onClick={() => tableIANA.setPageIndex(tableIANA.getPageCount() - 1)}
                disabled={!tableIANA.getCanNextPage()}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                {'>>'}
              </button>
            </div>
            <span className="text-sm text-gray-400">
              {tableIANA.getState().pagination.pageIndex + 1}/{tableIANA.getPageCount()}
            </span>
            <select
              value={tableIANA.getState().pagination.pageSize}
              onChange={e => tableIANA.setPageSize(Number(e.target.value))}
              className="px-3 py-1 bg-gray-700 text-white rounded"
            >
              {[10, 20, 50, 100, timezonesIANA.length].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize === timezonesIANA.length ? 'Show All' : `Show ${pageSize}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
