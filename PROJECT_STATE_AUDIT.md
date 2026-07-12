# AVENTA Rent-a-Car — Project State Audit

**Date:** 2026-07-07
**Scope:** Full read-only audit of the codebase. Nothing was built or changed to produce this report.
**Method:** Direct code reading + four parallel read-only audits (data model, security, dormant features/payments, placeholder/seed content), each cross-checked against `src/`.

> An older `CURRENT_STATE.md` (dated 2026-07-01) exists in the repo. It is **partially stale** (e.g. it calls `CarPhoto` dead — it is now fully read/write). Treat **this** document as the current source of truth.

**Legend:** ✅ working end-to-end · 🟡 works with caveats · 🟠 placeholder content · 💤 dormant-but-ready (needs credentials/switch) · ⛔ blocked · 🔩 stubbed (scaffolding only) · ⚠️ gap/bug

---

## 1. Feature inventory — true status

### Customer-facing

| Feature | Status | Notes / caveats |
|---|---|---|
| Storefront (home, catalog, about, contact) | 🟡 | Fully functional UI, but **About + Contact ship placeholder contact details** (see §3). |
| Car catalogue + cards + photo carousel | ✅ | Recently redesigned for mobile (compact filters, working sort, full-width CTA). Thumbnail renditions (`.t.webp`) live. Desktop unchanged. |
| Booking flow (6-step: dates → route → extras → documents → payment → confirm) | 🟡 | Core flow works end-to-end. **Caveats:** additional-driver capture is dead (form always sends `[]`); **no in-app contract signing** (see §4); no pickup-map-picker / no return-location UI (schema columns exist but unused); guest-draft→account binding partially pending (per project memory). |
| Per-document verification (MANUAL) | ✅ | Each required doc PENDING/APPROVED/REJECTED; immutable attempts (`supersededAt`); one derived gate (`getVerificationForUser`) is the only authority. Poll-while-pending. Server-enforced delete rules. |
| Customer profile (`/account`) | ✅ | Redesigned 3-tier layout; live booking hero; booking history. |
| — Standalone `/account/documents` | ✅ | Reuses upload + per-doc UI; delete pending/rejected only (server-enforced); re-upload works; persists issuing country/region. |
| — Standalone `/account/addresses` | 🟡 | Full add/edit/remove of **SavedPlace** (map pins) + directions. Note: the profile's *typed* "Saved addresses" list reads a **different, read-only** model (`SavedAddress`, §6) that users cannot edit. |
| — Standalone `/account/payment-methods` | 🟠 | Honest "Coming soon" placeholder. No card storage, no fake cards. Correct by design. |
| Map + saved places + directions | 🟡 | OSM/Leaflet live and default. "Directions to pickup" on the **My-car** tab reads `Booking.pickupLat/Lng`, which **has no writer** (§6) — so that button generally won't appear. Saved-place directions work. |
| Mobile bottom nav (Home/Map/My car/Settings) | ✅ | Frosted, customer+mobile only; excludes staff/admin/auth/booking; safe-area + reduced-motion. |
| Booking-success / contract / payment page | 🟡 | Redesigned (mobile stacked flow, desktop 2-column). Contract PDF is real (`/api/contract/[number]`). **Caveats:** the "electronic signature available" note has **no signing UI** behind it; a **demo fallback renders a fake booking (Ivan Petrov PII)** when `/success` is opened without a valid `?b=`. |
| i18n (EN/RU/TR/ES/DE) | ✅ | Data-driven registry; EN default; per-language dictionaries with EN fallback. |
| Auth — email/password | ✅ | bcrypt (cost 12), DB-backed hashed opaque sessions. |
| Auth — phone/OTP code | ✅ | `OtpCode` model + `otp.ts`; codes hashed, expiry + attempt limits. |
| Auth — social (Google/Yandex/Telegram) | 💤 | Full OAuth routes exist; buttons hide when creds unset. Needs OAuth client credentials. |
| Logout in profile menus | ✅ | Customer avatar dropdown (Account + Sign out) and admin sidebar profile-card menu (Выйти); both → `/`. |

### Admin / internal

| Feature | Status | Notes |
|---|---|---|
| Admin dashboard + panels (bookings, cars, clients, calendar, services, settings) | ✅ | Dark shell, RU-first. |
| Order lifecycle / kanban (`/admin/board`, status control) | ✅ | Single rulebook `lib/booking-status.ts` (`canTransition`), server-enforced for staff writes. |
| Verification queue (`/admin/verifications`) | ✅ | Per-document approve/reject with expiry; staff-only. |
| Finance module (`/admin/finance`) | ✅ | Income derived from confirmed payments; expenses + categories; accounts/transfers/adjustments; reconciliation; base-EUR conversion; **immutable finance audit** trail. |
| Payments admin — manual (`/admin/settings/payments`) | ✅ | Bank + crypto wallet entry; toggles (card OFF, bank/crypto ON by default). |
| Payments admin — processors (`/admin/settings/payment-providers`) | 🔩💤⛔ | Stripe/PayPal/PayTR/iyzico configurable, but adapters are stubs (§2). |
| Services CRUD | ✅ | Create/edit/delete/reorder; mirrors cars. |
| Locations (cities/offices) admin | ✅ | Map-based office picker (routes through provider abstraction). |
| Insurance tiers admin | 🟡 | Fully editable; **tiers ship as `isPlaceholder` demo text** until an admin saves real terms (§3). |
| Map provider switcher | ✅ | OSM/Google/Yandex; encrypted client keys; dormant providers ready. |
| Auto-translation admin | ✅ (UI) / 💤 | Draft-vs-reviewed workflow; dormant until a key is set. |
| Sumsub settings | ✅ (UI) / 💤 | Runtime + webhook fully built; dormant until credentials + method switch. |
| Social-login settings | ✅ (UI) / 💤 | Encrypted creds; dormant. |
| CRM (`/crm`), Fleet calendar (`/calendar`), Notifications (`/notifications`) | 🟡 | Present and rendering. Notifications: infra exists (`notify.ts` via nodemailer + `Notification` log + optional Telegram/WhatsApp); **email only actually sends when SMTP is configured** (else console). Full booking-event notification coverage not exhaustively verified in this audit. |

---

## 2. Dormant / blocked — what each needs to go live

Every integration uses the same pattern: a DB config row with an `enabled` toggle + AES-256-GCM-encrypted secrets, default OFF. Nothing is enabled in seed.

### Payments — the important structural finding
There are **two parallel, non-overlapping payment stacks**, and **neither can currently charge**:

- **Stack A — admin adapter framework** (`lib/payment-gateway/*`): defines Stripe, PayPal, PayTR, iyzico. **All four adapters spread `...notImplemented`** — `createPayment`/`handleWebhook` return `not_implemented`, `verifySignature` returns `false`. Pure scaffolding; the admin can configure them but they cannot take money. Stripe/PayPal additionally carry a hard **Turkey-entity block** (`availability.blocked = true`).
- **Stack B — legacy env-based** (`lib/payments.ts` + `server/payment-actions.ts`): `createStripeIntentAction` and `createPayPalOrderAction` are actually wired to charge, gated on env vars. Stripe here has a **real, signature-verified webhook** at `/api/webhooks/stripe`. This is the closest-to-live processor path.

> ⚠️ These two stacks are redundant and confusing. Any go-live needs to **pick one** and finish its webhook wiring. (The adapter framework references `/api/payments/webhook/*` routes that **do not exist**; only `/api/webhooks/stripe` and `/api/sumsub/webhook` are built.)

| Integration | Status | Exact external requirement to activate |
|---|---|---|
| **Manual bank transfer + crypto** | ✅ **LIVE** | None — admin enters wallet addresses + bank details. Already operational. |
| **Stripe** | 💤⛔🔩 | Stack B: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`. Stack A also requires a **non-Turkey legal entity** to lift the block, plus finishing the stub. |
| **PayPal** | 💤⛔🔩 | `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` (+ `PAYPAL_ENV`). **No PayPal webhook route exists** → confirmation not automated. Adapter is a blocked stub. |
| **PayTR** | 💤🔩 | A **PayTR merchant account** + `merchantId`/`merchantKey`/`merchantSalt`. Not Turkey-blocked, but the **runtime is a stub** — must be implemented + webhook built. |
| **iyzico** | 💤🔩 | An **iyzico merchant account** + `apiKey`/`secretKey`. Runtime is a stub — must be implemented + webhook built. |
| **Coinbase** | ✅ removed | Deliberately deleted (shutting down 2026-03-31; never available to a Turkey entity). Clean — only explanatory comments remain. |
| **Sumsub (automated KYC)** | 💤 (runtime + webhook fully built) | A **Sumsub account** + `appToken`, `secretKey`, `webhookSecret`, `levelName`; switch verification method to `SUMSUB`; point the Sumsub dashboard webhook at `/api/sumsub/webhook`. The most "ready" of the dormant integrations. |
| **Google Maps** | 💤 | A Google Maps JavaScript API key (referrer-restricted); select provider `google`. |
| **Yandex Maps** | 💤 | A Yandex Maps JavaScript API key (referrer-restricted); select provider `yandex`. |
| **OSM/Leaflet maps** | ✅ **LIVE (default)** | None. |
| **Auto-translation** | 💤 | A **DeepL Auth Key** (default provider) or a **Google Cloud Translation API key**; enable in admin. Legal + insurance groups are excluded from auto-translation by design. |
| **Email (SMTP)** | 💤 | `SMTP_HOST/PORT/USER/PASS` + `MAIL_FROM`. Without them, mail logs to console (dev). |
| **Telegram / WhatsApp notifications** | 💤 | `TELEGRAM_BOT_TOKEN`/`TELEGRAM_ADMIN_CHAT_ID`; `WHATSAPP_TOKEN`/`WHATSAPP_PHONE_ID`. |
| **Social login (Google/Yandex/Telegram)** | 💤 | Respective OAuth client id/secret (+ `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`). |
| **Saved cards page** | 🟠 | Placeholder; depends on a live card processor first. |

---

## 3. Placeholder content that must be replaced before launch

| Item | Status | Detail |
|---|---|---|
| **Legal documents** (privacy, distance-selling, delivery/returns) | 🟠 **all placeholder** | `src/data/legal-docs.ts` — every section body is `[TEMPLATE — replace with real, lawyer-reviewed legal text]` / `[ШАБЛОН …]`. Structure maps to Turkish law (KVKK 6698, Consumer Law 6502) but **no binding wording**. UI shows warning banners. |
| **`LEGAL_VERSION`** | 🟠 | `= '2026-01-DRAFT'` (`src/lib/legal.ts`). **Every consent record customers generate today references the draft** — legally weak until real text lands and the version is bumped. |
| **Insurance tier coverage text** | 🟠 | `InsuranceTier` rows seeded (`scripts/seed-insurance.mjs`) with `isPlaceholder: true` and `[ПРИМЕР]/[EXAMPLE]` text + demo excess €1500/€500/€0. Admin-editable; saving clears the flag. Unreplaced until an admin edits all three tiers. |
| **Seeded company + bank settings** | 🟠 | `bank_iban = TR00 0000 0000 0000 0000 0000 00`, `bank_swift = XXXXTRXX`, `company_phone = +90 555 000 00 00`, `company_email = hello@aventa.rent`, `company_legal = AVENTA Turizm ve Rent A Car Ltd. Şti.`. **These surface on the Booking + Success pages.** |
| **Contact page** | 🟠 | Placeholder phone/email/WhatsApp/Telegram (`+90 555 000 00 00`, `hello@aventa-rental.com`, `@aventa`). Has an on-page warning. |
| **About page** | 🟠 | Hardcoded `AVENTA Rental LLC` + placeholder phone/email — **no warning banner**. |
| **Company identity inconsistency** | ⚠️ | Three different legal names across the codebase (`AVENTA Turizm ve Rent A Car Ltd. Şti.` / `AVENTA Rental LLC` / `AVENTA Rent`) and two emails (`hello@aventa.rent` / `hello@aventa-rental.com`). Must be reconciled to the real registered entity. |
| **Car photos** | 🟠 | Seed cars use generated SVG placeholders in `public/uploads/cars/seed-*.svg`. |
| **Success demo fallback** | 🟠 | `/success` without a booking renders a fake booking (`AVN-2026-0042`, Ivan Petrov, passport/licence). Decide whether to gate/remove. |

---

## 4. Known bugs, TODOs, and half-finished work

**Code hygiene:** **zero** `TODO`/`FIXME`/`HACK`/`XXX` markers, **zero** `@ts-ignore`/`@ts-expect-error`, **zero** `dangerouslySetInnerHTML`. `tsc --noEmit` is clean. This is an unusually tidy codebase.

**Half-finished / built-but-not-wired features** (from the data-model trace):

- ⚠️ **Contract e-signature — not wired.** `ContractSignature` model + `contract-actions.ts` (`upsert`) + `SignaturePad.tsx` all exist, but **`SignaturePad` is never mounted in any view**. No signature is ever captured, yet the Success page advertises "electronic signature available." Either wire the pad into the flow or remove the claim.
- ⚠️ **Additional drivers — dead input.** Nested-create is supported server-side, but `Booking.tsx` always sends `additionalDrivers: []`. The feature is invisible to users.
- ⚠️ **Waitlist — effectively dead.** `WaitlistEntry` is read once on the calendar page; there is **no join-waitlist action, no offer/notify path**.
- ⚠️ **Reviews — no moderation.** `Review.approved` is filtered on read but **never written by the app** (seed-only). No admin moderation UI; new reviews cannot be created in-app.
- ⚠️ **Typed saved addresses — read-only.** `SavedAddress` is displayed on the profile but has **no create/update/delete** anywhere; only seed populates it. (The map-based `/account/addresses` page manages the separate `SavedPlace` model instead.)
- ⚠️ **Pickup coordinates / return location — no capture UI.** `Booking.pickupLat/Lng` and all `Booking.return*` columns have no writer, so features that read them (e.g. My-car "directions to pickup") degrade to nothing.

**Mobile/desktop divergence:** the app intentionally branches many views on `useIsMobile()` and maintains **both** paths. Recent redesigns (catalogue mobile, success desktop 2-column, mobile bottom nav) were built per-viewport and verified on both. No feature was found that works on one viewport but is broken/missing on the other.

---

## 5. Security posture

Overall **strong**: real server-side authority checks, correct HMAC verification on both webhooks, encrypted-at-rest documents + all third-party secrets, hashed opaque sessions, and genuine single-source-of-truth rulebooks. Specific gaps listed at the end.

**Encryption pipeline — IN PLACE (with a resilience caveat).** AES-256-GCM, 96-bit random IV per message, GCM auth tag stored. Single key from **`DOC_ENCRYPTION_KEY`** (must decode to 32 bytes; app throws if missing/malformed). Encrypts: uploaded documents (passports/licences/selfies/payment proofs, stored outside web root) **and** all config secrets (OAuth, Sumsub, payment-provider, map-provider, translation keys).
- ⚠️ **Single key, no versioning/rotation.** Rotating or losing `DOC_ENCRYPTION_KEY` **permanently orphans all existing ciphertext** — documents throw (HTTP 500), secrets silently read as `null` ("unconfigured"). This is documented in code but is a real operational risk: the key must be generated strongly, backed up securely, and never rotated without a re-encryption plan (which does not exist).

**Authority-over-state — IN PLACE (strong).** Every critical write is guarded server-side:
- Booking status → `requireStaff()` + `canTransition`.
- Document/verification approval + expiry → `requireStaff()` (staff only).
- Payment confirm/record → `requireStaff()` (staff-authoritative).
- All finance writes → `requireStaff()` on every export.
- Customer manual-payment declaration → owner/staff check, **status hard-forced to `AWAITING`** (customer can only *declare*, never mark paid), proof-doc ownership re-checked.
- Booking create → re-prices and re-checks availability server-side; verification-authoritative fields (`passportExpiry`/`licenseExpiry`) are written **only** by the signed Sumsub webhook, never from the booking payload (mass-assignment explicitly blocked).

**Audit trails — IN PLACE.** 89 `logAudit` call sites + a separate **immutable finance audit** (`FinanceAudit` / `writeFinanceAudit`).
- ⚠️ Gaps: Stripe `payment_failed` (`Payment.status='ERROR'`) and `createPayPalOrderAction` are **not** sent to `logAudit`; `saveDocLocationAction` is unlogged (low sensitivity).

**Webhook signature verification — IN PLACE (both).**
- Sumsub: HMAC over **raw bytes**, algorithm whitelisted, `timingSafeEqual`, fail-closed if secret unset, rejection audited.
- Stripe: `stripe.webhooks.constructEvent` on the raw body, 400 on failure.

**XSS / injection — one real GAP.**
- ⚠️ **`src/views/Booking.tsx:1582`** interpolates admin-entered office `name`/`address` into a raw-HTML map popup **without `escapeHtml`** — unlike the identical (fixed) pattern in `SavedPlaces`. Stored/admin-XSS sink. Low likelihood (staff input) but inconsistent with the project's own escaping discipline. **Recommend applying `escapeHtml` here.**
- Map popups (Leaflet/Google/Yandex) render `popupHtml` as raw HTML by design; `SavedPlaces` correctly escapes; only the Booking office popup was missed.

**Rulebook single-source-of-truth — IN PLACE, but bypassed on two paths.**
- ⚠️ The **Stripe webhook** sets `booking.status='CONFIRMED'` **without `canTransition`** — a `payment_intent.succeeded` on an `ACTIVE`/`RETURNED` booking could scramble the lifecycle. Signature-verified (not attacker-controlled) but circumvents the rulebook.
- ⚠️ **`submitManualPaymentAction`** (customer-callable) sets `booking.status='AWAITING_PAYMENT'` **without `canTransition`**.

**Session / auth — IN PLACE.** DB-backed opaque 256-bit tokens, **only the SHA-256 hash stored**; cookie `aventa_session` with `httpOnly`, `secure` (prod), `sameSite=lax`, 30-day expiry; bcrypt cost 12; `requireUser/requireRole/requireStaff` gates.
- ⚠️ **CSP is weak:** `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com` — both `unsafe-inline` and `unsafe-eval` allowed, weakening XSS defense-in-depth (nonces noted as a future improvement in code).
- ⚠️ **No in-app HSTS** (`Strict-Transport-Security`); presumably expected at the reverse-proxy layer but not enforced by the app.

---

## 6. Data model overview

**PostgreSQL, 45 models, 21 enums, 20 migrations** (latest `20260704105942_map_providers_saved_places`).

**Core entity graph:** `User` is the root (cascade-deletes ClientProfile, Booking, Document, Session, OAuthAccount, SavedAddress/Place, PaymentMethod, WaitlistEntry, BookingDraft). `Booking` is the transactional core (cascade-deletes BookingExtra, Insurance, AdditionalDriver, Payment, BookingStatusEvent, ContractSignature; set-null to Document/ConsentRecord/IncomeAdjustment). `Car` cascade-deletes CarPhoto/WaitlistEntry, restrict-linked from Booking, set-null from Review. Finance (`Account`, `Expense`, `Transfer`, `IncomeAdjustment`, `Payment`) is restrict-linked to `Account`. Config is mostly single-row admin tables (`Setting`, `MapProviderConfig`, `TranslationConfig`, `SumsubConfig`, `PaymentProvider`, `ProviderCredential`, `CurrencyRate`, `InsuranceTier`, `City`, `Office`, `SiteContent`).

**Dead / orphaned (grep-verified across `src/`):**
- **`SavedPaymentMethod` — DEAD.** Zero app references; seed-only. (Orphaned when the fake-card UI was removed.) Safe to drop.
- **`SavedAddress` — read-only.** Read on the account page; no CRUD anywhere.
- **`Review` — read-only.** Seed-only writes; no moderation; `approved` never set by app.
- **`WaitlistEntry` — effectively dead.** One calendar read; no queue/offer path.
- **`AuditLog` — write-only.** Written everywhere, **never read** (no admin viewer/export).
- **`ConsentRecord` — write-only.** Written on consent, no read/export path.
- **`AdditionalDriver` / `ContractSignature` — never populated** (see §4).
- **Dead columns:** `Booking.prepaidAmount`, all `Booking.return*` + `pickupLat/Lng`; `ClientProfile` passport/license issue+expiry + `addressCountry/City` + `notes`; most of `Payment.provider/providerRef/crypto*/proofDocId/kind` (client-initiated processor path unwired).

Enums are comprehensive (e.g. `BookingStatus` 10 states, `PaymentStatus` 8, `PaymentMethod` 6, `Currency` 6). Nothing malformed.

---

## 7. Deployment readiness

**Hard-required env (app throws without them):**
- `SESSION_SECRET` — session token signing.
- `DOC_ENCRYPTION_KEY` — **32-byte hex; generate strong, back up securely, never rotate without a re-encryption plan** (§5).
- `DATABASE_URL` — read by Prisma.

**Must set for production (have dev-only defaults):**
- `APP_URL` — defaults to `http://localhost:3000`. **Must be the real domain** (used in emails, Sumsub webhook host derivation, links).
- `STORAGE_DIR` — defaults to `./.storage`. **Encrypted documents are stored on local disk here.** In production this must be a **persistent volume** (not ephemeral container storage) with backups, or documents are lost on redeploy.

**Optional / feature-gated (unset = feature hidden/dormant):** SMTP (`SMTP_*`, `MAIL_FROM`, `ADMIN_EMAIL`), `TELEGRAM_*`, `WHATSAPP_*`, `STRIPE_*`, `PAYPAL_*`, `CRYPTO_*` wallets, `GOOGLE_/YANDEX_/TELEGRAM_` OAuth, `CRON_SECRET`, `BACKUP_DIR`.

**External services required at minimum:** managed **PostgreSQL** (dev uses Docker `postgres:16-alpine` on port **5544** via `docker-compose.yml`), a **reverse proxy** terminating TLS (and ideally adding HSTS), and **persistent file storage** for `STORAGE_DIR`.

**Scheduled jobs:** `/api/cron/document-retention`, `/api/cron/reservation-timeout` (cancels unconfirmed manual holds, releases cars), `/api/cron/booking-draft-cleanup` (deletes abandoned booking DRAFTS past their configurable TTL, default 24h), and `/api/cron/card-intent-reconcile` (refunds card deposits that were CHARGED but never became a booking — 3-D Secure redirect stranded, session lost, async 'processing' settled late — after a configurable grace window, default 30 min) all exist and are gated by `CRON_SECRET` — each needs an external scheduler (cron/Cloud Scheduler) to actually run. All four are mutually SEPARATE (the reservation-hold releases a car, the draft cleanup deletes form data, the card reconcile refunds a Stripe charge).

**Hardcoded localhost / dev-only to check:** `env.appUrl` fallback (`localhost:3000`) and the Sumsub settings page host fallback (`localhost:3000`). Both are covered once `APP_URL`/proxy headers are set.

**Would break in production if shipped as-is:**
- Demo seed data (accounts with default passwords, fake bank/company details, demo client PII, fake reviews/bookings) — see §3 and the checklist below.
- `STORAGE_DIR` on ephemeral disk → document loss.
- Missing `APP_URL` → wrong links / webhook host.
- `.env` is correctly git-ignored; ensure real secrets are injected via the platform, not committed.

---

## 8. What's left before launch — prioritized

### A. Blocking — legal, safety, and correctness (do first)
1. **Replace all legal text** (`src/data/legal-docs.ts`) with real lawyer-reviewed KVKK privacy, distance-selling contract, and delivery/returns; then **bump `LEGAL_VERSION`** off `2026-01-DRAFT`. (Current consent records reference a draft — legally weak.)
2. **Replace seeded company + bank details** (`bank_iban`, `bank_swift`, `company_phone`, `company_email`, `company_legal`, `company_address`) — these appear on Booking/Success payment screens.
3. **Rotate/disable demo accounts + passwords** (`Admin!2026`/`Owner!2026`/`Client!2026`) and **do not seed** demo client PII, fake cards, fake reviews, or fake bookings in production.
4. **Set required secrets properly:** strong `SESSION_SECRET` + `DOC_ENCRYPTION_KEY` (backed up), real `APP_URL`, `DATABASE_URL` to managed Postgres, and `STORAGE_DIR` on a **persistent, backed-up volume**.
5. **Fill real insurance tier terms** in `/admin/settings/insurance` (clears the placeholder flag).
6. **Reconcile company identity** (one legal name + one email across seed, About, Contact) and **replace placeholder contact details** (Contact + About) + **real car photos**.

### B. Security fixes (should-fix before launch)
7. **Escape `office.name`/`office.address`** in `Booking.tsx:1582` (apply `escapeHtml`).
8. **Route the two rulebook-bypass status writes** (Stripe webhook, `submitManualPaymentAction`) through `canTransition`.
9. **Tighten CSP** (remove `unsafe-eval`/`unsafe-inline` via nonces) or formally accept as a known risk; **add HSTS** at the proxy; confirm secure cookies in prod.
10. **Close audit gaps** (log Stripe `payment_failed` and PayPal order-create).

### C. Product decisions / feature completion
11. **Decide the payment go-live path:** either (a) stay **manual bank/crypto only** (works today), or (b) pick **one** processor stack and finish it — Stripe/PayPal need a **non-Turkey legal entity** + keys + webhook; **PayTR/iyzico** are Turkey-eligible but their runtime is a **stub** that must be built + webhooked. Resolve the two-redundant-stacks confusion.
12. **Contract e-signature:** wire `SignaturePad` into the flow, or remove the "electronic signature available" claim.
13. **Resolve the dead/half-features:** build or remove waitlist, additional-driver input, typed-address CRUD, review moderation, and pickup-coordinate capture (which the My-car "directions to pickup" depends on).
14. **Gate or remove the Success demo fallback** (renders fake PII when no booking).
15. **Optional integrations, as desired:** Sumsub (fully ready — just credentials), Google/Yandex maps, auto-translation (DeepL/Google key), social login, and **SMTP** (needed for real customer/admin email — currently console-only).

### D. Ops / non-code
16. Provision managed Postgres + automated backups; persistent storage volume for encrypted documents; reverse proxy with TLS + HSTS.
17. Configure the `document-retention` cron with a scheduler + `CRON_SECRET`.
18. Delete/refresh the stale `CURRENT_STATE.md` so the team has one accurate status doc.

---

### Bottom line
The engineering is **solid and unusually clean** — strong security fundamentals, a real single-source-of-truth rulebook, comprehensive audit trails, and a consistent dormant-but-ready pattern for every integration. What stands between it and launch is mostly **non-code**: real legal text, real company/bank/contact data, removing demo seed data, and secrets/ops setup — plus a **payment go-live decision** (manual-only works today; card processors are blocked or stubbed), wiring or removing the **e-signature**, and a handful of **security tidy-ups** (one XSS escape, two rulebook bypasses, CSP hardening).
