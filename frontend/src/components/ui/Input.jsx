function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 text-sm rounded-lg border shadow-sm transition-colors
          bg-white dark:bg-[#0f1117]
          text-gray-900 dark:text-slate-200
          placeholder:text-gray-400 dark:placeholder:text-slate-600
          focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500
          dark:focus:ring-accent-500/20 dark:focus:border-accent-500
          ${error ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-[#1e2a3a]'}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default Input
