import Sidebar from './Sidebar'

function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-neutral-950">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

export default Layout
