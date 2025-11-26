
# 🎬 Custom Video Generator - Installatie Guide

## ✅ Wat is er geïmplementeerd?

Jouw WritgoAI app heeft nu een **eigen video generatie systeem** dat Vadoo vervangt:

### Features
- 🖼️ **AI Afbeeldingen**: DALL-E 3 via AIML API (7 verschillende stijlen)
- 🎤 **Voiceover**: ElevenLabs (Nederlands en Engels)
- 🎬 **Video Compositie**: FFmpeg met Ken Burns effect
- 🎵 **Background Muziek**: Optioneel (placeholder voor nu)
- 📐 **Formats**: 9:16 (vertical), 16:9 (horizontal), 1:1 (square)

### Voordelen vs Vadoo
- ✅ **Kostenbesparing**: Geen Vadoo credits meer nodig
- ✅ **Meer controle**: Volledige aanpassing mogelijk
- ✅ **Sneller**: Geen wachttijd op externe API
- ✅ **Flexibeler**: Zelf stijlen en opties bepalen

## 📋 Wat moet er nog gebeuren?

### 1️⃣ FFmpeg Installatie (VERPLICHT)

FFmpeg is nodig voor video compositie. Installeer dit op je server:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y ffmpeg

# Verify installatie
ffmpeg -version
```

### 2️⃣ Server Requirements

- **Node.js**: 18+ (al geïnstalleerd ✅)
- **FFmpeg**: 4.0+ (nog niet geïnstalleerd ❌)
- **Disk Space**: Min. 5GB voor temp video files
- **Memory**: Min. 2GB RAM

### 3️⃣ Background Muziek (Optioneel)

Voor nu is background muziek gedeactiveerd. Je kunt dit toevoegen door:

1. Royalty-free muziek te uploaden naar S3
2. De `getBackgroundMusic()` functie in `lib/custom-video-generator.ts` aan te passen
3. Een library op te bouwen met verschillende muziekstijlen

Voorbeelden van gratis muziek bronnen:
- YouTube Audio Library
- Free Music Archive
- Incompetech (Kevin MacLeod)
- Bensound

### 4️⃣ Testen

Na FFmpeg installatie, test de video generatie:

1. Login op WritgoAI
2. Open de AI Agent chat
3. Vraag: "Maak een video over 5 tips voor betere slaap"
4. Selecteer de gewenste opties (stijl, formaat, etc.)

De AI zal automatisch:
- Een script schrijven
- Afbeeldingen genereren
- Voiceover maken met ElevenLabs
- Video samenstellen met FFmpeg
- Uploaden naar S3

## 🎨 Beschikbare Stijlen

1. **Realistic**: Fotorealistische afbeeldingen
2. **Cinematic**: Filmische look met dramatische belichting
3. **Animated**: Cartoon animatie stijl
4. **Cartoon**: 2D cartoon tekeningen
5. **Fantasy**: Fantasie kunst met magische elementen
6. **Digital Art**: Moderne digitale kunst
7. **3D**: Professionele 3D renders

## 🎤 Beschikbare Stemmen

- **Roger** (Nederlands, mannelijk) - ID: `CwhRBWXzGAHq8TQ4Fs17`
- **Sarah** (Engels, vrouwelijk) - ID: `EXAVITQu4vr4xnSDxMaL`
- **Clyde** (Engels, mannelijk) - ID: `2EiwWnXFnvU5JabPnv8n`

## 💰 Kosten per Video

- **DALL-E 3** (afbeeldingen): ~$0.04 per afbeelding (5 images = $0.20)
- **ElevenLabs** (voiceover): ~$0.30 per 1000 karakters
- **FFmpeg**: Gratis (alleen server resources)

**Totaal**: ~$0.50 - $1.00 per video (afhankelijk van lengte)

Vadoo kost: $5 - $10 per video → **80-90% besparing!**

## 🔧 Technische Details

### Bestanden
- `lib/custom-video-generator.ts` - Hoofdlogica
- `app/api/ai-agent/generate-custom-video/route.ts` - API endpoint
- `lib/deepagent-tools.ts` - Tool integratie
- `components/writgo-deep-agent.tsx` - UI opties

### Video Pipeline
1. Script genereren (AI)
2. Script opdelen in scènes
3. Per scène: Visuele prompt genereren (GPT-4)
4. Afbeeldingen genereren (DALL-E 3)
5. Voiceover genereren (ElevenLabs)
6. Video samenstellen met FFmpeg (Ken Burns effect, transities)
7. Upload naar S3
8. Thumbnail genereren
9. Opslaan in database

### FFmpeg Command Example
```bash
ffmpeg -y \
  -loop 1 -t 5 -i image1.png \
  -loop 1 -t 5 -i image2.png \
  -i audio.mp3 \
  -filter_complex "
    [0:v]scale=1080:1920,zoompan=z='min(zoom+0.0015,1.5)':d=125[v0];
    [1:v]scale=1080:1920,zoompan=z='min(zoom+0.0015,1.5)':d=125[v1];
    [v0][v1]concat=n=2:v=1:a=0[outv]
  " \
  -map "[outv]" -map 2:a \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  output.mp4
```

## 🚀 Deployment

Na FFmpeg installatie:

```bash
cd /home/ubuntu/writgo_planning_app/nextjs_space
yarn build
pm2 restart writgoai
```

## 📝 Credits Systeem

Video generatie kost **100 credits** per video.

Je kunt dit aanpassen in:
- `app/api/ai-agent/generate-custom-video/route.ts` (regel 9)

## ❓ Troubleshooting

### "FFmpeg error"
→ FFmpeg niet geïnstalleerd. Zie stap 1️⃣

### "AIML API error"
→ AIML API key niet correct. Check .env file.

### "ElevenLabs error"
→ ElevenLabs API key niet correct. Check .env file.

### "Failed to generate image"
→ DALL-E rate limit bereikt. Wacht 1 minuut.

### Video quality is laag
→ Verhoog `-crf 23` naar `-crf 18` in FFmpeg command (lagere waarde = hogere kwaliteit)

### Videos te groot
→ Verlaag `-b:a 192k` naar `-b:a 128k` of verhoog `-crf` waarde

## 🎯 Volgende Stappen

1. **Installeer FFmpeg** op je server
2. **Test** de video generatie
3. **Voeg achtergrondmuziek toe** (optioneel)
4. **Optimaliseer** FFmpeg settings voor jouw use case
5. **Monitor** disk space en cleaning van temp files

## 📧 Support

Bij vragen of problemen:
- Check de logs: `pm2 logs writgoai`
- Check FFmpeg: `ffmpeg -version`
- Check API keys in `.env`

---

**Status**: ✅ Code complete | ❌ FFmpeg niet geïnstalleerd

**Laatst geupdate**: 27 oktober 2025
