import { Bell, Menu, RefreshCw, Settings, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

interface TopNavbarProps {
  onOpenMenu: () => void
}

export function TopNavbar({ onOpenMenu }: TopNavbarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-outline/60 bg-white/90 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg p-2 hover:bg-surface-soft md:hidden"
          onClick={onOpenMenu}
          aria-label="Mở menu"
        >
          <Menu size={21} />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <span className="font-headline text-2xl font-bold tracking-tight text-primary">InnoLabs</span>
          <span className="hidden rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary sm:inline">
            ads.innolabs.vn
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to="/config"
          className="rounded-full p-2 text-muted transition hover:bg-surface-soft hover:text-primary"
          title="Cấu hình hệ thống"
        >
          <Settings size={19} />
        </Link>

        {/* User Profile */}
        <div className="flex items-center gap-2 rounded-full border border-outline bg-surface-soft py-1 pl-1 pr-3">
          <div className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-white shadow-sm">
            AD
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold leading-tight text-ink">admin</p>
            <p className="text-[10px] leading-tight text-muted">Storefront</p>
          </div>
        </div>
      </div>
    </header>
  )
}
