import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { getLanguages, type Language } from '@/data/languages'
import { fuzzyFilter } from '@/lib/fuzzy-filter'

export const Route = createFileRoute('/languages/')({
  component: Languages,
  loader: async () => {
    const languages = await getLanguages()
    return { languages }
  },
  head: () => ({
    meta: [
      {
        title: 'Languages | Standards',
      },
    ],
  }),
})

function Languages() {
  const { languages } = Route.useLoaderData()

  const columns = React.useMemo<ColumnDef<Language>[]>(
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
        accessorKey: 'nativeName',
        header: 'Native Name',
      },
      {
        accessorKey: 'family',
        header: 'Family',
      },
      {
        accessorKey: 'speakers',
        header: 'Speakers',
        cell: (info) => info.getValue<number>().toLocaleString(),
      },
    ],
    []
  )

  const table = useReactTable({
    data: languages,
    columns,
    getCoreRowModel: getCoreRowModel(),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
  })

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Languages</h1>

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
                  <th className="px-4 py-3 text-left">Native Name</th>
                  <th className="px-4 py-3 text-left">Family</th>
                  <th className="px-4 py-3 text-left">Speakers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {languages.map((language) => (
                  <tr key={language.code} className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 font-medium">{language.code}</td>
                    <td className="px-4 py-3">{language.name}</td>
                    <td className="px-4 py-3">{language.nativeName}</td>
                    <td className="px-4 py-3">{language.family}</td>
                    <td className="px-4 py-3">{language.speakers.toLocaleString()}</td>
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
