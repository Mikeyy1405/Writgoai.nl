# WritGo AI - Development Guide

Deze gids helpt je om het project lokaal te draaien en aan te passen.

## 🚀 Setup op je Lokale Machine

### Stap 1: Clone het Project

```bash
# Clone vanaf GitHub
git clone https://github.com/Mikeyy1405/Writgoai.nl.git

# Ga naar de project directory
cd Writgoai.nl
```

### Stap 2: Installeer Dependencies

```bash
# Installeer alle packages
yarn install
```

### Stap 3: Setup Environment Variables

```bash
# Kopieer de example file
cp .env.example .env

# Open .env en vul je credentials in
nano .env  # of gebruik je favoriete editor
```

**Minimaal vereiste variabelen:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/writgo
NEXTAUTH_SECRET=een-lange-random-string
NEXTAUTH_URL=http://localhost:3000
```

### Stap 4: Database Setup

```bash
# Generate Prisma client
yarn prisma generate

# Run migrations om database te maken
yarn prisma migrate dev

# (Optioneel) Seed de database met test data
yarn prisma db seed
```

### Stap 5: Start Development Server

```bash
yarn dev
```

✅ Je app draait nu op [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Aanpassingen Maken

### 1. UI/Styling Aanpassen

Alle styling gebeurt met Tailwind CSS:

```tsx
// Voorbeeld: Kleur van een button aanpassen
<button className="bg-green-600 hover:bg-green-700">
  Klik hier
</button>
```

**Belangrijkste kleur:** `green-600` (WritGo branding)

### 2. Nieuwe Pagina Toevoegen

```bash
# Maak een nieuwe page in app/client-portal/
touch app/client-portal/mijn-pagina/page.tsx
```

### 3. Database Schema Aanpassen

```prisma
// prisma/schema.prisma
model Client {
  id                 String   @id @default(cuid())
  email              String   @unique
  // Voeg nieuwe velden toe:
  mijnNieuwVeld      String?
}
```

```bash
# Maak een migration
yarn prisma migrate dev --name add_mijn_nieuw_veld

# Generate Prisma client
yarn prisma generate
```

---

## 📊 Database Management

### Prisma Studio (Database GUI)

```bash
yarn prisma studio
```

Dit opent een GUI op [http://localhost:5555](http://localhost:5555)

---

## 🔧 Handige Commands

```bash
# Development
yarn dev                    # Start dev server
yarn build                  # Build voor productie
yarn start                  # Start productie server

# Database
yarn prisma studio          # Open database GUI
yarn prisma migrate dev     # Maak en run migrations
yarn prisma generate        # Generate Prisma client

# Code Quality
yarn lint                   # Run ESLint
```

---

## 🐛 Common Issues

### Issue: "Module not found"
```bash
# Clear cache en herinstalleer
rm -rf .next node_modules
yarn install
```

### Issue: Prisma client errors
```bash
# Regenerate Prisma client
yarn prisma generate
```

---

## 🚀 Deploy naar Productie

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

**Happy Coding! 🎉**