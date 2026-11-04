# Use official Node.js LTS Debian-slim image for better-sqlite3 native compilation
FROM node:20-bookworm-slim

# Install native build dependencies required by better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency manifests first for optimal Docker layer caching
COPY package*.json ./

# Install dependencies (including production rebuild of native bindings)
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000) + '/api/health', (r) => { if (r.statusCode !== 200) process.exit(1); })"

# Run the server
CMD ["node", "backend/server.js"]

