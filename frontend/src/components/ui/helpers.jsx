/** Shared micro-components used across list pages */

export function ActionButton({ children, onClick, title, color = 'gray' }) {
  const colors = {
    sky:   'hover:text-accent-400 hover:bg-accent-400/10',
    red:   'hover:text-red-400 hover:bg-red-400/10',
    green: 'hover:text-emerald-400 hover:bg-emerald-400/10',
    amber: 'hover:text-amber-400 hover:bg-amber-400/10',
    gray:  'hover:text-slate-300 hover:bg-slate-400/10',
  }
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md text-slate-400 dark:text-slate-600 transition-colors ${colors[color]}`}
    >
      {children}
    </button>
  )
}

export function EmptyState({ icon: Icon, message, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#1a2236] flex items-center justify-center mb-3">
        <Icon size={22} className="text-gray-300 dark:text-slate-600" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-gray-400 dark:text-slate-500">{message}</p>
      {sub && <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">{sub}</p>}
    </div>
  )
}

export function TableSkeleton({ cols = 4 }) {
  return (
    <div className="p-6 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="h-8 flex-1 rounded-lg bg-gray-100 dark:bg-[#1a2236] animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function TableHead({ cols }) {
  return (
    <thead>
      <tr className="border-b border-gray-100 dark:border-[#1e2a3a] bg-gray-50/50 dark:bg-[#161b27]">
        {cols.map((col, i) => (
          <th
            key={i}
            className={`px-6 py-3 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide ${
              col.right ? 'text-right' : 'text-left'
            }`}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  )
}

/** Inline input for table-row form lines (Factures / Devis lignes) */
export const lineInputClass =
  'px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-[#1e2a3a] ' +
  'bg-white dark:bg-[#0f1117] text-gray-900 dark:text-slate-200 ' +
  'placeholder:text-gray-400 dark:placeholder:text-slate-600 ' +
  'focus:outline-none focus:ring-1 focus:ring-accent-500/30 focus:border-accent-500 w-full'

/** Class for textarea in modals */
export const textareaClass =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#1e2a3a] ' +
  'bg-white dark:bg-[#0f1117] text-gray-900 dark:text-slate-200 ' +
  'placeholder:text-gray-400 dark:placeholder:text-slate-600 ' +
  'focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500'

/** Class for the "add prestation" dropdown in modals */
export const prestationSelectClass =
  'text-sm rounded-lg border border-gray-200 dark:border-[#1e2a3a] px-2 py-1.5 ' +
  'bg-white dark:bg-[#0f1117] text-gray-700 dark:text-slate-300 ' +
  'focus:outline-none focus:ring-1 focus:ring-accent-500/30 focus:border-accent-500'
