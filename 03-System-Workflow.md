# Smart Dukan 2.0 — System Workflow

---

## 1. Master Flow

The canonical path, end to end:

```
   👤 CUSTOMER
      │  places order
      ▼
   🏪 SMART DUKAN  ──────────────►  🤖 INVENTORY AI ENGINE
      │                                   │  Stock Check
      │                                   │  Demand Prediction
      │  ◄────────────── availability ────┘
      │
      │  order confirmed
      ▼
   🚴 DELIVERY  ────────►  Rider Match
      │
      │  assigned → picked up → out for delivery
      ▼
   📦 DELIVERED  ────────►  status stream back to customer + shop
      │
      ▼
   📊 Sales ledger → feeds next forecast cycle
```

The loop is the point: every completed order becomes training signal for the next stock decision.

---

## 2. Order Placement Workflow (detailed)

```
Customer          Frontend          API              AI Engine        DB/Redis
   │                 │                │                   │              │
   │─ add to cart ──►│                │                   │              │
   │                 │─ POST /cart/validate ─────────────►│              │
   │                 │                │─ stock check ────►│              │
   │                 │                │                   │─ SELECT FOR  │
   │                 │                │                   │  UPDATE ────►│
   │                 │◄─ available / substitutions ───────│              │
   │◄─ cart state ───│                │                   │              │
   │                 │                │                   │              │
   │─ checkout ─────►│─ POST /orders (Idempotency-Key) ──►│              │
   │                 │                │─ BEGIN TX ───────────────────────►│
   │                 │                │  1. re-validate stock             │
   │                 │                │  2. create reservations (TTL 10m) │
   │                 │                │  3. decrement availableQty        │
   │                 │                │  4. insert Order + OrderItems     │
   │                 │                │  5. insert OrderEvent (→PLACED)   │
   │                 │                │─ COMMIT ─────────────────────────►│
   │                 │                │                   │              │
   │                 │                │─ enqueue: payment, notify ───────►│
   │◄─ order id + payment intent ─────│                   │              │
   │                 │                │                   │              │
   │─ pays ─────────►│  gateway ──── webhook ───► /webhooks/payment      │
   │                 │                │─ commit reservations              │
   │                 │                │─ status → CONFIRMED               │
   │                 │                │─ emit order:{id} status_changed ─►│
   │◄─ live status ──│◄─── WebSocket ─┤                                   │
```

**Failure handling at each step**

| Failure | Behaviour |
|---|---|
| Item went out of stock between validate and place | Transaction aborts, returns 409 with the offending items and AI substitution suggestions |
| Payment never completes | Reservation expires after 10 min, stock is returned, order → `CANCELLED` |
| Duplicate submit / network retry | Idempotency key returns the original order, no double charge |
| Shop rejects the order | Stock released, refund job enqueued, customer notified with reason |

---

## 3. Inventory AI Engine Workflow

### 3.1 Stock Check (request path, synchronous)

```
order request
     │
     ▼
for each line item:
     ├── read InventoryItem FOR UPDATE
     ├── availableQty >= requestedQty ?
     │       ├── yes → create StockReservation (HELD, TTL 10m)
     │       │         availableQty -= qty ; reservedQty += qty
     │       └── no  → mark unavailable
     │                 └── ask Substitution Engine for nearest alternative
     ▼
all available? ── yes ──► commit transaction, order PLACED
     └── no ──► rollback, return 409 + substitution options
```

Batches are consumed **FEFO** (first-expiry-first-out), so near-expiry stock clears first.

### 3.2 Demand Prediction (offline, nightly)

```
02:00 cron ──► forecast queue
     │
     ├── 1. EXTRACT    90 days of order lines per shop/SKU
     ├── 2. ENRICH     day-of-week, month, festival calendar,
     │                 weather forecast, promo flags, stock-out masking*
     ├── 3. BASELINE   Holt-Winters / seasonal-naive per SKU
     ├── 4. MODEL      gradient boosting per shop-category (if ≥60 days history)
     ├── 5. BLEND      weighted by recent backtest error
     ├── 6. WRITE      DemandForecast rows (7 / 14 / 30 day horizons + CI)
     ├── 7. DERIVE     safetyStock = z · σ_demand · √leadTime
     │                 reorderPoint = μ_demand(leadTime) + safetyStock
     ├── 8. SUGGEST    where projectedStock < reorderPoint
     │                 → ReorderSuggestion(qty, reason, confidence)
     └── 9. NOTIFY     emit shop:{id} insight_ready
```

\* *Stock-out masking:* days where a SKU was unavailable are excluded from the demand signal, otherwise the model learns "we sell zero" from a supply failure rather than a demand fact.

### 3.3 Feedback loop

```
ReorderSuggestion ──► shopkeeper accepts / dismisses
                          │
                          ▼
                  logged with context
                          │
                          ▼
             weekly: recompute model weights,
             recalibrate confidence, adjust safety-stock z
```

### 3.4 Alerting sweep (every 15 min)

```
for each shop:
   low stock      : availableQty <= reorderPoint          → LOW_STOCK alert
   expiry risk    : batch expires < 7d AND qty > forecast → EXPIRY alert + discount suggestion
   dead stock     : zero sales in 30d AND qty > 0         → DEAD_STOCK insight
   demand spike   : forecast > 1.5× trailing average      → STOCK_UP alert
```

---

## 4. Delivery Workflow

### 4.1 Rider matching

```
order → CONFIRMED
     │
     ▼
enqueue matching job
     │
     ├── Redis GEOSEARCH riders within 5 km of shop, isAvailable = true
     │        └── none? → wait 20s, widen to 8 km, retry ×3
     │                    └── still none → notify shopkeeper for manual assignment
     │
     ├── score each candidate
     │      distance · currentLoad · rating · predictedETA · sameShopBatchBonus
     │
     ├── offer to best rider  ──► rider:{id} job_offered   (25 s window)
     │        ├── accepted → Delivery.riderId set, status RIDER_ASSIGNED
     │        │              rider.activeLoad++, emit to order room
     │        ├── rejected → next candidate
     │        └── timeout  → next candidate, rider acceptance-rate penalised
     │
     └── batching: if another CONFIRMED order exists for the same shop
                   with drop point within 800 m → attach to the same trip
```

### 4.2 Live tracking

```
Rider app ──► POST /rider/location (every 5s, throttled)
                  │
                  ├── Redis GEOADD rider:live  (TTL 60s)
                  ├── recompute ETA (haversine + traffic factor)
                  └── emit order:{id} eta_updated
                          │
                          ▼
              Customer map marker interpolates between pings
              (frontend tweens over 5s so motion looks continuous, not jumpy)
```

### 4.3 Completion

```
Rider arrives ──► taps "Delivered"
     │
     ├── customer reads out 4-digit OTP
     ├── rider enters it → POST /rider/jobs/:id/complete
     ├── server compares against otpHash (bcrypt)
     │       ├── match  → status DELIVERED, reservations COMMITTED,
     │       │            payment captured (if COD, cash marked collected),
     │       │            rider.activeLoad--, route snapshot persisted
     │       └── fail ×3 → escalate to support, order stays OUT_FOR_DELIVERY
     └── emit order:{id} status_changed → animated "Delivered" state on client
```

---

## 5. Frontend Experience Flow (landing narrative)

The landing page is a scripted scroll story. Each section is a scroll-triggered scene:

```
🌐 LANDING PAGE
   ├── Hero: WebGL particle field reacting to cursor; headline words stagger in
   ├── Scroll indicator pulses
        ↓
✨ SMOOTH UI ANIMATIONS
   ├── Device mockup tilts on scroll (useScroll → useTransform → rotateX)
   ├── UI cards fly in with spring physics, shared-layout transitions
        ↓
📊 INTERACTIVE DASHBOARDS
   ├── Revenue chart draws its path left-to-right
   ├── Counters tick from 0 to target with useSpring
   ├── Hover a bar → tooltip + connected sparkline highlight (genuinely interactive, not a video)
        ↓
🛒 CUSTOMER ORDER ANIMATION
   ├── Animated cart → an item token travels along an SVG path
   ├── Path passes through "Stock Check" node which pulses green
   └── Order card flips to "Confirmed"
        ↓
🚴 LIVE DELIVERY ANIMATION
   ├── Stylised map, rider icon animates along a dashed route
   ├── Status timeline fills segment by segment in sync with the rider
   └── ETA counter counts down
        ↓
🤖 AI INSIGHTS ANIMATION
   ├── Forecast curve draws in with a shaded confidence band
   ├── "Reorder 8 crates" card slides up with a typewriter reveal
   └── Particles converge into the brand mark → CTA
```

**Orchestration rules**

- One `IntersectionObserver` per scene drives an `animate` control; scenes outside the viewport are paused, not just hidden.
- Scene assets (Three.js scene, map tiles) are lazy-loaded one scene ahead.
- Under `prefers-reduced-motion`, every scene renders its final frame immediately — the story still reads, it just doesn't move.
- On devices scoring below the perf threshold, particle scenes swap to a static gradient and CSS-only transitions.

---

## 6. Shopkeeper Daily Workflow

```
MORNING
  open dashboard
   ├── overnight AI insights waiting: reorder suggestions, expiry alerts
   ├── accept suggestions → purchase order draft generated
   └── review yesterday's sales heatmap

THROUGH THE DAY
  order arrives → toast + sound + dashboard badge
   ├── accept / partial accept (with substitution) / reject
   ├── pack → mark PACKED → matching engine fires automatically
   └── watch rider assignment and delivery on the live board

EVENING
  ├── reconcile COD collections
  ├── update stock received from suppliers (bulk or scan)
  └── review dead-stock list, set discounts on flagged items
        └── discount events feed back into the forecast as promo flags
```

---

## 7. Error & Recovery Paths

| Scenario | Recovery |
|---|---|
| Socket disconnects | Client reconnects with backoff, refetches order state via REST, reconciles missed events from `OrderEvent` since last seen id |
| Rider app loses network mid-trip | Location pings buffer locally, flush on reconnect; completion works offline and syncs the OTP verification when back online |
| Forecast job fails | Previous forecast stays live; alert to ops; retries with exponential backoff up to 3× |
| Payment webhook arrives twice | Webhook handler is idempotent on gateway event id |
| DB primary fails over | Prisma connection pool retries; API returns 503 on `/readyz` so the load balancer drains it |
| Redis unavailable | Queue and realtime degrade; orders still place (stock check is Postgres-backed); matching falls back to manual assignment |

---

## 8. Data Lifecycle

```
Order placed
   → OrderEvent trail (immutable, retained 7 years for dispute/audit)
   → Sales ledger row on DELIVERED
        → nightly feature extraction
             → forecast + reorder suggestion
                  → shopkeeper action
                       → outcome logged
                            → weekly model recalibration
```

Rider location pings: retained 60 s live, one route snapshot persisted per delivery, raw pings discarded.
