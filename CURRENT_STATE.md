# AVENTA — Current State Audit

**Purpose:** an honest, code-verified snapshot of what is actually wired vs. what only exists as
schema/scaffolding. Verified by tracing every `prisma.<model>` read/write, every server action,
and every route — not by assumption. Date: 2026-07-01.

Legend for model usage:
- **R/W** — read *and* written by application code (working).
- **read-only** — read by app, but **never written** by app code (rows only appear via seed, or never).
- **write-only** — written by app, but **never read/displayed** anywhere.
- **never-populated** — a write path exists in code but no UI/trigger ever calls it → table stays empty.
- **dead** — neither meaningfully read nor written in practice.

---

## 1. Prisma models — fields, relations, real usage

| Model | Key fields | Relations | Real status |
|---|---|---|---|
| **User** | email(unique), passwordHash?, role, firstName, lastName, phone, whatsapp, telegram, image, emailVerified, phoneVerified, locale, loyaltyTier | profile, bookings, documents, sessions, oauthAccounts, resetTokens, addresses, paymentMethods, waitlist, consents, smartResponses, auditLogs | **R/W** (auth, account, admin) |
| **Session** | tokenHash(unique), userId, expiresAt, ip, userAgent | user | **R/W** (login/logout, guards) |
| **OAuthAccount** | provider, providerAccountId(unique pair), email | user | **R/W** (Google/Yandex/Telegram/OTP linking) |
| **PasswordResetToken** | tokenHash(unique), userId, expiresAt, usedAt | user | **R/W** (reset flow) |
| **OtpCode** | identifier, channel, codeHash, purpose, expiresAt, attempts, consumedAt | — | **R/W** (phone/messenger/email codes) |
| **ClientProfile** | birthDate, citizenship, passportNo/Issue/Expiry, licenseNo/Issue/Expiry/Country, address* , notes | user (1:1) | **partial R/W** — written by booking (name, phone, citizenship, birthDate, passportNo, licenseNo, licenseCountry, addressLine only); read by admin. **Doc issue/expiry dates + addressCountry/City + notes never written.** |
| **SavedAddress** | label, kind, country, city, district, line, comment, lat, lng, isDefault | user | **read-only** — seeded for the demo user, read by Account; **no app write** (users can't add/edit). |
| **SavedPaymentMethod** | brand, last4, kind, isDefault | user | **read-only** — seeded only, read by Account; **no app write**. |
| **Car** | slug(unique), brand, model, year, class, gearbox, fuel, seats, doors, airConditioning, pricePerDay, deposit, mileageLimitPerDay, conditions*, description*, minRentalDays, prepHoursBetween, active, sortOrder | photos, bookings, waitlist, reviews | **R/W** (catalog + admin CRUD). `descriptionRu/En` never displayed. |
| **CarPhoto** | storageKey, isExternal, alt, sortOrder, isCover | car | **read-only → dead** — read via `include: {photos}`, but **never written anywhere** (no seed, no upload). See §3. |
| **Booking** | number(unique), status, startAt, endAt, days, pickup*, return*, currency, fxRate, rentTotal, extrasTotal, insuranceTotal, subtotal, depositAmount, prepaidAmount, balanceAmount, baseTotal, tripGoal, adminComment | car, user, extras, insurance, additionalDrivers, payments, documents, statusHistory, smartResponse, consents, contractSignature | **R/W** (core). Several columns unset — see §3. |
| **BookingExtra** | serviceId, nameRu/En, unitPrice, qty, perDay, total | booking, service | **R/W** (nested-created in booking, read in admin/summary) |
| **Insurance** | type, status, price, notes | booking (1:1) | **R/W** (created in booking; admin `setInsuranceStatus`) |
| **AdditionalDriver** | firstName, lastName, licenseNo, licenseCountry, licenseExpiry, birthDate | booking | **never-populated** — booking action supports nested create, but the Booking UI always sends `additionalDrivers: []`. No UI. |
| **BookingStatusEvent** | status, byUserId, comment | booking | **R/W** (booking create + admin `setBookingStatus`; read in detail) |
| **Document** | type, storageKey(unique), filename, mime, size, iv, authTag, status, rejectionReason, reviewedById | user, booking | **R/W** (encrypted upload, gated download, admin verify/reject) |
| **Service** | key(unique), category, nameRu/En, descRu/En, price, unit, forGoals[], active, sortOrder | bookingExtras | **R/W** (seed + admin active-toggle; read catalog/services). No add/edit/reorder/price-edit UI. |
| **SmartServiceResponse** | tripGoal, needs[], notes | booking, user | **R/W** (saveSmartResponseAction + booking; read in CRM/admin) |
| **Payment** | method, kind, currency, amount, fxRate, status, txHash, cryptoNetwork, cryptoAddress, provider, providerRef, proofDocId, adminComment | booking | **partial** — written **only** by admin `recordPayment`; read in admin. **Client never creates a Payment** (see §2.9). Many columns (provider*, crypto*, proofDocId, kind, fxRate) never set. |
| **WaitlistEntry** | startAt, endAt, status, notifiedAt | car, user | **read-only → dead** — read by Fleet Calendar note, **never written** (no join-queue). See §3. |
| **ContractSignature** | signerName, signatureData, ip, userAgent | booking (1:1) | **never-populated** — write action + PDF read exist, but `signContractAction`/`SignaturePad` are **never mounted** in any UI. |
| **CurrencyRate** | code(id), symbol, rateFromBase, active | — | **R/W** (seed + admin `updateRate`; read by pricing) |
| **Setting** | key(id), value, group | — | **R/W** (seed + admin `updateSetting`; read) |
| **SiteContent** | key+locale(unique), value, group | — | **R/W** (seed + admin `updateSiteContent`; read by i18n) |
| **Review** | authorName, rating, text, locale, carId, approved | car | **read-only** — seeded only, read by About/CRM. No admin CRUD to add/moderate. |
| **Notification** | event, channel, toAddress, subject, body, status, bookingId, error, sentAt | — | **R/W** (written by notify/otp; read by /notifications) |
| **AuditLog** | userId, action, entity, entityId, meta, ip | user | **write-only** — written everywhere via `logAudit`, **never read/displayed** in any UI. |
| **ConsentRecord** | userId, bookingId, type, version, acceptedAt, ip, userAgent | user, booking | **write-only** — captured at register/booking/cookie-accept, **never displayed** (fine for compliance, but no admin view). |

---

## 2. MVP features — real status

### 2.1 Car catalog (public) + admin car CRUD with photo upload — **PARTIAL**
- Public catalog: **working** (DB-driven grid, class filters, live availability, car detail).
- Admin car CRUD: **working** — create/edit (`upsertCar`), delete (`deleteCar`), active toggle (`toggleCarActive`), price/deposit/mileage/conditions all editable.
- **Photo upload: NOT built.** `CarPhoto` is never written; there is no upload action, no admin upload UI, and the `/api/car-photo/[slug]` route that `carToView` points to **does not exist**. Cars render a gradient placeholder (or a client-only `ImageSlot` drag-drop that saves to **browser localStorage**, not the DB — not admin-managed, not shared).
  **Missing:** a `CarPhoto` write/upload server action, an admin photo-management UI, and an image-serving route (`/api/car-photo/...`).

### 2.2 Booking flow: select car, dates, locations, services, auto-price — **WORKING (core), with gaps**
- Select car ✅, dates ✅, extras/services ✅ (selectable + priced), **auto-price ✅** (server `quote()` + client mirror), currency ✅. Creates a real `Booking` with extras, insurance, consents, status event.
- **Gaps:** return location has **no UI** (`returnSameAsPickup` hardcoded `true`); **no map point selection** (the OpenStreetMap iframe is display-only — no Google Maps/point picker, `pickupLat/Lng` always null); pickup `district` sent empty; **additional-drivers UI absent** (always `[]`).

### 2.3 Availability calendar + server-side double-booking prevention — **PARTIAL (server side solid)**
- **Server-side prevention: working & verified** — `createBookingAction` re-checks `checkCarAvailability` (overlap + prep-time buffer + min-rental) and refuses conflicts, returning the nearest free interval.
- **Interactive booking calendar: NOT built to spec §19.** There is a static "busy days" mini-grid on the catalog detail (one car) and a real admin Gantt, but the **date picker in the booking flow does not show red/green/blue selectable dates and does not prevent picking busy dates client-side** — a user can submit busy dates and only then get a server rejection.
  **Missing:** a per-car calendar widget in booking that colors busy/free/selected and disables busy dates.

### 2.4 "Show only free cars for my dates" filter — **WORKING**
- Catalog wires `searchAvailabilityAction(start,end)` → hides cars that conflict, using the same engine. Verified.

### 2.5 Customer personal-data collection form — **PARTIAL**
- Collects & stores (to `ClientProfile`/`User`): first/last name, phone, WhatsApp, citizenship, birth date, passport №, licence №, licence country, address line.
- **Missing fields:** passport issue/expiry dates, licence issue/expiry dates (schema has them, form omits them); address country/city (only a single address line captured).

### 2.6 Document upload (passport/licence) with admin-only access — **WORKING END-TO-END ✅**
- Upload: `uploadDocumentAction` → **AES-256-GCM encrypted**, stored under `./.storage` (outside the web root, **not** under `public/`).
- **Public-URL reachability when logged out: CONFIRMED SAFE.** Files are served only via `/api/documents/[id]`, which returns **401** with no session and **403** for a logged-in non-owner/non-staff; owner or ADMIN/OWNER get the decrypted bytes; every access is audit-logged. There is no static path to the ciphertext.
- Admin verify/reject: `reviewDocument` wired in the admin booking detail.

### 2.7 Admin bookings panel with status changes + filters — **WORKING (filters partial)**
- List, **status filter chips** (client-side), row → detail, **status change** (`setBookingStatus` + history), admin comment, insurance status. Staff-gated (verified 307→/auth when logged out, 200 for staff).
- **Partial:** the "Авто ▾ / Период ▾" (by-car / by-date) filters and "Экспорт" are **cosmetic only** — not functional.

### 2.8 Admin customers panel with history — **WORKING**
- Clients list (role=CLIENT) with booking counts + document-completeness. Per-client booking history is reachable via the booking detail view. (No standalone "client card" page, but the data is present.)

### 2.9 Payments: currency choice, methods, manual confirmation — **PARTIAL**
- **Currency choice: working** — selected currency is stored on the `Booking` (+ fxRate, base total).
- **Client-side payment: NOT wired.** `payment-actions.ts` (`submitManualPaymentAction`, `getCryptoPaymentInfo`, `createStripeIntentAction`, `createPayPalOrderAction`) and `lib/payments.ts` (Stripe/PayPal/crypto-QR) are **never called by any UI**. The booking "Payment" step shows currency pills and a **static** QR image only — it does **not** read the wallet/network from `.env`, generate a real per-booking QR, start Stripe/PayPal, or let the client upload a cheque / enter a tx-hash.
- **Manual confirmation: half.** Admin `recordPayment` **works**; the **client cannot initiate a payment or upload proof**, so there is nothing for the admin to confirm yet.
- The Stripe **webhook** route exists but is only reachable if a Stripe intent is created (it isn't).

### 2.10 Admin notification on new booking — **WORKING (delivery needs keys)**
- `createBookingAction` calls `notifyNewBooking` → creates `Notification` rows + sends admin email + admin Telegram + a client confirmation email. Without `SMTP_*`/`TELEGRAM_*` keys these **log to the server console** (dev fallback) rather than actually delivering. The admin `/notifications` screen shows the recent log.

---

## 3. Dead schema (exists but nothing meaningfully reads/writes it)

**Tables never written by app code:**
- **CarPhoto** — read via includes, never written. → the whole "car photo" feature is schema-only. `/api/car-photo/[slug]` route referenced by `carToView` is **missing**.
- **WaitlistEntry** — read once (calendar queue note), never written. The "pre-booking queue" feature has no join-queue action, no admin offer, no notification. → schema + one read, otherwise dead.

**Tables with a write path but never populated (no UI trigger):**
- **AdditionalDriver** — booking action supports it; UI always sends `[]`.
- **ContractSignature** — `signContractAction` + PDF embed exist; `SignaturePad` is never mounted, so no signatures are ever created.

**Seed-only (no runtime write path):**
- **SavedAddress**, **SavedPaymentMethod** — only the demo user's rows (from seed); users cannot add/edit their own.
- **Review** — seeded only; no admin add/moderate.

**Write-only (written, never surfaced):**
- **AuditLog** — logged everywhere, no screen ever reads it.
- **ConsentRecord** — captured, never displayed (acceptable for compliance, but there's no admin view/export).

**Columns that are effectively unused / never set:**
- `Booking.prepaidAmount` (always 0 — no prepay flow), `Booking.balanceAmount` (set = subtotal, never recomputed after a payment), all `Booking.return*` fields, `Booking.pickupLat/Lng` (no map picker), `Booking.pickupComment`/`pickupDistrict` (form omits).
- `ClientProfile.passportIssue/passportExpiry/licenseIssue/licenseExpiry/addressCountry/addressCity/notes` (form omits).
- `Payment.provider/providerRef/cryptoNetwork/cryptoAddress/proofDocId/kind/fxRate` (client payment path unused).
- `User.emailVerified/phoneVerified` (set, but never used to gate anything), `Car.descriptionRu/En` (never displayed).

---

## 4. Phone-uniqueness gap — **CONFIRMED: duplicate phones CAN be created**

The DB-level `@unique` on `User.phone` was **dropped** (to keep the migration non-interactive). The
schema comment says "uniqueness enforced in app logic," but that is only **partially** true:

- **OTP / phone sign-in** (`linkOrCreateUser`) does `findFirst({ where: { phone } })` and **reuses** a
  matching user — so that one path won't duplicate.
- **`registerAction` (email + password) does NOT check phone** — it only enforces unique *email*, then
  writes `phone` as-is. Two accounts with different emails and the **same phone** can be created.
- **`createBookingAction` updates `user.phone`** from the booking's personal-data form with **no
  uniqueness check** — a user can be given a phone that already belongs to someone else.

**Net:** there is currently **no global guarantee** that a phone number maps to one account. Duplicates
are creatable via email/password registration and via the booking profile update. To close it: re-add a
uniqueness check in `registerAction` + the booking profile update (and normalize phone formatting), and/or
de-dupe existing rows and restore the DB `@@unique` (or a partial unique index allowing multiple NULLs).

---

## 5. Recommended build order (with dependencies)

Foundations already done and depended-upon: availability engine, encrypted document storage, booking
creation, pricing, auth/sessions, admin actions. Build the gaps in this order:

**Phase 1 — MVP integrity & completeness (mostly independent, do first)**
1. **Phone-uniqueness enforcement** — cheap, data-integrity critical. Add checks in `registerAction`
   + booking profile update + phone normalization. *(No deps.)*
2. **Car photo upload** — `CarPhoto` write action + admin upload UI + `/api/car-photo/[slug]` serving
   route. *(Depends on: storage decision — reuse encrypted store or a public image dir.)*
3. **Booking-flow date calendar with busy-date blocking** (spec §19: red/green/blue, can't pick busy).
   *(Depends on: availability engine — done; needs per-car `getBusyRanges` in the picker.)*
4. **Complete the personal-data + location + drivers forms** — add passport/licence issue+expiry dates,
   return-location UI, additional-drivers UI (action already supports it). *(Depends on: booking form.)*

**Phase 2 — Payments (the biggest real gap)**
5. **Client payment flow** — wire `payment-actions.ts` into booking step 4: method selection, crypto
   wallet+network+**real QR from `.env`** (`getCryptoPaymentInfo`), and **manual proof / tx-hash upload**
   (`submitManualPaymentAction`, reusing the document-upload pipeline). Admin `recordPayment`/confirm
   already exists. Recompute `balanceAmount` on payment. *(Depends on: booking + document upload — both
   done. Stripe/PayPal are optional and only need keys.)*

**Phase 3 — Retention & polish (still in spec, lower priority)**
6. **E-signature UI** — mount `SignaturePad` on the success/contract screen (backend + PDF embed already
   done). *(Quick win; depends on a completed booking.)*
7. **Saved addresses / payment methods management** — add/edit/delete in Account (powers real "book
   again"). *(Depends on: account page.)*
8. **Waitlist / pre-booking queue** — join-queue action + admin offer + notification on cancellation.
   *(Depends on: availability + notifications.)*
9. **Admin polish** — make the by-car / by-date booking filters functional; Review admin CRUD;
   Service add/edit/reorder/price; an AuditLog viewer. *(Independent.)*

**Dependency summary:** availability engine → (3) calendar UX, (8) waitlist. Document upload → (5) payment
proof. Booking create → (5) payments, (6) e-signature. Items (1), (2), (7), (9) are independent.
