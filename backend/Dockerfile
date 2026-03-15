# Backend Dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG DATABASE_URL=postgresql://ci:ci@localhost:5432/ci
ENV DATABASE_URL=${DATABASE_URL}

RUN npx prisma generate
RUN npm run build 2>&1
RUN echo "=== /app contents ===" && ls -la /app/
RUN echo "=== dist/ ===" && (ls -la /app/dist/ 2>/dev/null || echo "dist/ does not exist")
RUN find /app -name "main.js" 2>/dev/null | head -20 || true
RUN test -f dist/main.js || (echo "ERROR: dist/main.js not found" && exit 1)

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
