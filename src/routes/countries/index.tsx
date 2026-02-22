import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
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

type Subdivision = NonNullable<Country['subdivisions']>[number]

function toFlag(alpha2: string): string {
  return [...alpha2.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
}

function SubdivisionsExpandedRow({ subs, colSpan }: { subs: Subdivision[]; colSpan: number }) {
  const langCodes = [...new Set(subs.flatMap(sub => Object.keys(sub.names)))]
  const hasType = subs.some(sub => sub.type !== undefined)
  return (
    <tr className="bg-gray-800/50">
      <td colSpan={colSpan} className="px-6 py-3">
        <table className="text-xs text-gray-300 w-auto">
          <thead>
            <tr className="text-gray-500">
              <th className="pr-4 pb-1 text-left font-normal">Flag</th>
              <th className="pr-6 pb-1 text-left font-normal">Code</th>
              {hasType && <th className="pr-6 pb-1 text-left font-normal">Type</th>}
              {langCodes.map(lang => (
                <th key={lang} className="pr-6 pb-1 text-left font-normal">{lang}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subs.map((sub) => {
              const flag = sub.flag ?? (sub.iso1 ? toFlag(sub.iso1) : undefined)
              return (
                <tr key={sub.code}>
                  <td className="pr-4 py-0.5">{flag ?? ''}</td>
                  <td className="pr-6 py-0.5 font-mono">
                    {sub.code}
                    {sub.iso1 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-blue-900 text-blue-300 rounded">{sub.iso1}</span>
                    )}
                  </td>
                  {hasType && <td className="pr-6 py-0.5 text-gray-400">{sub.type ? Object.entries(sub.type).map(([lang, name]) => `${name} (${lang})`).join(', ') : ''}</td>}
                  {langCodes.map(lang => (
                    <td key={lang} className="pr-6 py-0.5">{sub.names[lang] ?? ''}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </td>
    </tr>
  )
}

function getCellHighlight(colId: string, original: Country): string {
  if (colId === 'icaoCode' && original.icaoCode && original.icaoCode !== original.alpha3Code) return 'bg-red-950 text-red-300'
  if (colId === 'dsitCode' && original.dsitCode && original.dsitCode !== original.alpha2Code && original.dsitCode !== original.alpha3Code) return 'bg-red-950 text-red-300'
  if (colId === 'iocCode' && original.iocCode && original.iocCode !== original.alpha3Code) return 'bg-red-950 text-red-300'
  if (colId === 'unMembership') {
    if (original.unMembership === 'member') return 'bg-green-950 text-green-300'
    if (original.unMembership === 'observer') return 'bg-blue-950 text-blue-300'
    if (original.unMembership === 'non-member') return 'bg-red-950 text-red-300'
    if (original.sovereignState) return 'bg-gray-800 text-gray-400'
  }
  if (colId === 'euMember' && original.euMember) return 'bg-green-950 text-green-300'
  return ''
}

function Countries() {
  const { countriesIntl, countriesUN, countriesMissing } = Route.useLoaderData()
  const [intlGlobalFilter, setIntlGlobalFilter] = React.useState('')
  const [unGlobalFilter, setUnGlobalFilter] = React.useState('')

  const columnsIntl = React.useMemo<ColumnDef<Country>[]>(
    () => [
      {
        accessorKey: 'flag',
        header: 'Flag',
        cell: (info) => <span className="text-2xl">{info.getValue<string>()}</span>,
        size: 60,
        maxSize: 60,
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'alpha2Code',
        header: 'Alpha-2',
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

  const columnsUN = React.useMemo<ColumnDef<Country>[]>(
    () => [
      {
        accessorKey: 'flag',
        header: 'Flag',
        cell: (info) => <span className="text-2xl">{info.getValue<string>()}</span>,
        size: 60,
        maxSize: 60,
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'alpha2Code',
        header: 'Alpha-2',
        size: 80,
        maxSize: 80,
      },
      {
        accessorKey: 'alpha3Code',
        header: 'Alpha-3',
        size: 80,
        maxSize: 80,
      },
      {
        accessorKey: 'subdivisions',
        header: '3166-2',
        size: 70,
        maxSize: 70,
        cell: ({ row }) => {
          const subs = row.original.subdivisions
          if (!subs?.length) return <span className="text-gray-600">-</span>
          return (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); row.toggleExpanded() }}
              className="cursor-pointer hover:bg-gray-700 px-2 py-1 rounded flex items-center gap-1"
            >
              <span>{subs.length}</span>
              <span className="text-xs">{row.getIsExpanded() ? '▼' : '▶'}</span>
            </button>
          )
        },
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'icaoCode',
        header: 'ICAO',
        size: 90,
        maxSize: 90,
        cell: (info) => info.getValue<string>() ?? '-',
      },
      {
        accessorKey: 'dsitCode',
        header: 'DSIT',
        size: 80,
        maxSize: 80,
        cell: (info) => info.getValue<string>() ?? '-',
      },
      {
        accessorKey: 'iocCode',
        header: 'IOC',
        size: 70,
        maxSize: 70,
        cell: (info) => info.getValue<string>() ?? '-',
      },
      {
        accessorKey: 'unMembership',
        header: '🇺🇳',
        size: 50,
        maxSize: 50,
        cell: (info) => info.row.original.sovereignState ?? '',
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'euMember',
        header: '🇪🇺',
        size: 50,
        maxSize: 50,
        cell: () => '',
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'region',
        header: 'Region',
        size: 100,
        maxSize: 100,
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
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'includesString',
    state: { globalFilter: intlGlobalFilter },
    onGlobalFilterChange: setIntlGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    filterFns: { fuzzy: fuzzyFilter },
  })

  const tableUN = useReactTable({
    data: countriesUN,
    columns: columnsUN,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: (row) => !!(row.original.subdivisions?.length),
    globalFilterFn: 'includesString',
    state: { globalFilter: unGlobalFilter },
    onGlobalFilterChange: setUnGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    filterFns: { fuzzy: fuzzyFilter },
  })

  const columnsMissing = React.useMemo<ColumnDef<Country>[]>(
    () => [
      {
        accessorKey: 'flag',
        header: 'Flag',
        cell: (info) => <span className="text-2xl">{info.getValue<string>()}</span>,
        size: 60,
        maxSize: 60,
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'alpha2Code',
        header: 'Alpha-2',
        size: 80,
        maxSize: 80,
      },
      {
        accessorKey: 'alpha3Code',
        header: 'Alpha-3',
        size: 80,
        maxSize: 80,
      },
      {
        accessorKey: 'icaoCode',
        header: 'ICAO',
        size: 90,
        maxSize: 90,
        cell: (info) => info.getValue<string>() ?? '-',
      },
      {
        accessorKey: 'dsitCode',
        header: 'DSIT',
        size: 80,
        maxSize: 80,
        cell: (info) => info.getValue<string>() ?? '-',
      },
      {
        accessorKey: 'iocCode',
        header: 'IOC',
        size: 70,
        maxSize: 70,
        cell: (info) => info.getValue<string>() ?? '-',
      },
      {
        accessorKey: 'unMembership',
        header: '🇺🇳',
        size: 50,
        maxSize: 50,
        cell: (info) => info.row.original.sovereignState ?? '',
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'euMember',
        header: '🇪🇺',
        size: 50,
        maxSize: 50,
        cell: () => '',
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'region',
        header: 'Region',
        size: 100,
        maxSize: 100,
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: (info) => info.getValue<string>() ?? '',
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
    filterFns: { fuzzy: fuzzyFilter },
  })

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Countries</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left: Intl API */}
        <div className="md:col-span-1">
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
          <input
            type="text"
            value={intlGlobalFilter}
            onChange={e => setIntlGlobalFilter(e.target.value)}
            placeholder="Search by name or code…"
            className="w-full px-3 py-2 mb-3 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-400"
          />
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
        <div className="md:col-span-3">
          <h2 className="text-xl font-semibold text-white mb-2">
            UN M49 Standard (Official)
          </h2>
          <ul className="text-xs text-gray-400 mb-3 space-y-1">
            <li>• Source: United Nations Statistics Division</li>
            <li>• Standard: ISO 3166-1 Alpha-2/Alpha-3 + UN M49 numeric codes</li>
            <li>• Updates: Manually updated from official UN source</li>
            <li>• Coverage: All 249 officially assigned countries and territories</li>
            <li>• Addons: ICAO 9303 passport codes, DSIT vehicle codes, IOC Olympic codes, UN &amp; EU membership</li>
          </ul>
          <input
            type="text"
            value={unGlobalFilter}
            onChange={e => setUnGlobalFilter(e.target.value)}
            placeholder="Search by name or code…"
            className="w-full px-3 py-2 mb-3 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-400"
          />
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
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-gray-800 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={`px-4 py-3 whitespace-nowrap ${getCellHighlight(cell.column.id, cell.row.original)}`}
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
                    {row.getIsExpanded() && (
                      <SubdivisionsExpandedRow
                        subs={row.original.subdivisions ?? []}
                        colSpan={row.getVisibleCells().length}
                      />
                    )}
                  </React.Fragment>
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
                      className={`px-4 py-3 ${getCellHighlight(cell.column.id, cell.row.original)}`}
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
