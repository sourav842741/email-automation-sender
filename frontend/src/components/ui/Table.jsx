import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export default function Table({ columns, data, loading, emptyMessage = 'No data found', sortKey, sortDir, onSort, className = '' }) {
  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-100 dark:border-zinc-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-6 py-4 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400' : ''}`}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1.5">
                  {col.label}
                  {col.sortable && (
                    sortKey === col.key ? (
                      sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-indigo-500" />
                        : <ChevronDown className="h-3.5 w-3.5 text-indigo-500" />
                    ) : <ChevronsUpDown className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
          {data.map((row, i) => (
            <tr
              key={row._id || row.id || i}
              className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-sm text-gray-700 dark:text-zinc-300">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
