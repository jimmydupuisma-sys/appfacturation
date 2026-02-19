function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-[#1e2a3a] shadow-sm dark:shadow-none ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 dark:border-[#1e2a3a] ${className}`}>
      {children}
    </div>
  )
}

function CardContent({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}

export { Card, CardHeader, CardContent }
