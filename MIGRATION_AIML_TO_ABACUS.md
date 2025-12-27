# Migratie van AIML API naar Abacus.AI RouteLLM

## Overzicht

WritGO.ai is volledig gemigreerd van AIML API naar **Abacus.AI RouteLLM API**. Deze migratie biedt toegang tot 500+ AI modellen via één unified API met automatische routing voor kostenoptimalisatie.

## Voordelen van Abacus.AI RouteLLM

✅ **500+ Modellen**: Toegang tot alle populaire modellen (Claude, GPT, Gemini, Llama, etc.)
✅ **Automatische Routing**: RouteLLM selecteert automatisch het beste model op basis van je prompt
✅ **Kostenoptimalisatie**: Intelligente routing bespaart tot 85% op API kosten
✅ **OpenAI Compatible**: Volledige OpenAI SDK compatibiliteit
✅ **Hoge Uptime**: Automatische failover tussen providers
✅ **Betaalbaar**: $10/maand voor ChatLLM subscription met 20K credits

## Wat is er veranderd?

### Environment Variabelen

**Oud:**
```env
AIML_API_KEY=your-aiml-api-key
```

**Nieuw:**
```env
ABACUS_API_KEY=your-abacus-api-key
```

### API Base URLs

- **Oud**: `https://api.aimlapi.com/v1`
- **Nieuw**: `https://api.abacus.ai/api/v0`

### Bestandsnamen

De volgende bestanden zijn hernoemd:
- `lib/aiml-api-client.ts` → `lib/abacus-api-client.ts`
- `lib/aiml-image-generator.ts` → `lib/abacus-image-generator.ts`

### Code Imports

**Oud:**
```typescript
import { generateVideo } from '@/lib/aiml-api-client';
import { generateImage } from '@/lib/aiml-image-generator';
```

**Nieuw:**
```typescript
import { generateVideo } from '@/lib/abacus-api-client';
import { generateImage } from '@/lib/abacus-image-generator';
```

## Migratie Instructies

### Stap 1: API Key Verkrijgen

1. Ga naar [Abacus.AI](https://abacus.ai)
2. Meld je aan en subscribe op **ChatLLM** ($10/maand)
3. Klik op het **RouteLLM API** icoon linksonder
4. Kopieer je API key

### Stap 2: Environment Variabelen Updaten

Update je `.env.local` bestand:

```env
# Verwijder of comment out
# AIML_API_KEY=your-old-key

# Voeg toe
ABACUS_API_KEY=your-abacus-api-key
```

### Stap 3: Code is Al Gemigreerd

Alle code in deze repository is al gemigreerd. Je hoeft alleen:
1. Je API key aan te passen
2. De applicatie opnieuw te starten

### Stap 4: Verifieer de Migratie

Test de volgende functionaliteiten:
- ✅ Artikel generatie
- ✅ Beeld generatie
- ✅ Video generatie (Video Studio)
- ✅ Social media posts
- ✅ Content enhancement

## Technische Details

### Aangepaste Bestanden

**Core Library:**
- `lib/ai-client.ts` - Hoofd AI client (OpenAI compatible)
- `lib/abacus-api-client.ts` - Video/Voice/Music generatie
- `lib/abacus-image-generator.ts` - Beeld generatie
- `lib/ai-discovery.ts` - Content discovery
- `lib/ai-article-generator.ts` - Artikel generatie

**API Routes:**
- Alle API routes in `app/api/` die AI modellen gebruiken
- Video Studio routes
- WordPress integratie routes
- Social media routes

**Configuration:**
- `.env.example` - Voorbeeld configuratie
- `.env.local.example` - Lokale voorbeeld configuratie

### Backward Compatibility

Het systeem heeft fallback ondersteuning:
```typescript
const apiKey = process.env.ABACUS_API_KEY ||
               process.env.ANTHROPIC_API_KEY ||
               process.env.OPENAI_API_KEY || '';
```

## Beschikbare Modellen

Via Abacus.AI RouteLLM heb je toegang tot:

### Tekst Modellen
- Claude 4.5 Sonnet, Opus, Haiku
- GPT-4o, GPT-4o Mini, O1, O3 Mini
- Gemini 2.0/2.5 Flash, Pro
- DeepSeek V3, R1
- Llama 3.3, 4.0
- Qwen Max, Plus, Turbo
- En vele anderen...

### Beeld Modellen
- Flux Pro/v1.1/Ultra
- Flux Realism
- Flux Schnell

### Video Modellen
- MiniMax Hailuo
- OpenAI Sora 2
- Runway Gen-3/4
- Kling Video
- PixVerse
- En meer...

### Voice/Audio Modellen
- ElevenLabs Multilingual v2
- ElevenLabs Turbo v2.5
- Stable Audio
- MiniMax Music

## Pricing

**ChatLLM Subscription**: $10/maand
- 20,000 credits included
- Closed-source models: Provider pricing (OpenAI, Anthropic, etc.)
- Open-source models: Best available price wereldwijd
- Credits worden proportioneel per call afgetrokken

## Support & Documentatie

- **Abacus.AI API Docs**: https://abacus.ai/help/api/ref
- **RouteLLM FAQ**: https://routellm-apis.abacus.ai/routellm_apis_faq
- **ChatLLM**: https://chatllm.abacus.ai/

## Sources

Deze migratie is gebaseerd op de volgende bronnen:
- [Abacus.AI RouteLLM APIs](https://routellm-apis.abacus.ai/routellm_apis_faq)
- [API Reference](https://abacus.ai/help/api/ref)
- [RouteLLM API Documentation](https://abacus.ai/help/api/ref/routellm)

## Troubleshooting

### API Key Niet Gevonden

**Fout:** `AI API key not configured`

**Oplossing:**
1. Controleer of `ABACUS_API_KEY` is ingesteld in `.env.local`
2. Herstart de development server
3. Check of er geen typo's zijn in de env var naam

### 401 Authentication Error

**Fout:** `AI API authentication failed`

**Oplossing:**
1. Verifieer dat je API key correct is
2. Check of je ChatLLM subscription actief is
3. Genereer eventueel een nieuwe API key

### 429 Rate Limit

**Fout:** `AI API rate limit exceeded`

**Oplossing:**
1. Check je credit balance op Abacus.AI
2. Overweeg upgrade van je subscription
3. Implementeer rate limiting in je applicatie

### Model Niet Beschikbaar

**Fout:** `Model not found or not available`

**Oplossing:**
1. Check beschikbare modellen via RouteLLM API docs
2. Gebruik alternatief model uit dezelfde categorie
3. RouteLLM kan automatisch failover naar beschikbaar model

## Vragen?

Voor vragen over deze migratie, open een issue in de GitHub repository.
