import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { getCountries, getCountriesFromUN, getMissingCountries, type Country } from '@/data/countries'
import { fuzzyFilter } from '@/lib/fuzzy-filter'

export const Route = createFileRoute('/countries/')({
  component: Countries,
  loader: async () => {
    const [countriesIntl, countriesUN, countriesMissing] = await Promise.all([
      getCountries(),
      getCountriesFromUN(),
      getMissingCountries()
    ])
    return {
      countriesIntl,
      countriesUN,
      countriesMissing
    }
  },
  head: () => ({
    meta: [
      {
        title: 'Countries | Standards',
      },
    ],
  }),
})

function Countries() {
  const { countriesIntl, countriesUN, countriesMissing } = Route.useLoaderData()

  const columnsIntl = React.useMemo<ColumnDef<Country>[]>(
    () => [
      {
        accessorKey: 'flag',
        header: 'Flag',
        cell: (info) => <span className="text-2xl">{info.getValue<string>()}</span>,
        size: 60,
        maxSize: 60,
      },
      {
        accessorKey: 'code',
        header: 'A2',
        size: 60,
        maxSize: 60,
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
    ],
    []
  )

  const columnsUN = React.useMemo<ColumnDef<Country>[]>(
    () => [
      {
        accessorKey: 'flag',
        header: 'Flag',
        cell: (info) => <span className="text-2xl">{info.getValue<string>()}</span>,
        size: 60,
        maxSize: 60,
      },
      {
        accessorKey: 'code',
        header: 'A2',
        size: 60,
        maxSize: 60,
      },
      {
        accessorKey: 'code3',
        header: 'A3',
        size: 70,
        maxSize: 70,
      },
      {
        accessorKey: 'vehicleCode',
        header: 'Vehicle',
        size: 80,
        maxSize: 80,
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
    ],
    []
  )

  const tableIntl = useReactTable({
    data: countriesIntl,
    columns: columnsIntl,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
  })

  const tableUN = useReactTable({
    data: countriesUN,
    columns: columnsUN,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
  })

  const columnsMissing = React.useMemo<ColumnDef<Country>[]>(
    () => [
      {
        accessorKey: 'flag',
        header: 'Flag',
        cell: (info) => <span className="text-2xl">{info.getValue<string>()}</span>,
        size: 60,
        maxSize: 60,
      },
      {
        accessorKey: 'code',
        header: 'A2',
        size: 60,
        maxSize: 60,
      },
      {
        accessorKey: 'code3',
        header: 'A3',
        size: 70,
        maxSize: 70,
      },
      {
        accessorKey: 'vehicleCode',
        header: 'Vehicle',
        size: 80,
        maxSize: 80,
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
    ],
    []
  )

  const tableMissing = useReactTable({
    data: countriesMissing,
    columns: columnsMissing,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
      <h1 className="text-3xl font-bold text-white mb-6">Countries</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Intl API */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Intl API (Built-in)
          </h2>
          <ul className="text-xs text-gray-400 mb-3 space-y-1">
            <li>• Source: JavaScript runtime's built-in database</li>
            <li>• Standard: ISO 3166-1 Alpha-2 codes</li>
            <li>• Updates: Tied to Node.js version updates</li>
            <li>• Coverage: All ISO country codes</li>
            <li>• Addons: None</li>
          </ul>
          <p className="text-sm text-gray-400 mb-4">
            Total: {countriesIntl.length} countries
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm text-gray-200">
              <thead className="bg-gray-800 text-gray-100">
                {tableIntl.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left"
                        style={{
                          width: header.column.getSize(),
                          minWidth: header.column.getSize(),
                          maxWidth: header.column.getSize()
                        }}
                      >
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
                      <td
                        key={cell.id}
                        className="px-4 py-3 whitespace-nowrap"
                        style={{
                          width: cell.column.getSize(),
                          minWidth: cell.column.getSize(),
                          maxWidth: cell.column.getSize()
                        }}
                      >
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
              {[10, 20, 50, 100, countriesIntl.length].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize === countriesIntl.length ? 'Show All' : `Show ${pageSize}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: UN M49 */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">
            UN M49 Standard (Official)
          </h2>
          <ul className="text-xs text-gray-400 mb-3 space-y-1">
            <li>• Source: United Nations Statistics Division</li>
            <li>• Standard: ISO 3166-1 Alpha-2/Alpha-3 + UN M49 numeric codes</li>
            <li>• Updates: Manually updated from official UN source</li>
            <li>• Coverage: All 249 officially assigned countries and territories</li>
            <li>• Addons: Vienna Convention vehicle plate codes (UNECE)</li>
          </ul>
          <p className="text-sm text-gray-400 mb-4">
            Total: {countriesUN.length} countries
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm text-gray-200">
              <thead className="bg-gray-800 text-gray-100">
                {tableUN.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left"
                        style={{
                          width: header.column.getSize(),
                          minWidth: header.column.getSize(),
                          maxWidth: header.column.getSize()
                        }}
                      >
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
                {tableUN.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-800 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 whitespace-nowrap"
                        style={{
                          width: cell.column.getSize(),
                          minWidth: cell.column.getSize(),
                          maxWidth: cell.column.getSize()
                        }}
                      >
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
                onClick={() => tableUN.setPageIndex(0)}
                disabled={!tableUN.getCanPreviousPage()}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                {'<<'}
              </button>
              <button
                onClick={() => tableUN.previousPage()}
                disabled={!tableUN.getCanPreviousPage()}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                {'<'}
              </button>
              <button
                onClick={() => tableUN.nextPage()}
                disabled={!tableUN.getCanNextPage()}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                {'>'}
              </button>
              <button
                onClick={() => tableUN.setPageIndex(tableUN.getPageCount() - 1)}
                disabled={!tableUN.getCanNextPage()}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                {'>>'}
              </button>
            </div>
            <span className="text-sm text-gray-400">
              {tableUN.getState().pagination.pageIndex + 1}/{tableUN.getPageCount()}
            </span>
            <select
              value={tableUN.getState().pagination.pageSize}
              onChange={e => tableUN.setPageSize(Number(e.target.value))}
              className="px-3 py-1 bg-gray-700 text-white rounded"
            >
              {[10, 20, 50, 100, countriesUN.length].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize === countriesUN.length ? 'Show All' : `Show ${pageSize}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Missing Countries Section */}
      <div className="mt-6">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Missing Countries (Not in Official Standards)
        </h2>
        <ul className="text-xs text-gray-400 mb-3 space-y-1">
          <li>• Kosovo: User-assigned code (XK) used by EU, IMF, SWIFT</li>
          <li>• Taiwan: Listed in UN M49 but not a UN member state</li>
          <li>• Note: These have emoji flags and ISO codes but special status</li>
        </ul>
        <p className="text-sm text-gray-400 mb-4">
          Total: {countriesMissing.length} countries
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm text-gray-200">
            <thead className="bg-gray-800 text-gray-100">
              {tableMissing.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left"
                      style={{ width: header.column.getSize() }}
                    >
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
              {tableMissing.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-800 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3"
                      style={{ width: cell.column.getSize() }}
                    >
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
      </div>
    </div>
  )
}
