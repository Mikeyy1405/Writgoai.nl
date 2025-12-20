# 🚀 Supabase Setup Guide

De app gebruikt nu **Supabase** in plaats van Prisma + NextAuth!

## ✅ Wat is er veranderd?

### Voor:
- ❌ Prisma ORM + PostgreSQL direct connection
- ❌ NextAuth voor authentication
- ❌ Bcrypt voor password hashing
- ❌ Complex setup met migrations

### Na:
- ✅ Supabase Client SDK
- ✅ Supabase Auth (ingebouwd)
- ✅ REST API (geen poort problemen!)
- ✅ Simpele setup

---

## 📋 Environment Variables

Voeg deze toe aan Render:

```bash
# Supabase (VERPLICHT)
NEXT_PUBLIC_SUPABASE_URL=https://utursgxvfhhfheeoewfn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<jouw-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<jouw-service-role-key>

# AI APIs (Optioneel)
AIML_API_KEY=<jouw-api-key>
PERPLEXITY_API_KEY=<jouw-api-key>
```

---

## 🔑 Waar vind je de Supabase Keys?

### Stap 1: Ga naar Supabase Dashboard
https://supabase.com/dashboard

### Stap 2: Selecteer je project
`utursgxvfhhfheeoewfn`

### Stap 3: Ga naar Settings → API
1. Klik op **Settings** (tandwiel icoon links)
2. Klik op **API**
3. Scroll naar **"Project API keys"**

### Stap 4: Kopieer de keys
- **anon public**: Dit is je `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role**: Dit is je `SUPABASE_SERVICE_ROLE_KEY`

**Let op:** De `service_role` key is geheim! Deel deze nooit publiekelijk.

---

## 🗄️ Database Schema

De app verwacht deze tabellen in Supabase:

### 1. Users Table
Wordt **automatisch** aangemaakt door Supabase Auth!
- Tabel naam: `auth.users` (ingebouwd)
- Geen handmatige setup nodig

### 2. Projects Table
Run dit in Supabase SQL Editor:

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  wp_url TEXT,
  wp_username TEXT,
  wp_password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);
```

### 3. Articles Table
Run dit in Supabase SQL Editor:

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see articles from their own projects
CREATE POLICY "Users can view own articles" ON articles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own articles" ON articles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own articles" ON articles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own articles" ON articles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );
```

---

## 🔐 Google OAuth Setup (Optioneel)

Als je Google login wilt:

### Stap 1: Ga naar Supabase Dashboard
1. Settings → Authentication
2. Scroll naar **"Auth Providers"**
3. Klik op **Google**

### Stap 2: Enable Google Provider
1. Toggle **"Enable Sign in with Google"** aan
2. Je ziet nu velden voor Client ID en Secret

### Stap 3: Google Cloud Console
1. Ga naar https://console.cloud.google.com
2. Maak een nieuw project (of selecteer bestaand)
3. Ga naar **APIs & Services** → **Credentials**
4. Klik **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   ```
   https://utursgxvfhhfheeoewfn.supabase.co/auth/v1/callback
   ```
7. Kopieer Client ID en Client Secret

### Stap 4: Terug naar Supabase
1. Plak Client ID in Supabase
2. Plak Client Secret in Supabase
3. Save

**Klaar!** Google login werkt nu automatisch.

---

## 🚀 Deploy naar Render

### Stap 1: Update Environment Variables
1. Ga naar Render Dashboard
2. Selecteer je service
3. Environment tab
4. Voeg de Supabase keys toe (zie boven)
5. **Verwijder** oude variables:
   - `DATABASE_URL` (niet meer nodig!)
   - `NEXTAUTH_SECRET` (niet meer nodig!)
   - `NEXTAUTH_URL` (niet meer nodig!)
6. Save Changes

### Stap 2: Deploy
1. Klik **Manual Deploy**
2. Deploy latest commit
3. Wacht tot build klaar is (~30 seconden)

### Stap 3: Test
1. Ga naar https://writgo.nl
2. Klik "Registreer"
3. Maak een account aan
4. Je wordt automatisch ingelogd!
5. Dashboard werkt! 🎉

---

## ✅ Checklist

- [ ] Supabase keys toegevoegd aan Render
- [ ] Projects tabel aangemaakt in Supabase
- [ ] Articles tabel aangemaakt in Supabase
- [ ] Row Level Security policies toegevoegd
- [ ] Google OAuth geconfigureerd (optioneel)
- [ ] Oude environment variables verwijderd
- [ ] Gedeployed naar Render
- [ ] Getest: Registratie werkt
- [ ] Getest: Login werkt
- [ ] Getest: Dashboard werkt

---

## 🎊 Voordelen van Supabase

| Feature | Voor (Prisma) | Na (Supabase) |
|---------|---------------|---------------|
| **Database Connection** | Direct PostgreSQL | REST API (HTTPS) |
| **Auth System** | NextAuth (custom) | Supabase Auth (ingebouwd) |
| **Password Hashing** | Bcrypt (manual) | Automatisch |
| **Row Level Security** | Manual queries | Ingebouwd |
| **Real-time** | Niet beschikbaar | Ja! |
| **File Storage** | Niet beschikbaar | Ja! |
| **Edge Functions** | Niet beschikbaar | Ja! |
| **Setup Tijd** | 30+ minuten | 5 minuten |

---

**Succes met je deployment! 🚀**
