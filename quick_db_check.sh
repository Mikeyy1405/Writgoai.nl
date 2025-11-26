#!/bin/bash
echo "=== QUICK DATABASE CHECK ==="
echo "Timestamp: $(date)"
echo ""
cd /home/ubuntu/writgo_planning_app/nextjs_space
yarn tsx check_db.ts
