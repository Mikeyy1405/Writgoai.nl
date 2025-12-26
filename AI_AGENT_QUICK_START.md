# 🚀 AI Agent Quick Start - Jouw Setup

## ✅ Wat je NU moet doen (3 stappen)

### **STAP 1: Database Migration** (2 minuten)

1. Open https://supabase.com/dashboard
2. Selecteer je WritGo.nl project
3. Klik **SQL Editor** (links in menu)
4. Klik **New Query**
5. Kopieer de SQL uit `supabase/migrations/20251226_ai_agent_module.sql`
6. Plak in editor
7. Klik **RUN**

**Verificatie:**
```sql
SELECT * FROM agent_templates;
```
Je moet 5 templates zien! ✅

---

### **STAP 2: Environment Variables** (1 minuut)

Voeg toe aan `.env.local`:

```bash
# Genereer keys eerst:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Dan voeg toe aan .env.local:
AGENT_WEBHOOK_SECRET=<output-van-eerste-command>
CREDENTIALS_ENCRYPTION_KEY=<output-van-tweede-command>

# Je Render VPS URL (vul in wat je hebt)
VPS_API_URL=https://your-render-vps.onrender.com
VPS_API_SECRET=<genereer-ook-een-secret>

# Voor nu, VPS disabled (zet op true als VPS executor klaar is)
VPS_ENABLED=false
```

---

### **STAP 3: Test de App** (5 minuten)

```bash
npm run dev
```

1. Open http://localhost:3000/dashboard
2. Klik **🦾 AI Agent** in sidebar
3. Klik **💬 Chat**
4. Type: "Check de top 10 queries van Google Search Console"
5. Agent (Claude Opus!) moet antwoorden met task proposal
6. Klik "Yes, do it!"
7. Task wordt aangemaakt ✅

---

## ✅ Wat WERKT nu:

- ✅ Complete UI (dashboard, chat, templates)
- ✅ Chat met **Claude Opus 4.5** (niet Sonnet!)
- ✅ Task aanmaken via chat
- ✅ 5 default templates
- ✅ Database tracking
- ⏳ Task execution (needs VPS - komt later)

---

## 📊 Jouw VPS Setup (Render)

Je hebt al een VPS op Render staan! Perfect. Nu moet je beslissen:

### **Optie 1: Upgrade Render VPS** (AANBEVOLEN)
Huidige specs waarschijnlijk te laag voor browser automation.

**Upgrade naar:**
- **4GB RAM** (minimaal) - ~$15/maand
- **8GB RAM** (aanbevolen) - ~$30/maand

**Wat je krijgt:**
- Browser automation (Playwright + Chrome)
- Live browser viewing (noVNC)
- Screenshots + session replay
- Multi-step workflows
- 2-5 concurrent tasks

### **Optie 2: Blijf bij huidige specs** (LIGHTWEIGHT)
Ik bouw een versie ZONDER browser automation:
- ✅ API calls
- ✅ Data processing
- ✅ Simple workflows
- ❌ Geen browser scraping
- ❌ Geen screenshots

---

## 🎯 Render VPS URL Instellen

Jouw VPS URL staat al in env (zo te horen). Voeg deze toe:

```bash
# In .env.local (WritGo.nl)
VPS_API_URL=https://your-app.onrender.com
VPS_API_SECRET=your-secret-key

# Later op je VPS (Render environment variables):
WRITGO_API_URL=https://writgo.nl
WRITGO_WEBHOOK_SECRET=<zelfde-als-AGENT_WEBHOOK_SECRET>
```

---

## 📝 Wat ik voor je gewijzigd heb:

### ✅ Claude Opus 4.5 in Chat
```typescript
// app/api/agent/chat/route.ts - regel 172
model: 'claude-opus-4.5',  // WAS: claude-sonnet-4.5
max_tokens: 4000,           // WAS: 2000 (Opus heeft meer capaciteit)
```

### ✅ VPS Environment Variables
```bash
VPS_API_URL=...        # Je Render VPS URL
VPS_API_SECRET=...     # Authenticatie tussen WritGo <-> VPS
VPS_ENABLED=false      # Zet op true als VPS executor klaar is
```

---

## 🔄 Git Commit

Alles is al gepushed naar branch `claude/ai-agent-tasks-ahQ0L`:

```bash
# Check status:
git log -1

# Je ziet:
# Add complete AI Agent module to WritGo.nl
# - Claude Opus 4.5 chat
# - VPS configuration
# - 5 default templates
# - Complete UI + API
```

---

## ❓ Volgende Stap - JIJ KIEST:

**A) Test UI nu**
→ Run migration + env vars + `npm run dev` + test chat

**B) VPS Executor bouwen**
→ Vertel me je Render VPS specs + ik bouw de Docker container

**C) Lightweight versie (geen browser)**
→ Werkt met huidige VPS specs, maar geen scraping

**D) Vragen**
→ Ask away!

---

## 💡 Tips:

1. **Chat met Opus werkt direct** na migration + env vars
2. **Templates zijn al live** na migration
3. **Task execution** werkt pas na VPS setup
4. **VPS specs checken:** Ga naar Render dashboard → je service → Instance Type

---

## 🐛 Troubleshooting

### Migration faalt
```sql
-- Check of tables al bestaan:
SELECT tablename FROM pg_tables
WHERE tablename LIKE 'agent_%';

-- Als tables bestaan, gooi weg en run opnieuw:
DROP TABLE IF EXISTS agent_chat_messages CASCADE;
DROP TABLE IF EXISTS agent_sessions CASCADE;
DROP TABLE IF EXISTS agent_credentials CASCADE;
DROP TABLE IF EXISTS agent_tasks CASCADE;
DROP TABLE IF EXISTS agent_templates CASCADE;
```

### Chat werkt niet
- Check AIML_API_KEY in .env.local
- Check browser console voor errors
- Test: curl http://localhost:3000/api/agent/chat

### Templates verschijnen niet
- Run alleen het INSERT deel van migration opnieuw
- Check: `SELECT * FROM agent_templates;`

---

**Klaar? Run die 3 stappen en laat me weten wat je kiest: A, B, C of D!** 🚀
