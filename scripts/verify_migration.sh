#!/bin/bash

# Verify Supabase Migration
# Usage: ./scripts/verify_migration.sh <old_db_url> <new_db_url>

set -e

echo "🔍 WritGo Migration Verification"
echo "================================"
echo ""

OLD_DB_URL="$1"
NEW_DB_URL="$2"

if [ -z "$OLD_DB_URL" ] || [ -z "$NEW_DB_URL" ]; then
    echo "Usage: $0 <old_db_url> <new_db_url>"
    exit 1
fi

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Comparing record counts...${NC}"
echo ""

TABLES=("User" "Client" "Project" "ContentPiece" "Video" "CreditTransaction" "CreditPurchase" "BlogPost" "SavedContent" "EmailTemplate")

for TABLE in "${TABLES[@]}"; do
    echo -e "${YELLOW}Checking $TABLE...${NC}"
    
    OLD_COUNT=$(psql "$OLD_DB_URL" -t -c "SELECT COUNT(*) FROM \"$TABLE\"" | xargs)
    NEW_COUNT=$(psql "$NEW_DB_URL" -t -c "SELECT COUNT(*) FROM \"$TABLE\"" | xargs)
    
    if [ "$OLD_COUNT" -eq "$NEW_COUNT" ]; then
        echo -e "  ${GREEN}✅ $TABLE: $OLD_COUNT records (match)${NC}"
    else
        echo -e "  ${RED}❌ $TABLE: Old=$OLD_COUNT, New=$NEW_COUNT (MISMATCH!)${NC}"
    fi
done

echo ""
echo -e "${YELLOW}Checking database size...${NC}"

OLD_SIZE=$(psql "$OLD_DB_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()))" | xargs)
NEW_SIZE=$(psql "$NEW_DB_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()))" | xargs)

echo -e "  Old database: $OLD_SIZE"
echo -e "  New database: $NEW_SIZE"

echo ""
echo -e "${GREEN}✅ Verification complete!${NC}"
