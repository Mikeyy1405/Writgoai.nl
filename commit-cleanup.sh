#!/bin/bash

echo "🧹 Committing cleanup changes..."

# Add all changes
git add .

# Commit with detailed message
git commit -m "🧹 Major cleanup: Remove deprecated routes, fix build errors, add Render config

Changes:
- Removed 8 deprecated/duplicate cron jobs
- Archived 96+ test/utility scripts to scripts/archive/
- Fixed TypeScript build errors (sendEmail, publishToWordPress)
- Added render.yaml for Render deployment
- Added RENDER_DEPLOYMENT.md with complete deployment guide
- Added CLEANUP_SUMMARY.md with detailed cleanup info
- Updated .gitignore to exclude archived scripts

Build status: ✅ All errors fixed
Ready for: Render deployment"

echo "✅ Changes committed!"
echo ""
echo "To push to GitHub, run:"
echo "  git push origin main"
