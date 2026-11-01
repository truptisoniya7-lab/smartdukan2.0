import { z } from 'zod';

// ─── Category ────────────────────────────────────────────────
export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  iconUrl: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

// ─── Product ─────────────────────────────────────────────────
export const createProductSchema = z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(250),
  description: z.string().max(2000).optional(),
  categoryId: z.string().uuid(),
  mrp: z.number().positive('MRP must be positive').multipleOf(0.01),
  sellPrice: z.number().positive('Sell price must be positive').multipleOf(0.01),
  unit: z.string().max(50), // e.g. "kg", "500ml", "piece"
  hsn: z.string().max(20).optional(), // GST HSN code
  isActive: z.boolean().default(true),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductDto = z.infer<typeof updateProductSchema>;

// ─── Inventory ───────────────────────────────────────────────
export const updateInventorySchema = z.object({
  availableQty: z.number().int().min(0),
  reorderPoint: z.number().int().min(0).optional(),
  safetyStock: z.number().int().min(0).optional(),
});

export type UpdateInventoryDto = z.infer<typeof updateInventorySchema>;

// ─── Stock Batch ─────────────────────────────────────────────
export const addStockBatchSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().positive(),
  costPrice: z.number().positive().multipleOf(0.01),
  expiryDate: z.coerce.date().optional(),
});

export type AddStockBatchDto = z.infer<typeof addStockBatchSchema>;

// ─── Bulk Upload Row (CSV) ───────────────────────────────────
export const bulkInventoryRowSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  mrp: z.coerce.number().positive(),
  sellPrice: z.coerce.number().positive(),
  unit: z.string().min(1),
  qty: z.coerce.number().int().min(0),
  costPrice: z.coerce.number().positive().optional(),
  expiryDate: z.string().optional(),
});

export const bulkInventorySchema = z.array(bulkInventoryRowSchema).min(1).max(1000);
export type BulkInventoryDto = z.infer<typeof bulkInventorySchema>;

// ─── Product List Query ───────────────────────────────────────
export const listProductsSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(24),
  inStock: z.coerce.boolean().optional(),
});

export type ListProductsDto = z.infer<typeof listProductsSchema>;
