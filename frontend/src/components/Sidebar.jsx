import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Receipt,
  Building2,
  Percent,
  Settings,
  Moon,
  Sun,
  Zap,
  HelpCircle,
} from 'lucide-react'
import { useDarkMode } from '../contexts/DarkMode'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/prestations', label: 'Prestations', icon: Briefcase },
  { to: '/devis', label: 'Devis', icon: FileText },
  { to: '/factures', label: 'Factures', icon: Receipt },
  { to: '/urssaf', label: 'URSSAF', icon: Building2 },
  { to: '/tva', label: 'TVA', icon: Percent },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
  { to: '/aide', label: 'Aide', icon: HelpCircle },
]

function Sidebar() {
  const { dark, toggle } = useDarkMode()

  return (
    <aside className="sidebar-group group relative flex flex-col h-screen w-[60px] hover:w-[220px] transition-[width] duration-200 ease-out bg-[#0a0c10] border-r border-[#1a2236] overflow-hidden shrink-0 z-20">

      {/* Espace traffic lights macOS (hiddenInset titlebar) */}
      <div className="h-10 shrink-0 drag-region" />

      {/* Logo */}
      <div className="flex items-center h-12 px-[18px] border-b border-[#1a2236] shrink-0">
        <div className="w-6 h-6 rounded-md bg-accent-500 flex items-center justify-center shrink-0 shadow-lg shadow-accent-500/20">
          <Zap size={13} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="sidebar-label ml-3 text-sm font-semibold text-slate-200 tracking-tight">
          Facturation
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center h-10 px-[18px] mb-0.5 transition-colors duration-150 border-l-2 ${
                isActive
                  ? 'bg-accent-400/10 text-accent-400 border-accent-400'
                  : 'text-slate-400 hover:bg-[#161b27] hover:text-slate-200 border-transparent'
              }`
            }
          >
            <Icon size={18} className="shrink-0" strokeWidth={1.75} />
            <span className="sidebar-label ml-3 text-sm font-medium">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Dark mode toggle */}
      <div className="shrink-0 border-t border-[#1a2236] p-2">
        <button
          onClick={toggle}
          className="flex items-center w-full h-10 px-[14px] rounded-lg text-slate-400 hover:bg-[#161b27] hover:text-slate-200 transition-colors duration-150"
        >
          {dark ? (
            <Sun size={18} className="shrink-0" strokeWidth={1.75} />
          ) : (
            <Moon size={18} className="shrink-0" strokeWidth={1.75} />
          )}
          <span className="sidebar-label ml-3 text-sm font-medium">
            {dark ? 'Mode clair' : 'Mode sombre'}
          </span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
