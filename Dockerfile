# Dockerfile for Writgo AI - Multi-stage build for Next.js application
# Optimized for production deployment on Render

# Stage 1: Dependencies
FROM node:18-alpine AS deps
LABEL stage=deps

# Install system dependencies required for native modules
# @napi-rs/canvas requires: pixman cairo pango jpeg giflib
# Prisma requires: openssl
# Sharp requires: vips
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    cairo \
    pango \
    jpeg \
    giflib \
    pixman \
    vips \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
# Using npm ci for reproducible builds with package-lock.json
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder
LABEL stage=builder

# Install same system dependencies for build
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    cairo \
    pango \
    jpeg \
    giflib \
    pixman \
    vips \
    python3 \
    make \
    g++

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
# Note: .next directory is excluded in .dockerignore (correct behavior)
# The .next build will be created fresh during the build process below
COPY . .

# Generate Prisma Client with correct binary target
RUN npx prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Run build and verify .next directory is created
RUN npm run build && \
    echo "Verifying .next directory was created..." && \
    ls -la .next/ && \
    test -f .next/BUILD_ID && \
    echo "✓ Build successful - .next directory exists with BUILD_ID"

# Stage 3: Runner (Production)
FROM node:18-alpine AS runner
LABEL stage=runner

WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache \
    openssl \
    cairo \
    pango \
    jpeg \
    giflib \
    pixman \
    vips \
    bash

# Create nextjs user for running the application (security best practice)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh && \
    chown nextjs:nodejs ./start.sh

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

# Verify .next directory exists in runner stage
RUN ls -la .next/ && \
    test -f .next/BUILD_ID && \
    echo "✓ Production build verified in runner stage"

# Switch to non-root user
USER nextjs

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with migrations
CMD ["./start.sh"]
