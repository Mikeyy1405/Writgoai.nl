# 🚀 Deployment Guide - TransIP VPS

## WritGo.nl AI Agent op TransIP VPS

Deze guide helpt je de AI Agent runtime deployen op jullie **TransIP VPS** met **AIML API**.

---

## ✅ Voordelen TransIP + AIML API

### **TransIP VPS**
- 🇳🇱 Nederlandse datacenter (sneller voor NL users)
- 💰 Goede prijs/kwaliteit
- 🔒 GDPR compliant
- 📞 Nederlandse support

### **AIML API**
- 🎯 **100+ models** via één API endpoint
- 💰 **Pay-as-you-go** pricing
- 🚀 Claude, GPT, Llama, Mistral, DeepSeek, Gemini, etc.
- 🔄 Easy model switching zonder code changes
- 📊 Usage dashboard en analytics

---

## 📋 Requirements

### **Minimum TransIP VPS Specs:**
- **RAM:** 4 GB (voor browser automation)
- **vCPU:** 2 cores
- **Storage:** 50 GB SSD
- **OS:** Ubuntu 22.04 LTS

**Aanbevolen TransIP VPS:** **BladeVPS X4** (4GB RAM, 2 cores) - €15/maand

### **Accounts Nodig:**
- ✅ TransIP VPS account (jullie hebben dit al)
- ✅ AIML API account → https://aimlapi.com
- ✅ SSH access naar je VPS

---

## 🔑 Stap 1: AIML API Key Ophalen

1. Ga naar https://aimlapi.com
2. Sign up / Log in
3. Dashboard → **API Keys**
4. Klik **Create New API Key**
5. Kopieer de key (bewaar veilig!)

**Voorbeeld:** `sk_aiml_1234567890abcdef...`

---

## 🖥️ Stap 2: SSH naar TransIP VPS

```bash
# SSH naar je TransIP VPS
ssh root@your-vps-ip.transip.nl

# Of via TransIP control panel: VPS → Console
```

---

## 🐳 Stap 3: Installeer Docker

```bash
# Update system
apt update && apt upgrade -y

# Installeer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installeer Docker Compose
apt install docker-compose -y

# Verificeer installatie
docker --version
docker-compose --version

# Start Docker service
systemctl start docker
systemctl enable docker
```

---

## 📥 Stap 4: Clone Repository

```bash
# Installeer Git als nodig
apt install git -y

# Clone je WritGo.nl repository
git clone https://github.com/your-org/writgo.git
cd writgo/vps-agent

# Of upload via SCP/SFTP als je geen Git hebt
```

---

## ⚙️ Stap 5: Configureer Environment

```bash
# Kopieer environment template
cp .env.example .env

# Edit met nano of vim
nano .env
```

Vul in:

```bash
# AIML API Key (van stap 1)
AIML_API_KEY=sk_aiml_jouw_api_key_hier

# WritGo.nl Integration
WRITGO_API_URL=https://writgo.nl
WRITGO_WEBHOOK_SECRET=genereer_een_random_secret_32_chars

# Agent Configuration
MAX_ITERATIONS=50
SANDBOX_TIMEOUT=300
MODEL_ROUTING=true

# Models (defaults zijn goed, aanpassen optioneel)
DEFAULT_MODEL=claude-3-5-sonnet-20241022
MODEL_COMPLEX=claude-3-opus-20240229
MODEL_FAST=claude-3-5-haiku-20241022
MODEL_CODING=deepseek-ai/DeepSeek-Coder-V2-Instruct
```

**Genereer een veilig webhook secret:**
```bash
# Op je VPS:
openssl rand -hex 32
# Kopieer output → WRITGO_WEBHOOK_SECRET
```

**Opslaan:** Ctrl+O, Enter, Ctrl+X

---

## 🏗️ Stap 6: Build Docker Images

```bash
# In vps-agent/ directory

# 1. Build sandbox image (dit duurt ~5-10 minuten eerste keer)
docker build -t writgo-agent-sandbox -f Dockerfile.sandbox .

# 2. Build main agent image
docker build -t writgo-agent-runtime -f Dockerfile .

# Verificeer images
docker images | grep writgo
# Je moet zien:
# - writgo-agent-sandbox
# - writgo-agent-runtime
```

---

## 🚀 Stap 7: Start Agent Services

```bash
# Start met Docker Compose
docker-compose up -d

# Check of het draait
docker-compose ps

# Bekijk logs
docker-compose logs -f agent

# Als alles goed is zie je:
# "WritGo.nl AI Agent VPS Runtime"
# "Starting FastAPI server on http://0.0.0.0:8000"
```

---

## 🔍 Stap 8: Test de Agent

```bash
# Health check
curl http://localhost:8000/health

# Expected output:
{
  "status": "healthy",
  "version": "1.0.0",
  "sandbox_ready": true
}
```

Als `sandbox_ready: false` → Docker is niet correct geïnstalleerd.

---

## 🌐 Stap 9: Setup Nginx Reverse Proxy (Aanbevolen)

### **Waarom Nginx?**
- SSL/HTTPS support
- Domain naam (agent.writgo.nl)
- Better security
- Port 80/443 i.p.v. 8000

```bash
# Installeer Nginx
apt install nginx -y

# Create config
nano /etc/nginx/sites-available/writgo-agent
```

Plak in:

```nginx
server {
    listen 80;
    server_name agent.writgo.nl;  # Of je subdomain

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts voor long-running tasks
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
    }
}
```

Enable en test:

```bash
# Enable site
ln -s /etc/nginx/sites-available/writgo-agent /etc/nginx/sites-enabled/

# Test config
nginx -t

# Restart Nginx
systemctl restart nginx

# Enable on boot
systemctl enable nginx
```

### **DNS Setup (TransIP)**

1. Ga naar TransIP Control Panel
2. Domains → je domein (writgo.nl)
3. DNS → Add record:
   - **Type:** A
   - **Name:** agent (of subdomain naar keuze)
   - **Value:** Je VPS IP adres
   - **TTL:** 3600

Wacht 5-10 minuten voor DNS propagation.

### **SSL Certificate (Let's Encrypt)**

```bash
# Installeer Certbot
apt install certbot python3-certbot-nginx -y

# Generate certificate
certbot --nginx -d agent.writgo.nl

# Volg de prompts:
# - Email: je@email.nl
# - Agree to TOS: Yes
# - Redirect HTTP to HTTPS: Yes (aanbevolen)

# Auto-renewal is automatisch geconfigureerd!
```

Test: `https://agent.writgo.nl/health`

---

## 🔗 Stap 10: Configureer WritGo.nl

In je WritGo.nl `.env.local`:

```bash
# VPS Agent Configuration
VPS_ENABLED=true
VPS_API_URL=https://agent.writgo.nl  # Of je URL
VPS_API_SECRET=<SAME-AS-WRITGO_WEBHOOK_SECRET-FROM-VPS>

# Let op: VPS_API_SECRET moet EXACT hetzelfde zijn als
# WRITGO_WEBHOOK_SECRET op de VPS!
```

Restart WritGo.nl:

```bash
npm run build
# Deploy naar productie
```

---

## ✅ Stap 11: End-to-End Test

1. **Ga naar WritGo.nl** → `/dashboard/ai-agent/chat`

2. **Test simpele task:**
   ```
   "Calculate the first 10 Fibonacci numbers"
   ```

3. **Check VPS logs:**
   ```bash
   # Op VPS:
   docker-compose logs -f agent

   # Je moet zien:
   # - "Received task ..."
   # - "Starting agent execution..."
   # - "Using model: claude-3-5-sonnet-20241022"
   # - "Task ... completed successfully"
   ```

4. **Check WritGo.nl:**
   - Task status → "completed"
   - Results visible in UI

**Success!** 🎉

---

## 🔥 Firewall Setup (Security)

```bash
# Installeer UFW firewall
apt install ufw -y

# Allow SSH (BELANGRIJK!)
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Deny direct access to port 8000 (agent is achter Nginx)
ufw deny 8000/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## 📊 Monitoring & Logs

### **Logs bekijken**

```bash
# Live logs
docker-compose logs -f agent

# Laatste 100 regels
docker-compose logs --tail=100 agent

# Log files op disk
tail -f logs/agent.log
```

### **System Resources**

```bash
# Docker stats
docker stats

# Disk usage
df -h

# Memory usage
free -h

# CPU usage
top
```

### **Automatic Restart on Crash**

Docker Compose is geconfigureerd met `restart: unless-stopped` dus de agent start automatisch opnieuw bij crash of reboot.

---

## 🔄 Updates Deployen

```bash
# SSH naar VPS
ssh root@your-vps-ip

cd /path/to/writgo/vps-agent

# Pull latest code
git pull origin main

# Rebuild images
docker-compose build

# Restart services
docker-compose up -d

# Verify
curl http://localhost:8000/health
```

---

## 💰 Kosten Overzicht

### **TransIP VPS:**
- BladeVPS X4 (4GB): **€15/maand**
- BladeVPS X8 (8GB): **€30/maand** (aanbevolen productie)

### **AIML API Pricing:**

| Model | Input Cost | Output Cost | Typical Task |
|-------|-----------|-------------|--------------|
| Claude Opus | $15/M tokens | $75/M tokens | €0.01-0.05 |
| Claude Sonnet | $3/M tokens | $15/M tokens | €0.003-0.015 |
| Claude Haiku | $0.25/M tokens | $1.25/M tokens | €0.0003-0.002 |
| DeepSeek Coder | $0.14/M tokens | $0.28/M tokens | €0.0001-0.001 |
| Llama 3.3 70B | $0.59/M tokens | $0.79/M tokens | €0.0005-0.003 |

**Met multi-model routing:** Gemiddeld ~€0.005-0.02 per task

### **Totaal voor 100 tasks/maand:**
- VPS: €15
- API: €0.50-2.00
- **Total: ~€17/maand**

vs. **Echte VA:** €500-2000/maand → **97% besparing!** 🎯

---

## 🐛 Troubleshooting

### **Agent start niet**

```bash
# Check logs
docker-compose logs agent

# Common issues:
# - AIML_API_KEY niet ingesteld
# - Docker niet geïnstalleerd
# - Port 8000 al in gebruik
```

### **Sandbox timeout**

```bash
# Verhoog timeout in .env
SANDBOX_TIMEOUT=600  # 10 minuten

# Restart
docker-compose restart agent
```

### **Out of memory**

```bash
# Check memory
free -h

# Upgrade TransIP VPS naar 8GB
# Of verhoog Docker limits in docker-compose.yml
```

### **Task blijft in "running" stuck**

```bash
# Restart agent
docker-compose restart agent

# Reset task in WritGo.nl database:
UPDATE agent_tasks
SET status='failed', error_message='Timeout - manually reset'
WHERE id='task-id-here';
```

---

## 📞 Support

**TransIP Support:**
- Tel: 0887 000 700
- Email: support@transip.nl
- Control panel: https://www.transip.nl/cp/

**AIML API Support:**
- Discord: https://discord.gg/aimlapi
- Docs: https://docs.aimlapi.com
- Email: support@aimlapi.com

**WritGo.nl Agent:**
- GitHub issues
- Check logs eerst
- Deployment docs

---

## ✅ Deployment Checklist

- [ ] TransIP VPS account actief (4GB+ RAM)
- [ ] AIML API account + key
- [ ] Docker geïnstalleerd op VPS
- [ ] Repository gecloned
- [ ] .env geconfigureerd (AIML_API_KEY, WRITGO_WEBHOOK_SECRET)
- [ ] Docker images gebuild
- [ ] Agent draait (`docker-compose ps`)
- [ ] Health check OK (`curl http://localhost:8000/health`)
- [ ] Nginx geïnstalleerd en geconfigureerd
- [ ] DNS record aangemaakt (agent.writgo.nl)
- [ ] SSL certificate geïnstalleerd
- [ ] Firewall geconfigureerd (UFW)
- [ ] WritGo.nl .env.local updated (VPS_ENABLED=true)
- [ ] End-to-end test geslaagd
- [ ] Monitoring setup (logs, resources)

---

## 🎉 Klaar!

Je hebt nu een **volledig werkende AI Agent runtime** op TransIP VPS met AIML API!

**Voordelen van deze setup:**
- ✅ Nederlandse datacenter (sneller + GDPR)
- ✅ Toegang tot 100+ AI models
- ✅ Cost-effective (model routing bespaart geld)
- ✅ Schaalbaar (upgrade VPS als nodig)
- ✅ Secure (SSL, firewall, isolated containers)

**Veel succes! 🚀**
