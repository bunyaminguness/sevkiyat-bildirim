# syntax=docker/dockerfile:1

# --------- deps ---------
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies based on lockfile
COPY package.json package-lock.json* ./
RUN npm ci

# --------- builder ---------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public env vars (embedded into the bundle)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# --------- runner ---------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output if configured; fallback to full .next if not.
# Next.js standalone typically generates .next/standalone and .next/static.
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# If standalone exists, use it; otherwise copy full build output.
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "run", "start"]
