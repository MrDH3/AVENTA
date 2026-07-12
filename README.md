# AVENTA — Premium Car Rental & Travel Ecosystem

A production-grade **full-stack** web application for a premium car-rental company in Antalya,
Turkey, that doubles as a travel ecosystem (transfers, tours, real estate, concierge). Clients
book cars with real availability checks, upload passport/licence documents securely, and pay in
multiple currencies (card / bank / crypto); staff manage the fleet, bookings, clients, finances,
and analytics from an admin panel + owner CRM.

Bright **“seaside”** design on the client side (bilingual RU/EN), harmonised **deep-sea dark**
theme for internal tools.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 14** (App Router) + React 18 + **TypeScript (strict)** |
| Database | **PostgreSQL 16** (Docker) via **Prisma** ORM |
| Auth | Custom **DB-backed sessions** (bcrypt, httpOnly cookies, roles CLIENT/ADMIN/OWNER) |
| Documents | **AES-256-GCM** encrypted at rest, access-gated download route |
| Payments | Manual (proof/tx-hash) · **Stripe** · **PayPal** · **crypto** (USDT/USDC, QR) |
| PDF / e-sign | `pdf-lib` rental contract + canvas e-signature embedded in the PDF |
| Validation | **Zod** on every input · rate limiting · audit log · consent capture |
| Notifications | Email (Nodemailer) · Telegram · WhatsApp (optional) |
| Styling | Design-token CSS variables + inline styles (no UI framework) |

---

## Quick start

Prerequisites: **Node 20+**, **Docker Desktop** running.

```bash
# 1. install deps
npm install

# 2. environment — copy the template and fill secrets (a working .env is already present in dev)
cp .env.example .env
#    generate secrets:
#    node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"   → SESSION_SECRET
#    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"         → DOC_ENCRYPTION_KEY

# 3. start PostgreSQL (Docker, host port 5544)
npm run db:up

# 4. create the schema + seed the fleet, services, users, demo bookings
npm run db:migrate        # applies migrations
npm run db:seed

# 5. run
npm run dev               # http://localhost:3000
```

Production: `npm run build && npm run start`.

### Seed credentials (change before production)
| Role | Email | Password |
|---|---|---|
| Admin | `admin@aventa.rent` | `Admin!2026` |
| Owner | `owner@aventa.rent` | `Owner!2026` |
| Demo client | `ivan@example.com` | `Client!2026` |

---

## What works

**Client**
- Home with animated coastline hero + featured fleet (live from DB).
- **Catalog** with class filters, live availability, and **“show only free cars for my dates”**.
- **Booking** (5 steps): dates + pickup/return location + OpenStreetMap, extras & insurance
  (live total recompute), personal/contract data, **encrypted document upload** (passport/licence),
  consent, currency + payment (card/bank/crypto QR). Server **re-checks availability** (no
  double-booking, prep-time buffer, min rental) and suggests the nearest free interval.
- **Smart Services** concierge questionnaire → personalised recommendations, saved to CRM.
- **Account / tourist cabinet**: book-again, booking history + statuses, encrypted documents,
  saved addresses & payment methods, logout.
- **Auth**: email/password register + login (rate-limited), **Google & Yandex OAuth**, **phone /
  WhatsApp / Telegram / MAX / email one-time-code** sign-in, **Telegram Login Widget**, and
  **password reset** (email link). Auth-aware nav with a Sign-in button / avatar + sign-out.
- **Success + auto PDF contract** (`/api/contract/<number>`) with optional **e-signature**.
- About (DB reviews), Legal (cookie banner + consent modal → recorded), Brand Kit, screen map.

**Staff (ADMIN / OWNER)**
- **Admin panel**: bookings (filters, detail, status changes, comments, insurance state, document
  verify/reject), cars (CRUD + active toggle), clients, payments (record), services (toggle),
  settings (currency rates, site-text editor, company details).
- **CRM dashboard**: real revenue, utilization, profit-per-car, client interests, 14-day chart.
- **Fleet calendar**: real Gantt occupancy timeline per car.
- **Notifications**: templates + Email/Telegram/WhatsApp previews + recent-sent log.

**Security & privacy** (passports/licences are collected)
- Documents AES-256-GCM encrypted outside the web root; served only to the owner or staff via
  `/api/documents/<id>` (every access is audit-logged).
- DB-backed sessions, bcrypt(12), role-based guards on every protected page + middleware gate.
- CSP + security headers (`next.config.mjs` + `middleware.ts`), Zod validation, rate limiting,
  consent records with IP/UA, full audit log.
- `npm run backup` → gzipped `pg_dump` in `backups/` (restore instructions in `scripts/backup.ts`).

---

## Configuration (`.env`)

Payments/notifications are optional and **degrade gracefully** when unset (Stripe/PayPal show a
“not configured” message; emails/Telegram log to the console). Fill in to enable:
`STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
`PAYPAL_CLIENT_ID`/`SECRET`, `CRYPTO_*` wallet addresses, `SMTP_*`, `TELEGRAM_*`. See `.env.example`.

**Social sign-in** (buttons hide until configured): `GOOGLE_CLIENT_ID`/`SECRET` (redirect URI
`{APP_URL}/api/auth/oauth/google/callback`), `YANDEX_CLIENT_ID`/`SECRET` (`…/yandex/callback`),
`TELEGRAM_LOGIN_BOT_TOKEN` + `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`. Phone/WhatsApp/MAX one-time codes
work in dev (code logged to console); plug in an SMS/WhatsApp provider for production sending.

---

## Project structure

```
prisma/schema.prisma      full domain model · prisma/seed.ts
src/
  app/                    App Router — routes + /api (documents, contract, webhooks/stripe)
  views/                  the screen UIs (client components; formerly the prototype)
  components/             shared UI (nav, shells, cards, phone frame, signature pad…)
  lib/                    db, auth, crypto-storage, availability, pricing, money, i18n,
                          notify, validation, audit, rate-limit, payments, contract-pdf, view, queries
  server/                 server actions (auth, booking, document, admin, payment, contract, misc)
  styles/global.css       design tokens
docker-compose.yml        PostgreSQL 16 (host port 5544)
design-reference/         original hi-fi design comps (.dc.html) + DESIGN-HANDOFF.md
```

## Roadmap (post-MVP)
Promo codes, accounting integration, driver mobile app, OTP/password-reset backends, S3 document
storage, multi-node rate limiting (Redis), TR/ES/DE locales.
