# 🚀 Supabase Migratie - Quick Start

## TL;DR - In 5 Stappen

### 1. Maak Supabase Account (5 min)

1. Ga naar https://supabase.com/dashboard
2. Sign up gratis
3. Klik **New Project**:
   - Name: `writgo-production`
   - Password: [kies sterk wachtwoord]
   - Region: **West EU (Ireland)**
4. Wacht 2 minuten

### 2. Verkrijg Connection String (2 min)

1. In Supabase: **Settings** → **Database**
2. Kopieer **Connection string** (Nodejs)
3. Vervang `[YOUR-PASSWORD]` met je password
4. Save als:
   ```
   postgresql://postgres:YOUR_PASS@db.xxx.supabase.co:5432/postgres
   ```

### 3. Run Migratie Script (15 min)

```bash
cd /home/ubuntu/writgo_planning_app

# Maak script executable
chmod +x scripts/migrate_to_supabase.sh

# Run migratie
./scripts/migrate_to_supabase.sh

# Volg de prompts:
# - Plak Supabase URL
# - Wacht tot migratie klaar is
```

### 4. Test Lokaal (10 min)

```bash
cd nextjs_space
yarn dev

# Open http://localhost:3000
# Test:
# - Login
# - Content generatie
# - Admin functies
```

### 5. Deploy naar Productie (5 min)

```bash
# Update .env op productie server
# Voeg toe:
DATABASE_URL="postgresql://postgres:PASS@db.xxx.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://postgres:PASS@db.xxx.supabase.co:5432/postgres"

# Rebuild & restart
yarn build
pm2 restart writgo-app
```

## ✅ Checklist

- [ ] Supabase account aangemaakt
- [ ] Project in EU region
- [ ] Connection string verkregen
- [ ] Migratie script gerund
- [ ] Lokaal getest
- [ ] Productie .env updated
- [ ] App deployed
- [ ] Oude database bewaard (backup)

## 🚨 Rollback (indien nodig)

```bash
# Restore oude .env
cp nextjs_space/.env.backup.XXXXXX nextjs_space/.env

# Restart app
pm2 restart writgo-app
```

## 📊 Voordelen

- ✅ **Gratis tier**: 500 MB database
- ✅ **EU hosting**: GDPR compliant
- ✅ **Auto backups**: Op Pro plan
- ✅ **Admin UI**: Makkelijke management
- ✅ **Monitoring**: Ingebouwde dashboard

## 📚 Volledige Guide

Zie `SUPABASE_MIGRATIE_GUIDE.md` voor:
- Detailed troubleshooting
- Performance tips
- Backup strategies
- Advanced configuration

---

**Questions?** Check de volledige guide of neem contact op!
