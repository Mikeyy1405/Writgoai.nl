# AI Video Generator

Modulair Python script voor het genereren van complete video's met AI.

## Features

- 🎬 **Meerdere formaten**: Landscape (16:9), Portrait (9:16), Square (1:1)
- 🎨 **12+ visuele stijlen**: Ultra Realistic, Cyberpunk, Studio Ghibli, en meer
- 🎤 **Voice-over**: ElevenLabs stemmen via AIML API
- 🎵 **Muziek**: AI-gegenereerde achtergrondmuziek via Suno
- 📝 **Captions**: Automatisch gebrandde ondertiteling
- ⏱️ **Shortform & Longform**: Van 60 seconden tot 10+ minuten

## Installatie

```bash
# Navigeer naar de video-generator folder
cd scripts/video-generator

# Installeer dependencies
pip install -r requirements.txt
```

### FFmpeg (vereist voor MoviePy)

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**Windows:**
Download van https://ffmpeg.org/download.html en voeg toe aan PATH.

## API Key Instellen

Verkrijg een API key via [AIML API](https://aimlapi.com).

**Optie 1: Environment variable**
```bash
export AIML_API_KEY="jouw-api-key-hier"
```

**Optie 2: Direct in script**
Open `ai_video_generator.py` en vervang:
```python
AIML_API_KEY = "VULL_HIER_JE_API_KEY_IN"
```

## Snel Starten

### Voorbeeld video genereren

```bash
python ai_video_generator.py
```

Dit genereert een voorbeeld motivatie-video met 6 scènes in verschillende stijlen.

### Templates gebruiken

```python
from templates import create_shorts_template, generate_complete_video
from ai_video_generator import generate_complete_video

# Kies een template
project = create_shorts_template()  # TikTok/Shorts/Reels

# Genereer de video
generate_complete_video(project)
```

## Beschikbare Templates

| Template | Formaat | Duur | Gebruik |
|----------|---------|------|---------|
| `create_shorts_template()` | 9:16 | 60s | TikTok, YouTube Shorts, Reels |
| `create_youtube_intro_template()` | 16:9 | 60s | YouTube videos |
| `create_instagram_square_template()` | 1:1 | 60s | Instagram, Facebook, LinkedIn |
| `create_longform_template()` | 16:9 | 180s | Tutorials, documentaires |
| `create_product_showcase_template()` | Variabel | 60s | Product marketing |

## Custom Video Maken

```python
from templates import build_custom_video
from ai_video_generator import generate_complete_video

# Definieer je scènes
scenes = [
    {
        "prompt": "Sunrise over mountains, golden light",
        "narration": "Een nieuwe dag breekt aan.",
        "style": "cinematic_drone",
        "duration": 10.0
    },
    {
        "prompt": "Person running through forest trail",
        "narration": "Vol energie en mogelijkheden.",
        "style": "ultra_realistic",
        "duration": 10.0
    },
    {
        "prompt": "City skyline at dusk, lights turning on",
        "narration": "De wereld wacht op jou.",
        "style": "cyberpunk",
        "duration": 10.0
    }
]

# Bouw het project
project = build_custom_video(
    title="Mijn Video",
    scene_data=scenes,
    aspect_ratio="16:9",  # of "9:16" of "1:1"
    music_prompt="Inspiring orchestral music"
)

# Genereer
generate_complete_video(project)
```

## Beschikbare Stijlen

| Stijl | Beschrijving |
|-------|--------------|
| `ultra_realistic` | Fotorealistisch, 8K kwaliteit |
| `vintage_comic` | Retro stripboek stijl |
| `3d_pixar` | Pixar-achtige 3D animatie |
| `cyberpunk` | Neon, futuristisch |
| `studio_ghibli` | Japanse anime, aquarel |
| `cinematic_drone` | Epische luchtopnames |
| `noir` | Zwart-wit, jaren '40 |
| `synthwave` | 80s retro neon |
| `watercolor` | Aquarel schilderij |
| `documentary` | Documentaire stijl |
| `anime` | Moderne anime |
| `minimalist` | Clean, simpel design |

## Configuratie Opties

```python
from ai_video_generator import VideoConfig

config = VideoConfig(
    # Formaat
    aspect_ratio="9:16",           # "16:9", "9:16", "1:1"

    # Video model
    video_model="kling-v1",        # "kling-v1", "kling-v1-5", "luma-dream-machine"

    # Voice
    voice_model="elevenlabs/eleven_multilingual_v2",
    voice_id="pNInz6obpgDQGcFmaJgB",  # Adam stem

    # Captions
    font_name="Arial-Bold",
    font_size=48,
    font_color="white",
    stroke_color="black",
    stroke_width=3,
    caption_position="center",     # "center", "bottom", "top", "none"

    # Audio levels
    voice_volume=1.0,
    music_volume=0.15
)
```

## ElevenLabs Stem IDs

| Stem | ID | Taal |
|------|-----|------|
| Adam | `pNInz6obpgDQGcFmaJgB` | Multilingual |
| Antoni | `ErXwobaYiN019PkySvjV` | Multilingual |
| Bella | `EXAVITQu4vr4xnSDxMaL` | English |
| Elli | `MF3mGyEYCl7XYWbV9V6O` | English |
| Josh | `TxGEqnHWrfWFTfGW9XjX` | English |
| Rachel | `21m00Tcm4TlvDq8ikWAM` | English |

## Output

Gegenereerde bestanden komen in de `output/` folder:
- Video clips per scène
- Voice-over audio per scène
- Achtergrondmuziek
- Finale samengevoegde video

## Troubleshooting

### Font niet gevonden
```
⚠️ Caption toevoegen mislukt: Font 'Arial-Bold' niet gevonden
```
**Oplossing:** Installeer het font of wijzig `font_name` in de config:
```python
config = VideoConfig(font_name="DejaVu-Sans")  # Linux
config = VideoConfig(font_name="Helvetica")   # macOS
```

### FFmpeg niet gevonden
```
MoviePy Error: ffmpeg not found
```
**Oplossing:** Installeer FFmpeg (zie installatie sectie).

### API timeout
```
API timeout na 60 seconden
```
**Oplossing:** Video generatie kan lang duren. Het script pollt elke 15 seconden tot max 10 minuten.

### Onvoldoende credits
Controleer je AIML API credits op https://aimlapi.com/dashboard.

## Credits Schatting

Per 60 seconden video (6 scènes):
- ~6 video generaties
- ~6 voice-over generaties
- ~1 muziek generatie

Check actuele prijzen op AIML API website.

## Licentie

Onderdeel van WritGO.ai
