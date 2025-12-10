# 📍 .env Bestand Locatie - WritGo Project

## 🚨 Huidige Situatie

### Gevonden .env Bestanden

| Locatie | Status | Beschrijving |
|---------|--------|-------------|
| `/home/ubuntu/writgo_planning_app/nextjs_space/.env` | ❌ **ONTBREEKT** | **Correcte locatie** waar Next.js naar zoekt |
| `/home/ubuntu/writgo_planning_app/nextjs_space/nextjs_space/.env` | ⚠️ **VERKEERD** | Nested directory (geen goede locatie) |
| `/home/ubuntu/writgo_planning_app/nextjs_space/.env.example` | ✅ **OK** | Template bestand met placeholders |
| `/home/ubuntu/writgo_planning_app/nextjs_space/.env.originality` | 📄 **INFO** | Specifieke API config |

### Probleem

Je **productie .env bestand ontbreekt** op de correcte locatie. De app draait waarschijnlijk met environment variables die zijn ingesteld in:
- Deployment systeem (PM2, systemd, etc.)
- Server environment variables
- Docker/container configuratie
- Of een andere deployment tool

## ✅ Oplossing: Creëer Nieuwe .env

### Optie 1: Handmatig Creëren (Aanbevolen)

```bash
cd /home/ubuntu/writgo_planning_app/nextjs_space

# Kopieer template
cp .env.example .env

# Bewerk met je credentials
nano .env
```

### Optie 2: Van Bestaande Nested .env

```bash
cd /home/ubuntu/writgo_planning_app/nextjs_space

# Kopieer van nested locatie
cp nextjs_space/.env .env

# Voeg ontbrekende variabelen toe
nano .env
```

## 📝 Benodigde Environment Variables

### 1. Database (VERPLICHT)

```bash
# Huidige database (Reai.io hosted)
DATABASE_URL="postgresql://role_660998b92:PASSWORD@db-660998b92.db002.hosteddb.reai.io:5432/660998b92"

# Of nieuwe Supabase database
DATABASE_URL="postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

### 2. NextAuth (VERPLICHT)

```bash
NEXTAUTH_URL="https://writgoai.nl"
NEXTAUTH_SECRET="your-secret-here"

# Genereer nieuwe secret:
# openssl rand -base64 32
```

### 3. AI APIs (VERPLICHT voor content generatie)

```bash
# AIML API (Claude + Images)
AIML_API_KEY="your-aiml-key"
AIML_API_BASE_URL="https://api.aimlapi.com/v1"

# Abacus AI (fallback)
ABACUSAI_API_KEY="your-abacus-key"
```

### 4. Stripe (VERPLICHT voor betalingen)

```bash
# ⚠️ BELANGRIJK: Genereer NIEUWE keys (oude zijn gecompromitteerd)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Stripe Price IDs
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_BUSINESS_PRICE_ID="price_..."
```

### 5. AWS S3 (VERPLICHT voor file uploads)

```bash
AWS_PROFILE="hosted_storage"
AWS_REGION="us-west-2"
AWS_BUCKET_NAME="your-bucket"
AWS_FOLDER_PREFIX="uploads/"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
```

### 6. Google OAuth (OPTIONEEL - voor Google SSO)

```bash
# ⚠️ BELANGRIJK: Genereer NIEUWE credentials (oude zijn gecompromitteerd)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
```

### 7. Bol.com (OPTIONEEL - voor affiliate links)

```bash
BOLCOM_CLIENT_ID="your-bolcom-client-id"
BOLCOM_CLIENT_SECRET="your-bolcom-client-secret"
```

### 8. Overige APIs (OPTIONEEL)

```bash
# ElevenLabs (text-to-speech)
ELEVENLABS_API_KEY="sk_..."

# Vadoo (video)
VADOO_API_KEY="..."

# Late.dev
LATE_DEV_API_KEY="sk_..."

# DataForSEO
DATAFORSEO_USERNAME="your-username"
DATAFORSEO_PASSWORD="your-password"

# Google Search Console
GOOGLE_SEARCH_CONSOLE_CLIENT_ID="..."

# Cron Secret
CRON_SECRET="writgo-content-automation-secret-2025"
```

## 🛠️ Template .env Bestand

Ik heb een kant-en-klare template gemaakt:

```bash
# Gebruik deze command om .env aan te maken
cd /home/ubuntu/writgo_planning_app/nextjs_space
cp .env.example .env
```

Dan vul je de volgende variabelen in:

1. **DATABASE_URL** - Je database connection string
2. **NEXTAUTH_SECRET** - Genereer met `openssl rand -base64 32`
3. **AIML_API_KEY** - Van https://aimlapi.com/
4. **STRIPE keys** - Van https://dashboard.stripe.com/apikeys
5. **AWS credentials** - Van je AWS console

## 🔍 Huidige Productie Environment

### Waar Draait Je App?

Om te achterhalen waar je app draait en waar environment variables vandaan komen:

```bash
# Check PM2 (process manager)
pm2 list
pm2 env 0  # Check env vars van eerste process

# Check systemd service
sudo systemctl list-units | grep writgo
sudo systemctl cat writgo  # Als service bestaat

# Check Docker
docker ps | grep writgo
docker inspect <container_id>

# Check environment variables
env | grep -E "DATABASE|NEXTAUTH|STRIPE|AIML"
```

### Productie Deployment

Als je app live draait op writgoai.nl, dan zijn environment variables waarschijnlijk ingesteld via:

1. **Abacus.AI Deployment System**
   - Environment variables zijn waarschijnlijk geconfigureerd in deployment setup
   - Check deployment dashboard voor environment configuration

2. **Server Environment**
   - Variables zijn direct op de server ingesteld
   - Check `/etc/environment` of systemd service files

3. **Docker/Container**
   - Variables zijn in Docker compose of container config

## 🔒 Security Best Practices

### ⚠️ KRITISCH: Gecompromitteerde Credentials

De volgende credentials zijn geëxposeerd via GitHub en MOETEN worden vervangen:

1. **Stripe Keys**
   - Ga naar: https://dashboard.stripe.com/apikeys
   - Delete oude keys
   - Genereer nieuwe Secret + Publishable keys

2. **Google OAuth**
   - Ga naar: https://console.cloud.google.com/apis/credentials
   - Delete oude OAuth Client ID
   - Creëer nieuwe credentials

3. **NextAuth Secret**
   - Genereer nieuwe: `openssl rand -base64 32`
   - Update in .env

4. **API Keys**
   - AIML API: Regenereer op https://aimlapi.com/
   - ElevenLabs: Regenereer op https://elevenlabs.io/
   - Andere keys: Check respective services

### .env Beveiliging

```bash
# Set correct permissions
chmod 600 /home/ubuntu/writgo_planning_app/nextjs_space/.env

# Verify niet in Git
cd /home/ubuntu/writgo_planning_app
git ls-files | grep "\.env$"
# Moet leeg zijn!

# Check .gitignore
grep "\.env" .gitignore
# Moet .env bevatten
```

## ✅ Verificatie Checklist

Na het aanmaken van .env:

- [ ] .env bestand bestaat op `/home/ubuntu/writgo_planning_app/nextjs_space/.env`
- [ ] DATABASE_URL is ingevuld (werkende database)
- [ ] NEXTAUTH_SECRET is gegenereerd
- [ ] AIML_API_KEY is ingevuld
- [ ] STRIPE keys zijn ingevuld (NIEUWE keys!)
- [ ] AWS credentials zijn ingevuld
- [ ] File permissions zijn 600 (`chmod 600 .env`)
- [ ] .env is NIET in Git (`git ls-files | grep .env` is leeg)
- [ ] App kan opstarten (`yarn dev` werkt lokaal)

## 🚀 Testing

### Lokaal Testen

```bash
cd /home/ubuntu/writgo_planning_app/nextjs_space

# Check of .env wordt geladen
yarn dev

# In andere terminal:
curl http://localhost:3000/api/health

# Test database connectie
yarn prisma studio
```

### Productie Deployment

```bash
# Build app
cd /home/ubuntu/writgo_planning_app/nextjs_space
yarn build

# Als build succesvol:
# - Update .env op productie server
# - Restart app (PM2/systemd/Docker)
# - Test https://writgoai.nl
```

## 📚 Handige Commands

```bash
# Bekijk .env (gemaskeerd)
cat nextjs_space/.env | sed 's/=.*/=***MASKED***/g'

# Kopieer .env naar backup
cp nextjs_space/.env nextjs_space/.env.backup.$(date +%Y%m%d)

# Vind alle .env bestanden
find . -name ".env*" -type f | grep -v node_modules

# Check welke env vars Next.js ziet
cd nextjs_space && yarn next info

# Genereer nieuwe NextAuth secret
openssl rand -base64 32
```

## ❓ FAQ

### Waar is mijn huidige database URL?

De huidige database draait op:
```
postgresql://role_660998b92:PASSWORD@db-660998b92.db002.hosteddb.reai.io:5432/660998b92
```

Als je het wachtwoord niet meer weet, check:
1. Oude backups van .env
2. Deployment dashboard
3. Password manager
4. Contact database hosting provider

### Moet ik alles opnieuw configureren?

Nee, alleen:
1. **VERPLICHT**: Database, NextAuth, AIML API
2. **VERPLICHT (security)**: Nieuwe Stripe keys, nieuwe Google OAuth
3. **OPTIONEEL**: Andere services (Bol.com, ElevenLabs, etc.)

### Kan ik de oude .env ergens vinden?

Mogelijk in:
- Deployment dashboard (Abacus.AI)
- Server environment files
- PM2/systemd configuration
- Docker compose files
- Oude backups op je lokale machine

### Help, mijn app werkt niet meer!

```bash
# Check logs
cd /home/ubuntu/writgo_planning_app/nextjs_space
yarn dev 2>&1 | tee debug.log

# Common issues:
# 1. DATABASE_URL incorrect
# 2. NEXTAUTH_SECRET ontbreekt
# 3. AIML_API_KEY incorrect
# 4. Permissions probleem (.env niet readable)

# Fix permissions:
chmod 600 .env

# Verify .env format (no spaces around =)
cat .env | grep -v "^#" | grep "="
```

---

## 📦 Template Generator

Wil je snel een werkende .env? Run:

```bash
cd /home/ubuntu/writgo_planning_app/nextjs_space

# Generate from template
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://"

# NextAuth
NEXTAUTH_URL="https://writgoai.nl"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# AIML API
AIML_API_KEY=""
AIML_API_BASE_URL="https://api.aimlapi.com/v1"

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# AWS S3
AWS_PROFILE="hosted_storage"
AWS_REGION="us-west-2"
AWS_BUCKET_NAME=""
AWS_FOLDER_PREFIX="uploads/"
EOF

# Edit to add your values
nano .env
```

Dan vul je alleen de lege strings in!

---

**Need help?** Check de .env.example file of neem contact op!
