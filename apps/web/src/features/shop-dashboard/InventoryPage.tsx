import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Package, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { addStockBatchSchema, type AddStockBatchDto } from '@smart-dukan/shared';
import { apiClient } from '@/shared/api/client';
import { DashboardLayout } from './DashboardLayout';
import { Card, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Badge, StockBadge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

export default function InventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [addBatchFor, setAddBatchFor] = useState<any | null>(null);

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => apiClient.get('/shop/inventory').then((r) => r.data as any[]),
  });

  const filtered = inventory.filter((item: any) =>
    item.product.name.toLowerCase().includes(search.toLowerCase()) ||
    item.product.sku.toLowerCase().includes(search.toLowerCase()),
  );

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AddStockBatchDto>({
    resolver: zodResolver(addStockBatchSchema),
  });

  const addBatch = useMutation({
    mutationFn: (data: AddStockBatchDto) => apiClient.post('/shop/inventory/batches', data),
    onSuccess: () => {
      toast.success('Stock added!');
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setAddBatchFor(null);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? 'Failed to add stock'),
  });

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-display">Inventory</h1>
            <p className="text-white/50 text-sm mt-1">Live stock levels across all SKUs</p>
          </div>
          <Button size="sm" onClick={() => toast('Bulk CSV upload coming in M2!', { icon: '📁' })}>
            <Plus className="h-4 w-4" /> Add Stock
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search by product name or SKU…"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-white/30">
              <Package className="h-8 w-8 mx-auto mb-3 animate-bounce opacity-50" />
              <p>Loading inventory…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-white/30">
              <Package className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No products found. Add products first.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                <div className="col-span-5">Product</div>
                <div className="col-span-2 text-center">Available</div>
                <div className="col-span-2 text-center">Reserved</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              <AnimatePresence>
                {filtered.map((item: any, i: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-card/50 transition-colors"
                  >
                    <div className="col-span-5">
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-white/30 mt-0.5">
                        SKU: {item.product.sku} · {item.product.unit}
                      </p>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-lg font-bold font-display">{item.availableQty}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm text-white/40">{item.reservedQty}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <StockBadge qty={item.availableQty} reorderPoint={item.reorderPoint} />
                    </div>
                    <div className="col-span-1 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAddBatchFor(addBatchFor?.id === item.id ? null : item)}
                        title="Add stock batch"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Inline add batch form */}
                    <AnimatePresence>
                      {addBatchFor?.id === item.id && (
                        <motion.div
                          key="batch-form"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="col-span-12 overflow-hidden"
                        >
                          <form
                            onSubmit={handleSubmit((data) =>
                              addBatch.mutate({ ...data, productId: item.product.id })
                            )}
                            className="mt-3 p-4 rounded-xl bg-surface border border-brand-500/20 grid grid-cols-3 gap-3"
                          >
                            <input type="hidden" value={item.product.id} {...register('productId')} />
                            <Input
                              label="Quantity"
                              type="number"
                              placeholder="e.g. 24"
                              error={errors.qty?.message}
                              {...register('qty', { valueAsNumber: true })}
                            />
                            <Input
                              label="Cost Price (₹)"
                              type="number"
                              step="0.01"
                              placeholder="e.g. 45.00"
                              error={errors.costPrice?.message}
                              {...register('costPrice', { valueAsNumber: true })}
                            />
                            <Input
                              label="Expiry Date (optional)"
                              type="date"
                              error={errors.expiryDate?.message}
                              {...register('expiryDate')}
                            />
                            <div className="col-span-3 flex justify-end gap-2">
                              <Button type="button" variant="ghost" size="sm" onClick={() => setAddBatchFor(null)}>
                                Cancel
                              </Button>
                              <Button type="submit" size="sm" loading={isSubmitting || addBatch.isPending}>
                                Add Batch
                              </Button>
                            </div>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
