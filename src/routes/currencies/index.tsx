import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  flexRender,
  getCoreRowModel,
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
        accessorKey: 'code',
        header: 'Code',
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'symbol',
        header: 'Symbol',
      },
      {
        accessorKey: 'numericCode',
        header: 'Numeric Code',
      },
    ],
    []
  )

  const table = useReactTable({
    data: currencies,
    columns,
    getCoreRowModel: getCoreRowModel(),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
  })

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Currencies</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* TanStack Table */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">TanStack Table</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm text-gray-200">
              <thead className="bg-gray-800 text-gray-100">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
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
        </div>

        {/* Custom Table */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Custom Table</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm text-gray-200">
              <thead className="bg-gray-800 text-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Symbol</th>
                  <th className="px-4 py-3 text-left">Numeric Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {currencies.map((currency) => (
                  <tr key={currency.code} className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 font-medium">{currency.code}</td>
                    <td className="px-4 py-3">{currency.name}</td>
                    <td className="px-4 py-3">{currency.symbol}</td>
                    <td className="px-4 py-3">{currency.numericCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
