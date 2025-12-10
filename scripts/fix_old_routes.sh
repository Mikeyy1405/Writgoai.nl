#!/bin/bash
cd /home/ubuntu/writgo_planning_app/nextjs_space/app/api

# Find all API routes that need to be replaced
find . -name "route.ts" -type f | while read file; do
  # Skip the routes we want to keep
  if [[ "$file" == *"/auth/"* ]] || \
     [[ "$file" == "./admin/clients/route.ts" ]] || \
     [[ "$file" == *"/client/"* ]] || \
     [[ "$file" == *"/client-auth/"* ]] || \
     [[ "$file" == *"/cron/daily-automation/"* ]] || \
     [[ "$file" == "./shared/"* ]]; then
    echo "Keeping: $file"
    continue
  fi
  
  echo "Replacing: $file"
  cat > "$file" << 'ROUTE'
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Deze API route is niet meer beschikbaar' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: 'Deze API route is niet meer beschikbaar' }, { status: 404 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Deze API route is niet meer beschikbaar' }, { status: 404 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Deze API route is niet meer beschikbaar' }, { status: 404 });
}
ROUTE
done

echo "Done!"
