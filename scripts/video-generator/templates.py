"""
Video Templates - Voorbeelden voor verschillende video types
=============================================================

Dit bestand bevat kant-en-klare templates voor verschillende soorten video's.
Kopieer en pas aan naar je eigen behoeften.
"""

from ai_video_generator import (
    VideoProject, VideoConfig, Scene, VIDEO_STYLES
)


# ============================================================================
# TEMPLATE 1: SHORTS / REELS / TIKTOK (Portrait 9:16, 60 sec)
# ============================================================================

def create_shorts_template() -> VideoProject:
    """
    Template voor korte verticale video's (TikTok, YouTube Shorts, Instagram Reels).
    6 scènes van 10 seconden = 60 seconden totaal.
    """
    config = VideoConfig(
        aspect_ratio="9:16",
        video_model="kling-v1",
        font_size=56,  # Groter voor mobiel
        caption_position="center",
        music_volume=0.12
    )

    scenes = [
        Scene(
            scene_number=1,
            prompt="Person looking directly at camera with intriguing expression, close-up shot",
            narration_text="Stop met scrollen, dit moet je weten!",
            style="ultra_realistic",
            duration=10.0
        ),
        Scene(
            scene_number=2,
            prompt="Dynamic transition revealing surprising information, visual metaphor",
            narration_text="De meeste mensen weten dit niet...",
            style="cyberpunk",
            duration=10.0
        ),
        Scene(
            scene_number=3,
            prompt="Animated character explaining concept with floating graphics",
            narration_text="Maar het is eigenlijk heel simpel.",
            style="3d_pixar",
            duration=10.0
        ),
        Scene(
            scene_number=4,
            prompt="Split screen showing before and after transformation",
            narration_text="Kijk eens naar het verschil!",
            style="vintage_comic",
            duration=10.0
        ),
        Scene(
            scene_number=5,
            prompt="Success montage, person achieving goals, celebration",
            narration_text="En zo kun jij het ook!",
            style="cinematic_drone",
            duration=10.0
        ),
        Scene(
            scene_number=6,
            prompt="Call to action scene, person pointing at camera, engaging",
            narration_text="Volg voor meer tips en deel dit met iemand die dit moet zien!",
            style="ultra_realistic",
            duration=10.0
        ),
    ]

    return VideoProject(
        title="Shorts Template",
        description="Verticale video voor TikTok/Shorts/Reels",
        scenes=scenes,
        config=config,
        music_prompt="Trending TikTok style beat, catchy, upbeat, viral sound"
    )


# ============================================================================
# TEMPLATE 2: YOUTUBE LANDSCAPE (16:9, 60 sec)
# ============================================================================

def create_youtube_intro_template() -> VideoProject:
    """
    Template voor YouTube intro of korte YouTube video.
    Landscape formaat voor desktop viewing.
    """
    config = VideoConfig(
        aspect_ratio="16:9",
        video_model="kling-v1-5",  # Hogere kwaliteit voor YouTube
        font_size=42,
        caption_position="bottom",
        music_volume=0.15
    )

    scenes = [
        Scene(
            scene_number=1,
            prompt="Epic cinematic opening shot, dramatic lighting, wide landscape",
            narration_text="Welkom bij een nieuw verhaal.",
            style="cinematic_drone",
            duration=10.0
        ),
        Scene(
            scene_number=2,
            prompt="Documentary style footage, informative visuals, clean composition",
            narration_text="Vandaag duiken we diep in een fascinerend onderwerp.",
            style="documentary",
            duration=10.0
        ),
        Scene(
            scene_number=3,
            prompt="Animated infographic, data visualization, modern design",
            narration_text="Laten we beginnen met de basis.",
            style="minimalist",
            duration=10.0
        ),
        Scene(
            scene_number=4,
            prompt="Expert interview setup, professional studio environment",
            narration_text="Dit is wat de experts zeggen.",
            style="ultra_realistic",
            duration=10.0
        ),
        Scene(
            scene_number=5,
            prompt="Dynamic montage of key concepts, quick cuts, engaging visuals",
            narration_text="Onthoud deze belangrijke punten.",
            style="synthwave",
            duration=10.0
        ),
        Scene(
            scene_number=6,
            prompt="Outro scene with subscribe button animation, channel branding",
            narration_text="Abonneer en klik op de bel voor meer content!",
            style="3d_pixar",
            duration=10.0
        ),
    ]

    return VideoProject(
        title="YouTube Intro",
        description="Landscape video voor YouTube",
        scenes=scenes,
        config=config,
        music_prompt="Cinematic orchestral background music, inspiring, professional"
    )


# ============================================================================
# TEMPLATE 3: INSTAGRAM SQUARE (1:1, 60 sec)
# ============================================================================

def create_instagram_square_template() -> VideoProject:
    """
    Template voor Instagram feed posts (vierkant formaat).
    Werkt goed op Instagram, Facebook, en LinkedIn.
    """
    config = VideoConfig(
        aspect_ratio="1:1",
        video_model="kling-v1",
        font_size=40,
        caption_position="bottom",
        music_volume=0.18
    )

    scenes = [
        Scene(
            scene_number=1,
            prompt="Eye-catching product shot with dynamic lighting, centered composition",
            narration_text="Ontdek iets nieuws.",
            style="ultra_realistic",
            duration=10.0
        ),
        Scene(
            scene_number=2,
            prompt="Lifestyle scene showing product in use, happy people, bright colors",
            narration_text="Gemaakt voor jouw lifestyle.",
            style="studio_ghibli",
            duration=10.0
        ),
        Scene(
            scene_number=3,
            prompt="Close-up detail shots, premium quality emphasis, luxury feel",
            narration_text="Kwaliteit die je kunt voelen.",
            style="cinematic_drone",
            duration=10.0
        ),
        Scene(
            scene_number=4,
            prompt="Customer testimonial style, genuine reactions, social proof",
            narration_text="Mensen zijn enthousiast.",
            style="documentary",
            duration=10.0
        ),
        Scene(
            scene_number=5,
            prompt="Brand values visualization, company mission, emotional connection",
            narration_text="Omdat we geloven in beter.",
            style="watercolor",
            duration=10.0
        ),
        Scene(
            scene_number=6,
            prompt="Call to action with logo, shop now button, promotional offer",
            narration_text="Bestel nu en ervaar het zelf!",
            style="minimalist",
            duration=10.0
        ),
    ]

    return VideoProject(
        title="Instagram Square",
        description="Vierkante video voor Instagram/Facebook/LinkedIn",
        scenes=scenes,
        config=config,
        music_prompt="Modern lifestyle music, trendy, upbeat, feel-good vibes"
    )


# ============================================================================
# TEMPLATE 4: LONGFORM CONTENT (16:9, 3+ minuten)
# ============================================================================

def create_longform_template() -> VideoProject:
    """
    Template voor langere content (3+ minuten).
    Geschikt voor tutorials, documentaires, educatieve content.

    Let op: Dit vereist meer API calls en credits!
    """
    config = VideoConfig(
        aspect_ratio="16:9",
        video_model="luma-dream-machine",  # Beste kwaliteit voor lange content
        font_size=38,
        caption_position="bottom",
        music_volume=0.10  # Zachter voor lange content
    )

    # 18 scènes van 10 seconden = 3 minuten
    scenes = [
        # INTRO (30 sec)
        Scene(
            scene_number=1,
            prompt="Dramatic opening shot, mysterious atmosphere, building anticipation",
            narration_text="Er is een geheim dat de meesten niet kennen.",
            style="noir",
            duration=10.0
        ),
        Scene(
            scene_number=2,
            prompt="Historical footage style, old photographs coming to life",
            narration_text="Een verhaal dat teruggaat tot het begin.",
            style="vintage_comic",
            duration=10.0
        ),
        Scene(
            scene_number=3,
            prompt="Modern day transition, time lapse from past to present",
            narration_text="Vandaag onthullen we de waarheid.",
            style="documentary",
            duration=10.0
        ),

        # DEEL 1: PROBLEEM (30 sec)
        Scene(
            scene_number=4,
            prompt="Problem visualization, struggling person, obstacles everywhere",
            narration_text="Het probleem waar velen mee worstelen.",
            style="ultra_realistic",
            duration=10.0
        ),
        Scene(
            scene_number=5,
            prompt="Data visualization showing statistics, graphs and charts",
            narration_text="De cijfers liegen niet.",
            style="minimalist",
            duration=10.0
        ),
        Scene(
            scene_number=6,
            prompt="Emotional scene, person feeling overwhelmed, relatable struggle",
            narration_text="Herken je dit gevoel?",
            style="studio_ghibli",
            duration=10.0
        ),

        # DEEL 2: OPLOSSING (60 sec)
        Scene(
            scene_number=7,
            prompt="Lightbulb moment, breakthrough discovery, eureka scene",
            narration_text="Maar er is een oplossing.",
            style="3d_pixar",
            duration=10.0
        ),
        Scene(
            scene_number=8,
            prompt="Step by step process visualization, clear instructions",
            narration_text="Stap één: begin met het fundament.",
            style="documentary",
            duration=10.0
        ),
        Scene(
            scene_number=9,
            prompt="Person following instructions, making progress",
            narration_text="Stap twee: bouw verder.",
            style="ultra_realistic",
            duration=10.0
        ),
        Scene(
            scene_number=10,
            prompt="Advanced techniques demonstration, expert level",
            narration_text="Stap drie: optimaliseer.",
            style="cyberpunk",
            duration=10.0
        ),
        Scene(
            scene_number=11,
            prompt="Common mistakes to avoid, warning signs, what not to do",
            narration_text="Vermijd deze veelgemaakte fouten.",
            style="vintage_comic",
            duration=10.0
        ),
        Scene(
            scene_number=12,
            prompt="Success tips compilation, pro advice, insider knowledge",
            narration_text="Dit zijn de geheimen van de experts.",
            style="synthwave",
            duration=10.0
        ),

        # DEEL 3: RESULTATEN (30 sec)
        Scene(
            scene_number=13,
            prompt="Before and after transformation, dramatic difference",
            narration_text="Kijk naar de resultaten.",
            style="cinematic_drone",
            duration=10.0
        ),
        Scene(
            scene_number=14,
            prompt="Success stories montage, happy people, achievements",
            narration_text="Mensen die het al hebben gedaan.",
            style="documentary",
            duration=10.0
        ),
        Scene(
            scene_number=15,
            prompt="Data showing improvement, charts going up, positive metrics",
            narration_text="De resultaten spreken voor zich.",
            style="minimalist",
            duration=10.0
        ),

        # OUTRO (30 sec)
        Scene(
            scene_number=16,
            prompt="Inspiring conclusion, person standing tall, confidence",
            narration_text="Nu is het jouw beurt.",
            style="cinematic_drone",
            duration=10.0
        ),
        Scene(
            scene_number=17,
            prompt="Community scene, people helping each other, together",
            narration_text="Je hoeft het niet alleen te doen.",
            style="studio_ghibli",
            duration=10.0
        ),
        Scene(
            scene_number=18,
            prompt="Call to action, subscribe animation, next video preview",
            narration_text="Abonneer en bekijk de volgende video voor meer!",
            style="3d_pixar",
            duration=10.0
        ),
    ]

    return VideoProject(
        title="Longform Tutorial",
        description="Lange educatieve video (3 minuten)",
        scenes=scenes,
        config=config,
        music_prompt="Ambient documentary music, subtle, professional, non-distracting"
    )


# ============================================================================
# TEMPLATE 5: PRODUCT SHOWCASE (alle formaten)
# ============================================================================

def create_product_showcase_template(
    aspect_ratio: str = "9:16",
    product_name: str = "Amazing Product",
    product_features: list = None
) -> VideoProject:
    """
    Dynamische template voor product showcases.
    Pas aan naar je eigen product!

    Args:
        aspect_ratio: "16:9", "9:16", of "1:1"
        product_name: Naam van je product
        product_features: Lijst met product features
    """
    if product_features is None:
        product_features = [
            "Premium kwaliteit",
            "Gebruiksvriendelijk",
            "Duurzaam gemaakt"
        ]

    config = VideoConfig(
        aspect_ratio=aspect_ratio,
        video_model="kling-v1",
        font_size=48 if aspect_ratio == "9:16" else 40,
        caption_position="bottom",
        music_volume=0.15
    )

    scenes = [
        Scene(
            scene_number=1,
            prompt=f"Dramatic product reveal, {product_name} emerging from shadow, premium lighting",
            narration_text=f"Maak kennis met {product_name}.",
            style="ultra_realistic",
            duration=10.0
        ),
        Scene(
            scene_number=2,
            prompt=f"Close-up product details, craftsmanship, quality materials, {product_name}",
            narration_text=product_features[0] if product_features else "Ongeëvenaarde kwaliteit.",
            style="cinematic_drone",
            duration=10.0
        ),
        Scene(
            scene_number=3,
            prompt=f"Product in use demonstration, easy to use, intuitive design",
            narration_text=product_features[1] if len(product_features) > 1 else "Makkelijk in gebruik.",
            style="documentary",
            duration=10.0
        ),
        Scene(
            scene_number=4,
            prompt=f"Lifestyle shot, product fitting perfectly in daily life, happy user",
            narration_text=product_features[2] if len(product_features) > 2 else "Past in jouw leven.",
            style="studio_ghibli",
            duration=10.0
        ),
        Scene(
            scene_number=5,
            prompt=f"Customer reactions, satisfied users, five star reviews visualization",
            narration_text="Klanten zijn enthousiast!",
            style="3d_pixar",
            duration=10.0
        ),
        Scene(
            scene_number=6,
            prompt=f"Special offer graphic, limited time deal, buy now button, {product_name}",
            narration_text="Bestel nu met speciale korting!",
            style="synthwave",
            duration=10.0
        ),
    ]

    return VideoProject(
        title=f"{product_name} Showcase",
        description=f"Product showcase video voor {product_name}",
        scenes=scenes,
        config=config,
        music_prompt="Modern commercial music, uplifting, premium brand feel, inspiring"
    )


# ============================================================================
# CUSTOM TEMPLATE BUILDER
# ============================================================================

def build_custom_video(
    title: str,
    scene_data: list,
    aspect_ratio: str = "16:9",
    video_model: str = "kling-v1",
    music_prompt: str = "Background music"
) -> VideoProject:
    """
    Bouw een custom video project van een lijst met scène data.

    Args:
        title: Titel van de video
        scene_data: Lijst met dictionaries:
            [
                {
                    "prompt": "Video prompt beschrijving",
                    "narration": "Voice-over tekst",
                    "style": "ultra_realistic",  # Kies uit VIDEO_STYLES
                    "duration": 10.0
                },
                ...
            ]
        aspect_ratio: "16:9", "9:16", of "1:1"
        video_model: "kling-v1", "kling-v1-5", of "luma-dream-machine"
        music_prompt: Beschrijving voor achtergrondmuziek

    Returns:
        VideoProject klaar voor generatie
    """
    config = VideoConfig(
        aspect_ratio=aspect_ratio,
        video_model=video_model
    )

    scenes = []
    for i, data in enumerate(scene_data):
        scene = Scene(
            scene_number=i + 1,
            prompt=data.get("prompt", ""),
            narration_text=data.get("narration", ""),
            style=data.get("style", "ultra_realistic"),
            duration=data.get("duration", 10.0)
        )
        scenes.append(scene)

    return VideoProject(
        title=title,
        description=f"Custom video: {title}",
        scenes=scenes,
        config=config,
        music_prompt=music_prompt
    )


# ============================================================================
# ALLE BESCHIKBARE STIJLEN TONEN
# ============================================================================

def print_available_styles():
    """Print alle beschikbare visuele stijlen."""
    print("\n📎 BESCHIKBARE VISUELE STIJLEN:")
    print("-" * 50)
    for key, description in VIDEO_STYLES.items():
        print(f"  • {key}")
        print(f"    {description}")
        print()


# ============================================================================
# VOORBEELD GEBRUIK
# ============================================================================

if __name__ == "__main__":
    print("Video Templates - Voorbeelden")
    print("=" * 50)

    # Toon beschikbare stijlen
    print_available_styles()

    # Voorbeeld: maak een custom video
    print("\n📹 VOORBEELD: Custom Video Bouwen")
    print("-" * 50)

    my_scenes = [
        {
            "prompt": "Beautiful sunset over the ocean, waves crashing",
            "narration": "De natuur is onze grootste inspiratie.",
            "style": "cinematic_drone",
            "duration": 10.0
        },
        {
            "prompt": "Person meditating on a cliff, peaceful atmosphere",
            "narration": "Neem een moment voor jezelf.",
            "style": "studio_ghibli",
            "duration": 10.0
        },
        {
            "prompt": "Futuristic city at night, neon lights reflecting",
            "narration": "De toekomst begint vandaag.",
            "style": "cyberpunk",
            "duration": 10.0
        }
    ]

    project = build_custom_video(
        title="Mijn Custom Video",
        scene_data=my_scenes,
        aspect_ratio="9:16",
        music_prompt="Relaxing ambient music with soft beats"
    )

    print(f"Project aangemaakt: {project.title}")
    print(f"Aantal scènes: {len(project.scenes)}")
    print(f"Aspect ratio: {project.config.aspect_ratio}")
    print(f"Totale duur: {sum(s.duration for s in project.scenes)} seconden")

    print("\nOm deze video te genereren, run:")
    print("  from ai_video_generator import generate_complete_video")
    print("  generate_complete_video(project)")
