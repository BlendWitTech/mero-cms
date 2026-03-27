# Backend Dockerfile — Railway / Production (multi-stage)
# Railway auto-detects this file. Build context = repo root.
# Railway settings: Root Directory = / (repo root)

# ── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder
RUN apt-get update -y && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install workspace dependencies (hoists prisma + nestjs CLI to root node_modules)
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
RUN npm ci --workspace=backend --include-workspace-root

# Copy source
COPY scripts/ ./scripts/
COPY backend/  ./backend/
COPY themes/   ./themes/

# Assemble Prisma schema — always include ALL modules so every model exists
RUN node scripts/build-schema.js all

# Generate Prisma client & build NestJS
WORKDIR /app/backend
ARG DATABASE_URL=postgresql://ci:ci@localhost:5432/ci
RUN DATABASE_URL=${DATABASE_URL} npx prisma generate
RUN npm run build
RUN test -f dist/main.js || (echo "ERROR: dist/main.js not found" && exit 1)

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/node_modules         ./node_modules
COPY --from=builder /app/backend/dist         ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/prisma       ./backend/prisma
COPY --from=builder /app/themes               ./themes
COPY --from=builder /app/scripts              ./scripts

WORKDIR /app/backend

EXPOSE 3001

# Push schema → seed (idempotent upserts) → start app
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm run seed 2>/dev/null; node dist/main"]
