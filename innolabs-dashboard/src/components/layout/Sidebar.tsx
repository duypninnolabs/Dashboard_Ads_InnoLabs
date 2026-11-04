import { LogOut, X } from 'lucide-react'
import { mainNavigation, utilityNavigation } from '../../data/navigation'
import type { NavigationItem } from '../../types/navigation'
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom'
import { useLogout } from '../../hooks/auth.hook'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

function NavLink({ item }: { item: NavigationItem }) {

  const Icon = item.icon

  
 
  return (
    <RouterNavLink
      to={item.href}
      end={item.href === '/'}
      className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-white hover:text-ink'}`}
    >
      <Icon size={20} />
      <span>{item.label}</span>
    </RouterNavLink>
  )
}

export function Sidebar({ open, onClose }: SidebarProps) {
    const navigate=useNavigate()
  const logoutMutation=useLogout()
    const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
        });
      },

      onError: (error:any) => {
        console.error("Logout error:", error);
      },
    });
  };
  return (
    <>
      {open && <button className="fixed inset-0 z-30 bg-ink/30 md:hidden" onClick={onClose} aria-label="Đóng menu" />}
      <aside className={`fixed bottom-0 left-0 top-16 z-40 flex w-72 flex-col bg-surface-soft px-4 py-6 shadow-sidebar transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <button className="absolute right-4 top-4 rounded-lg p-2 hover:bg-white md:hidden" onClick={onClose} aria-label="Đóng menu"><X size={20} /></button>
        <div className="mb-6 px-4">
          <h2 className="font-headline text-lg font-bold text-primary">Meta Ads Spend</h2>
          <p className="text-sm text-muted">Resource Intelligence</p>
        </div>
        <nav className="space-y-1">{mainNavigation.map((item) => <NavLink key={item.label} item={item} />)}</nav>
        {/* <nav className="mt-auto space-y-1 border-t border-outline pt-4">{utilityNavigation.map((item) => <NavLink key={item.label} item={item} />)}</nav> */}
        <nav className="mt-auto space-y-1 border-t border-outline pt-4">
            <button
      type="button"
      onClick={handleLogout}
      // disabled={logoutMutation.isPending}
      className="
        flex w-full items-center gap-3
        rounded-lg px-4 py-3
        text-sm font-medium
        text-muted
        transition
        hover:bg-white
        hover:text-ink
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      <LogOut size={20} />

      <span>
Đăng xuất
      </span>
    </button>
        </nav>
      </aside>
    </>
  )
}
