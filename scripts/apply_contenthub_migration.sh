#!/bin/bash

# Apply ContentHubSite projectId migration
# This script applies the pending migration to add projectId column to ContentHubSite table

set -e  # Exit on error

echo "🚀 Applying ContentHubSite Migration"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to nextjs_space directory
cd "$(dirname "$0")/../nextjs_space"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Please create .env file with DATABASE_URL"
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "^DATABASE_URL=" .env; then
    echo -e "${RED}❌ DATABASE_URL not found in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

echo -e "${YELLOW}Step 1: Generating Prisma client...${NC}"
yarn prisma generate

echo ""
echo -e "${YELLOW}Step 2: Applying pending migrations...${NC}"
yarn prisma migrate deploy

echo ""
echo -e "${YELLOW}Step 3: Verifying migration...${NC}"
echo "Checking if projectId column exists in ContentHubSite table..."

# Extract DATABASE_URL
DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"')

# Check if column exists using psql (if available)
if command -v psql &> /dev/null; then
    COLUMN_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ContentHubSite' AND column_name='projectId');")
    
    if [ "$COLUMN_EXISTS" = "t" ]; then
        echo -e "${GREEN}✅ projectId column exists in ContentHubSite table${NC}"
    else
        echo -e "${RED}❌ projectId column NOT found in ContentHubSite table${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  psql not available, skipping verification${NC}"
    echo "Please manually verify the migration was applied"
fi

echo ""
echo -e "${GREEN}✅ Migration applied successfully!${NC}"
echo ""
echo "======================================"
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Restart your application"
echo "2. Test WordPress connection from Integration page"
echo "3. Test WordPress connection from AI Content page"
echo "4. Verify project linking works correctly"
echo ""
echo -e "${GREEN}🎉 Done!${NC}"
