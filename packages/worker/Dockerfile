FROM node:alpine AS base

# Install ffmpeg, python3, openssl, and spotdl
RUN apk add --no-cache ffmpeg python3 py3-pip openssl && \
    pip install yt-dlp --upgrade --break-system-packages && \
    pip install spotdl --break-system-packages

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY packages/worker/package.json ./
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/worker .
COPY prisma ./prisma
RUN npx prisma generate

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Copy startup script
COPY packages/worker/start.sh ./start.sh
RUN chmod +x ./start.sh

CMD ["./start.sh"]
