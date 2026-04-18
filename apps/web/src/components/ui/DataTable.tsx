'use client'

import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  rows: T[]
  columns: DataTableColumn<T>[]
  rowKey: (row: T) => string
  emptyMessage?: string
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  emptyMessage = 'No data',
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px]" role="table">
        <thead className="bg-surface-2/80">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left text-label uppercase tracking-wide text-text-tertiary',
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-8 text-center text-body-sm text-text-tertiary" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={rowKey(row)} className="bg-surface/20">
              {columns.map((column) => (
                <td key={column.key} className={cn('px-4 py-3 text-body-sm text-text-secondary', column.className)}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
