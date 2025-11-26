#!/bin/bash

# health-check.sh - Health check script for Writgo AI
# Verifies application health and database connectivity

# Exit codes:
# 0 = All checks passed
# 1 = Application health check failed
# 2 = Database connection failed

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Configuration
APP_URL="${NEXTAUTH_URL:-http://localhost:3000}"
HEALTH_ENDPOINT="${APP_URL}/api/health"
MAX_RETRIES=3
RETRY_DELAY=5

echo "═══════════════════════════════════════════════"
echo "  Writgo AI Health Check"
echo "═══════════════════════════════════════════════"
echo ""

# Check 1: Application Health Endpoint
print_info "Checking application health endpoint: ${HEALTH_ENDPOINT}"

for i in $(seq 1 $MAX_RETRIES); do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_ENDPOINT}" 2>/dev/null || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        print_success "Application is healthy (HTTP 200)"
        APP_HEALTHY=true
        break
    else
        if [ $i -lt $MAX_RETRIES ]; then
            print_info "Attempt $i/$MAX_RETRIES failed (HTTP $HTTP_STATUS). Retrying in ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
        else
            print_error "Application health check failed after $MAX_RETRIES attempts (HTTP $HTTP_STATUS)"
            APP_HEALTHY=false
        fi
    fi
done

# Check 2: Database Connection
print_info "Checking database connection..."

# Navigate to nextjs_space directory if it exists
if [ -d "nextjs_space" ]; then
    cd nextjs_space
elif [ ! -f "package.json" ]; then
    print_error "Cannot find Next.js application directory"
    DB_HEALTHY=false
else
    # Already in the correct directory
    :
fi

# Only proceed with database check if directory check passed
if [ "$DB_HEALTHY" != false ]; then
  # Check if DATABASE_URL is set
  if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set"
    DB_HEALTHY=false
  else
    # Use Prisma's built-in validation command
    DB_CHECK=$(yarn prisma validate 2>&1)
    DB_EXIT_CODE=$?

    if [ $DB_EXIT_CODE -eq 0 ]; then
        print_success "Database connection is healthy"
        DB_HEALTHY=true
    else
        print_error "Database schema validation failed"
        echo "$DB_CHECK" | head -5
        DB_HEALTHY=false
    fi
  fi
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════"
echo "  Health Check Summary"
echo "═══════════════════════════════════════════════"

if [ "$APP_HEALTHY" = true ] && [ "$DB_HEALTHY" = true ]; then
    print_success "All health checks passed!"
    exit 0
elif [ "$APP_HEALTHY" = false ] && [ "$DB_HEALTHY" = false ]; then
    print_error "Both application and database checks failed!"
    exit 1
elif [ "$APP_HEALTHY" = false ]; then
    print_error "Application health check failed!"
    exit 1
else
    print_error "Database connection check failed!"
    exit 2
fi
