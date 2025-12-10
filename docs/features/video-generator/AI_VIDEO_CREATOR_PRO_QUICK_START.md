# AI Video Creator Pro - Quick Start Guide

## 🚀 Snel aan de Slag

Deze guide helpt je om binnen 5 minuten je eerste professionele YouTube video te genereren.

## 📋 Vereisten

### Environment Variables

Zorg dat de volgende environment variables zijn ingesteld:

```bash
# AI/ML API (voor image generatie en LLMs)
AIML_API_KEY=your_key_here

# ElevenLabs (voor voice-over)
ELEVENLABS_API_KEY=your_key_here

# AWS S3 (voor video opslag)
AWS_BUCKET_NAME=your_bucket
AWS_FOLDER_PREFIX=writgo/

# Late.dev (optioneel, voor YouTube publishing)
LATE_DEV_API_KEY=your_key_here

# Database
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=https://your-domain.nl
```

### Server Vereisten

```bash
# FFmpeg is vereist voor video compositie
sudo apt-get update
sudo apt-get install ffmpeg

# Verify installatie
ffmpeg -version
```

## 🎬 Stap-voor-Stap Instructies

### Stap 1: Navigeer naar Video Creator Pro

```
URL: https://your-domain.nl/client-portal/video-creator-pro
```

Of via het dashboard menu → "Video Creator Pro"

### Stap 2: Configureer je Video

#### 2.1 Selecteer een Niche

Kies uit 12 voorgedefinieerde niches:
- **Horror** - Griezelige verhalen
- **Stoicism** - Filosofie en wijsheid
- **Finance** - Financiële tips
- **Tech** - Technologie nieuws
- **Gezondheid** - Health & wellness
- **Gaming** - Game reviews en tips
- **Motivatie** - Inspirerende content
- **Wetenschap** - Wetenschappelijke onderwerpen
- **Geschiedenis** - Historische verhalen
- **True Crime** - Misdaadverhalen
- **Educatie** - Educatieve content
- **Lifestyle** - Lifestyle tips

#### 2.2 Koppel een Project (Optioneel)

Selecteer een bestaand project om automatisch te gebruiken:
- Brand voice
- Target audience
- Niche-specifieke settings
- Content pillars

#### 2.3 Voer Onderwerp in (Optioneel)

- Laat leeg voor AI-gegenereerde suggesties
- Of specificeer een exact onderwerp: bijv. "5 tips voor beter slapen"

#### 2.4 Kies Taal

- Nederlands (Voice: Roger)
- Engels (Voice: Sarah)
- Duits (Voice: Clyde)
- Frans (Voice: Laura)
- Spaans (Voice: Charlie)

#### 2.5 Selecteer Video Lengte

- **Kort** (1-3 minuten) - Perfect voor quick tips
- **Medium** (5-8 minuten) - Ideaal voor standaard content
- **Lang** (10-15 minuten) - Voor diepgaande onderwerpen

#### 2.6 Kies Toon

- Informatief
- Mysterieus
- Motiverend
- Dramatisch
- Casual
- Professioneel

#### 2.7 Selecteer Beeldstijl

- **Cinematic** - Filmische look
- **Realistic** - Fotorealistisch
- **Artistic** - Artistiek
- **Dark & Moody** - Donker en mysterieus
- **Bright & Clean** - Helder en professioneel
- **Vintage** - Retro stijl

#### 2.8 Kies Aspect Ratio

- **9:16 (Verticaal)** - Perfect voor TikTok, Instagram Reels, YouTube Shorts
- **16:9 (Horizontaal)** - Perfect voor YouTube, Facebook
- **1:1 (Vierkant)** - Perfect voor Instagram Feed

### Stap 3: Genereer Video-ideeën

Klik op **"✨ Genereer Video-ideeën"**

Het systeem genereert 3 virale video-ideeën met:
- Pakkende titel
- Gedetailleerde beschrijving
- Viraal score (0-100)
- Relevante keywords
- Geschatte duur

⏱️ Dit duurt ongeveer 10-20 seconden.

### Stap 4: Selecteer een Idee

1. Bekijk de 3 gegenereerde ideeën
2. Let op de viraal score
3. Lees de beschrijving en keywords
4. Klik op het idee dat je wilt gebruiken
5. Klik op **"🎬 Genereer Complete Video"**

### Stap 5: Wacht op Video Generatie

Het systeem voert nu automatisch 7 stappen uit:

1. ✍️ **Script Schrijven** (~30 sec)
   - Volledig script met scenes
   - Voiceover tekst per scene
   - Timing berekeningen

2. 🎨 **Beeld Prompts** (~10 sec)
   - Niche-specifieke prompts
   - Geoptimaliseerd voor AI

3. 🖼️ **Afbeeldingen Genereren** (~60-120 sec)
   - 5-8 professionele afbeeldingen
   - Upload naar S3

4. 🎤 **Voice-Over** (~30 sec)
   - Multi-taal support
   - Natuurlijke stem

5. 🎬 **Video Assemblage** (~60 sec)
   - Ken Burns zoom effecten
   - Audio synchronisatie
   - Thumbnail generatie

6. 📊 **Metadata Generatie** (~10 sec)
   - SEO-geoptimaliseerde titel
   - Keyword-rijke beschrijving
   - Relevante tags

⏱️ **Totaal: 2-5 minuten** (afhankelijk van video lengte)

### Stap 6: Download of Publiceer

Zodra de video klaar is, zie je:

#### Video Preview
- Video player met controls
- Thumbnail preview

#### Download Opties
- 📥 **Download Video** - Volledige MP4 video
- 🖼️ **Download Thumbnail** - High-quality thumbnail

#### YouTube Metadata
- **Titel** - Geoptimaliseerd voor SEO
- **Beschrijving** - Met keywords en hooks
- **Tags** - Relevante hashtags

#### Publishing (Optioneel)
Voor YouTube publishing via Late.dev:
1. Zorg dat je YouTube account is gekoppeld aan Late.dev
2. Gebruik de `/api/client/video-creator-pro/publish-youtube` endpoint
3. Of implementeer een publish button in de UI

## 💡 Best Practices

### Niche Selectie
- Kies een niche die past bij je doelgroep
- Experimenteer met verschillende niches
- Let op de viraal score van ideeën

### Onderwerp Specificatie
- Wees specifiek voor betere resultaten
- Gebruik trending topics in je niche
- Laat leeg voor AI creativiteit

### Video Lengte
- **Kort**: Quick tips, facts, teases
- **Medium**: Tutorials, stories, reviews
- **Lang**: Deep dives, documentaries, guides

### Aspect Ratio Keuze
- **9:16**: Maximale reach op short-form platforms
- **16:9**: Beste voor long-form YouTube content
- **1:1**: Goede balance voor social media

### Project Integratie
- Link aan project voor consistent brand voice
- Gebruik voor series/recurring content
- Automatisch gebruik van target audience insights

## 🔧 Troubleshooting

### "FFmpeg not found" Error
```bash
# Installeer FFmpeg
sudo apt-get update
sudo apt-get install ffmpeg
```

### Video Generatie Timeout
- Probeer een kortere video lengte
- Verminder aantal scenes
- Check server resources

### S3 Upload Failed
- Verify AWS credentials in .env
- Check bucket permissions
- Ensure CORS is configured

### ElevenLabs Quota Exceeded
- Check your ElevenLabs account quota
- Upgrade plan indien nodig
- Contact support voor enterprise solutions

### Low Quality Images
- Probeer een andere beeldstijl
- Wees specifieker in onderwerp
- Sommige niches hebben betere image models

## 📊 Performance Tips

### Optimale Settings voor Snelheid
- Video Lengte: "Kort"
- Beeldstijl: "Realistic" (snelste)
- Aantal scenes: Minimaal 5

### Optimale Settings voor Kwaliteit
- Video Lengte: "Medium" of "Lang"
- Beeldstijl: "Cinematic"
- Image Model: Flux Pro Ultra (automatisch voor bepaalde niches)

### Cost Efficiency
- Gebruik project integratie voor betere context
- Laat AI onderwerpen suggereren
- Batch meerdere video's in dezelfde niche

## 🎯 Voorbeelden

### Voorbeeld 1: Horror Short Video
```
Niche: Horror
Onderwerp: "3 griezelige feiten over verlaten ziekenhuizen"
Taal: Nederlands
Lengte: Kort (1-3 min)
Toon: Mysterieus
Beeldstijl: Dark & Moody
Aspect Ratio: 9:16
```

### Voorbeeld 2: Finance Tutorial
```
Niche: Finance
Onderwerp: "Hoe je €1000 per maand passief inkomen genereert"
Taal: Nederlands
Lengte: Medium (5-8 min)
Toon: Professioneel
Beeldstijl: Bright & Clean
Aspect Ratio: 16:9
```

### Voorbeeld 3: Tech News
```
Niche: Tech
Onderwerp: "" (laat AI beslissen)
Taal: Engels
Lengte: Medium (5-8 min)
Toon: Enthusiast
Beeldstijl: Futuristic
Aspect Ratio: 16:9
```

## 🔄 Workflow voor Bulk Content

Voor het maken van meerdere video's:

1. **Planning**
   - Kies 1-2 niches
   - Plan 5-10 onderwerpen
   - Bepaal consistent format

2. **Batch Generatie**
   - Genereer ideeën voor alle onderwerpen
   - Selecteer beste ideeën
   - Genereer video's één voor één

3. **Quality Check**
   - Preview alle video's
   - Check metadata consistency
   - Verify brand voice alignment

4. **Publishing**
   - Schedule voor optimale tijden
   - Stagger releases (niet allemaal tegelijk)
   - Monitor performance

## 📞 Support

Voor vragen of problemen:
- Check de `AI_VIDEO_CREATOR_PRO_README.md` voor technische details
- Review de troubleshooting sectie hierboven
- Contact development team voor advanced support

## 🎉 Klaar om te Beginnen!

Je bent nu klaar om professionele faceless YouTube video's te genereren in minuten. 

**Pro Tip:** Begin met een korte video in de "Lifestyle" of "Tech" niche om het systeem te leren kennen!

Happy video creating! 🎬✨
