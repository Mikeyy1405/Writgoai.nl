"""
AI Video Generator - Modulair Python Script
============================================
Genereert complete video's met AI-gegenereerde clips, voice-over en muziek.

Ondersteunt:
- Meerdere aspect ratios: 16:9 (landscape), 9:16 (portrait/shorts), 1:1 (square)
- Shortform (60 sec) en longform content
- Verschillende visuele stijlen per scène
- ElevenLabs voice-over via AIML API
- Achtergrondmuziek via Suno
- Automatische caption branding

Auteur: WritGO.ai
Versie: 1.0.0
"""

import os
import time
import json
import requests
from typing import List, Dict, Optional, Literal
from dataclasses import dataclass
from pathlib import Path
from datetime import datetime

# ============================================================================
# CONFIGURATIE - Vul hier je gegevens in
# ============================================================================

# Je AIML API key (verkrijgbaar via https://aimlapi.com)
AIML_API_KEY = os.getenv("AIML_API_KEY", "VULL_HIER_JE_API_KEY_IN")

# AIML API Base URL
AIML_BASE_URL = "https://api.aimlapi.com"

# Output directory voor gegenereerde bestanden
OUTPUT_DIR = Path("./output")

# Polling interval voor video generatie (seconden)
POLLING_INTERVAL = 15

# Maximum wachttijd voor video generatie (seconden)
MAX_WAIT_TIME = 600  # 10 minuten

# ============================================================================
# VIDEO CONFIGURATIE
# ============================================================================

@dataclass
class VideoConfig:
    """Configuratie voor video generatie."""

    # Aspect ratio opties
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9"

    # Video model keuze
    video_model: Literal["luma-dream-machine", "kling-v1", "kling-v1-5"] = "kling-v1"

    # Voice model
    voice_model: str = "elevenlabs/eleven_multilingual_v2"
    voice_id: str = "pNInz6obpgDQGcFmaJgB"  # Adam - Nederlandse stem

    # Muziek model
    music_model: str = "suno/v3"

    # Caption settings
    font_name: str = "Arial-Bold"
    font_size: int = 48
    font_color: str = "white"
    stroke_color: str = "black"
    stroke_width: int = 3
    caption_position: str = "center"

    # Audio levels
    voice_volume: float = 1.0
    music_volume: float = 0.15


# Beschikbare visuele stijlen voor scènes
VIDEO_STYLES = {
    "ultra_realistic": "Ultra Realistic, photorealistic, 8K quality, cinematic lighting",
    "vintage_comic": "Vintage Comic Book style, halftone dots, bold colors, speech bubbles aesthetic",
    "3d_pixar": "3D Pixar-style animation, vibrant colors, smooth textures, family-friendly",
    "cyberpunk": "Cyberpunk aesthetic, neon lights, futuristic city, rain-soaked streets, holographic displays",
    "studio_ghibli": "Studio Ghibli anime style, hand-drawn aesthetic, soft watercolors, magical atmosphere",
    "cinematic_drone": "Cinematic drone footage style, sweeping aerial shots, golden hour lighting",
    "noir": "Film Noir style, black and white, dramatic shadows, 1940s detective aesthetic",
    "synthwave": "Synthwave/Retrowave, 80s aesthetic, neon grids, sunset gradients, chrome elements",
    "watercolor": "Watercolor painting style, soft edges, flowing colors, artistic brushstrokes",
    "documentary": "Documentary style, realistic, informative, clean composition",
    "anime": "Modern anime style, vibrant colors, dynamic action, expressive characters",
    "minimalist": "Minimalist design, clean lines, simple shapes, limited color palette",
}


# ============================================================================
# DATA STRUCTUREN
# ============================================================================

@dataclass
class Scene:
    """Representeert één scène in de video."""
    scene_number: int
    prompt: str
    narration_text: str
    style: str
    duration: float = 10.0  # seconden

    # Gegenereerde bestanden (worden ingevuld tijdens generatie)
    video_path: Optional[str] = None
    audio_path: Optional[str] = None


@dataclass
class VideoProject:
    """Complete video project met alle scènes."""
    title: str
    description: str
    scenes: List[Scene]
    config: VideoConfig
    music_prompt: str = "Upbeat background music, modern, energetic"

    # Gegenereerde bestanden
    music_path: Optional[str] = None
    final_video_path: Optional[str] = None


# ============================================================================
# API CLIENT KLASSE
# ============================================================================

class AIMLClient:
    """Client voor communicatie met de AIML API."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = AIML_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        timeout: int = 60
    ) -> Dict:
        """Maak een API request met error handling."""
        url = f"{self.base_url}/{endpoint}"

        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=self.headers, timeout=timeout)
            elif method.upper() == "POST":
                response = requests.post(url, headers=self.headers, json=data, timeout=timeout)
            else:
                raise ValueError(f"Onbekende HTTP methode: {method}")

            response.raise_for_status()
            return response.json()

        except requests.exceptions.Timeout:
            raise Exception(f"API timeout na {timeout} seconden voor {endpoint}")
        except requests.exceptions.HTTPError as e:
            raise Exception(f"HTTP Error {e.response.status_code}: {e.response.text}")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Request failed: {str(e)}")


# ============================================================================
# VIDEO GENERATIE
# ============================================================================

def request_video(
    client: AIMLClient,
    prompt: str,
    style: str,
    aspect_ratio: str = "16:9",
    model: str = "kling-v1",
    duration: float = 5.0
) -> str:
    """
    Genereer een video clip via de AIML API.

    Args:
        client: AIML API client
        prompt: Beschrijving van de video inhoud
        style: Visuele stijl (uit VIDEO_STYLES)
        aspect_ratio: Beeldverhouding (16:9, 9:16, 1:1)
        model: Video model (luma-dream-machine, kling-v1, kling-v1-5)
        duration: Gewenste duur in seconden

    Returns:
        Pad naar de gedownloade video file
    """
    print(f"  📹 Video generatie gestart...")
    print(f"     Model: {model}")
    print(f"     Aspect ratio: {aspect_ratio}")
    print(f"     Stijl: {style}")

    # Combineer prompt met stijl
    full_prompt = f"{prompt}. Style: {VIDEO_STYLES.get(style, style)}"

    # Bepaal model-specifieke parameters
    if model == "luma-dream-machine":
        endpoint = "v1/videos/generations"
        request_data = {
            "model": "luma-dream-machine",
            "prompt": full_prompt,
            "aspect_ratio": aspect_ratio,
            "loop": False
        }
    elif model in ["kling-v1", "kling-v1-5"]:
        endpoint = "v1/videos/generations"
        request_data = {
            "model": model,
            "prompt": full_prompt,
            "aspect_ratio": aspect_ratio,
            "duration": str(min(duration, 10))  # Kling max 10 sec per clip
        }
    else:
        raise ValueError(f"Onbekend video model: {model}")

    try:
        # Start video generatie
        response = client._make_request("POST", endpoint, request_data)
        generation_id = response.get("id") or response.get("generation_id")

        if not generation_id:
            raise Exception(f"Geen generation ID ontvangen: {response}")

        print(f"     Generation ID: {generation_id}")

        # Polling voor status
        start_time = time.time()
        while True:
            elapsed = time.time() - start_time
            if elapsed > MAX_WAIT_TIME:
                raise Exception(f"Video generatie timeout na {MAX_WAIT_TIME} seconden")

            # Check status
            status_response = client._make_request(
                "GET",
                f"v1/videos/generations/{generation_id}"
            )

            status = status_response.get("status", "unknown")
            print(f"     Status: {status} ({int(elapsed)}s verstreken)")

            if status == "completed":
                video_url = status_response.get("video", {}).get("url") or \
                           status_response.get("url") or \
                           status_response.get("output", {}).get("url")

                if not video_url:
                    raise Exception(f"Geen video URL in response: {status_response}")

                # Download video
                video_path = download_file(video_url, "video", ".mp4")
                print(f"  ✅ Video gedownload: {video_path}")
                return video_path

            elif status == "failed":
                error = status_response.get("error", "Onbekende fout")
                raise Exception(f"Video generatie mislukt: {error}")

            # Wacht voor volgende poll
            time.sleep(POLLING_INTERVAL)

    except Exception as e:
        print(f"  ❌ Video generatie fout: {str(e)}")
        raise


# ============================================================================
# AUDIO / VOICE-OVER GENERATIE
# ============================================================================

def request_audio(
    client: AIMLClient,
    text: str,
    voice_model: str = "elevenlabs/eleven_multilingual_v2",
    voice_id: str = "pNInz6obpgDQGcFmaJgB"
) -> str:
    """
    Genereer voice-over audio via ElevenLabs integratie in AIML.

    Args:
        client: AIML API client
        text: De tekst om te spreken
        voice_model: ElevenLabs model via AIML
        voice_id: Stem ID (standaard: Adam - goed voor Nederlands)

    Returns:
        Pad naar de gegenereerde .mp3 file
    """
    print(f"  🎤 Voice-over generatie gestart...")
    print(f"     Tekst: {text[:50]}..." if len(text) > 50 else f"     Tekst: {text}")

    endpoint = "v1/tts"
    request_data = {
        "model": voice_model,
        "voice": voice_id,
        "text": text,
        "response_format": "mp3"
    }

    try:
        # ElevenLabs via AIML geeft direct audio terug
        url = f"{client.base_url}/{endpoint}"
        response = requests.post(
            url,
            headers=client.headers,
            json=request_data,
            timeout=120
        )
        response.raise_for_status()

        # Check of we audio data krijgen
        content_type = response.headers.get("Content-Type", "")

        if "audio" in content_type or response.content[:4] == b'ID3\x04':
            # Direct audio response
            audio_path = generate_output_path("voice", ".mp3")
            with open(audio_path, "wb") as f:
                f.write(response.content)
            print(f"  ✅ Voice-over opgeslagen: {audio_path}")
            return audio_path
        else:
            # JSON response met URL
            data = response.json()
            audio_url = data.get("url") or data.get("audio_url")
            if audio_url:
                audio_path = download_file(audio_url, "voice", ".mp3")
                print(f"  ✅ Voice-over gedownload: {audio_path}")
                return audio_path
            else:
                raise Exception(f"Onverwachte response: {data}")

    except Exception as e:
        print(f"  ❌ Voice-over generatie fout: {str(e)}")
        raise


# ============================================================================
# MUZIEK GENERATIE
# ============================================================================

def request_music(
    client: AIMLClient,
    prompt: str,
    duration: int = 60,
    model: str = "suno/v3"
) -> str:
    """
    Genereer achtergrondmuziek via Suno model in AIML.

    Args:
        client: AIML API client
        prompt: Beschrijving van de gewenste muziek
        duration: Gewenste duur in seconden
        model: Muziek model

    Returns:
        Pad naar de gegenereerde muziek file
    """
    print(f"  🎵 Muziek generatie gestart...")
    print(f"     Prompt: {prompt}")
    print(f"     Duur: {duration} seconden")

    endpoint = "v1/audio/generations"
    request_data = {
        "model": model,
        "prompt": prompt,
        "duration": duration,
        "make_instrumental": True  # Geen vocals voor achtergrondmuziek
    }

    try:
        response = client._make_request("POST", endpoint, request_data)
        generation_id = response.get("id") or response.get("generation_id")

        if not generation_id:
            # Directe response met audio
            audio_url = response.get("url") or response.get("audio_url")
            if audio_url:
                music_path = download_file(audio_url, "music", ".mp3")
                print(f"  ✅ Muziek gedownload: {music_path}")
                return music_path

        # Polling voor async generatie
        print(f"     Generation ID: {generation_id}")
        start_time = time.time()

        while True:
            elapsed = time.time() - start_time
            if elapsed > MAX_WAIT_TIME:
                raise Exception(f"Muziek generatie timeout na {MAX_WAIT_TIME} seconden")

            status_response = client._make_request(
                "GET",
                f"v1/audio/generations/{generation_id}"
            )

            status = status_response.get("status", "unknown")
            print(f"     Status: {status} ({int(elapsed)}s verstreken)")

            if status == "completed":
                audio_url = status_response.get("url") or \
                           status_response.get("audio_url") or \
                           status_response.get("output", {}).get("url")

                if audio_url:
                    music_path = download_file(audio_url, "music", ".mp3")
                    print(f"  ✅ Muziek gedownload: {music_path}")
                    return music_path
                else:
                    raise Exception(f"Geen audio URL in response: {status_response}")

            elif status == "failed":
                error = status_response.get("error", "Onbekende fout")
                raise Exception(f"Muziek generatie mislukt: {error}")

            time.sleep(POLLING_INTERVAL)

    except Exception as e:
        print(f"  ❌ Muziek generatie fout: {str(e)}")
        raise


# ============================================================================
# VIDEO ASSEMBLY MET MOVIEPY
# ============================================================================

def assemble_video(
    project: VideoProject,
    output_filename: Optional[str] = None
) -> str:
    """
    Voeg alle video clips, audio en muziek samen tot één finale video.

    Args:
        project: Het complete VideoProject met alle gegenereerde bestanden
        output_filename: Optionele output bestandsnaam

    Returns:
        Pad naar de finale video
    """
    print("\n🎬 Video assembly gestart...")

    try:
        from moviepy.editor import (
            VideoFileClip, AudioFileClip, TextClip,
            CompositeVideoClip, CompositeAudioClip,
            concatenate_videoclips
        )
    except ImportError:
        raise ImportError(
            "MoviePy is niet geïnstalleerd. Run: pip install moviepy"
        )

    config = project.config
    video_clips = []
    audio_clips = []
    current_time = 0

    # Laad en verwerk elke scène
    for i, scene in enumerate(project.scenes):
        print(f"  📎 Scène {scene.scene_number} verwerken...")

        if not scene.video_path or not os.path.exists(scene.video_path):
            print(f"     ⚠️ Video bestand niet gevonden, overslaan...")
            continue

        # Laad video clip
        video_clip = VideoFileClip(scene.video_path)

        # Pas duur aan indien nodig
        if video_clip.duration < scene.duration:
            # Loop de video als hij te kort is
            loops_needed = int(scene.duration / video_clip.duration) + 1
            video_clip = video_clip.loop(n=loops_needed)

        video_clip = video_clip.subclip(0, scene.duration)

        # Voeg captions toe
        if scene.narration_text and config.caption_position != "none":
            video_clip = add_captions(
                video_clip,
                scene.narration_text,
                config
            )

        video_clips.append(video_clip)

        # Laad audio clip indien beschikbaar
        if scene.audio_path and os.path.exists(scene.audio_path):
            audio_clip = AudioFileClip(scene.audio_path)
            audio_clip = audio_clip.set_start(current_time)
            audio_clip = audio_clip.volumex(config.voice_volume)
            audio_clips.append(audio_clip)

        current_time += scene.duration

    if not video_clips:
        raise Exception("Geen video clips gevonden om samen te voegen")

    # Combineer alle video clips
    print("  🔗 Video clips samenvoegen...")
    final_video = concatenate_videoclips(video_clips, method="compose")

    # Voeg achtergrondmuziek toe
    if project.music_path and os.path.exists(project.music_path):
        print("  🎵 Achtergrondmuziek toevoegen...")
        music = AudioFileClip(project.music_path)

        # Loop muziek indien nodig
        if music.duration < final_video.duration:
            loops_needed = int(final_video.duration / music.duration) + 1
            music = music.loop(n=loops_needed)

        music = music.subclip(0, final_video.duration)
        music = music.volumex(config.music_volume)
        audio_clips.append(music)

    # Combineer alle audio
    if audio_clips:
        print("  🔊 Audio tracks mixen...")
        final_audio = CompositeAudioClip(audio_clips)
        final_video = final_video.set_audio(final_audio)

    # Exporteer finale video
    if output_filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_title = "".join(c for c in project.title if c.isalnum() or c in "_ -")
        output_filename = f"{safe_title}_{timestamp}.mp4"

    output_path = OUTPUT_DIR / output_filename

    print(f"  💾 Exporteren naar: {output_path}")
    final_video.write_videofile(
        str(output_path),
        codec="libx264",
        audio_codec="aac",
        fps=30,
        preset="medium",
        threads=4
    )

    # Cleanup
    final_video.close()
    for clip in video_clips:
        clip.close()

    print(f"\n✅ Video succesvol gegenereerd: {output_path}")
    return str(output_path)


def add_captions(
    video_clip,
    text: str,
    config: VideoConfig
):
    """
    Voeg gebrandde captions toe aan een video clip.

    Args:
        video_clip: MoviePy VideoFileClip
        text: De caption tekst
        config: Video configuratie met font settings

    Returns:
        CompositeVideoClip met captions
    """
    from moviepy.editor import TextClip, CompositeVideoClip

    try:
        # Maak text clip
        txt_clip = TextClip(
            text,
            fontsize=config.font_size,
            font=config.font_name,
            color=config.font_color,
            stroke_color=config.stroke_color,
            stroke_width=config.stroke_width,
            method='caption',
            size=(video_clip.w * 0.9, None),  # 90% van video breedte
            align='center'
        )

        # Positioneer caption
        if config.caption_position == "center":
            txt_clip = txt_clip.set_position(("center", "center"))
        elif config.caption_position == "bottom":
            txt_clip = txt_clip.set_position(("center", video_clip.h * 0.85))
        elif config.caption_position == "top":
            txt_clip = txt_clip.set_position(("center", video_clip.h * 0.1))

        txt_clip = txt_clip.set_duration(video_clip.duration)

        return CompositeVideoClip([video_clip, txt_clip])

    except Exception as e:
        print(f"     ⚠️ Caption toevoegen mislukt: {e}")
        print(f"     Tip: Controleer of het font '{config.font_name}' geïnstalleerd is")
        return video_clip


# ============================================================================
# HULPFUNCTIES
# ============================================================================

def ensure_output_dir():
    """Maak output directory aan indien nodig."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def generate_output_path(prefix: str, extension: str) -> str:
    """Genereer een unieke output bestandsnaam."""
    ensure_output_dir()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    return str(OUTPUT_DIR / f"{prefix}_{timestamp}{extension}")


def download_file(url: str, prefix: str, extension: str) -> str:
    """Download een bestand van een URL."""
    output_path = generate_output_path(prefix, extension)

    response = requests.get(url, timeout=120)
    response.raise_for_status()

    with open(output_path, "wb") as f:
        f.write(response.content)

    return output_path


# ============================================================================
# HOOFDFUNCTIE - COMPLETE VIDEO GENERATIE WORKFLOW
# ============================================================================

def generate_complete_video(project: VideoProject) -> str:
    """
    Genereer een complete video van begin tot eind.

    Args:
        project: VideoProject met alle scène configuraties

    Returns:
        Pad naar de finale video
    """
    print("=" * 60)
    print(f"🎬 AI VIDEO GENERATOR")
    print(f"   Project: {project.title}")
    print(f"   Scènes: {len(project.scenes)}")
    print(f"   Aspect ratio: {project.config.aspect_ratio}")
    print("=" * 60)

    client = AIMLClient(AIML_API_KEY)
    ensure_output_dir()

    # Stap 1: Genereer alle video clips
    print("\n📹 STAP 1: Video clips genereren")
    print("-" * 40)

    for i, scene in enumerate(project.scenes):
        print(f"\n🎬 Scène {scene.scene_number}/{len(project.scenes)}")
        try:
            scene.video_path = request_video(
                client=client,
                prompt=scene.prompt,
                style=scene.style,
                aspect_ratio=project.config.aspect_ratio,
                model=project.config.video_model,
                duration=scene.duration
            )
        except Exception as e:
            print(f"  ❌ Scène {scene.scene_number} video mislukt: {e}")

    # Stap 2: Genereer alle voice-overs
    print("\n🎤 STAP 2: Voice-overs genereren")
    print("-" * 40)

    for i, scene in enumerate(project.scenes):
        print(f"\n🎤 Scène {scene.scene_number}/{len(project.scenes)}")
        if scene.narration_text:
            try:
                scene.audio_path = request_audio(
                    client=client,
                    text=scene.narration_text,
                    voice_model=project.config.voice_model,
                    voice_id=project.config.voice_id
                )
            except Exception as e:
                print(f"  ❌ Scène {scene.scene_number} voice-over mislukt: {e}")
        else:
            print(f"  ⏭️ Geen narration tekst, overslaan...")

    # Stap 3: Genereer achtergrondmuziek
    print("\n🎵 STAP 3: Achtergrondmuziek genereren")
    print("-" * 40)

    total_duration = sum(scene.duration for scene in project.scenes)
    try:
        project.music_path = request_music(
            client=client,
            prompt=project.music_prompt,
            duration=int(total_duration) + 5  # Kleine buffer
        )
    except Exception as e:
        print(f"  ❌ Muziek generatie mislukt: {e}")
        print("  ℹ️ Video wordt zonder achtergrondmuziek gegenereerd")

    # Stap 4: Assembleer finale video
    print("\n🎬 STAP 4: Finale video samenstellen")
    print("-" * 40)

    final_path = assemble_video(project)
    project.final_video_path = final_path

    print("\n" + "=" * 60)
    print("✅ VIDEO GENERATIE VOLTOOID!")
    print(f"   Output: {final_path}")
    print("=" * 60)

    return final_path


# ============================================================================
# VOORBEELD GEBRUIK
# ============================================================================

def create_example_project() -> VideoProject:
    """
    Maak een voorbeeld project met 6 scènes in verschillende stijlen.

    Dit is een template die je kunt aanpassen voor je eigen content.
    """

    # Configuratie - pas aan naar wens
    config = VideoConfig(
        aspect_ratio="9:16",      # Portrait voor TikTok/Shorts/Reels
        # aspect_ratio="16:9",    # Landscape voor YouTube
        # aspect_ratio="1:1",     # Square voor Instagram
        video_model="kling-v1",
        voice_model="elevenlabs/eleven_multilingual_v2",
        voice_id="pNInz6obpgDQGcFmaJgB",  # Adam stem
        music_volume=0.15,
        caption_position="center"
    )

    # Definieer de scènes - elk 10 seconden voor totaal 60 sec
    scenes = [
        Scene(
            scene_number=1,
            prompt="A person waking up and looking at their phone with shocked expression",
            narration_text="Wist je dat de meeste mensen hun potentieel nooit benutten?",
            style="ultra_realistic",
            duration=10.0
        ),
        Scene(
            scene_number=2,
            prompt="Superhero origin story moment, person transforming with energy around them",
            narration_text="Maar wat als ik je vertel dat jij dat kunt veranderen?",
            style="vintage_comic",
            duration=10.0
        ),
        Scene(
            scene_number=3,
            prompt="Cute animated character having a lightbulb moment, ideas floating around",
            narration_text="Het begint allemaal met één simpele gewoonten.",
            style="3d_pixar",
            duration=10.0
        ),
        Scene(
            scene_number=4,
            prompt="Futuristic city with holographic productivity stats and data streams",
            narration_text="Elke dag vijf minuten investeren in jezelf.",
            style="cyberpunk",
            duration=10.0
        ),
        Scene(
            scene_number=5,
            prompt="Peaceful scene of person meditating in a magical forest with spirits",
            narration_text="Focus op wat echt belangrijk is.",
            style="studio_ghibli",
            duration=10.0
        ),
        Scene(
            scene_number=6,
            prompt="Aerial shot of person standing on mountain peak at sunrise, triumphant",
            narration_text="Begin vandaag nog. Je toekomstige zelf zal je dankbaar zijn!",
            style="cinematic_drone",
            duration=10.0
        ),
    ]

    return VideoProject(
        title="Motivatie Video",
        description="Een motiverende video over persoonlijke groei",
        scenes=scenes,
        config=config,
        music_prompt="Inspirational uplifting background music, motivational, modern, energetic beat"
    )


# ============================================================================
# SCRIPT ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║           AI VIDEO GENERATOR v1.0                        ║
    ║           Powered by AIML API                            ║
    ╚══════════════════════════════════════════════════════════╝
    """)

    # Controleer API key
    if AIML_API_KEY == "VULL_HIER_JE_API_KEY_IN":
        print("⚠️  WAARSCHUWING: Geen API key ingesteld!")
        print("   Stel je AIML_API_KEY in via environment variable of in het script.")
        print("   Verkrijg een key op: https://aimlapi.com")
        print()

    # Maak voorbeeld project
    project = create_example_project()

    # Start generatie
    try:
        final_video = generate_complete_video(project)
        print(f"\n🎉 Klaar! Je video staat in: {final_video}")
    except Exception as e:
        print(f"\n❌ Er ging iets mis: {e}")
        import traceback
        traceback.print_exc()
