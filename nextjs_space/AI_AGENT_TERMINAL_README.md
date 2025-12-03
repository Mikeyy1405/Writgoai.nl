# AI Agent Terminal + Brain System

## 🧠 Overzicht

Een krachtige AI Agent Terminal voor admins om taken uit te voeren via een chat interface. Het systeem heeft toegang tot 400+ AI modellen via de AIML API en kan automatisch het beste model selecteren voor elke taak.

## 🎯 Functionaliteit

### Agent Terminal (`/dashboard/agent`)
- **Terminal-style chat interface**: Dark theme, real-time feedback
- **Streaming responses**: Live updates van agent antwoorden
- **Tool execution**: Visuele feedback tijdens tool gebruik
- **Message history**: Volledige conversatie geschiedenis
- **Keyboard shortcuts**: Cmd/Ctrl + Enter voor snelle invoer

### AI Brain System
- **Claude Opus 4.5 Orchestrator**: Intelligent agent brein
- **Function Calling**: Automatische tool selectie en uitvoering
- **Smart Model Routing**: Kiest beste model per taak
- **400+ Model Registry**: Complete database met alle AIML modellen

## 📁 Structuur

```
lib/ai-brain/
├── index.ts           # Main orchestrator met Claude Opus 4.5
├── models.ts          # 400+ model registry met metadata
├── model-router.ts    # Intelligente model selectie
├── tools.ts           # Tool definities voor function calling
└── tool-executor.ts   # Tool uitvoering tegen database/APIs

app/api/agent/
├── chat/route.ts      # Streaming chat API
└── models/route.ts    # Models lijst API

app/dashboard/agent/
└── page.tsx           # Agent terminal pagina

components/agent/
├── agent-terminal.tsx    # Main terminal component
├── agent-message.tsx     # User/agent berichten
├── tool-execution.tsx    # Tool uitvoering status
└── model-selector.tsx    # Model keuze dropdown
```

## 🤖 Beschikbare Tools

De AI agent heeft toegang tot deze tools:

### Klant Beheer
- `get_clients`: Zoek en lijst klanten
- `get_client_details`: Haal klant details op
- `update_autopilot`: Activeer/deactiveer autopilot

### Content Generatie
- `generate_article`: Genereer SEO blog artikel
- `generate_video_script`: Maak video script
- `generate_image`: Genereer afbeelding met AI
- `generate_content_plan`: Maak content plan

### WordPress
- `get_wordpress_posts`: Haal WordPress posts op
- `publish_to_wordpress`: Publiceer naar WordPress

### Administratie
- `create_invoice`: Maak factuur
- `send_email`: Verstuur email naar klant
- `get_assignments`: Haal opdrachten op
- `update_assignment`: Update opdracht status

### Analytics & Research
- `get_analytics`: Haal statistieken op
- `search_database`: Zoek in database

### AI Modellen
- `list_models`: Toon beschikbare modellen
- `run_model`: Voer specifiek model uit

## 🎨 Model Categories

### Chat / LLM Models (20+)
**Premium:**
- GPT-5.1 (400K context, reasoning)
- Claude Opus 4.5 (beste reasoning)
- Claude Sonnet 4.5 (beste code)
- Gemini 3 Pro (1M context, Deep Think)

**Budget:**
- GPT-5 Mini (snel, goedkoop)
- Gemini 2.5 Flash (1M context)
- DeepSeek V3 (extreem goedkoop)
- Llama 4 Scout (512K context)

### Image Generation (7)
- FLUX 1 Pro (fotorealistisch)
- DALL-E 3 (beste tekst)
- Ideogram V3 (tekst in images)
- Recraft V3 (logos & design)
- Midjourney (artistiek)

### Video Generation (5)
- Luma Ray 2 (fotorealistisch)
- Runway Gen-3 Turbo (snel)
- Kling Video V2 (betaalbaar)

### Voice / TTS (3)
- ElevenLabs (beste Nederlands)
- OpenAI TTS HD
- Cartesia Sonic (ultra-snel)

### Audio (3)
- Whisper Large V3 (transcriptie)
- Suno V4 (muziek met vocals)
- MiniMax Music

### Embeddings (2)
- OpenAI Text Embedding 3

### Moderation (2)
- OpenAI Omni Moderation
- Llama Guard 3

## 🎯 Smart Model Routing

Het systeem kiest automatisch het beste model per taak:

### Task Types & Best Models

| Task | Best Model | Fallback | Budget |
|------|------------|----------|--------|
| orchestrate | Claude Opus 4.5 | GPT-5.1 | - |
| blog_long | Claude Sonnet 4.5 | GPT-5.1 | DeepSeek V3 |
| blog_short | GPT-5 Mini | Haiku 3.5 | DeepSeek V3 |
| social_post | GPT-4o Mini | Gemini Flash | DeepSeek V3 |
| video_script | GPT-5.1 | Sonnet 4.5 | - |
| code_generate | Claude Sonnet 4.5 | GPT-5.1 | Qwen Coder |
| code_debug | Claude Opus 4.5 | DeepSeek R1 | DeepSeek R1 |
| image_realistic | FLUX 1 Pro | DALL-E 3 | FLUX Schnell |
| image_logo | Ideogram V3 | Recraft V3 | - |
| voice_nl | ElevenLabs | OpenAI TTS | - |
| research | Grok 4.1 Fast | Opus 4.5 | DeepSeek R1 |

### Routing Opties

```typescript
selectBestModel({
  task: 'blog_long',
  language: 'nl',
  priority: 'quality',  // of 'speed', 'cost'
  maxBudget: 2.0,       // max cents per 1k tokens
  minQuality: 4,        // min quality score (1-5)
})
```

## 🔧 Setup

### 1. Environment Variables

Voeg toe aan `.env`:

```env
# AIML API - 400+ AI Models
AIML_API_KEY=your-aiml-api-key
AIML_API_URL=https://api.aimlapi.com/v1
```

### 2. AIML API Key Verkrijgen

1. Ga naar https://aimlapi.com
2. Maak een account aan
3. Genereer een API key
4. Plak in `.env`

### 3. Database (Optioneel)

Voor conversation history, voeg toe aan `prisma/schema.prisma`:

```prisma
model AgentConversation {
  id        String   @id @default(cuid())
  userId    String
  messages  Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Run migration:
```bash
npx prisma migrate dev
```

## 💬 Gebruik

### Via UI
1. Navigeer naar `/dashboard/agent`
2. Type een opdracht, bijvoorbeeld:
   - "Genereer 5 blogs voor Bakkerij Jansen"
   - "Zoek alle actieve klanten"
   - "Maak een factuur voor klant X"
   - "Toon beschikbare AI modellen voor images"

### Via API

#### Chat Request
```typescript
POST /api/agent/chat

{
  "messages": [
    { "role": "user", "content": "Zoek klant Bakkerij Jansen" }
  ],
  "stream": true  // optioneel
}
```

#### Tool Execution
```typescript
POST /api/agent/chat

{
  "messages": [...],
  "toolCalls": [
    {
      "id": "call_123",
      "name": "get_clients",
      "parameters": { "search": "Bakkerij" },
      "status": "pending"
    }
  ]
}
```

#### List Models
```typescript
GET /api/agent/models?category=chat
GET /api/agent/models?provider=OpenAI
GET /api/agent/models?search=gpt
```

## 🎨 Components

### AgentTerminal
Main terminal interface met:
- Message history
- Tool execution feedback
- Input met keyboard shortcuts
- Auto-scroll

### AgentMessage
Displays user/agent messages met:
- Markdown rendering
- Code highlighting
- Avatar icons

### ToolExecution
Shows tool status met:
- Real-time updates
- Collapsible details
- Status indicators

### ModelSelector
Dropdown voor model keuze met:
- Grouped by category
- Model info tooltip
- Cost/quality/speed display

## 🔒 Security

### Authentication
- Alleen admins hebben toegang
- Session check via NextAuth
- Role-based access (admin/superadmin)

### API Security
- Server-side AIML API key
- Input validation
- Error handling
- Rate limiting (TODO)

## 📊 Kosten Optimalisatie

### Budget Models
Voor bulk taken, gebruik budget models:
- **DeepSeek V3**: €0.05/1k input, €0.20/1k output
- **Llama 4 Scout**: €0.20/1k input, €0.80/1k output
- **Gemini 2.5 Flash**: €0.10/1k input, €0.40/1k output

### Cost Estimation
```typescript
import { estimateCost } from '@/lib/ai-brain/model-router';

const model = selectBestModel({ task: 'blog_long' });
const cost = estimateCost(model, 1000, 2000);
console.log(`Estimated cost: $${cost.toFixed(2)}`);
```

## 🚀 Performance

### Streaming
- Real-time response streaming
- Tool execution feedback
- Progressive rendering

### Model Selection
- Automatic task detection
- Priority-based routing
- Budget constraints

### Caching (TODO)
- Response caching
- Tool result caching
- Model metadata caching

## 🔍 Troubleshooting

### AIML API Errors
```
Error: AIML API key is missing
→ Check .env file en AIML_API_KEY
```

```
Error: Model not found
→ Check model ID in models.ts
→ Verify AIML API supports model
```

### Tool Execution Errors
```
Error: Client not found
→ Verify client ID exists
→ Check database connection
```

### UI Not Loading
```
Error: Cannot reach /dashboard/agent
→ Check authentication
→ Verify role is admin/superadmin
```

## 📚 Voorbeelden

### Content Generatie
```
"Genereer 5 blogs over broodsoorten voor Bakkerij Jansen"
→ Agent:
  1. Zoekt klant "Bakkerij Jansen"
  2. Genereert 5 blog topics
  3. Gebruikt Claude Sonnet 4.5 voor elk artikel
  4. Toont voortgang per blog
```

### Klant Beheer
```
"Toon alle klanten met actieve subscription"
→ Agent:
  1. Gebruikt get_clients tool
  2. Filtert op subscriptionStatus: 'active'
  3. Toont lijst met klant details
```

### Analytics
```
"Geef me statistieken van deze maand"
→ Agent:
  1. Gebruikt get_analytics met period: 'month'
  2. Toont totaal klanten, actieve klanten, etc.
  3. Genereert samenvatting
```

## 🛠️ Development

### Add New Tool
1. Voeg tool toe aan `lib/ai-brain/tools.ts`
2. Implementeer executor in `lib/ai-brain/tool-executor.ts`
3. Test via terminal

### Add New Model
1. Voeg model toe aan `lib/ai-brain/models.ts`
2. Update routing in `lib/ai-brain/model-router.ts`
3. Test via model selector

## 📝 TODO

- [ ] Add conversation history persistence
- [ ] Implement response caching
- [ ] Add rate limiting
- [ ] Create admin dashboard for usage stats
- [ ] Add more tools (CRM, marketing, etc.)
- [ ] Implement multi-turn tool execution
- [ ] Add file upload support
- [ ] Create API documentation
- [ ] Add unit tests
- [ ] Performance monitoring

## 📖 Resources

- [AIML API Docs](https://docs.aimlapi.com)
- [Claude Function Calling](https://docs.anthropic.com/claude/docs/functions-external-tools)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Model Comparison](https://artificialanalysis.ai)

## 🎉 Credits

Built with:
- Next.js 14
- TypeScript
- AIML API
- Claude Opus 4.5
- Tailwind CSS
- Radix UI
