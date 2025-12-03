#!/bin/bash

# WooCommerce Product Update Cron Job
# Runs weekly to check prices and stock for all auto-update enabled projects

cd /home/ubuntu/writgo_planning_app/nextjs_space || exit 1

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Run the update script
echo "🔄 Starting WooCommerce product update..."
npx tsx scripts/cron-update-woocommerce-products.ts

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ WooCommerce update completed successfully"
else
    echo "❌ WooCommerce update failed"
    exit 1
fi
