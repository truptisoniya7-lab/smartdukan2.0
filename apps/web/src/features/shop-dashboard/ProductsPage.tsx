import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Package, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { createProductSchema, type CreateProductDto } from '@smart-dukan/shared';
import { apiClient } from '@/shared/api/client';
import { DashboardLayout } from './DashboardLayout';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Badge } from '@/shared/ui/Badge';

function ProductModal({ onClose, editProduct }: { onClose: () => void; editProduct?: any }) {
  const qc = useQueryClient();
  const isEdit = !!editProduct;

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then((r) => r.data as any[]),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateProductDto>({
    resolver: zodResolver(createProductSchema),
    defaultValues: editProduct ? {
      sku: editProduct.sku, name: editProduct.name, categoryId: editProduct.categoryId,
      mrp: Number(editProduct.mrp), sellPrice: Number(editProduct.sellPrice), unit: editProduct.unit,
    } : undefined,
  });

  const mutation = useMutation({
    mutationFn: (data: CreateProductDto) =>
      isEdit
        ? apiClient.patch(`/shop/products/${editProduct.id}`, data)
        : apiClient.post('/shop/products', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? 'Failed'),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 32 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 32 }}
        className="w-full max-w-lg glass rounded-xl3 p-6 border border-surface-border shadow-brand"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-surface-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="SKU" placeholder="e.g. ATTA-5KG" error={errors.sku?.message} {...register('sku')} />
            <Input label="Unit" placeholder="e.g. kg, 500ml" error={errors.unit?.message} {...register('unit')} />
          </div>
          <Input label="Product Name" placeholder="e.g. Aashirvaad Atta 5kg" error={errors.name?.message} {...register('name')} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/80">Category</label>
            <select
              className="input"
              {...register('categoryId')}
            >
              <option value="">Select category…</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-red-400">{errors.categoryId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="MRP (₹)" type="number" step="0.01" placeholder="55.00" error={errors.mrp?.message} {...register('mrp', { valueAsNumber: true })} />
            <Input label="Selling Price (₹)" type="number" step="0.01" placeholder="50.00" error={errors.sellPrice?.message} {...register('sellPrice', { valueAsNumber: true })} />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || mutation.isPending}>
              {isEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const qc = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => apiClient.get('/shop/inventory').then((r) => r.data as any[]),
  });

  const products = inventory.map((i: any) => i.product).filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const deactivate = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/shop/products/${id}`),
    onSuccess: () => { toast.success('Product removed'); qc.invalidateQueries({ queryKey: ['inventory'] }); },
    onError: () => toast.error('Failed to remove'),
  });

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-display">Products</h1>
            <p className="text-white/50 text-sm mt-1">Manage your shop's product catalogue</p>
          </div>
          <Button size="sm" onClick={() => { setEditProduct(null); setShowModal(true); }}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>

        <div className="mb-6">
          <Input placeholder="Search products…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-white/30">
            <Package className="h-8 w-8 mx-auto mb-3 animate-bounce opacity-50" />
            <p>Loading products…</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product: any, i: number) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="flex flex-col gap-3 hover:border-brand-500/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-xs text-white/40 mt-0.5">SKU: {product.sku}</p>
                    </div>
                    <Badge variant="purple">{product.unit}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-display">₹{Number(product.sellPrice).toFixed(2)}</span>
                    {product.mrp !== product.sellPrice && (
                      <span className="text-xs text-white/30 line-through">₹{Number(product.mrp).toFixed(2)}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                    <span className="text-xs text-white/40">{product.category?.name}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditProduct(product); setShowModal(true); }} title="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-red-400" onClick={() => deactivate.mutate(product.id)} title="Remove">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showModal && (
            <ProductModal
              onClose={() => { setShowModal(false); setEditProduct(null); }}
              editProduct={editProduct}
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
