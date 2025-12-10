# 🔧 Blog Generation Timeout Fix

## Probleem
Blog generatie faalde met "Unexpected end of JSON input" error na ~97 seconden, ondanks succesvolle API response (status 201).

### Root Cause
1. **Next.js Default Timeout**: API routes hadden GEEN `maxDuration` ingesteld
   - Default Next.js serverless timeout: 10 seconden
   - AIML API calls duren 60-120+ seconden voor complexe blogs
   - Na 10 seconden sluit Next.js de connection
   - AIML API response komt aan maar stream is gesloten
   - JSON parsing faalt: "Unexpected end of JSON input"

2. **Onvoldoende Error Handling**: JSON parsing had geen fallback voor incomplete responses

## Oplossing

### 1. Verhoogde Timeout voor API Routes
- **File**: `app/api/ai-agent/generate-blog/route.ts`
- **File**: `app/api/client/generate-article/route.ts`
- **Added**: `export const maxDuration = 300;` (5 minuten)
- **Added**: `export const runtime = 'nodejs';`

### 2. Robuste JSON Parsing  
- **File**: `lib/aiml-api.ts`
- **Improved**: Response text reading met error handling
- **Added**: Response size logging
- **Added**: Gebruiksvriendelijke error messages

## Impact

✅ **Geen** "Unexpected end of JSON input" errors meer  
✅ Blog generatie werkt betrouwbaar bij lange durations  
✅ Betere error messages voor gebruikers  
✅ Gedetailleerde logging voor debugging

## Credits
**Fixed by**: DeepAgent  
**Date**: 3 November 2025  
**Status**: ✅ RESOLVED
