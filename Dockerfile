# Dockerfile for Writgo AI - Multi-stage build for Next.js application
# Optimized for production deployment on Render

# Stage 1: Dependencies
FROM node:18-alpine AS deps
LABEL stage=deps

# Install system dependencies required for native modules
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY nextjs_space/package*.json nextjs_space/yarn.lock ./
COPY nextjs_space/.yarnrc.yml ./

# Install dependencies with frozen lockfile for reproducibility
RUN yarn install --frozen-lockfile

# Stage 2: Builder
FROM node:18-alpine AS builder
LABEL stage=builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY nextjs_space/. .

# Generate Prisma Client
RUN yarn prisma generate

# Build Next.js application with standalone output for optimal size
# Next.js automatically detects and uses standalone mode from next.config.js
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN yarn build

# Stage 3: Runner (Production)
FROM node:18-alpine AS runner
LABEL stage=runner

WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache openssl

# Create nextjs user for running the application (security best practice)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy necessary files from builder
# Copy public assets
COPY --from=builder /app/public ./public

# Copy Next.js build output
# If using standalone build, copy the standalone folder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nextjs

# Expose port 3000
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
# If using standalone build, the server.js is in the root
CMD ["node", "server.js"]
