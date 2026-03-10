import { ReactNode } from 'react'

interface Column<T> {
  key: string
  label: string
  render: (item: T) => ReactNode
  mobileLabel?: string
  hideOnMobile?: boolean
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
}

export default function ResponsiveTable<T>({ 
  data, 
  columns, 
  loading, 
  emptyMessage = 'No data found',
  keyExtractor,
  onRowClick 
}: ResponsiveTableProps<T>) {
  
  if (loading) {
    return (
      <div className="space-y-3">
        {/* Desktop skeleton */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="text-left px-4 py-3 font-medium text-gray-500">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-gray-100">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile skeleton */}
        <div className="md:hidden space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-gray-200">
        {emptyMessage}
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(item => (
              <tr 
                key={keyExtractor(item)} 
                className={`hover:bg-gray-50 transition ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map(item => (
          <div 
            key={keyExtractor(item)}
            className={`bg-white border border-gray-200 rounded-lg p-4 ${onRowClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
            onClick={() => onRowClick?.(item)}
          >
            {columns
              .filter(col => !col.hideOnMobile)
              .map(col => (
                <div key={col.key} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                  <span className="text-xs font-medium text-gray-500 mr-3">
                    {col.mobileLabel || col.label}
                  </span>
                  <div className="text-sm text-gray-900 text-right flex-1">
                    {col.render(item)}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  )
}
