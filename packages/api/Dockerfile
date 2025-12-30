FROM node:alpine AS base

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

FROM base AS deps
WORKDIR /app
COPY packages/api/package.json ./
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/api .
COPY prisma ./prisma
RUN npx prisma generate

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

EXPOSE 3001

CMD ["node", "src/index.js"]
