#!/bin/bash

echo "🔧 WritGo .env Generator"
echo "========================"
echo ""

TARGET="/home/ubuntu/writgo_planning_app/nextjs_space/.env"

# Check if .env already exists
if [ -f "$TARGET" ]; then
    echo "⚠️  .env bestand bestaat al op: $TARGET"
    read -p "Wil je deze overschrijven? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Geannuleerd"
        exit 1
    fi
    # Backup existing
    cp "$TARGET" "${TARGET}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backup gemaakt"
fi

# Generate new .env
cat > "$TARGET" << 'ENVEOF'
# ====================================
# WritGo Production Environment
# ====================================

# Database Configuration
# Voor Supabase: gebruik pooled connection (port 6543)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# NextAuth Configuration
NEXTAUTH_URL="https://writgoai.nl"
NEXTAUTH_SECRET="REPLACE_WITH_RANDOM_SECRET"

# AIML API (Claude + Image Generation)
AIML_API_KEY="YOUR_AIML_KEY"
AIML_API_BASE_URL="https://api.aimlapi.com/v1"

# Stripe Payment Configuration
# ⚠️ BELANGRIJK: Gebruik NIEUWE keys (oude zijn gecompromitteerd)
STRIPE_SECRET_KEY="sk_live_YOUR_SECRET_KEY"
STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_PUBLISHABLE_KEY"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_PUBLISHABLE_KEY"

# Stripe Price IDs (from Stripe Dashboard)
STRIPE_STARTER_PRICE_ID="price_xxx"
STRIPE_PRO_PRICE_ID="price_xxx"
STRIPE_BUSINESS_PRICE_ID="price_xxx"
STRIPE_BASIS_PRICE_ID="price_xxx"
STRIPE_PROFESSIONAL_PRICE_ID="price_xxx"
STRIPE_ENTERPRISE_PRICE_ID="price_xxx"

# AWS S3 Configuration (File Uploads)
AWS_PROFILE="hosted_storage"
AWS_REGION="us-west-2"
AWS_BUCKET_NAME="YOUR_BUCKET_NAME"
AWS_FOLDER_PREFIX="uploads/"
AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY"
AWS_SECRET_ACCESS_KEY="YOUR_SECRET_KEY"

# Google OAuth (Optional)
# ⚠️ BELANGRIJK: Gebruik NIEUWE credentials (oude zijn gecompromitteerd)
GOOGLE_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-YOUR_SECRET"

# Bol.com Affiliate API (Optional)
BOLCOM_CLIENT_ID="YOUR_BOLCOM_CLIENT_ID"
BOLCOM_CLIENT_SECRET="YOUR_BOLCOM_SECRET"

# Additional APIs (Optional)
ABACUSAI_API_KEY="YOUR_ABACUS_KEY"
ELEVENLABS_API_KEY="YOUR_ELEVENLABS_KEY"
VADOO_API_KEY="YOUR_VADOO_KEY"
LATE_DEV_API_KEY="YOUR_LATEDEV_KEY"

# DataForSEO (Optional)
DATAFORSEO_USERNAME="YOUR_USERNAME"
DATAFORSEO_PASSWORD="YOUR_PASSWORD"

# Google Search Console (Optional)
GOOGLE_SEARCH_CONSOLE_CLIENT_ID="YOUR_GSC_CLIENT_ID"

# Automation
CRON_SECRET="writgo-content-automation-secret-2025"

# Email Configuration (Optional)
SMTP_HOST="writgoai.nl"
ENVEOF

# Set permissions
chmod 600 "$TARGET"

echo ""
echo "✅ .env bestand aangemaakt: $TARGET"
echo ""
echo "📋 Volgende stappen:"
echo "1. Bewerk .env met je credentials:"
echo "   nano $TARGET"
echo ""
echo "2. Genereer nieuwe NextAuth secret:"
echo "   openssl rand -base64 32"
echo ""
echo "3. Vul minimaal in:"
echo "   - DATABASE_URL"
echo "   - NEXTAUTH_SECRET" 
echo "   - AIML_API_KEY"
echo "   - STRIPE_SECRET_KEY + STRIPE_PUBLISHABLE_KEY"
echo "   - AWS credentials"
echo ""
echo "4. Test lokaal:"
echo "   cd nextjs_space && yarn dev"
echo ""
