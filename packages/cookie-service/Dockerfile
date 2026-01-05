FROM node:alpine

# Install Chromium and dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Tell Puppeteer to skip installing Chromium - use installed package instead
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Create app directory
WORKDIR /app

# Copy package files
COPY packages/cookie-service/package.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application code
COPY packages/cookie-service/src ./src

# Create cookies output directory
RUN mkdir -p /app/cookies

CMD ["node", "src/index.js"]
