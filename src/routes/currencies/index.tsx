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
import { getCurrencies, type Currency } from '@/data/currencies'
import { fuzzyFilter } from '@/lib/fuzzy-filter'

export const Route = createFileRoute('/currencies/')({
  component: Currencies,
  loader: async () => {
    const currencies = await getCurrencies()
    return { currencies }
  },
  head: () => ({
    meta: [
      {
        title: 'Currencies | Standards',
      },
    ],
  }),
})

function Currencies() {
  const { currencies } = Route.useLoaderData()

  const columns = React.useMemo<ColumnDef<Currency>[]>(
    () => [
      {
        accessorKey: 'symbolUnicode',
        header: 'Symbol (Unicode)',
      },
      {
        accessorKey: 'symbolIntl',
        header: 'Symbol (Intl)',
      },
      {
        accessorKey: 'code',
        header: 'Code',
      },
      {
        accessorKey: 'numericCode',
        header: 'Numeric Code',
      },
      {
        accessorKey: 'type',
        header: 'Type',
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'minorUnit',
        header: 'Minor Unit',
      },
      {
        accessorKey: 'countries',
        header: 'Countries',
        cell: (info) => info.getValue<string[]>()?.join(', ') || '-',
      },
      {
        accessorKey: 'status',
        header: 'Status',
      },
      {
        accessorKey: 'introducedDate',
        header: 'Introduced',
      },
      {
        accessorKey: 'withdrawnDate',
        header: 'Withdrawn',
      },
      {
        accessorKey: 'namePlural',
        header: 'Plural Name',
      },
      {
        accessorKey: 'definitions',
        header: 'Definitions of the fund types',
      },
    ],
    []
  )

  const table = useReactTable({
    data: currencies,
    columns,
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
      <h1 className="text-3xl font-bold text-white mb-6">Currencies</h1>

      <div>
        <h2 className="text-xl font-semibold text-white mb-2">ISO 4217 (SIX Group List One)</h2>
        <ul className="text-xs text-gray-400 mb-3 space-y-1">
          <li>• Source: SIX Group on behalf of ISO</li>
          <li>• Standard: ISO 4217 currency codes</li>
          <li>• Includes: Alphabetic codes, numeric codes, minor units</li>
          <li>• Coverage: Active currencies worldwide</li>
        </ul>
        <p className="text-sm text-gray-400 mb-4">
          Total: {currencies.length} currencies
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm text-gray-200">
            <thead className="bg-gray-800 text-gray-100">
              {table.getHeaderGroups().map((headerGroup) => (
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
              {table.getRowModel().rows.map((row) => (
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
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
            >
              {'<<'}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
            >
              {'<'}
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
            >
              {'>'}
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
            >
              {'>>'}
            </button>
          </div>
          <span className="text-sm text-gray-400">
            {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="px-3 py-1 bg-gray-700 text-white rounded"
          >
            {[10, 20, 50, 100, currencies.length].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize === currencies.length ? 'Show All' : `Show ${pageSize}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
