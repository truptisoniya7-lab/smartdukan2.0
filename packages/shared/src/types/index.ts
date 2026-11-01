// ─────────────────────────────────────────────────────────────
// Smart Dukan 2.0 — Shared Enums & Types
// ─────────────────────────────────────────────────────────────

export enum Role {
  CUSTOMER = 'CUSTOMER',
  SHOPKEEPER = 'SHOPKEEPER',
  RIDER = 'RIDER',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PACKED = 'PACKED',
  RIDER_ASSIGNED = 'RIDER_ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED',
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export enum PaymentMode {
  COD = 'COD',
  UPI = 'UPI',
  CARD = 'CARD',
  WALLET = 'WALLET',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum ReservationStatus {
  HELD = 'HELD',
  COMMITTED = 'COMMITTED',
  RELEASED = 'RELEASED',
}

export enum SuggestionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DISMISSED = 'DISMISSED',
}

export enum AlertType {
  LOW_STOCK = 'LOW_STOCK',
  EXPIRY_RISK = 'EXPIRY_RISK',
  DEAD_STOCK = 'DEAD_STOCK',
  DEMAND_SPIKE = 'DEMAND_SPIKE',
}

// ─── Pagination ───────────────────────────────────────────────

export interface PaginationMeta {
  nextCursor: string | null;
  limit: number;
  total?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── API Error (RFC 7807) ─────────────────────────────────────

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

// ─── Coordinates ──────────────────────────────────────────────

export interface Coordinates {
  latitude: number;
  longitude: number;
}
