# Handoff: AVENTA — Premium Car Rental & Travel Ecosystem (Turkey)

## Overview
AVENTA is an online car-rental booking site for a premium fleet in Antalya, Turkey, that also acts as a broader travel ecosystem (transfers, real estate, tours, concierge services). This package contains the full hi-fi design for the **client website**, the **admin panel**, the **owner CRM**, and supporting flows (auth, contract, notifications, legal, empty/error states), plus a brand kit / design system.

The visual direction is **"seaside / vacation"**: a bright, fresh, modern aesthetic (aqua-turquoise + coral + sand + sun-yellow on a light background) with a live animated coastline scene on the home page. Client-facing screens are bilingual (RU/EN) with a working language toggle; internal tools (admin/CRM) use a harmonized deep-sea dark theme and are Russian-first (operator-facing).

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing the intended look, layout, and behavior. They are **not production code to copy directly**. Each `.dc.html` file is a self-contained component authored in a small templating runtime (`support.js`), using **inline styles only**.

The task is to **recreate these designs in the target codebase's environment** (React, Vue, Next.js, SwiftUI, native, etc.) using its established patterns, component library, and styling approach. If no front-end environment exists yet, choose an appropriate stack (the design maps cleanly to React + a utility or CSS-in-JS approach) and implement there. Treat the inline styles as a precise spec for tokens/spacing, not as the shipping implementation.

A fully-bundled, offline-openable copy of every screen lives in `/export/*.dc.html` in the project (open `AVENTA-00-Index.dc.html` as the hub). Use those to click through the intended UX.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, shadows, and interactions are specified. Recreate the UI pixel-accurately using the codebase's libraries. Exact hex values and type scale are in **Design Tokens** below.

---

## Design Tokens

### Color — Client (light / "seaside")
| Token | Hex | Use |
|---|---|---|
| Page background | `#EAF7F8` | App background (light aqua) |
| Sky gradient top | `#CDEFF6` | Hero/nav gradient start |
| Sky gradient mid | `#A7E2EC` → `#7CD3E1` | Hero gradient |
| Sea | `#3FB7CA` → `#1C9DB3` → `#0E7E90` | Animated sea band |
| Surface / card | `#FFFFFF` | Cards, panels |
| Field background | `#F2FAFB` | Inputs, inert fields |
| Primary text | `#0C3B45` | Headings, body emphasis |
| Body text | `#0B5560` | Paragraphs |
| Muted text | `#5E8A92` | Secondary/labels |
| Label accent | `#1399AE` | Mono micro-labels |
| Teal (brand) | `#0E7E90` | Links, secondary actions, logo stroke |
| Coral (primary CTA) | gradient `#FF8A5B → #FF6F61` | Primary buttons, accents |
| Coral solid | `#FF7A5C` / `#FF6F61` | Accent text, borders |
| Sand / sun | `#FFD56B` / `#FFC24D` / `#FFB23E` | Sun, highlights |
| Success | `#27B576` / text `#1F9E6B`, bg `#E6F8EE`/`#E9FBF2` | Available, paid, verified |
| Busy/warning | `#FF9F45` / text `#E07A1E`, bg `#FFF0E0` | Busy until…, pending |
| Danger | `#E0533E`, bg `#FFE3DB`/`#FFF4F1` | Errors, rejected docs |
| Info | `#2E86C9`, bg `#EAF4FB` | Under review |
| Hairline border | `rgba(20,153,174,.14–.22)` | Dividers, field borders |

### Color — Internal (deep-sea dark, admin/CRM/calendar/notifications)
| Token | Hex | Use |
|---|---|---|
| Base/page | `#082A33` | Main dark background |
| Deepest (sidebar/footer) | `#06222A` | Sidebar, footer |
| Panel | `#0C3540` | Panels |
| Card | `#0E3A45` | Cards/rows |
| Element / hover | `#114451` / `#125060` | Hover, chips |
| Accent | `#FF7A5C` (coral) | Active nav, primary |
| Accent light | `#FFB48A` | Active text/gradients |
| Text | `#ECF1F8` / `#F4F7FB` | Primary light text |
| Muted | `#9CB0CB` / `#7E92AE` | Secondary text |
| Status green/amber/blue/red | `#6FBF8F` / `#E0A23E` / `#4E7FE0` / `#CE4A4A` | Booking/payment statuses |

### Typography
- **Display / headings:** `Bricolage Grotesque` (weights 500/600/700/800; uses `opsz` 12–96). Tight tracking `-0.02em` on large headings.
- **UI / body:** `Plus Jakarta Sans` (400/500/600/700/800).
- **Micro-labels / mono:** `Space Mono` (400/700), letter-spacing ~`.1–.16em`, often UPPERCASE.
- Google Fonts import:
  `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap`

Type scale (approx): hero 38–68 / H1 30–44 / H2 22–24 / section-title 17–18 / body 14–16 / small 12–13 / micro-label 10–11 (mono).

### Radius
Cards 16–22px · buttons/CTAs 11–13px · pills 999px · fields 10–11px · small chips 8–9px.

### Shadows
- Card: `0 16–20px 38–44px -24px rgba(11,85,96,.35–.45)`
- Floating CTA (coral): `0 12–14px 28px -10px rgba(255,111,97,.6–.7)`
- Modal: `0 24–30px 60–70px -28px rgba(11,85,96,.5–.6)`

### Spacing
Container max-width 1180–1240px, side padding `clamp(20px,4vw,40px)`. Section vertical rhythm `clamp(28px,4–6vw,64px)`. Card padding 18–26px. Grid gaps 14–22px. Mobile frame inner padding ~18px.

### Logo
Emblem = rounded-square (radius 14 on 48 viewBox) containing an "A" drawn as two strokes: apex stroke teal `#0E7E90` (or white on dark), crossbar coral `#FF7A5C`, plus a coral dot at the apex. Wordmark "AVENTA" in Bricolage Grotesque 800, letter-spacing `.04em`. SVG source is in every file's header and in `AVENTA-Brand-Kit.dc.html`.

---

## Screens / Views

> Files are listed in **Files** below. Each client screen shares the same nav (logo left, links center, RU/EN pill + avatar/CTA right) and a dark teal footer with an "all screens" link.

### 01 · Home (`AVENTA-01-Home.dc.html`) — bilingual
- **Purpose:** Landing + quick search; sets the brand tone.
- **Layout:** Full-bleed hero with an **animated coastline scene**, then advantages grid (4), fleet grid (3 featured cars), ecosystem block, footer.
- **Animated scene (pure CSS/SVG, no video/libs):** sky gradient; pulsing **sun** (`@keyframes` scale/opacity, ~6s); **clouds** drifting L→R (`translateX(-30vw→130vw)`, 46/64/80s); **seagulls** (small bobbing SVG strokes); a **sea band**; 2 turquoise **wave layers** + a white **foam** wave that loop seamlessly via a 2-tile-wide SVG translated `-50%` (`@keyframes av-wave`, 7–14s linear infinite); a **sand beach** strip at the bottom; a **palm** planted on the sand swaying (`@keyframes av-sway`, rotate -3°↔4°, 6.5s) with coconuts + a soft shadow ellipse. (Earlier a surfer existed; per latest direction it was removed and the palm moved onto the beach.)
- **Search card:** glassy white (`rgba(255,255,255,.82)`, backdrop-blur), fields Pickup / Return / Pickup-point + coral "Find a car" CTA; helper line "We show only cars free for your dates."
- **Components:** advantage cards (icon tile + title + desc), car cards (image area, class pill top-left, availability pill top-right green/amber, price `€NNN /day`, deposit, coral Book / outline "From this date"), ecosystem cards on a teal gradient panel with a sun circle.
- **Interactions:** RU/EN toggle persists to `localStorage['aventa_lang']`; all CTAs/cards link to catalog/booking/services.

### 02 · Catalog + Car Card (`AVENTA-02-Catalog-Card.dc.html`) — bilingual
- Search/filter bar (dates, pickup, "only available" toggle, Update), class filter chips, **5-car** responsive grid (busy cars dimmed `.66`), then an expanded **car detail**: hero `image-slot` + 4 thumbnail slots (user-droppable photos), 2×2 spec tiles (gearbox/fuel/seats-doors/mileage), rental conditions list, a **mini availability calendar** (7-col grid, green=free / coral=busy), and a sticky teal **price bar** with coral "Book now."

### 03 · Booking — 5 steps (`AVENTA-03-Booking.dc.html`) — bilingual
- Step rail (1 Route · 2 Extras+Insurance · 3 Details+Docs · 4 Payment · 5 Consent). Left column = stacked step cards; right column = **sticky order summary** (car, period, rent/extras/total/deposit, coral Submit).
- **Step 1** has a **live OpenStreetMap iframe** (`openstreetmap.org/export/embed.html?bbox=…&marker=36.8987,30.8005`) with a pickup-point label chip.
- **Step 4 (Payment):** currency pills (EUR/USD/RUB/TRY/USDT/USDC) + a **crypto card** with a **real QR** (`api.qrserver.com/v1/create-qr-code/?size=200x200&data=<wallet>`), network = TRC20, warning text "send only USDT on TRC20."
- Extras and insurance use checked (green) / idle (light) selectable rows.

### 04 · Smart Services (`AVENTA-04-Smart-Services.dc.html`) — bilingual
- Concierge questionnaire: **Step 1** trip-goal grid (6 cards, selected card = coral border + tinted icon); **Step 2** needs checklist (multi-select, green when checked); **Step 3** personalized recommendations — a teal hero recommendation + a grid of service cards (price + CTA) + a green "saved to your CRM card" note → Continue booking.

### 08 · Account / Tourist Cabinet (`AVENTA-08-Account.dc.html`) — bilingual
- Welcome + loyalty pill; a split **"Book again"** hero (teal favourite-car panel + white prefilled mini-form, coral CTA "≈45 sec"); booking **history** rows (status badge + action); side cards: **documents** (verified/encrypted), **saved addresses**, **saved payment methods**, **manager** contact card.

### 09 · Mobile (client) (`AVENTA-09-Mobile.dc.html`)
- 5 iPhone frames (light): Home (mini animated foam wave), Catalog, Car detail, Booking (extras), Account. Uses `ios-frame.jsx` with `dark={false}`.

### 05 · Fleet Calendar (`AVENTA-05-Fleet-Calendar.dc.html`) — internal, dark
- Admin sidebar shell + a **Gantt-style occupancy timeline**: 31-day header, one row per car, booking bars positioned by `left%`/`width%` and colored by status (active/confirmed/pending/closed) with client + status label. KPI chips + a pre-booking queue note.

### 06 · Admin Panel (`AVENTA-06-Admin.dc.html`) — internal, dark, interactive
- Left nav (SVG icons; active = coral). Sections (switch via `state.tab`): **Bookings** (filter chips + table; row → detail), **Booking detail** (client, documents, pickup address + mini map, trip-goal/interests from CRM, insurance status toggles, payment summary, admin comments, status changer), **Cars** (CRUD table + availability + active toggles), **Clients**, **Payments** (KPIs + table), **Services** (CRUD list: category, price, for-whom, active toggle, reorder handle), **Settings** (currencies & rates, languages & site-text editor, access/security, backup).

### 07 · CRM Dashboard (`AVENTA-07-CRM.dc.html`) — internal, dark
- KPI cards (revenue/day & month, avg check, fleet utilization), 14-day revenue bar chart (last bar highlighted), fleet-status donut (`conic-gradient`), today's events, **profit-per-car** bars, **client-interest** bars (from smart-services), and an insight banner.

### 10 · Notifications (`AVENTA-10-Notifications.dc.html`) — internal canvas
- Template editor (event × channel matrix; a template with `{variable}` chips — note: single braces, not `{{ }}`), plus realistic message previews: branded **Email**, **Telegram** (client + admin), **WhatsApp**. Telegram/WhatsApp use their own brand chrome colors (kept intentionally).

### 11 · Auth (`AVENTA-11-Auth.dc.html`) — canvas
- Login, Register (with consent checkbox), OTP (6 boxes, one active = coral), Reset password (with success state). White cards on a sky gradient.

### 12 · Success + Contract (`AVENTA-12-Success-Contract.dc.html`) — canvas
- Booking-accepted screen (green check, request number, order recap, 3-step "what's next" timeline, Download contract PDF) + a printable **rental contract** sheet (parties, subject table, cost breakdown, conditions, signature lines, e-signature note).

### 13 · States (`AVENTA-13-States.dc.html`) — canvas
- Document upload states (uploading w/ progress, verified, **rejected** w/ re-upload, under review w/ spinner, dropzone), **no cars for dates** (suggests nearest free intervals + queue), **no bookings** (admin empty), **payment failure** (error code, retry, alt method).

### 14 · About / Trust (`AVENTA-14-About-Trust.dc.html`) — bilingual
- Hero, stats row (8 yrs / 2000+ / 4.9★ / 41%), guarantees grid, **reviews** cards (★ + avatar), company-details/contacts/payment block on a teal panel, legal footer links.

### 15 · Legal (`AVENTA-15-Legal.dc.html`) — canvas
- Privacy policy, public offer, **cookie banner**, and **consent modal** (3 checkboxes incl. personal-data consent) — critical because the product collects passports/licences.

### 00 · Index hub (`AVENTA-00-Index.dc.html`)
- Light beach launcher linking every screen, grouped: Client / Admin-Owner / System-States-Legal.

### Brand Kit (`AVENTA-Brand-Kit.dc.html`)
- Logo lockups, full palette swatches with hex, type scale, the **icon set** (thin-line 1.6px, currentColor, rounded), and component samples (buttons, status pills, field, toggle). Use this as the canonical token source.

---

## Interactions & Behavior
- **Language toggle (client):** `setLang('ru'|'en')` writes `localStorage['aventa_lang']` and re-renders; all copy comes from a `dict` keyed by lang. Internal screens are RU-only by design.
- **Admin navigation:** section state in the component; clicking a left-nav item switches the visible section; clicking a booking row opens the detail view; "← back" returns to the list.
- **Hovers:** cards lift `translateY(-4–5px)` with a deeper shadow (200–250ms ease); CTAs brighten ~6%.
- **Animations:** home coastline loops (see Home). Document "under review" uses a 1s linear spinner; upload shows a width-% progress bar.
- **Maps/QR:** OSM embed + QR image are **online-only** (won't render in fully offline PDF/export — leave a graceful placeholder).
- **Responsive:** client pages use `max-width` containers, `flex-wrap`, `grid auto-fit/minmax`, and `clamp()` type — they reflow to mobile. Internal app screens are designed at fixed widths (≈1440px) and a dedicated mobile-admin set exists (`AVENTA-16-Mobile-Admin.dc.html`).

## State Management
- **Client:** `lang` (persisted). Selection states for extras/insurance/goals/needs are illustrative (static in mock) — wire to real form state. Booking summary totals should recompute from selected car × days + extras + insurance.
- **Admin:** `tab` (active section) + `detailOpen` (booking detail). Real impl needs: bookings list + statuses, cars CRUD + availability, clients, payments, services CRUD, settings (currencies/rates, site copy, roles, backups).
- **Booking domain:** availability must prevent overlapping dates, enforce min rental + prep-time between rentals, and offer nearest free intervals / a pre-booking queue (see States + Calendar).

## Booking statuses (use as enums)
new · awaiting confirmation · awaiting payment · confirmed · preparing · delivered · active · returned · closed · cancelled.
**Payment:** not paid · awaiting · partial · paid · deposit held · deposit returned · payment error · cancelled.
**Insurance flags:** issued · pending · client data incomplete · needs extra check.

## Assets
- **Logo & all icons:** inline SVG (no external files); copy from `AVENTA-Brand-Kit.dc.html`.
- **Car photos:** placeholders via `<image-slot>` (drag-drop, persists to localStorage) — replace with real fleet photography. Slots have stable ids on the catalog card.
- **Map:** OpenStreetMap embed (swap for Google Maps if a key is available).
- **QR:** generated via `api.qrserver.com` — replace with server-side QR for the real wallet/amount.
- **Fonts:** Google Fonts (Bricolage Grotesque, Plus Jakarta Sans, Space Mono).
- **Device frame / image slot:** `ios-frame.jsx`, `image-slot.js` included for reference only.

## Notes for implementation
- Inline styles in the mocks are the **spec**, not the delivery mechanism — map them to the codebase's tokens/components.
- Keep the RU/EN dictionary structure; add TR/ES/DE later (the admin Settings screen anticipates this).
- Security matters: passports/licences are collected — implement encrypted storage, admin-only document access, SSL, consent capture (see Legal + States).
- Currencies/rates and the services catalog and site copy are meant to be **admin-editable** (see Admin → Settings / Services).

## Files
Design source (in the project root; copies included in this handoff folder):
- `AVENTA-00-Index.dc.html` … `AVENTA-16-Mobile-Admin.dc.html`, `AVENTA-Brand-Kit.dc.html`
- Runtime/support: `support.js` (template runtime), `ios-frame.jsx`, `image-slot.js`
- Offline bundles (click-through): project `/export/*.dc.html`
