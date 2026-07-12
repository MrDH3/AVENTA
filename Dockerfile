# AVENTA — production container (Next.js 14 + Prisma/Postgres).
# Kept as a single, simple image (full node_modules) so migrations + the fleet seed can run at
# startup. Reliable over "optimized" — right for a self-managed VPS (Hetzner).
FROM node:20-bookworm-slim

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# openssl is required by the Prisma query engine; ca-certificates for outbound TLS (Stripe, SMTP…).
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install ALL dependencies (dev included — needed to build and to run prisma/tsx at startup).
# NODE_ENV is not "production" yet here, so devDependencies are installed.
COPY package.json package-lock.json ./
RUN npm ci

# App source, generate the Prisma client, build Next.
COPY . .
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 3000

# On every start: apply DB migrations, (re)seed the fleet (create-only, also restores car photos
# into the mounted uploads volume), then serve. `next start` binds to $PORT (3000 by default).
CMD ["sh", "-c", "npx prisma migrate deploy && (npm run db:seed:cars || echo 'car seed skipped') && npm start"]
