# Smart Dukan 2.0 — Security Architecture

---

## 1. Principles

1. **Never trust the client.** Every authorisation decision is made server-side, including for WebSocket room joins.
2. **Least privilege.** A shopkeeper can only touch their own shop's rows; a rider can only see the order currently assigned to them.
3. **Defence in depth.** Edge → transport → application → data. A single bypassed layer should not be enough.
4. **Secure by default.** Deny unless explicitly allowed. New endpoints inherit auth + rate limiting unless opted out deliberately.
5. **Assume breach.** Encrypt at rest, log everything sensitive, keep blast radius small.

---

## 2. Threat Model (STRIDE)

| Threat | Vector in this system | Mitigation |
|---|---|---|
| **Spoofing** | Fake rider accepting jobs; OTP guessing at the door | Phone OTP registration, KYC for riders, hashed delivery OTP, 3-attempt lockout |
| **Tampering** | Client-side price or quantity manipulation at checkout | Prices and totals recomputed server-side from DB; client values are ignored |
| **Repudiation** | "I never placed that order" / "I never received it" | Immutable `OrderEvent` audit trail, OTP-backed delivery proof, signed payment webhooks |
| **Information disclosure** | Enumerating other shops' inventory or customers' addresses | Row-level scoping in every repository query, UUID ids, no sequential ids in URLs |
| **Denial of service** | Order spam, credential stuffing, location-ping floods | Tiered rate limits, per-user and per-IP, CAPTCHA on repeated auth failure, ping throttle |
| **Elevation of privilege** | Customer calling shop-admin endpoints; JWT role tampering | RS256-signed tokens, server-side role check per route, no role read from request body |

**Business-logic threats specific to this product**

| Threat | Mitigation |
|---|---|
| Overselling via concurrent orders | `SELECT ... FOR UPDATE` + reservation rows inside a single transaction |
| Reservation squatting (hold stock, never pay) | 10-minute TTL, expiry worker, per-user concurrent-reservation cap |
| COD fraud / fake deliveries | OTP required, rider geofence check at drop point, anomaly scoring on rider completion patterns |
| Rider scraping customer addresses | Address revealed only after job acceptance; phone numbers masked through a proxy number |
| Forecast poisoning via fake orders | Cancelled and fraud-flagged orders excluded from training data |

---

## 3. Identity & Access Management

### 3.1 Authentication

| Actor | Method |
|---|---|
| Customer | Phone + OTP (primary), optional email/password |
| Shopkeeper | Email/password + **mandatory TOTP 2FA** |
| Rider | Phone + OTP, device binding |
| Admin | SSO + hardware-key or TOTP 2FA, IP allowlist |

**Token strategy**

```
Access token   JWT, RS256, 15 min TTL, in memory only (never localStorage)
Refresh token  opaque random 256-bit, 30 day TTL,
               httpOnly + Secure + SameSite=Strict cookie,
               stored hashed (SHA-256) in Redis,
               ROTATED on every use
```

Refresh-token reuse detection: if a already-rotated token is presented, the entire token family is revoked and the user is forced to re-authenticate. That is the signature of a stolen token.

Passwords: **Argon2id** (m=64MB, t=3, p=4). Never bcrypt-with-default-cost, never plain hashing.

### 3.2 Authorisation

Two layers, both enforced:

**a) Role gate (route level)**
```ts
router.get('/shop/inventory',
  authenticate,
  authorize(Role.SHOPKEEPER),
  scopeToOwnShop,
  inventoryController.list
);
```

**b) Resource ownership (data level)**
Every repository method takes a tenant scope. There is no "get by id" without a scope argument — the compiler enforces it via a required parameter.

```ts
findOrder(orderId: string, scope: { shopId?: string; customerId?: string; riderId?: string })
```

**c) PostgreSQL Row-Level Security** as a backstop on `Order`, `InventoryItem`, `Product` and `Delivery`, so an application-layer bug alone cannot leak cross-tenant rows.

### 3.3 Permission matrix

| Resource | Customer | Shopkeeper | Rider | Admin |
|---|---|---|---|---|
| Own profile | RW | RW | RW | RW |
| Shop catalogue | R | RW (own) | – | R |
| Inventory levels | – | RW (own) | – | R |
| Order (own) | R, create, cancel | RW (own shop) | R (assigned only) | RW |
| Customer address | RW (own) | R (after confirm) | R (after accept) | R |
| Payment details | – | R (settlement only) | – | R |
| AI insights | – | R (own) | – | R |
| Audit logs | – | – | – | R |

### 3.4 WebSocket authorisation
Connection is authenticated with the access token at handshake. Room joins are **not** client-controlled — the client requests `join order:{id}`, the server verifies the caller is that order's customer, shopkeeper, or assigned rider, and only then joins the room. Tokens are re-verified on refresh; expired connections are disconnected.

---

## 4. Application Security

### 4.1 Input handling
- **Zod** schemas on every request body, query, and param. Unknown keys stripped, not ignored.
- Type coercion is explicit; no `parseInt` on untrusted input without bounds.
- File uploads: MIME sniffing (not extension trust), size cap, dimension cap, re-encoded server-side, stored on a separate domain with `Content-Disposition: attachment`.

### 4.2 Injection defence

| Vector | Control |
|---|---|
| SQL injection | Prisma parameterised queries; the few raw queries use `$queryRaw` tagged templates, never string concatenation |
| NoSQL / Redis injection | Key names constructed from validated ids only |
| XSS | React escapes by default; `dangerouslySetInnerHTML` is lint-banned; DOMPurify for the one rich-text field |
| CSRF | SameSite=Strict cookies + double-submit token on cookie-authenticated mutations |
| SSRF | Outbound URLs allowlisted; webhook targets validated against a private-IP blocklist |
| Prototype pollution | `Object.create(null)` for dynamic maps; no deep-merge of untrusted objects |
| Command injection | No shell invocation with user data |

### 4.3 Security headers (Helmet + Nginx)

```
Content-Security-Policy: default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://cdn.smartdukan.app;
  connect-src 'self' https://api.smartdukan.app wss://api.smartdukan.app;
  worker-src 'self' blob:;
  frame-ancestors 'none'; base-uri 'self'; object-src 'none'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(), microphone=()
```

> Note for the graphics layer: WebGL shaders are compiled from strings, not `eval`, so the particle system runs fine without `unsafe-eval`. Web Workers loaded from blobs require `worker-src 'self' blob:` — that is the only CSP concession the animation stack needs.

### 4.4 Rate limiting

| Endpoint class | Limit |
|---|---|
| `POST /auth/login`, `/auth/otp` | 5 / 15 min per IP **and** per identifier |
| `POST /orders` | 10 / hour per user |
| `POST /rider/location` | 20 / min per rider |
| Read APIs | 100 / min per user |
| Unauthenticated | 30 / min per IP |

Redis-backed sliding window, plus Cloudflare/WAF-level protection at the edge for volumetric attacks.

### 4.5 Dependency & supply chain
- `npm audit` + Snyk/Dependabot in CI; the build fails on high/critical.
- Lockfiles committed; `npm ci` only.
- No `postinstall` scripts from untrusted packages (`--ignore-scripts` with an explicit allowlist).
- SBOM generated per release.
- Container images pinned by digest, scanned with Trivy.

---

## 5. Data Protection

### 5.1 Classification

| Class | Examples | Handling |
|---|---|---|
| **Critical** | Passwords, refresh tokens, delivery OTPs, payment tokens | Hashed/encrypted, never logged, never returned by any API |
| **Sensitive** | Phone, address, GPS trail, order history | Encrypted at rest, access-logged, masked in non-prod |
| **Internal** | Inventory levels, forecasts, margins | Tenant-scoped |
| **Public** | Shop name, product catalogue, prices | Cacheable |

### 5.2 Encryption

- **In transit:** TLS 1.3 everywhere, HSTS preloaded, internal service traffic over mTLS.
- **At rest:** AES-256 full-disk on Postgres volumes; column-level encryption (`pgcrypto`) for address text and phone numbers; S3 SSE for media.
- **Keys:** managed in AWS KMS / HashiCorp Vault. Never in env files in production. Annual rotation, immediate rotation on suspected compromise.
- **Secrets:** injected at runtime from the secret manager; `.env` is gitignored and `.env.example` carries no real values; git-secrets pre-commit hook.

### 5.3 PII handling
- Customer phone shown to rider only as a **masked proxy number**, valid for the delivery window.
- Delivery address revealed only after the rider accepts.
- Logs pass through a pino redaction serialiser: `password`, `token`, `otp`, `authorization`, `phone`, `address`, `card*`.
- Non-production databases are seeded from anonymised dumps — never a production restore.

### 5.4 Payments
The platform is **out of PCI-DSS scope by design.** Card data never touches our servers: the gateway's hosted fields/SDK tokenise on the client, we store only a gateway token and the last four digits. Webhooks are verified by HMAC signature and replay-protected via event-id idempotency.

---

## 6. Infrastructure Security

```
Internet
   │
   ▼
[ WAF / DDoS (Cloudflare) ]  ── bot rules, geo-rules, volumetric protection
   │
   ▼
[ Load Balancer ]            ── TLS 1.3 termination, HSTS
   │
   ▼  ── Public subnet ──
[ Nginx reverse proxy ]      ── headers, rate limit, request size cap
   │
   ▼  ── Private subnet (no public IP) ──
[ API containers ]           ── non-root user, read-only FS, dropped capabilities
   │
   ▼  ── Data subnet (no egress) ──
[ PostgreSQL ] [ Redis ]     ── security-group restricted to API subnet only
```

- Bastion/SSH access only via short-lived certificates, MFA required, all sessions recorded.
- Infrastructure as code (Terraform); drift detection in CI.
- Backups: nightly full + continuous WAL archiving, encrypted, cross-region, **restore tested monthly**. An untested backup is not a backup.
- Network policies default-deny between namespaces.

---

## 7. AI/ML-Specific Security

| Risk | Control |
|---|---|
| **Data poisoning** — fake orders skewing forecasts | Exclude cancelled/fraud-flagged orders; outlier clipping at the 99th percentile; anomaly alert when a SKU's demand jumps beyond a plausible band |
| **Model inversion / leakage** — inferring a shop's private sales from shared models | Models are trained per shop or per anonymised category cohort; no raw cross-shop data in a shared model |
| **Over-trust in suggestions** | Every suggestion carries a confidence score and an explanation; the shopkeeper always confirms before a purchase order is created — the system never auto-orders |
| **Prompt injection** (if an LLM is added for insight summaries) | User/product text treated strictly as data; structured output enforced; no tool-calling on unvalidated input |
| **Bias in rider matching** | Scoring weights are auditable and logged per assignment; a fairness sweep checks job distribution across riders to prevent starvation |

---

## 8. Monitoring, Logging & Response

### 8.1 Audit events (immutable, append-only table + shipped to SIEM)
- Auth: login success/failure, OTP issued/verified, password change, 2FA change, token-reuse detection
- Authorisation denials (403s) — a spike is the earliest signal of enumeration
- Order state transitions with actor
- Inventory adjustments outside normal sale flow
- Admin actions, role changes, data exports
- Payment and refund events

### 8.2 Alerting thresholds

| Signal | Threshold | Action |
|---|---|---|
| Failed logins for one account | 5 / 10 min | Lock + notify user |
| 403 rate from one identity | 20 / min | Auto-suspend session, page on-call |
| Refresh token reuse | any | Revoke token family, force re-auth, investigate |
| Manual inventory increase | > 3× 30-day average | Flag for review |
| OTP failures on one delivery | 3 | Escalate to support |
| Unusual data export volume | > 1000 rows | Approval required |

### 8.3 Incident response

```
DETECT (alert/report) → TRIAGE (severity, 15 min) → CONTAIN (revoke, isolate, disable)
  → ERADICATE (patch, rotate keys) → RECOVER (restore, verify) → REVIEW (blameless postmortem, 5 days)
```

Severity ladder: **S1** data breach or full outage → page immediately, 1-hour comms. **S2** partial outage or privilege bug → 4 hours. **S3** degraded → next business day.

Breach notification: users and regulator notified per applicable law (India DPDP Act — notify the Data Protection Board and affected users without undue delay).

---

## 9. Compliance & Privacy

| Area | Commitment |
|---|---|
| **India DPDP Act 2023** | Explicit consent at signup, purpose limitation, data-principal rights (access, correction, erasure), grievance officer named |
| **GDPR** (if EU users) | Lawful basis documented, DPA with processors, right to portability (JSON export), 30-day response SLA |
| **PCI-DSS** | SAQ-A scope via hosted fields — no card data in our environment |
| **Data retention** | Orders & financial records 7 years (statutory); GPS trails 30 days; raw location pings 60 seconds; logs 90 days hot, 1 year cold |
| **Right to erasure** | Personal fields anonymised, transactional records retained in pseudonymised form to satisfy statutory retention |
| **Sub-processors** | Public list maintained; DPAs signed with payment, SMS, maps and cloud vendors |

---

## 10. Secure Development Lifecycle

| Stage | Control |
|---|---|
| Design | Threat model reviewed for any new module touching money, PII, or auth |
| Code | Mandatory review; security-sensitive paths need a second approver |
| CI | ESLint security plugin, `semgrep` rules, secret scanning, SAST, dependency audit — all blocking |
| Pre-deploy | DAST (OWASP ZAP) against the staging environment |
| Release | Signed images, immutable tags, canary rollout with automatic rollback |
| Post-release | Quarterly pentest, annual third-party audit, running bug-bounty/responsible-disclosure policy |

---

## 11. Security Checklist (pre-launch gate)

- [ ] All endpoints authenticated unless explicitly public and documented
- [ ] RLS policies active and verified with a cross-tenant test suite
- [ ] Argon2id password hashing confirmed in production config
- [ ] Refresh-token rotation + reuse detection tested
- [ ] Rate limits verified under load
- [ ] CSP deployed with no `unsafe-eval`; violation reporting enabled
- [ ] Secrets absent from the repo (history scanned) and loaded from the vault
- [ ] TLS 1.3 only; A+ on SSL Labs
- [ ] Backups encrypted and a restore drill completed
- [ ] PII redaction verified in production log samples
- [ ] Payment webhook signature verification tested with a forged payload
- [ ] Dependency scan clean of high/critical
- [ ] Incident runbook written, on-call rota staffed
- [ ] Privacy policy, consent flow, and grievance contact published
