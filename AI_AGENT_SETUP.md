# 🤖 AI Agent Module - Complete Setup Guide

## 📋 Overzicht

Dit document beschrijft hoe je de volledige AI Agent module voor WritGo.nl instelt. Dit is een **Manus.im-achtig systeem** waar je een persoonlijke AI Virtual Assistant krijgt die taken voor je uitvoert.

---

## ✅ Wat is er gebouwd?

### **Frontend (WritGo.nl Dashboard)**
- ✅ `/dashboard/ai-agent` - Main dashboard
- ✅ `/dashboard/ai-agent/chat` - ChatGPT-style interface
- ✅ `/dashboard/ai-agent/templates` - Playbook library
- ✅ `/dashboard/ai-agent/tasks` - Task history
- ✅ `/dashboard/ai-agent/browser` - Live browser viewer (placeholder)
- ✅ `/dashboard/ai-agent/credentials` - Credential vault (placeholder)
- ✅ Navigation toegevoegd aan sidebar

### **Backend API**
- ✅ `/api/agent/chat` - Chat with AI agent
- ✅ `/api/agent/tasks` - Create and manage tasks
- ✅ `/api/agent/templates` - Manage playbooks
- ✅ `/api/agent/webhook` - Receive results from VPS
- ✅ `/api/agent/credentials` - Manage credentials

### **Database Schema**
- ✅ `agent_tasks` - Task tracking
- ✅ `agent_templates` - Playbook library
- ✅ `agent_sessions` - Execution logs
- ✅ `agent_credentials` - Encrypted credentials
- ✅ `agent_chat_messages` - Chat history
- ✅ 5 default templates (GSC report, competitor monitor, price monitor, WordPress publish, social media)

---

## 🚀 Stap 1: Database Migration Draaien

De AI Agent module heeft nieuwe database tables nodig. Volg deze stappen:

### **Optie A: Via Supabase Dashboard (AANBEVOLEN)**

1. Ga naar https://supabase.com/dashboard
2. Selecteer je WritGo.nl project
3. Ga naar **SQL Editor** in de sidebar
4. Klik op **New Query**
5. Open het bestand: `supabase/migrations/20251226_ai_agent_module.sql`
6. Kopieer de volledige inhoud
7. Plak in de SQL Editor
8. Klik op **Run** (RUN knop rechtsonder)
9. Wacht tot "Success. No rows returned" verschijnt

### **Verificatie**

Run deze query in SQL Editor om te checken of het gelukt is:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN (
  'agent_tasks',
  'agent_templates',
  'agent_sessions',
  'agent_credentials',
  'agent_chat_messages'
);
```

Je moet 5 tabellen zien! ✅

---

## 🔐 Stap 2: Environment Variables Toevoegen

Voeg deze variabelen toe aan je `.env.local` bestand:

```bash
# AI Agent Configuration
AGENT_WEBHOOK_SECRET=your-random-secret-key-change-this-123456
CREDENTIALS_ENCRYPTION_KEY=your-32-byte-encryption-key-here!!

# Optional: VPS API (later needed)
VPS_API_URL=https://your-vps-ip:3000
VPS_API_SECRET=your-vps-api-secret
```

**Genereer veilige keys:**

```bash
# Voor AGENT_WEBHOOK_SECRET (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Voor CREDENTIALS_ENCRYPTION_KEY (moet exact 32 bytes zijn)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 🧪 Stap 3: Test de UI

1. Start de dev server:
   ```bash
   npm run dev
   ```

2. Login op WritGo.nl

3. Klik op **🦾 AI Agent** in de sidebar

4. Test de volgende pagina's:
   - ✅ Dashboard: `/dashboard/ai-agent`
   - ✅ Chat: `/dashboard/ai-agent/chat`
   - ✅ Templates: `/dashboard/ai-agent/templates`

5. Test de chat:
   - Type: "Check de top 10 search queries van Google Search Console"
   - Agent moet antwoorden met een voorstel
   - Klik op "Yes, do it!" om een task aan te maken

**Expected behavior:**
- Chat interface werkt ✅
- Agent genereert task proposal ✅
- Task wordt aangemaakt in database ✅
- Task verschijnt in task list (maar execute nog niet want VPS is er nog niet)

---

## 🖥️ Stap 4: VPS Setup (Toekomstig)

**BELANGRIJK:** De VPS setup is nog NIET geïmplementeerd. Dit komt in de volgende fase.

### **Requirements:**

#### **Minimum VPS Specs:**
- **RAM:** 4 GB (minimaal voor browser automation)
- **vCPU:** 2 cores
- **Storage:** 100 GB NVMe
- **OS:** Ubuntu 22.04 LTS

#### **Aanbevolen VPS Specs (voor productie):**
- **RAM:** 8 GB (voor 2-3 concurrent tasks)
- **vCPU:** 4 cores
- **Storage:** 150 GB NVMe

### **VPS Architectuur (Toekomstig)**

```
┌─────────────────────────────────────────┐
│  VPS (Ubuntu 22.04)                     │
│                                          │
│  🐳 Docker Engine                       │
│  ├─ gVisor (container sandboxing)      │
│  └─ Docker Compose                      │
│                                          │
│  📦 Agent Runtime Container             │
│  ├─ Python 3.11                         │
│  ├─ Playwright + Chromium               │
│  ├─ noVNC (browser streaming)           │
│  ├─ Claude API client                   │
│  └─ WebSocket server                    │
│                                          │
│  🔧 Task Queue Worker (Node.js)         │
│  ├─ Receives tasks from WritGo.nl      │
│  ├─ Spawns Docker containers            │
│  ├─ Manages task lifecycle              │
│  └─ Sends results via webhook           │
│                                          │
└─────────────────────────────────────────┘
         ▲                    │
         │ HTTPS API          │ Webhook
         │                    ▼
┌─────────────────────────────────────────┐
│  WritGo.nl (Next.js + Supabase)        │
│  /api/agent/* endpoints                 │
└─────────────────────────────────────────┘
```

### **Software Stack (VPS):**
- **Docker** + **Docker Compose**
- **gVisor** (voor container isolation)
- **Playwright** (browser automation)
- **noVNC** (voor live browser viewing)
- **Python 3.11** (agent runtime)
- **Node.js 20** (task queue worker)
- **Redis** (optional, voor task queue)
- **Nginx** (reverse proxy + SSL)

### **Wat de VPS doet:**
1. ✅ Ontvangt task van WritGo.nl via API call
2. ✅ Spawnt Docker container (isolated environment)
3. ✅ Container draait Playwright + Chrome
4. ✅ Agent voert task uit (browser automation, API calls, etc.)
5. ✅ Logt elke actie + screenshots
6. ✅ Stuurt resultaten terug via webhook naar WritGo.nl
7. ✅ Container wordt destroyed na voltooiing

---

## 🎯 Wat werkt NU al?

### ✅ **Volledig Werkend:**
1. **UI/UX** - Complete dashboard interface
2. **Chat** - Real-time chat met AI agent
3. **Templates** - 5 default templates klaar
4. **Database** - Alle tables en relaties
5. **API** - Alle endpoints voor task management
6. **Navigation** - AI Agent in sidebar

### ⏳ **Nog Te Implementeren:**

#### **Fase 2: VPS Setup** (1-2 dagen)
- [ ] VPS server opzetten (Ubuntu + Docker)
- [ ] Docker containers bouwen (Python + Playwright)
- [ ] noVNC setup voor browser streaming
- [ ] WebSocket server voor live updates
- [ ] Task executor implementeren
- [ ] Webhook integration testen

#### **Fase 3: Browser Automation** (2-3 dagen)
- [ ] Playwright scripts schrijven
- [ ] Browser session management
- [ ] Screenshot systeem
- [ ] Cookie persistence
- [ ] Error handling

#### **Fase 4: Credential Management** (1 dag)
- [ ] OAuth flows (Google, WordPress)
- [ ] Browser session login flow
- [ ] Credential vault UI
- [ ] Encryption/decryption implementeren

#### **Fase 5: Advanced Features** (1-2 weken)
- [ ] Scheduled tasks (cron jobs)
- [ ] Multi-step workflows
- [ ] Agent learning (success/failure tracking)
- [ ] Cost optimization (model selection)
- [ ] Advanced playbooks

---

## 💰 Kosten Inschatting

### **Huidige WritGo.nl Credit Systeem:**
Je kunt je bestaande credit systeem gebruiken:

```typescript
// Voeg toe aan /lib/credit-costs.ts
export const CREDIT_COSTS = {
  // ... existing costs ...

  // AI Agent costs
  AGENT_TASK_SIMPLE: 2,      // API calls, data processing
  AGENT_TASK_BROWSER: 5,     // Browser automation
  AGENT_TASK_COMPLEX: 10,    // Multi-step workflows
  AGENT_PLAYBOOK_RUN: 1,     // Run saved playbook
};
```

### **VPS Kosten (maandelijks):**
- **4GB VPS:** €10-20/maand (Hetzner, DigitalOcean, Vultr)
- **8GB VPS:** €20-40/maand (aanbevolen voor productie)

### **API Kosten (ongeveer per task):**
- **Claude Sonnet 4.5:** €0.003 - €0.015 per task
- **Totaal per task:** ~€0.01 - €0.05

**ROI:** Met 250 credits/maand (Pro plan) kun je ~50-125 agent tasks draaien.
**Alternatief:** Echte VA kost €500-2000/maand → je bespaart €450-1950/maand! 💰

---

## 📊 Database Schema

### **agent_tasks**
```sql
id              UUID PRIMARY KEY
user_id         UUID (FK to auth.users)
project_id      UUID (FK to projects)
title           TEXT
description     TEXT
prompt          TEXT (full agent prompt)
status          TEXT (queued, running, completed, failed, cancelled)
priority        TEXT (low, normal, high)
result_data     JSONB (output data)
result_files    TEXT[] (URLs to generated files)
error_message   TEXT
started_at      TIMESTAMP
completed_at    TIMESTAMP
duration_seconds INTEGER
credits_used    INTEGER
```

### **agent_templates**
```sql
id                 UUID PRIMARY KEY
user_id            UUID (FK to auth.users)
name               TEXT
description        TEXT
category           TEXT (research, ecommerce, content, admin)
icon               TEXT (emoji)
prompt_template    TEXT
variables          JSONB (template variables)
is_scheduled       BOOLEAN
schedule_cron      TEXT (cron expression)
usage_count        INTEGER
is_public          BOOLEAN
is_system          BOOLEAN (built-in templates)
```

### **agent_sessions**
```sql
id              UUID PRIMARY KEY
task_id         UUID (FK to agent_tasks)
user_id         UUID (FK to auth.users)
container_id    TEXT (Docker container ID)
vnc_url         TEXT (live browser stream URL)
activity_log    JSONB (step-by-step actions)
screenshots     TEXT[] (screenshot URLs)
current_url     TEXT
is_active       BOOLEAN
ended_at        TIMESTAMP
```

### **agent_credentials**
```sql
id                  UUID PRIMARY KEY
user_id             UUID (FK to auth.users)
service_name        TEXT (wordpress, google, etc.)
service_type        TEXT (oauth, api_key, password, session)
encrypted_data      TEXT (AES-256-GCM encrypted)
encryption_iv       TEXT
encryption_tag      TEXT
oauth_access_token  TEXT
session_expires_at  TIMESTAMP
is_valid            BOOLEAN
```

### **agent_chat_messages**
```sql
id              UUID PRIMARY KEY
user_id         UUID (FK to auth.users)
task_id         UUID (FK to agent_tasks)
role            TEXT (user, agent, system)
content         TEXT
action_required BOOLEAN
action_type     TEXT
action_data     JSONB
created_at      TIMESTAMP
```

---

## 🎨 Default Templates

5 templates worden automatisch aangemaakt:

1. **📊 Daily GSC Report**
   Haalt Google Search Console data op en maakt PDF

2. **🎯 Competitor Content Monitor**
   Checkt nieuwe blog posts van concurrenten

3. **💎 Bol.com Price Monitor**
   Monitort productprijzen op Bol.com

4. **📝 WordPress Bulk Publisher**
   Publiceert alle drafts naar WordPress

5. **✨ Social Media Content Generator**
   Genereert social posts vanuit laatste blog

---

## 🔧 Troubleshooting

### **Migration fails**
```
ERROR: relation "agent_tasks" already exists
```
**Oplossing:** Tables bestaan al. Run deze query om te verifiëren:
```sql
SELECT * FROM agent_tasks LIMIT 1;
```

### **Chat stuurt geen messages**
**Check:**
1. Is AI API key ingesteld? (`AIML_API_KEY`)
2. Check browser console voor errors
3. Check `/api/agent/chat` logs

### **Templates verschijnen niet**
**Oplossing:** Run de INSERT statements opnieuw uit de migration file (vanaf regel "INSERT INTO agent_templates...")

### **Navigation menu werkt niet**
**Check:** Is de DashboardLayout.tsx correct ge-update? State `agentMenuOpen` moet bestaan.

---

## 📚 Volgende Stappen

### **Optie 1: VPS Setup Starten**
Als je je VPS wilt upgraden naar 4-8GB RAM:
1. Upgrade VPS
2. Laat me weten als je klaar bent
3. Ik bouw de VPS agent runtime

### **Optie 2: Lightweight Versie**
Als je bij 1GB RAM blijft:
1. Ik bouw een versie ZONDER browser automation
2. Alleen API calls en data processing
3. Langzamer maar werkt op 1GB

### **Optie 3: Hybrid Model**
1. WritGo.nl doet lightweight taken
2. Serverless functions (Vercel/AWS Lambda) voor browser automation
3. VPS alleen voor networking

---

## 🤔 Vragen?

**Wat werkt er nu?**
- ✅ Complete UI (chat, templates, tasks)
- ✅ Database schema
- ✅ API endpoints
- ⏳ VPS execution (nog niet gebouwd)

**Heb ik een VPS nodig?**
- Voor browser automation: **Ja** (4-8GB RAM)
- Voor alleen API calls: **Nee** (kan op WritGo.nl server)

**Kan ik dit testen zonder VPS?**
- ✅ UI testen: Ja
- ✅ Chat testen: Ja
- ✅ Tasks aanmaken: Ja
- ❌ Tasks uitvoeren: Nee (needs VPS)

**Hoeveel kost het?**
- VPS 4GB: ~€15/maand
- VPS 8GB: ~€30/maand
- API calls: ~€0.01-0.05 per task

---

## ✅ Checklist

- [ ] Database migration gedraaid
- [ ] Environment variables toegevoegd
- [ ] Dev server gestart
- [ ] UI getest (chat, templates)
- [ ] Task aangemaakt via chat
- [ ] VPS specs gekozen
- [ ] Klaar voor VPS setup

---

**Gebouwd:** 2025-12-26
**Versie:** 1.0.0
**Status:** Phase 1 Complete (UI + API) ✅ | Phase 2 Pending (VPS Setup) ⏳
