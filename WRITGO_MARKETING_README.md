# Writgo.nl Marketing Dashboard

## Overzicht

Deze feature voegt een nieuwe "Writgo Marketing" sectie toe aan het admin dashboard, waarmee Writgo.nl hun eigen marketing kan automatiseren met dezelfde flow die aan klanten wordt verkocht.

## Features

### 1. Marketing Dashboard (`/admin/writgo-marketing`)
- Status overzicht (setup, content plan, social accounts, automation)
- Quick stats (blogs en social posts deze maand en totaal)
- Recente content feed (laatste blogs en social posts)
- Setup wizard voor eerste configuratie

### 2. Content Plan Generator (`/admin/writgo-marketing/content-plan`)
- Genereer 7, 14 of 30 dagen content plan
- Preview van gegenereerd plan met blog titels en social posts
- Activeer/deactiveer automation toggle
- Gebruikt bestaande `generateContentPlan()` functie

### 3. Social Accounts Management (`/admin/writgo-marketing/social`)
- Overzicht van verbonden social media accounts
- Integratie met GetLate.dev voor posting
- Instructies voor het verbinden van accounts

## Technische Details

### API Endpoints

- `POST /api/admin/writgo-marketing/setup` - Maak Writgo.nl client aan
- `GET /api/admin/writgo-marketing/status` - Haal status op
- `POST /api/admin/writgo-marketing/generate-plan` - Genereer content plan
- `POST /api/admin/writgo-marketing/activate-automation` - Toggle automation

### Database

De feature gebruikt de bestaande database structuur:
- **Client** table voor Writgo.nl als interne klant
- **BlogPost** table voor gegenereerde blogs
- Optioneel: **ContentPiece** table voor social posts (gracefully degraded als niet aanwezig)

### Configuratie

#### Environment Variables

```bash
# Optional: Custom password for Writgo.nl internal account
# If not set, defaults to 'writgo-internal-2024'
WRITGO_INTERNAL_PASSWORD=your-secure-password-here
```

### Writgo.nl Client Data

Bij setup wordt een client aangemaakt met:
- **Email**: marketing@writgo.nl
- **Naam**: Writgo Marketing
- **Niche**: AI Content Marketing, Omnipresence Marketing
- **Keywords**: omnipresence marketing, AI content agency, social media + SEO pakket, etc.
- **Target Audience**: Lokale dienstverleners (kappers, installateurs, fysiotherapeuten, advocaten)
- **Tone of Voice**: Professioneel maar toegankelijk, Nederlands

## Gebruik

### Eerste Setup

1. Ga naar `/admin/writgo-marketing`
2. Klik op "Setup Writgo.nl Client"
3. Wacht tot de client is aangemaakt

### Content Plan Genereren

1. Ga naar `/admin/writgo-marketing/content-plan`
2. Kies aantal dagen (7, 14 of 30)
3. Klik op "Genereer Plan"
4. Bekijk het gegenereerde plan met alle content ideeën

### Automation Activeren

1. Zorg dat er een content plan is gegenereerd
2. Klik op "Activeer Automation" op de content plan pagina
3. De daily content generator zal nu automatisch content maken

### Social Accounts Verbinden

1. Ga naar [GetLate.dev](https://getlate.dev)
2. Log in met Writgo.nl account
3. Verbind social media accounts (LinkedIn, Instagram, Facebook, Twitter)
4. Ververs `/admin/writgo-marketing/social` om status te zien

## Integratie met Bestaande Systemen

### Content Plan Generator
Gebruikt `lib/content-plan-generator.ts` - dezelfde functie als voor klanten

### Daily Content Generator
Compatible met `lib/daily-content-generator-v2.ts` voor automatische content creatie

### Blog Publicatie
Gegenereerde blogs worden opgeslagen in de `BlogPost` table met:
- `authorName`: "Writgo.nl"
- `status`: "draft" of "published"
- Zichtbaar op de publieke `/blog` pagina

### GetLate.dev Integration
- Social media posting via GetLate.dev API
- OAuth flow voor account verbindingen
- Support voor LinkedIn, Instagram, Facebook, Twitter/X

## Security

- Admin-only toegang met role checking via `isUserAdmin()`
- Wachtwoord hashing met bcryptjs (12 rounds)
- Environment variable voor wachtwoord (niet hardcoded)
- Graceful error handling voor ontbrekende database tables

## Toekomstige Uitbreidingen

- Dashboard widgets voor metrics en performance
- Content calendar view
- A/B testing voor content varianten
- Analytics integratie (GA4, social platform insights)
- Automated posting scheduler
- Content performance tracking

## Support

Voor vragen of problemen, neem contact op met de development team of check de admin dashboard zelf voor status updates.
