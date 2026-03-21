import {
  flexRender,
  type Row,
  type Table as TanStackTable,
} from "@tanstack/react-table";
import React from "react";
import { ColumnFilter } from "@/components/ColumnFilter";

interface DataTableProps<TData> {
  table: TanStackTable<TData>;
  cellClassName?: (columnId: string, row: Row<TData>) => string;
  headerClassName?: (columnId: string) => string;
  renderExpandedRow?: (row: Row<TData>) => React.ReactNode;
}

const stickyFirstCol =
  "sticky left-0 z-10 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-border";

export function DataTable<TData>({
  table,
  cellClassName,
  headerClassName,
  renderExpandedRow,
}: DataTableProps<TData>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-secondary-foreground">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="h-12">
              {headerGroup.headers.map((header, index) => {
                const filterable =
                  (
                    header.column.columnDef.meta as
                      | { filterable?: boolean }
                      | undefined
                  )?.filterable === true;
                return (
                  <th
                    key={header.id}
                    className={`px-2 py-2 md:px-4 md:py-3 text-left border-r border-black/20 dark:border-white/20 last:border-r-0 ${index === 0 ? `${stickyFirstCol} bg-secondary` : ""} ${headerClassName?.(header.column.id) ?? ""}`}
                    style={{
                      width: header.column.getSize(),
                      minWidth: header.column.getSize(),
                      maxWidth: header.column.getSize(),
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-1 justify-between">
                        {/* biome-ignore lint/a11y/noStaticElementInteractions: role is conditionally set for sortable columns */}
                        <div
                          className={
                            header.column.getCanSort()
                              ? "cursor-pointer select-none flex items-center gap-2"
                              : ""
                          }
                          role={
                            header.column.getCanSort() ? "button" : undefined
                          }
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            if (
                              header.column.getCanSort() &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault();
                              header.column.getToggleSortingHandler()?.(e);
                            }
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: " \u{1F53C}",
                            desc: " \u{1F53D}",
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                        {filterable && <ColumnFilter column={header.column} />}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-border">
          {table.getRowModel().rows.map((row) => (
            <React.Fragment key={row.id}>
              <tr className="group/row hover:bg-accent transition-colors h-12">
                {row.getVisibleCells().map((cell, index) => (
                  <td
                    key={cell.id}
                    className={`px-2 py-1 md:px-4 md:py-1 h-12 align-middle ${index === 0 ? `${stickyFirstCol} bg-background group-hover/row:bg-accent` : ""} ${cellClassName?.(cell.column.id, cell.row) ?? ""}`}
                    style={{
                      width: cell.column.getSize(),
                      minWidth: cell.column.getSize(),
                      maxWidth: cell.column.getSize(),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
              {row.getIsExpanded() && renderExpandedRow?.(row)}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
