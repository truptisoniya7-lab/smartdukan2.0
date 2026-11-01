import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, Package, ShoppingBag, AlertTriangle, ArrowRight, Layers, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';
import { DashboardLayout } from './DashboardLayout';
import { Card, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Badge, StockBadge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { useAuthStore } from '@/features/auth/store/auth.store';

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, duration: 0.5 },
});

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => apiClient.get('/shop/inventory').then((r) => r.data as any[]),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiClient.get('/shop/inventory/alerts').then((r) => r.data as any[]),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then((r) => r.data as any[]),
  });

  const totalProducts = inventory?.length ?? 0;
  const lowStockCount = inventory?.filter((i: any) => i.availableQty > 0 && i.availableQty <= i.reorderPoint).length ?? 0;
  const outOfStockCount = inventory?.filter((i: any) => i.availableQty === 0).length ?? 0;
  const unreadAlerts = alerts?.filter((a: any) => !a.isRead).length ?? 0;

  const statCards = [
    { label: 'Total SKUs',      value: totalProducts,   icon: Package,    color: 'brand',   suffix: '' },
    { label: 'Low Stock',       value: lowStockCount,   icon: AlertTriangle, color: 'yellow', suffix: ' items' },
    { label: 'Out of Stock',    value: outOfStockCount, icon: ShoppingBag,   color: 'red',    suffix: ' items' },
    { label: 'Unread Alerts',   value: unreadAlerts,    icon: TrendingUp, color: 'blue',   suffix: '' },
  ];

  const colorIcon: Record<string, string> = {
    brand:  'bg-brand-500/15 text-brand-300',
    yellow: 'bg-amber-500/15 text-amber-400',
    red:    'bg-red-500/15 text-red-400',
    blue:   'bg-blue-500/15 text-blue-400',
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <motion.div {...fadeUp(0)} className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">
              Good {getGreeting()},{' '}
              <span className="text-gradient-brand">{user?.name?.split(' ')[0] ?? 'Shopkeeper'}!</span>
            </h1>
            <p className="text-white/50 text-sm mt-1">Here's what's happening in your shop today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard/products">
              <Button size="sm" variant="secondary">
                <Tag className="h-4 w-4" /> View Products
              </Button>
            </Link>
            <Link to="/dashboard/inventory">
              <Button size="sm">
                <Package className="h-4 w-4" /> Manage Stock
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={s.label} {...fadeUp(i + 1)}>
              <Card className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">{s.label}</span>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colorIcon[s.color]}`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-bold font-display text-white">
                  {s.value}<span className="text-sm text-white/40 font-normal">{s.suffix}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Categories Breakdown Section */}
        <motion.div {...fadeUp(5)} className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" />
                Shop Categories
                <Badge variant="purple">{categories.length} Active</Badge>
              </CardTitle>
              <Link to="/dashboard/products">
                <Button variant="ghost" size="sm">
                  Catalogue <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {categories.map((cat: any) => {
                const count = inventory.filter((i: any) => i.product?.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-all flex flex-col items-center text-center gap-2 group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{cat.iconUrl || '📦'}</span>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">{cat.name}</p>
                      <p className="text-[10px] text-white/40">{count} {count === 1 ? 'item' : 'items'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Live Inventory Preview & Alerts Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Top Stock SKUs (2 cols) */}
          <motion.div {...fadeUp(6)} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-brand-400" />
                  Live Inventory Status
                </CardTitle>
                <Link to="/dashboard/inventory">
                  <Button variant="ghost" size="sm">
                    Full Inventory <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>

              {inventory && inventory.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {inventory.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-white/40" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate text-white">{item.product?.name}</p>
                          <p className="text-xs text-white/40">{item.product?.sku} • {item.product?.unit}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold text-white">₹{item.product?.sellPrice}</span>
                        <StockBadge qty={item.availableQty} reorderPoint={item.reorderPoint} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-white/30">
                  <Package className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No items found in your inventory catalogue.</p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Alerts panel (1 col) */}
          <motion.div {...fadeUp(7)}>
            <Card className="h-full flex flex-col justify-between">
              <div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Recent Alerts
                    {unreadAlerts > 0 && (
                      <Badge variant="yellow">{unreadAlerts} new</Badge>
                    )}
                  </CardTitle>
                </CardHeader>

                {alerts && alerts.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {alerts.slice(0, 4).map((alert: any) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface/50 border border-surface-border">
                        <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                          alert.type === 'LOW_STOCK' ? 'bg-amber-400' :
                          alert.type === 'EXPIRY_RISK' ? 'bg-red-400' : 'bg-blue-400'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-xs text-white/90 leading-tight">{alert.message}</p>
                          <p className="text-[10px] text-white/30 mt-1">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={alert.type === 'LOW_STOCK' ? 'yellow' : 'red'} className="ml-auto shrink-0 text-[10px]">
                          {alert.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-white/30">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-30" />
                    <p className="text-xs">No alerts right now. Your shop is well-stocked!</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 mt-4">
                <Link to="/dashboard/inventory" className="w-full">
                  <Button variant="ghost" size="sm" className="w-full justify-center text-xs">
                    View all alerts <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
