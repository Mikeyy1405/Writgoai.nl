
# 🤖 WritgoAI Slimme AI Agent - Complete Implementatie

## ✅ Wat is Geïmplementeerd

Je AI agent heeft nu **3 krachtige systemen** die samenwerken:

### 1️⃣ **Tool Calling Orchestration** - Meerdere tools combineren
De agent kan automatisch meerdere tools achter elkaar gebruiken:
- Database queries (client info, content, automation status)
- Web search (actuele informatie via AI modellen)
- Content generation (blogs, social media, video scripts)
- Platform management (WordPress, YouTube, TikTok, Instagram)

**Voorbeeld werkflow:**
```
Gebruiker: "Maak een content plan voor volgende week"
↓
Agent denkt:
1. Eerst client info ophalen
2. Huidige content checken
3. Trends onderzoeken
4. Content plan genereren
↓
Voert uit:
- getClientInfo(clientId)
- getClientContent(clientId)
- webSearch("content trends in [niche]")
- generateContentPlan(clientId, 7 dagen)
↓
Resultaat: Compleet 7-daags content plan met blog, social en video ideeën
```

### 2️⃣ **Reasoning Chains** - Stap-voor-stap denken
De agent denkt na VOORDAT hij acties uitvoert:
- Analyseert de gebruikersvraag
- Bepaalt welke tools nodig zijn
- Plant de uitvoering
- Voert stappen uit in de juiste volgorde
- Combineert alle resultaten tot een compleet antwoord

**Voorbeeld reasoning:**
```json
{
  "reasoning": [
    {
      "step": 1,
      "thought": "Gebruiker wil content status zien",
      "action": "getAutomationStatus tool gebruiken"
    },
    {
      "step": 2,
      "thought": "Daarna recente content ophalen",
      "action": "getClientContent met filter"
    },
    {
      "step": 3,
      "thought": "Combineer stats en content overzicht",
      "action": "Maak een duidelijk dashboard"
    }
  ]
}
```

### 3️⃣ **Database Queries** - Volledige toegang tot alle data
De agent heeft toegang tot:
- **Client info**: naam, bedrijf, website, automation settings
- **Content pieces**: blogs, social posts, reels (gepubliceerd en draft)
- **Automation status**: actief/inactief, planning, statistics
- **Connected platforms**: WordPress, YouTube, TikTok, Instagram status
- **Content planning**: 7/30-daags plans, thema's, keywords

---

## 🛠️ Beschikbare Tools

### Database Tools
| Tool | Beschrijving |
|------|-------------|
| `getClientInfo` | Client informatie (naam, bedrijf, automation settings) |
| `getClientContent` | Gegenereerde content (blogs, social, reels) |
| `getAutomationStatus` | Automation status en statistieken |
| `getConnectedPlatforms` | Connected platforms (WordPress, socials) |
| `updateAutomationSettings` | Update automation instellingen |

### Web Search Tools
| Tool | Beschrijving |
|------|-------------|
| `webSearch` | Zoek actuele informatie op het web |
| `competitorResearch` | Analyseer concurrenten en strategieën |
| `trendResearch` | Onderzoek actuele trends |

### Content Generation Tools
| Tool | Beschrijving |
|------|-------------|
| `generateContentPlan` | Genereer compleet content plan (7/30 dagen) |
| `generateContentPiece` | Genereer compleet content piece (blog + social + reel) |

---

## 🎯 AI Modellen - 300+ Beschikbaar

De agent gebruikt **AIML API** met intelligente model routing:

### Premium Modellen (beste kwaliteit)
- **GPT-5** (400K context)
- **GPT-4o** (128K context)
- **Claude 3.5 Sonnet** (200K context)
- **Claude 3.5 Opus** (200K context)
- **Gemini 2.5 Pro** (1M context!) 🔥

### Balanced Modellen (prijs/kwaliteit)
- **DeepSeek R1** - Beste reasoning/prijs ratio 🔥
- **Llama 4 Scout** (256K context)
- **Qwen Max** - Excellent voor Nederlands
- **Grok 4** - Humor + reasoning

### Budget Modellen (goedkoop)
- **GPT-4o-mini**
- **Claude 3 Haiku**
- **Gemini 1.5 Flash**

### Intelligente Routing
De agent kiest **automatisch** het beste model per taak:
- **Blog schrijven** → Claude 3.5 Sonnet (beste voor lange content)
- **Social media** → GPT-4o (beste voor short-form)
- **Planning** → DeepSeek R1 (beste reasoning)
- **Research** → Gemini 2.5 Pro (1M context!)
- **Chat** → GPT-4o-mini (snel + goedkoop)

---

## 🚀 Hoe Te Gebruiken

### 1. In de Client Portal
Ga naar `/client-portal` en gebruik de AI agent:
```
"Maak een blog over [topic]"
"Laat mijn content planning zien"
"Wat zijn de trends over [topic]?"
"Genereer content voor dag 3"
```

### 2. Direct via API
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Wat kan je voor me doen?",
    "clientId": "client-id",
    "conversationHistory": []
  }'
```

### 3. Response Format
```json
{
  "success": true,
  "message": "Hier is wat ik voor je gevonden heb...",
  "reasoning": [
    {"step": 1, "thought": "...", "action": "..."}
  ],
  "toolsUsed": ["getClientInfo", "webSearch"],
  "toolResults": ["getClientInfo", "webSearch"],
  "timestamp": "2025-10-24T12:30:00.000Z"
}
```

---

## ⚙️ Configuratie

### Environment Variables
```env
AIML_API_KEY=your-aiml-api-key
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
```

### AIML API Credits Toevoegen
1. Ga naar https://aimlapi.com/app/billing
2. Voeg payment method toe
3. Koop credits (zeer betaalbaar!)

**Pricing:**
- GPT-4o: ~$2.50 per 1M tokens
- Claude 3.5: ~$3 per 1M tokens
- DeepSeek R1: ~$0.50 per 1M tokens (!) 🔥
- Gemini Pro: ~$1.25 per 1M tokens

---

## 🎨 UI Features

### AI Agent Chat Interface
- **Real-time chat** met de AI agent
- **Reasoning visibility** - zie hoe de agent denkt
- **Tool execution feedback** - zie welke tools gebruikt worden
- **Conversation history** - context behouden over berichten
- **Loading states** - "Analyzing your request...", "Executing tools..."

### Visual Feedback
```
🧠 Reasoning: Agent denkt stap-voor-stap
🔧 Tools gebruikt: getClientInfo, webSearch
✅ [Tool name] succeeded
❌ [Tool name] failed: [error]
```

---

## 📁 Bestandsstructuur

```
lib/
├── aiml-agent.ts           # AI model routing + 300+ modellen
├── agent-tools.ts          # Tool calling + orchestration
└── [other libs]

app/api/
├── chat/
│   └── route.ts           # Main agent chat API
└── client-auth/
    └── session/
        └── route.ts       # Client session info

components/
└── writgo-deep-agent.tsx  # AI chat UI component
```

---

## 🧪 Testing

### Test de Agent
```bash
# Start dev server
cd /home/ubuntu/writgo_planning_app/nextjs_space
yarn dev

# Test chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "conversationHistory": []}'
```

### Test Specifieke Tools
```javascript
import * as agentTools from '@/lib/agent-tools';

// Test client info
const info = await agentTools.getClientInfo('client-id');

// Test web search
const search = await agentTools.webSearch('AI trends 2025');

// Test content generation
const plan = await agentTools.generateContentPlan('client-id', {
  days: 7,
  theme: 'AI automation'
});
```

---

## 🎯 Voorbeeld Workflows

### Workflow 1: Content Plan Genereren
```
User: "Maak een content plan voor deze week"
↓
Agent reasoning:
1. Haal client info op (doelgroep, keywords, brand voice)
2. Check huidige automation status
3. Onderzoek trends in de niche
4. Genereer 7-daags plan met blogs + social + reels
↓
Tools:
- getClientInfo(clientId)
- getAutomationStatus(clientId)  
- trendResearch(industry, 'Instagram')
- generateContentPlan(clientId, 7)
↓
Output: "Hier is je 7-daags content plan..."
```

### Workflow 2: Content Status Check
```
User: "Hoe staat het ervoor met mijn content?"
↓
Agent reasoning:
1. Haal automation status op
2. Haal recente content pieces op
3. Check connected platforms
4. Maak overzicht
↓
Tools:
- getAutomationStatus(clientId)
- getClientContent(clientId, { limit: 10 })
- getConnectedPlatforms(clientId)
↓
Output: "Je hebt 15 content pieces, waarvan 8 gepubliceerd..."
```

### Workflow 3: Trend Research + Content
```
User: "Maak een blog over AI trends"
↓
Agent reasoning:
1. Zoek actuele AI trends
2. Analyseer wat viral gaat
3. Haal client keywords op
4. Genereer blog met actuele info
↓
Tools:
- webSearch("AI trends 2025")
- trendResearch("AI", "LinkedIn")
- getClientInfo(clientId)
- generateBlog("AI trends 2025", keywords)
↓
Output: "Hier is je blog met de laatste AI trends..."
```

---

## 🔥 Volgende Stappen

De AI agent is **volledig functioneel**! Wat je nog kunt toevoegen:

1. **WordPress auto-publish** - Blogs direct publiceren
2. **Social media posting** - Via Late.dev API
3. **Video generation** - Via Vadoo API
4. **Analytics tracking** - Performance monitoring
5. **A/B testing** - Verschillende content varianten
6. **Multi-language** - Content in meerdere talen

---

## 💡 Pro Tips

1. **Model tier instellen**
```javascript
import { setModelTier } from '@/lib/aiml-agent';
setModelTier('premium'); // of 'balanced' / 'budget'
```

2. **Custom tool maken**
```javascript
// In agent-tools.ts
export async function myCustomTool(param1, param2) {
  // Your logic
  return { success: true, result: ... };
}

// Voeg toe aan AVAILABLE_TOOLS
```

3. **Conversation context**
De agent onthoudt de laatste 5 berichten voor context.

---

## 🎊 Conclusie

Je hebt nu een **enterprise-grade AI agent** met:
- ✅ Tool calling orchestration
- ✅ Reasoning chains
- ✅ Database access
- ✅ 300+ AI modellen
- ✅ Web search capabilities
- ✅ Content generation
- ✅ Intelligent model routing

**De agent is klaar voor productie!** 🚀

---

**Vragen? Problemen?**
Check de logs voor debugging:
```bash
# Terminal logs tonen reasoning + tool execution
console.log output toont alle stappen
```
