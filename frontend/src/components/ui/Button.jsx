function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-[#0f1117] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none'

  const variants = {
    primary:   'bg-accent-500 text-white hover:bg-accent-400 focus:ring-accent-500/50 dark:bg-accent-600 dark:hover:bg-accent-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300 dark:bg-[#1a2236] dark:text-slate-300 dark:hover:bg-[#1e2a3a] dark:hover:text-slate-100',
    danger:    'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500/50',
    success:   'bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-500/50',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export default Button
