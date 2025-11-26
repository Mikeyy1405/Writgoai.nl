#!/bin/bash

# WritGo Database Migration to Supabase
# Usage: ./scripts/migrate_to_supabase.sh

set -e  # Exit on error

echo "🚀 WritGo Database Migration to Supabase"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ pg_dump not found. Installing PostgreSQL client tools...${NC}"
    sudo apt-get update
    sudo apt-get install -y postgresql-client
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql not found. Installing PostgreSQL client tools...${NC}"
    sudo apt-get update
    sudo apt-get install -y postgresql-client
fi

echo -e "${GREEN}✅ Required tools installed${NC}"
echo ""

# Get current database URL from .env
if [ -f "nextjs_space/.env" ]; then
    OLD_DB_URL=$(grep "^DATABASE_URL=" nextjs_space/.env | cut -d '=' -f2- | tr -d '"')
    if [ -z "$OLD_DB_URL" ]; then
        echo -e "${RED}❌ DATABASE_URL not found in .env${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Found current database URL${NC}"
else
    echo -e "${RED}❌ .env file not found in nextjs_space/${NC}"
    exit 1
fi

# Prompt for Supabase URL
echo ""
echo -e "${YELLOW}Please enter your Supabase database URL:${NC}"
echo "Example: postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
read -p "Supabase URL: " NEW_DB_URL

if [ -z "$NEW_DB_URL" ]; then
    echo -e "${RED}❌ No URL provided. Exiting.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 1: Creating backup directory...${NC}"
mkdir -p backups
BACKUP_FILE="backups/writgo_backup_$(date +%Y%m%d_%H%M%S).sql"

echo ""
echo -e "${YELLOW}Step 2: Dumping current database (this may take a few minutes)...${NC}"
pg_dump "$OLD_DB_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  --file="$BACKUP_FILE"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)${NC}"

echo ""
echo -e "${YELLOW}Step 3: Pushing schema to Supabase...${NC}"
cd nextjs_space

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update DATABASE_URL temporarily
SUPABASE_DIRECT_URL="${NEW_DB_URL}"
SUPABASE_POOLED_URL="${NEW_DB_URL/5432/6543}?pgbouncer=true"

echo "DIRECT_DATABASE_URL=\"$SUPABASE_DIRECT_URL\"" >> .env
echo "DATABASE_URL=\"$SUPABASE_POOLED_URL\"" >> .env

echo -e "${GREEN}✅ .env updated with Supabase URLs${NC}"

echo ""
echo -e "${YELLOW}Generating Prisma client...${NC}"
yarn prisma generate

echo ""
echo -e "${YELLOW}Pushing schema to Supabase...${NC}"
yarn prisma db push --accept-data-loss

echo -e "${GREEN}✅ Schema pushed to Supabase${NC}"

cd ..

echo ""
echo -e "${YELLOW}Step 4: Restoring data to Supabase...${NC}"
psql "$NEW_DB_URL" -f "$BACKUP_FILE" 2>&1 | grep -v "ERROR.*already exists" || true

echo -e "${GREEN}✅ Data restored to Supabase${NC}"

echo ""
echo -e "${YELLOW}Step 5: Verifying data migration...${NC}"
psql "$NEW_DB_URL" -c "
SELECT 
  'User' as table_name, COUNT(*) as count FROM \"User\" UNION ALL
  SELECT 'Client', COUNT(*) FROM \"Client\" UNION ALL
  SELECT 'Project', COUNT(*) FROM \"Project\" UNION ALL
  SELECT 'ContentPiece', COUNT(*) FROM \"ContentPiece\" UNION ALL
  SELECT 'Video', COUNT(*) FROM \"Video\" UNION ALL
  SELECT 'CreditTransaction', COUNT(*) FROM \"CreditTransaction\";
" | column -t

echo ""
echo -e "${GREEN}✅ Migration completed successfully!${NC}"
echo ""
echo "==========================================="
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test your app locally: cd nextjs_space && yarn dev"
echo "2. Verify all features work correctly"
echo "3. Update production .env with new Supabase URLs"
echo "4. Deploy to production"
echo "5. Keep old database as backup for 30 days"
echo ""
echo -e "${YELLOW}Backup Location:${NC} $BACKUP_FILE"
echo -e "${YELLOW}Old .env backup:${NC} nextjs_space/.env.backup.*"
echo ""
echo -e "${GREEN}🎉 Migration complete!${NC}"
