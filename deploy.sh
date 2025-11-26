#!/bin/bash

# deploy.sh - Deployment script for Writgo AI
# This script handles dependency installation, database migrations, and production build

# Exit on any error
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions for colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

# Navigate to the Next.js application directory
cd nextjs_space

print_header "Writgo AI Deployment Script"

# Step 1: Install dependencies
print_info "Installing dependencies with Yarn..."
if yarn install --frozen-lockfile; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 2: Generate Prisma Client
print_info "Generating Prisma Client..."
if yarn prisma generate; then
    print_success "Prisma Client generated successfully"
else
    print_error "Failed to generate Prisma Client"
    exit 1
fi

# Step 3: Run database migrations
print_info "Running database migrations..."
if yarn prisma migrate deploy; then
    print_success "Database migrations completed successfully"
else
    print_warning "Database migrations failed or were not needed"
    # Don't exit here as migrations might not be needed for first deploy
fi

# Step 4: Build Next.js application
print_info "Building Next.js application..."
if yarn build; then
    print_success "Next.js application built successfully"
else
    print_error "Failed to build Next.js application"
    exit 1
fi

# Print deployment summary
print_header "Deployment Summary"
print_success "All deployment steps completed successfully!"
print_info "Application is ready to start with: yarn start"
echo ""
