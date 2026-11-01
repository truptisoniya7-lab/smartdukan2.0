# Smart Dukan 2.0 — Technology Stack

---

## 1. Stack at a Glance

| Layer | Technology |
|---|---|
| Frontend | **React 18** + Vite + TypeScript |
| Visual effects | Three.js / react-three-fiber, tsParticles, Framer Motion |
| Backend | **Node.js 20 LTS** + **Express.js 4** + TypeScript |
| Database | **PostgreSQL 16** + **Prisma ORM** |
| Cache / Queue / Realtime | Redis 7, BullMQ, Socket.IO |
| Infra | Docker, GitHub Actions, Nginx, AWS (or Railway/Render for pilot) |

---

## 2. Frontend

### 2.1 Core

| Package | Version | Purpose |
|---|---|---|
| `react`, `react-dom` | ^18.3 | UI runtime |
| `typescript` | ^5.5 | Type safety |
| `vite` | ^5.4 | Dev server + build (esbuild/Rollup, near-instant HMR) |
| `react-router-dom` | ^6.26 | Routing, lazy routes, data loaders |

**Why Vite over CRA/Next:** the app is an authenticated SPA — SEO matters only for the landing page, which is prerendered at build time. Vite gives the fastest iteration loop, and the WebGL-heavy landing benefits from precise control over chunking that a framework's conventions would fight.

### 2.2 State & data

| Package | Purpose |
|---|---|
| `@tanstack/react-query` ^5 | Server state, caching, background refetch, optimistic updates |
| `zustand` ^4.5 | Cart, session, UI preferences; persisted middleware |
| `react-hook-form` ^7 + `@hookform/resolvers` | Forms |
| `zod` ^3 | Validation schemas — **shared with the backend** via a `packages/shared` workspace |
| `axios` ^1.7 | HTTP client with interceptors for auth refresh |
| `socket.io-client` ^4.7 | Realtime channels |

### 2.3 Visual & particle effects

| Package | Role |
|---|---|
| `framer-motion` ^11 | Page transitions, shared-layout animation, scroll-linked motion, spring physics |
| `three` ^0.168 | WebGL renderer |
| `@react-three/fiber` ^8 | React reconciler for Three.js — declarative scenes |
| `@react-three/drei` ^9 | Helpers: `Points`, `Float`, `Environment`, `Html` |
| `@react-three/postprocessing` | Bloom, chromatic aberration for the hero glow |
| `@tsparticles/react` + `@tsparticles/slim` | 2D interactive particle layer, cheap fallback for low-power devices |
| `lenis` | Smooth scroll driving the landing narrative |
| `lottie-react` | Vector micro-animations (empty states, success ticks) |
| `canvas-confetti` | Order-confirmed celebration |
| `maplibre-gl` | Live delivery map (open-source, no vendor lock) |
| `recharts` ^2 | Animated dashboard charts |
| `d3-scale`, `d3-shape` | Custom chart geometry where Recharts is too rigid |

**Effect-to-scene mapping**

| Scene | Stack used |
|---|---|
| Hero particle field | react-three-fiber instanced `Points`, custom GLSL shader, mouse-repulsion uniform |
| Cursor connection web | tsParticles slim, `links` mode |
| Scroll reveals | Framer Motion `whileInView` + stagger variants |
| Order flow animation | SVG path + `motion.circle` with `pathOffset` |
| Live delivery | MapLibre marker + interpolation tween + Framer pulse ring |
| AI insight charts | Recharts animated `Area` + `useSpring` counters |
| Page transitions | Framer `AnimatePresence` with route-keyed exit |

**Performance tooling:** `@react-three/fiber` `frameloop="demand"` where possible, `stats.js` in dev, a custom `useDeviceTier()` hook gating effect quality, bundle analysis via `rollup-plugin-visualizer`.

### 2.4 Styling & UI

| Package | Purpose |
|---|---|
| `tailwindcss` ^3.4 | Utility styling, design tokens in config |
| `class-variance-authority` + `tailwind-merge` | Variant-driven component API |
| `shadcn/ui` (Radix primitives) | Accessible dialogs, menus, tooltips |
| `lucide-react` | Icons |
| `@fontsource-variable/*` | Self-hosted variable fonts (no third-party font CDN, keeps CSP tight) |

### 2.5 Quality

`vitest` + `@testing-library/react` (unit), `msw` (API mocking), `playwright` (E2E), `eslint` + `prettier`, `@axe-core/playwright` (accessibility), Lighthouse CI budget enforced in the pipeline.

---

## 3. Backend

### 3.1 Core

| Package | Version | Purpose |
|---|---|---|
| `node` | 20 LTS | Runtime |
| `express` | ^4.19 | HTTP framework |
| `typescript` | ^5.5 | Type safety |
| `tsx` / `tsup` | — | Dev runner and build |
| `zod` | ^3 | Request validation (shared schemas) |

**Why Express:** the team knows it, the middleware ecosystem is the largest in Node, and nothing in this workload needs Fastify's throughput advantage. Controllers are kept thin and framework-agnostic, so swapping the HTTP layer later is a day of work, not a rewrite.

### 3.2 Data & infrastructure packages

| Package | Purpose |
|---|---|
| `prisma` / `@prisma/client` ^5 | ORM, migrations, type generation |
| `ioredis` ^5 | Redis client (cache, GEO, pub/sub) |
| `bullmq` ^5 | Job queues and schedulers |
| `socket.io` ^4.7 + `@socket.io/redis-adapter` | Realtime, horizontally scalable |
| `pino` + `pino-http` | Structured logging with redaction |
| `@opentelemetry/sdk-node` | Distributed tracing |
| `prom-client` | Metrics endpoint |

### 3.3 Security packages

| Package | Purpose |
|---|---|
| `helmet` | Security headers |
| `cors` | Strict origin allowlist |
| `express-rate-limit` + `rate-limit-redis` | Distributed rate limiting |
| `jsonwebtoken` | RS256 access tokens |
| `argon2` | Password hashing |
| `bcrypt` | Delivery OTP hashing |
| `csurf` alternative (`csrf-csrf`) | CSRF double-submit tokens |
| `express-mongo-sanitize` equivalent / custom | Input sanitising |
| `dompurify` + `jsdom` | Server-side sanitisation of rich text |

### 3.4 Integrations

| Concern | Choice |
|---|---|
| Payments | Razorpay (India-first) — Stripe adapter behind the same interface |
| SMS / OTP | MSG91 or Twilio |
| WhatsApp notifications | WhatsApp Business Cloud API |
| Push | Firebase Cloud Messaging |
| Maps / geocoding / routing | MapLibre + OpenStreetMap tiles; Mapbox Directions or OSRM for routing |
| Email | Resend or AWS SES |
| Object storage | AWS S3 / Cloudflare R2 |
| Weather (forecast feature) | Open-Meteo (free, no key) |

### 3.5 AI / ML layer

| Component | Technology |
|---|---|
| Baseline forecasting (in Node) | `simple-statistics`, custom Holt-Winters implementation |
| Advanced forecasting (worker) | Python 3.11 service: `pandas`, `scikit-learn`, `lightgbm`, `prophet` (optional), served via FastAPI |
| Feature store | PostgreSQL tables + materialised views |
| Model registry | MLflow (or versioned artefacts in S3 for the pilot) |
| Orchestration | BullMQ schedules the Node job, which calls the Python service over internal HTTP |
| Optional LLM insights | Anthropic Claude API for natural-language summaries of dashboard data |

The Node ↔ Python split is deliberate: statistics libraries in Python are far stronger, but the API stays TypeScript end to end. If the Python service is unavailable, the Node baseline forecaster still produces usable numbers.

### 3.6 Testing

`vitest` (unit), `supertest` (HTTP integration), `@testcontainers/postgresql` (real Postgres per test run, no mocking the DB), `k6` (load testing), `prisma` seed scripts for deterministic fixtures.

---

## 4. Database

### 4.1 PostgreSQL 16

Chosen for: ACID guarantees (non-negotiable for inventory), row-level locking for the stock-check path, JSONB for flexible metadata, PostGIS for delivery zones, mature replication.

**Extensions**

| Extension | Use |
|---|---|
| `postgis` | Delivery zone polygons, radius queries |
| `pg_trgm` | Fuzzy product search |
| `pgcrypto` | Column-level encryption for PII |
| `timescaledb` | Time-series metrics hypertables |
| `pg_stat_statements` | Query performance analysis |

**Tuning notes:** connection pooling via PgBouncer (transaction mode) — Prisma's pool alone is not enough at replica count > 2. Composite indexes on `(shopId, status, placedAt)` and `(shopId, availableQty)`. Partial index on `StockReservation(expiresAt) WHERE status = 'HELD'`.

### 4.2 Prisma ORM

| Capability | Use in this project |
|---|---|
| Schema-first modelling | `schema.prisma` is the single source of truth |
| Generated client | Full type safety from DB to API response |
| Migrations | `prisma migrate dev` locally, `migrate deploy` in CI |
| Transactions | `$transaction` for the order placement critical section |
| Raw escape hatch | `$queryRaw` for `SELECT ... FOR UPDATE` and complex analytics |
| Prisma Studio | Local data inspection |

**Known limits and how they're handled:** Prisma has no native `FOR UPDATE` — the stock-check path uses `$queryRaw` with a tagged template (still parameterised, still safe). Deeply nested analytical aggregations are written as SQL views and read through Prisma, not built with nested `include`.

### 4.3 Redis 7

Six distinct roles: BullMQ queue backend, session and refresh-token store, rate-limit counters, `GEOADD`/`GEOSEARCH` for live rider positions, Socket.IO pub/sub adapter, hot-path cache for shop catalogues. Persistence: AOF `everysec`; queue data is durable, cache data is expendable.

---

## 5. DevOps & Tooling

| Concern | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo (`apps/web`, `apps/api`, `apps/worker`, `packages/shared`) |
| Containers | Docker multi-stage builds, distroless runtime image |
| Local dev | `docker compose` — Postgres, Redis, MinIO, Mailpit |
| CI/CD | GitHub Actions: lint → typecheck → test → build → scan → migrate → deploy |
| Hosting (pilot) | Railway / Render — fast to stand up |
| Hosting (scale) | AWS ECS Fargate + RDS + ElastiCache, or Kubernetes |
| Frontend hosting | Vercel / Cloudflare Pages + CDN |
| IaC | Terraform |
| Monitoring | Prometheus + Grafana, Sentry, Better Stack for uptime |
| Feature flags | Unleash (self-hosted) or a simple DB-backed flag table |

---

## 6. Repository Layout

```
smart-dukan/
├── apps/
│   ├── web/                # React + Vite
│   ├── api/                # Express
│   ├── worker/             # BullMQ processors
│   └── ml/                 # Python FastAPI forecasting service
├── packages/
│   ├── shared/             # Zod schemas, types, constants shared web↔api
│   ├── ui/                 # Design system components
│   └── config/             # eslint, tsconfig, tailwind presets
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── docs/                   # these documents
├── infra/                  # Terraform, Dockerfiles, compose
└── .github/workflows/
```

---

## 7. Version Matrix

| Component | Version | Support until |
|---|---|---|
| Node.js | 20.x LTS | Apr 2026 → plan 22.x migration |
| React | 18.3 | current |
| Express | 4.19 | evaluate v5 after it stabilises |
| PostgreSQL | 16 | Nov 2028 |
| Prisma | 5.x | current |
| Redis | 7.2 | current |
| TypeScript | 5.5 | current |

---

## 8. Stack Rationale Summary

| Choice | Alternative considered | Why this one |
|---|---|---|
| React + Vite | Next.js | SPA with one prerendered marketing page; Vite's build control suits the WebGL bundle better |
| Express | Fastify, NestJS | Team familiarity, largest middleware ecosystem; NestJS overhead not justified at this size |
| PostgreSQL | MongoDB | Inventory is money — needs transactions and row locks, not eventual consistency |
| Prisma | TypeORM, Drizzle, Knex | Best-in-class DX and type generation; raw SQL still available where it matters |
| Redis | Postgres LISTEN/NOTIFY, RabbitMQ | One dependency covers queue, cache, geo, and pub/sub |
| Socket.IO | raw WebSocket, SSE | Rooms, reconnection, and fallback come free |
| Framer Motion + R3F | GSAP, Lottie-only | Declarative and React-idiomatic; animation state lives with component state |
| MapLibre | Google Maps | No per-load billing surprise; full styling control for the animated delivery view |
| Python ML service | TensorFlow.js in Node | Forecasting tooling in Python is genuinely better; isolation also means model work doesn't destabilise the API |
