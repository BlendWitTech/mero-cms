# Backend Dockerfile
# Build context must be the repo root so themes/ can be copied.
# In Railway: Root Directory = / (repo root), Dockerfile Path = backend/Dockerfile
FROM node:20-bookworm-slim

# Install OpenSSL 1.1 + 3 — both required by Prisma's query engine
RUN apt-get update -y && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install

# Copy backend source
COPY backend/ .

# Copy built-in themes so the CMS can list and activate them
COPY themes/ /themes/

ARG DATABASE_URL=postgresql://ci:ci@localhost:5432/ci

RUN DATABASE_URL=${DATABASE_URL} npx prisma generate
RUN npm run build
RUN test -f dist/main.js || (echo "ERROR: dist/main.js not found" && exit 1)

EXPOSE 3001

# Run prisma db push in background so app starts immediately (Railway health check passes),
# then tables are ready by the time the user fills in the setup wizard.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss > /tmp/dbpush.log 2>&1 & npm run start:prod"]
