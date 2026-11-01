import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Bell, LogOut,
  Store, TrendingUp, AlertTriangle, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { apiClient } from '@/shared/api/client';
import toast from 'react-hot-toast';
import { cn } from '@/shared/lib/cn';

const navItems = [
  { to: '/dashboard',            icon: LayoutDashboard, label: 'Overview'  },
  { to: '/dashboard/inventory',  icon: Package,         label: 'Inventory' },
  { to: '/dashboard/products',   icon: TrendingUp,      label: 'Products'  },
  { to: '/dashboard/orders',     icon: ShoppingBag,     label: 'Orders'    },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch { /* ignore */ }
    clearAuth();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex h-dvh bg-surface overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-64 flex flex-col glass border-r border-surface-border shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-surface-border">
          <div className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Store className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold font-display text-gradient-brand text-sm leading-none">Smart Dukan</p>
            <p className="text-[10px] text-white/30 mt-0.5">Shopkeeper Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/25'
                    : 'text-white/50 hover:text-white hover:bg-surface-card',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('h-4 w-4', isActive ? 'text-brand-400' : '')} />
                  {item.label}
                  {isActive && <ChevronRight className="ml-auto h-3 w-3 text-brand-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-surface-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="h-8 w-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-300">
              {user?.name?.[0]?.toUpperCase() ?? 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name ?? 'Shopkeeper'}</p>
              <p className="text-[10px] text-white/30">Shopkeeper</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
