import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { getCountries, type Country } from '@/data/countries'
import { fuzzyFilter } from '@/lib/fuzzy-filter'

export const Route = createFileRoute('/countries/')({
  component: Countries,
  loader: async () => {
    const countries = await getCountries()
    return { countries }
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
  const { countries } = Route.useLoaderData()

  const columns = React.useMemo<ColumnDef<Country>[]>(
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
        accessorKey: 'capital',
        header: 'Capital',
      },
      {
        accessorKey: 'continent',
        header: 'Continent',
      },
      {
        accessorKey: 'population',
        header: 'Population',
        cell: (info) => info.getValue<number>().toLocaleString(),
      },
    ],
    []
  )

  const table = useReactTable({
    data: countries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
  })

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Countries</h1>

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
                  <th className="px-4 py-3 text-left">Capital</th>
                  <th className="px-4 py-3 text-left">Continent</th>
                  <th className="px-4 py-3 text-left">Population</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {countries.map((country) => (
                  <tr key={country.code} className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 font-medium">{country.code}</td>
                    <td className="px-4 py-3">{country.name}</td>
                    <td className="px-4 py-3">{country.capital}</td>
                    <td className="px-4 py-3">{country.continent}</td>
                    <td className="px-4 py-3">{country.population.toLocaleString()}</td>
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
