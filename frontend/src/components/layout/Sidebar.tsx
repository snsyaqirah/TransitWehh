import { NavLink } from 'react-router-dom'
import { BarChart2, TrendingUp, GitCompare, Train, Lightbulb, BrainCircuit, Table2, Moon, Sun, X, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme'
import { useState } from 'react'

const NAV = [
  { to: '/',         label: 'Overview',    icon: BarChart2 },
  { to: '/trends',   label: 'Trends',      icon: TrendingUp },
  { to: '/compare',  label: 'Compare',     icon: GitCompare },
  { to: '/ktmb',     label: 'KTMB',        icon: Train },
  { to: '/insights', label: 'Insights',    icon: Lightbulb },
  { to: '/predict',  label: 'Predictions', icon: BrainCircuit },
  { to: '/explorer', label: 'Explorer',    icon: Table2 },
]

export function Sidebar() {
  const { theme, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navContent = (
    <>
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <Train size={14} className="text-primary-foreground" />
        </div>
        <span className="font-bold text-base tracking-tight">TransitWehh</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <button
          onClick={toggle}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <div className="mt-3 text-xs text-muted-foreground">
          Data: <a href="https://data.gov.my" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">data.gov.my</a>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-border bg-card h-screen sticky top-0 shrink-0">
        {navContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <Train size={12} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">TransitWehh</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-1 text-muted-foreground hover:text-foreground">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 w-56 bg-card border-r border-border flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <span className="font-bold text-sm">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-0.5">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-border">
              <button onClick={toggle} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full">
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
