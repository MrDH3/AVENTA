# Deploying AVENTA to a Hetzner VPS

Render is a **managed platform** (it builds from GitHub, runs your Postgres, and does SSL for
you). Hetzner Cloud is a **plain Linux server** — you run the app, the database, the web server
and HTTPS yourself. This repo now ships everything needed to do that with **Docker Compose**:

| File | Purpose |
|---|---|
| `Dockerfile` | Builds the Next.js app image; runs migrations + fleet seed on start |
| `docker-compose.prod.yml` | The full stack: Postgres + app + Caddy (auto‑HTTPS) |
| `Caddyfile` | Reverse proxy + automatic Let's Encrypt certificate |
| `.env.hetzner.example` | Environment template (copy to `.env` on the server) |

You end up with **one server** running three containers, reachable at `https://your-domain`.

---

## 0. Prerequisites
- A **domain name** you control (e.g. `aventa.com` or a subdomain `app.aventa.com`). Caddy needs a
  real domain to issue HTTPS — you can't use the bare server IP.
- A **Hetzner Cloud** account: <https://console.hetzner.cloud>
- An **SSH key** on your computer (`ssh-keygen -t ed25519` if you don't have one).

---

## 1. Create the server
In the Hetzner Cloud console → **New Project** → **Add Server**:
- **Location:** Nuremberg/Falkenstein (EU) or Helsinki — pick closest to your customers.
- **Image:** Ubuntu 24.04
- **Type:** **CX22** (2 vCPU, 4 GB RAM, ~€4/mo) is the minimum that builds this app comfortably.
  If the build runs out of memory, add swap (step 3) or use CX32.
- **SSH key:** add yours (so you can log in without a password).
- Create it, and note the server's **public IPv4**.

## 2. Point your domain at the server
At your DNS provider, create an **A record**:
```
app.yourdomain.com   →   <server-IPv4>
```
Wait a few minutes for it to propagate (`ping app.yourdomain.com` should show the server IP).

## 3. Install Docker on the server
SSH in and install Docker + Compose:
```bash
ssh root@<server-IPv4>

curl -fsSL https://get.docker.com | sh          # installs Docker + the compose plugin

# (optional) 2 GB swap so the Next.js build never OOMs on a small server:
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# basic firewall: allow SSH + web only
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
```

## 4. Get the code and configure it
```bash
apt-get install -y git
git clone https://github.com/MrDH3/AVENTA.git
cd AVENTA

cp .env.hetzner.example .env
nano .env
```
Fill in `.env`:
- `DOMAIN` and `APP_URL` → your domain (e.g. `app.yourdomain.com` / `https://app.yourdomain.com`)
- `POSTGRES_PASSWORD` → a long random password, **and** put the same password inside `DATABASE_URL`
- `SESSION_SECRET` → `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
  (if node isn't on the server, generate it on your laptop and paste it)
- `DOC_ENCRYPTION_KEY` → `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (64 hex chars)
- Optional: Stripe / SMTP / OAuth keys (see `.env.example`)

## 5. Launch
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
First run takes a few minutes (it builds the image). It then:
1. starts Postgres, waits until it's healthy,
2. the app applies DB migrations and seeds the fleet,
3. Caddy fetches a Let's Encrypt certificate for your domain.

Watch it come up:
```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f caddy   # look for "certificate obtained"
```
Then open **https://app.yourdomain.com** — the site should be live with the 5 seeded cars.

## 6. (Optional) Bring your data over from Render
Only needed if you have **real data** on Render (bookings, admin edits). If it's just the seeded
cars, skip this — Hetzner seeds them fresh.

Do this **right after step 4, before step 5** (into a fresh DB so schema matches):
```bash
# on the server, start ONLY the database first
docker compose -f docker-compose.prod.yml up -d db

# copy from Render → Hetzner. Get the Render EXTERNAL database URL from the Render dashboard
# (your Postgres → Connections → External Database URL).
apt-get install -y postgresql-client
pg_dump "RENDER_EXTERNAL_DATABASE_URL" --no-owner --no-privileges > render.sql
cat render.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U aventa -d aventa

# now start the rest — migrate deploy sees Render's migrations as already applied (no conflict)
docker compose -f docker-compose.prod.yml up -d --build
```
Uploaded document files on Render's free tier are ephemeral, so there's nothing to copy there;
car photos are re-seeded from the repo automatically.

## 7. Create the admin / full seed (if starting fresh)
The build only seeds **cars**. To add the demo users (or your real admin), open a shell in the app
container and run the full seed once (set `SEED_ADMIN_PASSWORD` etc. in `.env` first if you want):
```bash
docker compose -f docker-compose.prod.yml exec app npm run db:seed
```
Then log in at `/auth` and set your real company details in `/admin`.

---

## Day-2 operations

**Deploy an update** (after you `git push` new code):
```bash
cd AVENTA && git pull
docker compose -f docker-compose.prod.yml up -d --build
```

**Back up the database** (cron this):
```bash
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U aventa aventa | gzip > backup-$(date +%F).sql.gz
```

**Persistent data** lives in Docker volumes (`pgdata`, `storage`, `uploads`, `caddy_data`) — they
survive container rebuilds. Don't run `docker compose down -v` (the `-v` wipes volumes).

**Point the domain fully off Render:** once Hetzner works, update your DNS if needed and delete the
Render service + database to stop billing.
