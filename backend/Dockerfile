# Backend Dockerfile
# Build context must be the repo root so themes/ can be copied.
# In Railway: Root Directory = / (repo root), Dockerfile Path = backend/Dockerfile
FROM node:20-slim

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

# Push DB schema on every container start so tables exist before setup wizard runs
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm run start:prod"]
