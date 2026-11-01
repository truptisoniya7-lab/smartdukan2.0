import { z } from 'zod';

// ─── Shop Create / Update ─────────────────────────────────────
export const createShopSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(500).optional(),
  address: z.string().min(5).max(500),
  city: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid 6-digit pincode'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  deliveryRadiusKm: z.number().min(0.5).max(10).default(5),
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/).default('09:00'), // HH:mm
  closingTime: z.string().regex(/^\d{2}:\d{2}$/).default('21:00'),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
});

export type CreateShopDto = z.infer<typeof createShopSchema>;

export const updateShopSchema = createShopSchema.partial();
export type UpdateShopDto = z.infer<typeof updateShopSchema>;

// ─── Shop Query Params ────────────────────────────────────────
export const getNearbyShopsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(0.5).max(20).default(5),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type GetNearbyShopsDto = z.infer<typeof getNearbyShopsSchema>;
