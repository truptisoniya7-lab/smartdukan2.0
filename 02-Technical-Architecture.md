# Smart Dukan 2.0 — Technical Architecture

---

## 1. Architectural Style

**Modular monolith with extracted async workers.**

A single Express application exposes the API, organised internally into strictly separated domain modules. Heavy, slow, or bursty work (forecast training, rider matching sweeps, notifications, report generation) runs in BullMQ workers outside the request path. Real-time updates go over a dedicated Socket.IO gateway.

This is deliberate. At pilot scale (tens of shops) microservices would cost more in operational overhead than they return. The module boundaries below are drawn so that `inventory-ai`, `delivery`, and `notifications` can each be lifted into their own service later without touching callers — they already communicate through an internal service interface and a queue, never through shared function calls into each other's data layer.

---

## 2. High-Level Diagram

```
                         ┌─────────────────────────────────────────┐
                         │             CLIENTS                     │
                         │  Customer Web │ Shop Dashboard │ Rider  │
                         │        React 18 + Vite (SPA)            │
                         └───────────────┬─────────────────────────┘
                                         │ HTTPS / WSS
                         ┌───────────────▼─────────────────────────┐
                         │      CDN + Edge (static assets)         │
                         └───────────────┬─────────────────────────┘
                                         │
                         ┌───────────────▼─────────────────────────┐
                         │   API Gateway / Reverse Proxy (Nginx)   │
                         │   TLS termination · rate limit · CORS   │
                         └───────────────┬─────────────────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
     ┌────────▼────────┐        ┌────────▼────────┐        ┌────────▼────────┐
     │  Express API    │        │ Socket.IO       │        │  BullMQ Workers │
     │  (REST /api/v1) │◄──────►│ Realtime Gateway│◄──────►│  (background)   │
     └────────┬────────┘        └────────┬────────┘        └────────┬────────┘
              │                          │                          │
              │   ┌──────────────────────┴──────────────────────┐   │
              │   │        Domain Modules (in-process)          │   │
              │   │  auth · catalog · inventory · orders ·      │   │
              │   │  inventory-ai · delivery · payments ·       │   │
              │   │  notifications · analytics                  │   │
              │   └──────────────────────┬──────────────────────┘   │
              │                          │                          │
     ┌────────▼──────────────────────────▼──────────────────────────▼────────┐
     │                          DATA LAYER                                    │
     │  PostgreSQL 16 (Prisma ORM)  │  Redis 7 (cache, queue, pub/sub, geo)   │
     │  + TimescaleDB ext (metrics) │  S3-compatible object store (images)    │
     └────────────────────────────────────────────────────────────────────────┘
                                         │
                         ┌───────────────▼─────────────────────────┐
                         │  External: Payment GW · Maps/Geocode ·  │
                         │  SMS/WhatsApp · Push (FCM) · Weather    │
                         └─────────────────────────────────────────┘
```

---

## 3. Frontend Architecture

### 3.1 Application shape

Three surfaces, one codebase, route-level code splitting:

```
apps/web/src/
├── app/                   # router, providers, error boundaries
├── features/
│   ├── landing/           # hero, particles, scroll narrative
│   ├── catalog/
│   ├── cart-checkout/
│   ├── order-tracking/
│   ├── shop-dashboard/    # inventory, orders, AI insights
│   ├── rider/
│   └── auth/
├── shared/
│   ├── ui/                # design system primitives
│   ├── motion/            # animation variants, particle systems
│   ├── api/               # typed API client, React Query hooks
│   ├── realtime/          # socket provider + channel hooks
│   └── lib/
└── styles/
```

### 3.2 State strategy

| Kind of state | Tool | Why |
|---|---|---|
| Server data (products, orders, forecasts) | **TanStack Query** | caching, revalidation, optimistic updates |
| Global client state (cart, session, UI prefs) | **Zustand** | tiny, no boilerplate, persists to storage |
| Form state | **React Hook Form + Zod** | schema shared with backend validation |
| Realtime | **Socket.IO client** → writes into the Query cache | one source of truth |

Realtime events don't get their own store. `order:status_changed` patches the cached order object, so every component that reads that query re-renders consistently.

### 3.3 Visual & particle effects layer

| Effect | Implementation |
|---|---|
| Landing hero particle field | `react-three-fiber` + `@react-three/drei`, instanced points, GPU-driven |
| Interactive particle cursor / connection web | `tsParticles` (`@tsparticles/react`) as a light fallback for low-power devices |
| Page transitions, reveals, micro-interactions | **Framer Motion** (`AnimatePresence`, `layoutId`, variants) |
| Scroll-driven narrative on landing | Framer Motion `useScroll` + `useTransform` |
| Order flow animation | SVG path + `motion.circle` animated along `offsetPath` |
| Live delivery animation | MapLibre GL marker interpolated between GPS pings + pulsing status ring |
| AI insight charts | **Recharts** with `isAnimationActive`, plus counter tweens via `useSpring` |
| Glow / gradient mesh backgrounds | CSS `conic-gradient` + blurred blobs, no JS cost |

**Performance guardrails**

- Particle count adapts to `navigator.hardwareConcurrency` and measured FPS; degrade tier: `full → reduced → static gradient`.
- Three.js canvas is lazy-loaded and only mounted on the landing route.
- Every animated property is `transform` or `opacity` — never `top`/`width`/`box-shadow`.
- `prefers-reduced-motion: reduce` disables all decorative motion and swaps particle canvases for a static image.
- `IntersectionObserver` pauses off-screen animation loops; the render loop stops on `document.hidden`.
- Target: landing LCP < 2.0 s, no long task > 200 ms, sustained 60 fps on a mid-tier Android.

---

## 4. Backend Architecture

### 4.1 Layering

```
Route  →  Middleware  →  Controller  →  Service  →  Repository (Prisma)  →  PostgreSQL
                                          │
                                          └─→ Queue (BullMQ) → Worker
```

- **Route** — path + method only.
- **Middleware** — auth, RBAC, Zod validation, rate limit, idempotency, request context.
- **Controller** — HTTP translation. No business rules.
- **Service** — all business logic, transaction boundaries, domain events. Framework-agnostic.
- **Repository** — the only place Prisma is touched. Keeps queries testable and swappable.

### 4.2 Module map

```
apps/api/src/modules/
├── auth/            register, login, refresh, RBAC, sessions
├── shop/            shop profile, hours, delivery zone (PostGIS polygon)
├── catalog/         products, categories, media, search
├── inventory/       stock levels, batches, reservations, ledger
├── orders/          cart → order state machine, idempotent placement
├── inventory-ai/    stock check, forecasting, reorder, substitution, insights
├── delivery/        rider profile, availability, matching, tracking, OTP
├── payments/        gateway adapter, webhooks, refunds
├── notifications/   push, SMS, WhatsApp, email fan-out
├── analytics/       aggregates, dashboard queries, exports
└── admin/           onboarding, SLA monitoring, moderation
```

### 4.3 Order state machine

```
DRAFT → PLACED → CONFIRMED → PACKED → RIDER_ASSIGNED
      → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED
                            ↘ CANCELLED (from PLACED..PACKED)
                            ↘ FAILED    (from OUT_FOR_DELIVERY)
                            ↘ RETURNED  (post-delivery window)
```

Transitions are validated in `orders.service.ts` against an explicit transition table. Every transition writes an `OrderEvent` row — the audit trail and the source of the customer-facing timeline are the same data.

### 4.4 Inventory AI Engine

Three cooperating pieces:

**a) Stock Check (synchronous, sub-50 ms)**
Runs inside the order transaction. Reads `InventoryItem.availableQty` with `SELECT ... FOR UPDATE`, creates `StockReservation` rows with a TTL, decrements available quantity. Reservations expire via a scheduled worker if payment isn't completed. This is what prevents overselling; it is plain SQL, not ML.

**b) Demand Prediction (asynchronous, nightly + on-demand)**

| Stage | Input | Output |
|---|---|---|
| Feature build | 90-day sales ledger, day-of-week, festival calendar, weather, promo flags | feature rows in `sku_features` |
| Baseline | seasonal-naive + exponential smoothing (Holt-Winters) | per-SKU 7/14/30-day forecast |
| Model | gradient boosting per shop-category (Python worker) once ≥ 60 days data | refined forecast + confidence interval |
| Post-process | safety stock = z × σ × √leadTime; reorder point = μ_lead + safety | `ReorderSuggestion` rows |

Cold start falls back to category-level priors seeded from comparable shops.

**c) Rider Match (synchronous scoring, async retry)**

```
score(rider) =  w1 · normalizedDistanceToShop
              + w2 · currentLoadPenalty
              + w3 · (1 − rating)
              + w4 · predictedETA
              − w5 · sameShopBatchBonus
```

Candidate riders come from a Redis `GEOSEARCH` over live location pings (5 km radius, `isAvailable = true`). The lowest score wins; the offer holds for 25 s, then cascades to the next rider. Three failed cascades escalate to the shopkeeper for manual assignment.

### 4.5 Realtime channels

| Channel | Subscribers | Events |
|---|---|---|
| `order:{orderId}` | customer, shop, assigned rider | `status_changed`, `eta_updated`, `item_substituted` |
| `shop:{shopId}` | shopkeeper | `order_received`, `low_stock_alert`, `insight_ready` |
| `rider:{riderId}` | rider | `job_offered`, `job_expired`, `route_updated` |

Socket.IO authenticates on connection with the access token, then joins rooms only after a server-side authorisation check. Horizontal scaling uses the Redis adapter. Location pings are throttled to 1 per 5 s per rider and written to Redis, not Postgres — Postgres only receives a route snapshot on completion.

### 4.6 Background jobs

| Queue | Trigger | Job |
|---|---|---|
| `forecast` | nightly 02:00 + manual | rebuild per-shop SKU forecasts |
| `reservations` | every 60 s | expire stale stock reservations |
| `matching` | on order confirm | rider assignment + cascade |
| `notifications` | event-driven | push / SMS / WhatsApp fan-out |
| `analytics` | hourly | roll up dashboard aggregates |
| `alerts` | every 15 min | low-stock, expiry-risk, SLA breach |

---

## 5. Data Architecture

### 5.1 Core entities (Prisma sketch)

```prisma
model User {
  id            String   @id @default(uuid())
  phone         String   @unique
  email         String?  @unique
  passwordHash  String?
  role          Role     // CUSTOMER | SHOPKEEPER | RIDER | ADMIN
  createdAt     DateTime @default(now())
  orders        Order[]
  shop          Shop?
  riderProfile  RiderProfile?
}

model Shop {
  id            String   @id @default(uuid())
  ownerId       String   @unique
  name          String
  latitude      Float
  longitude     Float
  deliveryRadiusKm Float @default(5)
  isOpen        Boolean  @default(true)
  products      Product[]
  inventory     InventoryItem[]
  orders        Order[]
  @@index([latitude, longitude])
}

model Product {
  id          String  @id @default(uuid())
  shopId      String
  sku         String
  name        String
  categoryId  String
  mrp         Decimal @db.Decimal(10,2)
  sellPrice   Decimal @db.Decimal(10,2)
  unit        String
  imageUrl    String?
  isActive    Boolean @default(true)
  inventory   InventoryItem?
  @@unique([shopId, sku])
}

model InventoryItem {
  id            String   @id @default(uuid())
  productId     String   @unique
  shopId        String
  availableQty  Int
  reservedQty   Int      @default(0)
  reorderPoint  Int      @default(0)
  safetyStock   Int      @default(0)
  batches       StockBatch[]
  updatedAt     DateTime @updatedAt
  @@index([shopId, availableQty])
}

model StockBatch {
  id            String   @id @default(uuid())
  inventoryId   String
  qty           Int
  costPrice     Decimal  @db.Decimal(10,2)
  expiryDate    DateTime?
  receivedAt    DateTime @default(now())
  @@index([expiryDate])
}

model StockReservation {
  id          String   @id @default(uuid())
  orderId     String
  productId   String
  qty         Int
  expiresAt   DateTime
  status      ReservationStatus  // HELD | COMMITTED | RELEASED
  @@index([expiresAt, status])
}

model Order {
  id            String   @id @default(uuid())
  code          String   @unique          // human-readable
  customerId    String
  shopId        String
  status        OrderStatus
  subtotal      Decimal  @db.Decimal(10,2)
  deliveryFee   Decimal  @db.Decimal(10,2)
  total         Decimal  @db.Decimal(10,2)
  paymentMode   PaymentMode
  idempotencyKey String? @unique
  items         OrderItem[]
  events        OrderEvent[]
  delivery      Delivery?
  placedAt      DateTime @default(now())
  @@index([shopId, status, placedAt])
  @@index([customerId, placedAt])
}

model OrderEvent {
  id        String   @id @default(uuid())
  orderId   String
  fromState String?
  toState   String
  actorId   String?
  meta      Json?
  createdAt DateTime @default(now())
  @@index([orderId, createdAt])
}

model Delivery {
  id            String   @id @default(uuid())
  orderId       String   @unique
  riderId       String?
  assignedAt    DateTime?
  pickedUpAt    DateTime?
  deliveredAt   DateTime?
  otpHash       String?
  routeSnapshot Json?
  status        DeliveryStatus
}

model RiderProfile {
  id            String  @id @default(uuid())
  userId        String  @unique
  vehicleType   String
  isAvailable   Boolean @default(false)
  rating        Float   @default(5)
  activeLoad    Int     @default(0)
}

model DemandForecast {
  id          String   @id @default(uuid())
  shopId      String
  productId   String
  horizonDays Int
  predictedQty Float
  lowerBound  Float
  upperBound  Float
  modelVersion String
  generatedAt DateTime @default(now())
  @@index([shopId, productId, generatedAt])
}

model ReorderSuggestion {
  id            String  @id @default(uuid())
  shopId        String
  productId     String
  suggestedQty  Int
  reason        String
  confidence    Float
  status        SuggestionStatus  // PENDING | ACCEPTED | DISMISSED
  createdAt     DateTime @default(now())
}
```

### 5.2 Storage policy

| Data | Store |
|---|---|
| Transactional entities | PostgreSQL |
| Live rider coordinates | Redis GEO (TTL 60 s) |
| Session/refresh tokens | Redis |
| Job queues | Redis (BullMQ) |
| Dashboard aggregates | Postgres materialised views, refreshed hourly |
| Time-series metrics | TimescaleDB hypertable |
| Product images | S3-compatible bucket + CDN |

### 5.3 Migrations
`prisma migrate` with checked-in migration files. Expand-and-contract for breaking changes: add nullable column → backfill via job → switch reads → drop old column in a later release. No destructive migration ships in the same deploy as the code that depends on it.

---

## 6. API Design

REST, versioned at `/api/v1`, JSON only.

```
POST   /auth/register            POST /auth/login       POST /auth/refresh
GET    /shops?lat=&lng=&radius=
GET    /shops/:id/products
POST   /cart/validate            # runs stock check, returns unavailable items
POST   /orders                   # Idempotency-Key header required
GET    /orders/:id
PATCH  /orders/:id/status
GET    /shop/inventory           PATCH /shop/inventory/:productId
POST   /shop/inventory/bulk
GET    /shop/insights/forecast?horizon=7
GET    /shop/insights/reorder
POST   /shop/insights/reorder/:id/accept
GET    /shop/analytics/summary?from=&to=
POST   /rider/availability       POST /rider/location
POST   /rider/jobs/:id/accept    POST /rider/jobs/:id/complete   # OTP
POST   /webhooks/payment
```

**Conventions**

- Cursor pagination: `?cursor=&limit=` → `{ data, nextCursor }`.
- Errors: RFC 7807 problem+json with a stable `code` field.
- Mutating endpoints accept `Idempotency-Key`; replays return the original response.
- Every response carries `X-Request-Id` for trace correlation.

---

## 7. Cross-Cutting Concerns

| Concern | Approach |
|---|---|
| Config | `zod`-validated env schema, fails fast at boot |
| Logging | `pino` structured JSON, request-scoped child logger, PII redaction |
| Tracing | OpenTelemetry → Jaeger/Tempo; trace id propagated to the frontend |
| Metrics | `prom-client` → Prometheus → Grafana |
| Errors | Sentry on both frontend and backend, release-tagged |
| Health | `/healthz` (liveness), `/readyz` (DB + Redis reachable) |
| Testing | Vitest (unit), Supertest + Testcontainers (integration), Playwright (E2E) |
| CI/CD | GitHub Actions: lint → typecheck → test → build → migrate → deploy; preview env per PR |

---

## 8. Scalability Path

1. **Now** — single API container, single Postgres, single Redis.
2. **Growth** — horizontal API replicas behind the load balancer (stateless; sessions already in Redis), Postgres read replica for analytics and dashboards.
3. **Scale** — extract `inventory-ai` into a Python service, extract `delivery` matching into its own service, move the event bus from BullMQ to Kafka/NATS, partition `Order` and `OrderEvent` by month.
4. **Multi-region** — shard by city; each city gets its own Postgres primary; a global catalogue service serves shared product master data.

---

## 9. Key Decisions & Trade-offs

| Decision | Chosen | Rejected | Reason |
|---|---|---|---|
| Architecture | Modular monolith | Microservices from day 1 | Small team; avoids distributed debugging before there's traffic |
| ORM | Prisma | TypeORM / raw SQL | Type safety end-to-end, migration ergonomics; raw SQL still used for the hot inventory path |
| Realtime | Socket.IO | SSE / polling | Bidirectional, rooms, reconnect and fallback handled |
| Forecasting | Statistical baseline first, ML later | ML from day 1 | No data at launch; a baseline that works beats a model that can't train |
| Geo queries | Redis GEO for live, PostGIS for zones | PostGIS for everything | Location pings are high-write, low-value; Postgres shouldn't absorb them |
| Animation | Framer Motion + R3F | GSAP / Lottie only | Declarative, React-native, and tree-shakeable |
