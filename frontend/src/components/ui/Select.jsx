function Select({ label, options, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <select
        className="w-full px-3 py-2 text-sm rounded-lg border shadow-sm transition-colors
          bg-white dark:bg-[#0f1117]
          text-gray-900 dark:text-slate-200
          border-gray-200 dark:border-[#1e2a3a]
          focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500
          dark:focus:ring-accent-500/20 dark:focus:border-accent-500"
        {...props}
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Select
