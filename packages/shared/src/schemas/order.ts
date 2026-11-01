import { z } from 'zod';

// ─── Cart Validation ─────────────────────────────────────────
export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().positive().max(999),
  substituteIfUnavailable: z.boolean().default(true),
});

export const validateCartSchema = z.object({
  shopId: z.string().uuid(),
  items: z.array(cartItemSchema).min(1).max(50),
});

export type ValidateCartDto = z.infer<typeof validateCartSchema>;

// ─── Delivery Address ─────────────────────────────────────────
export const deliveryAddressSchema = z.object({
  line1: z.string().min(5).max(200),
  line2: z.string().max(200).optional(),
  landmark: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  label: z.enum(['HOME', 'WORK', 'OTHER']).default('HOME'),
});

export type DeliveryAddressDto = z.infer<typeof deliveryAddressSchema>;

// ─── Place Order ─────────────────────────────────────────────
export const placeOrderSchema = z.object({
  shopId: z.string().uuid(),
  items: z.array(cartItemSchema).min(1).max(50),
  deliveryAddress: deliveryAddressSchema,
  paymentMode: z.enum(['COD', 'UPI', 'CARD', 'WALLET']),
  deliverySlot: z.object({
    date: z.coerce.date(),
    slotId: z.string().optional(), // null = ASAP
  }).optional(),
  instructions: z.string().max(500).optional(),
});

export type PlaceOrderDto = z.infer<typeof placeOrderSchema>;

// ─── Update Order Status (Shopkeeper) ─────────────────────────
export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PACKED', 'CANCELLED']),
  reason: z.string().max(500).optional(),
  substitutions: z.array(z.object({
    originalProductId: z.string().uuid(),
    substituteProductId: z.string().uuid(),
    qty: z.number().int().positive(),
  })).optional(),
});

export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;

// ─── Order Query Params ────────────────────────────────────────
export const listOrdersSchema = z.object({
  status: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ListOrdersDto = z.infer<typeof listOrdersSchema>;
