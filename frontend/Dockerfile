# Frontend Dockerfile — multi-stage production build
# Build context: frontend/

# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cached unless package.json changes)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# NEXT_PUBLIC_* vars must be available at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_DEMO_MODE=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DEMO_MODE=$NEXT_PUBLIC_DEMO_MODE

RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only copy what next start needs
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/.next         ./.next
COPY --from=builder /app/public        ./public

EXPOSE 3000

CMD ["npm", "run", "start"]
