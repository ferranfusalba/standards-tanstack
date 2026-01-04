import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { getTimezones, type Timezone } from '@/data/timezones'
import { fuzzyFilter } from '@/lib/fuzzy-filter'

export const Route = createFileRoute('/timezones/')({
  component: Timezones,
  loader: async () => {
    const timezones = await getTimezones()
    return { timezones }
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
  const { timezones } = Route.useLoaderData()

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

  const table = useReactTable({
    data: timezones,
    columns,
    getCoreRowModel: getCoreRowModel(),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
  })

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Timezones</h1>

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
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Offset</th>
                  <th className="px-4 py-3 text-left">Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {timezones.map((timezone) => (
                  <tr key={timezone.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 font-medium">{timezone.id}</td>
                    <td className="px-4 py-3">{timezone.name}</td>
                    <td className="px-4 py-3">{timezone.offset}</td>
                    <td className="px-4 py-3">{timezone.region}</td>
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
