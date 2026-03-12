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
import { getLanguages, type Language } from '@/data/languages'
import { fuzzyFilterAcronym } from '@/lib/fuzzy-filter'

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
  const [displayLocale, setDisplayLocale] = React.useState('ca')
  const [globalFilter, setGlobalFilter] = React.useState('')

  // Update localized names when display locale changes
  const languagesWithLocalizedNames = React.useMemo(() => {
    const displayNames = new Intl.DisplayNames([displayLocale], { type: 'language' })
    return languages.map(lang => {
      try {
        const localized = displayNames.of(lang.code)
        return {
          ...lang,
          localizedName: (localized && localized !== lang.code) ? localized : undefined,
        }
      } catch {
        return {
          ...lang,
          localizedName: undefined,
        }
      }
    })
  }, [languages, displayLocale])

  const columns = React.useMemo<ColumnDef<Language>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => {
          const hasVariants = row.original.cldrVariants && row.original.cldrVariants.length > 0
          return hasVariants ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                row.toggleExpanded()
              }}
              className="cursor-pointer hover:bg-gray-700 px-2 py-1 rounded"
              type="button"
            >
              {row.getIsExpanded() ? '▼' : '▶'}
            </button>
          ) : null
        },
        size: 40,
        maxSize: 40,
      },
      {
        accessorKey: 'code',
        header: 'Code',
        size: 70,
        maxSize: 70,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 150,
      },
      {
        accessorKey: 'nativeName',
        header: 'Native Name',
        size: 150,
      },
      {
        accessorKey: 'localizedName',
        header: 'Localized Name',
        size: 150,
      },
      {
        accessorKey: 'bcp47Variants',
        header: 'BCP 47 Variants',
        cell: (info) => {
          const variants = info.getValue<string[] | undefined>()
          return variants ? (
            <span className="text-xs">{variants.length} variant{variants.length > 1 ? 's' : ''}</span>
          ) : <span className="text-gray-600">-</span>
        },
        size: 120,
      },
      {
        accessorKey: 'cldrVariants',
        header: 'CLDR',
        cell: (info) => {
          const variants = info.getValue<string[] | undefined>()
          return variants ? (
            <span className="text-xs">{variants.length} variant{variants.length > 1 ? 's' : ''}</span>
          ) : <span className="text-gray-600">-</span>
        },
        size: 100,
      },
      {
        accessorKey: 'intlVariants',
        header: 'Intl Supported',
        cell: (info) => {
          const variants = info.getValue<string[] | undefined>()
          return variants ? (
            <span className="text-xs">{variants.length} variant{variants.length > 1 ? 's' : ''}</span>
          ) : <span className="text-gray-600">-</span>
        },
        size: 120,
      },
    ],
    []
  )

  const table = useReactTable({
    data: languagesWithLocalizedNames,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: (row) => {
      return !!(row.original.cldrVariants && row.original.cldrVariants.length > 0)
    },
    globalFilterFn: 'fuzzy',
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    filterFns: {
      fuzzy: fuzzyFilterAcronym,
    },
  })

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Languages</h1>
      <input
        type="text"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search by name or code…"
        className="w-full px-3 py-2 mb-6 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-400"
      />

      <div className="grid grid-cols-1 gap-6">
        <div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-4">
            <h2 className="text-xl font-semibold text-white">
              ISO 639-1 Language Codes
            </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="displayLocale" className="text-sm text-gray-400">
                Show names in:
              </label>
              <select
                id="displayLocale"
                value={displayLocale}
                onChange={(e) => setDisplayLocale(e.target.value)}
                className="px-3 py-1 bg-gray-700 text-white rounded border border-gray-600"
              >
                <option value="ca">Catalan</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2" style={{ display: 'none' }}>
            ISO 639-1 Language Codes
          </h2>
          <ul className="text-xs text-gray-400 mb-3 space-y-1">
            <li>• Source: IANA Language Subtag Registry + Unicode CLDR 48</li>
            <li>• Standard: ISO 639-1 (2-letter codes)</li>
            <li>• Coverage: 184 major languages</li>
            <li>• Native names & Localized names: Generated via Intl.DisplayNames (use dropdown to change display language)</li>
            <li>• <strong className="text-blue-400">BCP 47 Variants</strong>: Official dialect/orthography variants from IANA</li>
            <li>• <strong className="text-purple-400">CLDR</strong>: All locale data from Unicode (includes regions, scripts, variants)</li>
            <li>• <strong className="text-green-400">Intl</strong>: What your JavaScript runtime actually supports</li>
          </ul>
          <p className="text-sm text-gray-400 mb-4">
            Total: {languages.length} languages
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm text-gray-200">
              <thead className="bg-gray-800 text-gray-100">
                {table.getHeaderGroups().map((headerGroup) => (
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
                {table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-gray-800 transition-colors">
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
                    {row.getIsExpanded() && (
                      <tr className="bg-gray-800/50">
                        {/* Expander column - empty */}
                        <td className="px-4 py-3"></td>

                        {/* Code column - empty */}
                        <td className="px-4 py-3"></td>

                        {/* Name column - empty */}
                        <td className="px-4 py-3"></td>

                        {/* Native Name column - empty */}
                        <td className="px-4 py-3"></td>

                        {/* Localized Name column - empty */}
                        <td className="px-4 py-3"></td>

                        {/* BCP 47 Variants column */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                            {row.original.bcp47Variants?.length ? (
                              row.original.bcp47Variants.map((variant) => (
                                <span
                                  key={variant}
                                  className="px-2 py-1 bg-blue-700 text-white rounded text-xs whitespace-nowrap"
                                >
                                  {variant}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">No official variants</span>
                            )}
                          </div>
                        </td>

                        {/* CLDR column */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                            {row.original.cldrVariants?.length ? (
                              row.original.cldrVariants.map((variant) => (
                                <span
                                  key={variant}
                                  className="px-2 py-1 bg-purple-700 text-white rounded text-xs whitespace-nowrap"
                                >
                                  {variant}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">No CLDR data</span>
                            )}
                          </div>
                        </td>

                        {/* Intl Supported column */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                            {row.original.intlVariants?.length ? (
                              row.original.intlVariants.map((variant) => (
                                <span
                                  key={variant}
                                  className="px-2 py-1 bg-green-700 text-white rounded text-xs whitespace-nowrap"
                                >
                                  {variant}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">No Intl support</span>
                            )}
                          </div>
                        </td>
                      </tr>
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
              {[10, 20, 50, 100, languages.length].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize === languages.length ? 'Show All' : `Show ${pageSize}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
