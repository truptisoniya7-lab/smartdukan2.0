# Smart Dukan 2.0 — Documentation

An AI-powered retail + inventory + local delivery management platform for neighbourhood shops.

> The shopkeeper doesn't just record sales — the system tells them **what to stock, what to sell, and how to deliver it efficiently.**

## Documents

| # | Document | Covers |
|---|---|---|
| 01 | [PRD](./01-PRD.md) | Problem, personas, features, success metrics, release plan, open questions |
| 02 | [Technical Architecture](./02-Technical-Architecture.md) | System design, frontend/backend architecture, data model, API design, scalability |
| 03 | [System Workflow](./03-System-Workflow.md) | Order flow, AI engine flow, delivery flow, landing-page animation flow, failure paths |
| 04 | [Security Architecture](./04-Security-Architecture.md) | Threat model, auth/authz, data protection, infra security, compliance |
| 05 | [Technology Stack](./05-Technology-Stack.md) | Every library, version, and the reasoning behind each choice |

## Core flow

```
Customer → Place Order → Smart Dukan → Inventory AI Engine (Stock Check + Prediction)
                                            ↓
                              Delivery → Rider Match → Order Confirmed → Delivery Status
                                            ↓
                              Sales data feeds the next forecast cycle
```

## Stack summary

- **Frontend:** React 18 + Vite + TypeScript, Framer Motion, react-three-fiber, tsParticles
- **Backend:** Node.js 20 + Express.js + TypeScript
- **Database:** PostgreSQL 16 + Prisma ORM
- **Supporting:** Redis (queue/cache/geo), Socket.IO (realtime), Python service for forecasting

## Status

Draft — open questions are listed at the end of the PRD and should be resolved before M1 kickoff.
