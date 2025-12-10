#!/bin/bash
cd /home/ubuntu/writgo_planning_app/nextjs_space/app/api/client

# Keep only: settings, content routes
for file in $(find . -name "*.ts" -type f); do
  if [[ "$file" == "./settings/route.ts" ]] || [[ "$file" == "./content/route.ts" ]]; then
    echo "Keeping: $file"
    continue
  fi
  
  echo "Replacing: $file"
  cat > "$file" << 'ROUTEFILE'
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
ROUTEFILE
done

echo "Done fixing client routes!"
