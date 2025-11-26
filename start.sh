#!/bin/bash
# Startup script for Writgo AI on Render
# This script runs database migrations and starts the Next.js server

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions for colored output
log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

log_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

# Function to check database connection
check_database() {
    log_info "Checking database connection..."
    
    max_retries=10
    retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
            log_success "Database connection established"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                log_warning "Database connection failed. Retrying in 5 seconds... (Attempt $retry_count/$max_retries)"
                sleep 5
            fi
        fi
    done
    
    log_error "Failed to connect to database after $max_retries attempts"
    return 1
}

# Function to run migrations with retry logic
run_migrations() {
    log_info "Running database migrations..."
    
    max_retries=3
    retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if npx prisma migrate deploy; then
            log_success "Database migrations completed successfully"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                log_warning "Migration failed. Retrying in 5 seconds... (Attempt $retry_count/$max_retries)"
                sleep 5
            fi
        fi
    done
    
    log_error "Failed to run migrations after $max_retries attempts"
    return 1
}

# Main startup sequence
log_header "Writgo AI Startup"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL environment variable is not set"
    exit 1
fi

log_success "Environment variables validated"

# Check database connection
if ! check_database; then
    log_error "Cannot proceed without database connection"
    exit 1
fi

# Run migrations
if ! run_migrations; then
    log_warning "Migrations failed, but attempting to start server anyway..."
    log_warning "Some features may not work correctly!"
fi

# Start the Next.js server
log_header "Starting Next.js Production Server"
log_info "Server will be available on port ${PORT:-3000}"

exec npm start
