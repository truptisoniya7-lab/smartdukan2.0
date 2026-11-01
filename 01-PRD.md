# Smart Dukan 2.0 — Product Requirements Document (PRD)

| Field | Value |
|---|---|
| Product | Smart Dukan 2.0 |
| Type | AI-powered retail + inventory + local delivery management platform |
| Version | 2.0 (Draft) |
| Owner | Product / Engineering |
| Status | Draft for review |
| Last updated | 2026-09-17 |

---

## 1. Overview

Smart Dukan 2.0 is a platform for neighbourhood retail shops ("dukans"). It connects three sides of a local commerce loop — the **customer** who orders, the **shopkeeper** who stocks and sells, and the **rider** who delivers — and puts an AI layer in the middle of all three.

The differentiator is not the storefront. It is the **decision layer**: the system tells the shopkeeper what to stock, what to push, what will expire, what is about to run out, and which rider should carry which order.

**One-line positioning:** *Your shop, but it thinks ahead.*

---

## 2. Problem Statement

Small retailers today run on memory and instinct.

| Problem | Impact |
|---|---|
| Stock decisions are guesswork | Dead stock blocks working capital; fast movers go out of stock |
| No demand visibility | Festival/weekend/weather spikes are missed entirely |
| Manual order taking (phone, WhatsApp) | Orders lost, wrong items, no record |
| Delivery is ad-hoc | One boy, one cycle, no routing, no ETA for the customer |
| No data trail | No idea which product, hour, or customer actually earns money |

Existing POS software digitises the *past* (billing, ledgers). Nothing helps with the *next* decision.

---

## 3. Goals & Non-Goals

### 3.1 Goals
- **G1** — Let a customer place an order from a shop in under 60 seconds.
- **G2** — Give the shopkeeper a live inventory position with automatic low-stock and expiry alerts.
- **G3** — Forecast demand per SKU so reorder quantities are suggested, not guessed.
- **G4** — Auto-assign the best available rider and expose live delivery status to the customer.
- **G5** — Present all of this through a fast, visually rich interface (animated landing, interactive dashboards) that makes the product feel modern to a first-time visitor.

### 3.2 Non-Goals (v2.0)
- Full accounting / GST filing suite.
- Multi-country or multi-currency support.
- Third-party marketplace listing (Amazon/Flipkart sync).
- In-house payment gateway (we integrate, we don't build).
- Long-haul or inter-city logistics.

---

## 4. Personas

### P1 — Ramesh, the Shopkeeper (primary)
Runs a 400 sq ft kirana. Android phone, occasional desktop. Low patience for complex UI. **Needs:** know what to reorder, never miss an order, see today's profit.

### P2 — Anjali, the Customer
Orders groceries 3–4× a week. Wants speed, accurate stock ("is it actually available?"), and a live ETA.

### P3 — Sohail, the Rider
Part-time, 2-wheeler, works a 3 km radius. Wants batched orders, a clear route, and a simple accept/reject screen.

### P4 — Admin / Platform Operator
Onboards shops, monitors SLA, handles disputes, watches fraud signals.

---

## 5. Feature Requirements

### 5.1 Customer Module
| ID | Requirement | Priority |
|---|---|---|
| C-01 | Browse nearby shops sorted by distance and delivery time | P0 |
| C-02 | Product catalogue with search, category filter, real-time availability badge | P0 |
| C-03 | Cart with quantity edit, substitution preference ("replace if unavailable") | P0 |
| C-04 | Checkout: address, slot selection, payment mode (COD / UPI / card) | P0 |
| C-05 | Live order tracking with rider position and animated status timeline | P0 |
| C-06 | Order history, reorder-in-one-tap | P1 |
| C-07 | AI recommendations ("you usually buy atta every 12 days — running low?") | P1 |
| C-08 | Ratings and issue reporting | P2 |

### 5.2 Shopkeeper Module
| ID | Requirement | Priority |
|---|---|---|
| S-01 | Inventory CRUD: SKU, batch, MRP, selling price, stock qty, expiry | P0 |
| S-02 | Incoming order queue with accept / partial-accept / reject and reason | P0 |
| S-03 | Low-stock and expiry-risk alerts | P0 |
| S-04 | **AI reorder suggestions** — predicted demand for next 7/14/30 days per SKU | P0 |
| S-05 | Interactive dashboard: revenue, top movers, dead stock, hourly heatmap | P0 |
| S-06 | Bulk stock upload via CSV | P1 |
| S-07 | Dynamic pricing / discount suggestions for slow-moving and near-expiry stock | P1 |
| S-08 | Supplier list and purchase-order generation from AI suggestions | P2 |

### 5.3 Inventory AI Engine
| ID | Requirement | Priority |
|---|---|---|
| A-01 | **Stock Check** — atomic availability validation at order time, reservation-based | P0 |
| A-02 | **Demand Prediction** — per-SKU forecast using sales history, seasonality, day-of-week, festivals, weather | P0 |
| A-03 | Reorder point + safety stock computation per SKU | P0 |
| A-04 | Dead-stock and expiry-risk scoring | P1 |
| A-05 | Basket affinity ("customers who buy X buy Y") for cross-sell | P1 |
| A-06 | Substitution engine — suggest the nearest in-stock alternative | P1 |
| A-07 | Model feedback loop: accepted vs rejected suggestions retrain the ranker | P2 |

### 5.4 Delivery Module
| ID | Requirement | Priority |
|---|---|---|
| D-01 | Rider registration, availability toggle, live location ping | P0 |
| D-02 | **Rider Match** — score riders by distance, load, rating, ETA; auto-assign | P0 |
| D-03 | Rider app view: job card, pickup → drop navigation, OTP delivery confirmation | P0 |
| D-04 | Delivery status stream to customer and shopkeeper (WebSocket) | P0 |
| D-05 | Batching — multiple orders from the same shop on one trip | P1 |
| D-06 | Route optimisation for batched trips | P2 |

### 5.5 Landing & Experience Layer
| ID | Requirement | Priority |
|---|---|---|
| L-01 | Hero landing page with particle/WebGL background and scroll-triggered reveals | P0 |
| L-02 | Smooth page transitions and micro-interactions across the app | P0 |
| L-03 | Interactive dashboard charts (hover, drill-down, animated transitions) | P0 |
| L-04 | Customer order animation — visual walkthrough of an order flowing through the system | P0 |
| L-05 | Live delivery animation — animated map path + status pulse | P0 |
| L-06 | AI insights animation — forecast curves drawing in, counters ticking up | P0 |
| L-07 | `prefers-reduced-motion` respected; all animation degradable | P0 |

---

## 6. User Stories (selected)

- *As a customer*, I want to see whether an item is genuinely in stock before I pay, so that my order isn't cancelled later.
- *As a customer*, I want to watch my rider move on a map, so I know when to be at the door.
- *As a shopkeeper*, I want the system to tell me "order 8 crates of milk on Thursday", so I stop over- and under-buying.
- *As a shopkeeper*, I want near-expiry items flagged with a suggested discount, so I recover cost instead of dumping stock.
- *As a rider*, I want orders from the same shop grouped, so I earn more per trip.
- *As an admin*, I want to see which shops breach delivery SLA, so I can intervene.

---

## 7. Success Metrics

| Metric | Target (6 months post-launch) |
|---|---|
| Stock-out rate on top-50 SKUs | < 5% |
| Forecast accuracy (MAPE, weekly, top SKUs) | ≤ 20% |
| Order → rider assignment time | < 30 s (p95) |
| On-time delivery | > 90% |
| Order cancellation due to unavailability | < 2% |
| Shopkeeper weekly active rate | > 70% |
| Landing page → signup conversion | > 6% |
| Dashboard TTI | < 2.5 s on mid-range Android |

---

## 8. Assumptions & Constraints

- Delivery radius per shop ≤ 5 km; riders are shop-affiliated or pooled per locality.
- A shop needs ~60 days of sales history before forecasts move from heuristic to model-driven. Cold start uses category-level priors.
- Mobile-first; shopkeeper dashboard also used on desktop.
- Network is unreliable — the app must handle offline gracefully for the rider flow.
- Payments handled by an external gateway (Razorpay/Stripe); we never store card data.

---

## 9. Release Plan

| Phase | Scope | Duration |
|---|---|---|
| **M1 — Foundation** | Auth, shop/product/inventory CRUD, schema, CI | 3 weeks |
| **M2 — Commerce** | Catalogue, cart, checkout, order lifecycle, payments | 4 weeks |
| **M3 — Intelligence** | Stock check service, demand forecasting, reorder suggestions, alerts | 4 weeks |
| **M4 — Delivery** | Rider app, matching engine, live tracking over WebSocket | 3 weeks |
| **M5 — Experience** | Landing page, particle effects, animated dashboards and flows | 3 weeks |
| **M6 — Hardening** | Security audit, load test, observability, pilot with 10 shops | 2 weeks |

---

## 10. Open Questions

1. Is the rider pool **per-shop** or **shared across a locality**? (Affects the matching algorithm significantly.)
2. Do we support **multi-outlet** shopkeepers in v2.0, or single shop per account?
3. Which **payment gateway** — Razorpay, Cashfree, or Stripe?
4. Should the forecasting engine be a **Node service** or a separate **Python (FastAPI) service**? The docs assume a Node service with a pluggable Python worker.
5. Is **B2B restocking** (shop ordering from distributor inside the app) in scope for 2.0, or just the suggestion?
6. Language support — English only at launch, or Hindi/regional from day one?
