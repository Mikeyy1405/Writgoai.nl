# Email Marketing Suite - Documentatie

## 📧 Overzicht

De Email Marketing Suite is een complete oplossing voor email marketing, inbox beheer en AI-powered email beantwoording binnen het WritGo AI platform.

## ✨ Features

### 1. Email Marketing (Campagnes & Lijsten)

#### Email Lijsten
- Maak en beheer email lijsten
- Import subscribers via CSV of API
- Segmentatie en filtering
- Automatic subscriber count tracking

**API Endpoints:**
- `GET /api/admin/email-marketing/lists` - Haal alle lijsten op
- `POST /api/admin/email-marketing/lists` - Maak nieuwe lijst
- `GET /api/admin/email-marketing/lists/[id]` - Specifieke lijst details
- `PATCH /api/admin/email-marketing/lists/[id]` - Update lijst
- `DELETE /api/admin/email-marketing/lists/[id]` - Verwijder lijst
- `POST /api/admin/email-marketing/lists/[id]/subscribers` - Voeg subscribers toe

#### Marketing Campagnes
- HTML email templates
- Personalisatie met variabelen ({{firstName}}, {{lastName}}, etc.)
- Scheduling voor toekomstige verzending
- Real-time analytics (opens, clicks, bounces)

**API Endpoints:**
- `GET /api/admin/email-marketing/campaigns` - Alle campagnes
- `POST /api/admin/email-marketing/campaigns` - Nieuwe campagne
- `POST /api/admin/email-marketing/campaigns/[id]/send` - Verstuur campagne

**Credit Kosten:**
- 1 credit per 10 verzonden emails

### 2. Mailbox Integratie

#### Ondersteunde Providers
1. **Gmail** (OAuth 2.0) - In ontwikkeling
2. **Outlook/Microsoft 365** (OAuth 2.0) - In ontwikkeling
3. **Custom IMAP/SMTP** - Volledig werkend

#### Functies
- Automatische synchronisatie (configureerbaar, standaard 15 min)
- Versleutelde opslag van credentials
- Multi-mailbox support per client

**API Endpoints:**
- `GET /api/admin/email-marketing/mailbox` - Alle mailboxen
- `POST /api/admin/email-marketing/mailbox` - Koppel nieuwe mailbox

**⚠️ Belangrijke Notities:**
- Password encryption is momenteel basic (base64) - **NIET GESCHIKT VOOR PRODUCTIE**
- Implementeer AES-256-GCM of gebruik AWS KMS voor productie
- IMAP synchronisatie is een placeholder - moet nog geïmplementeerd worden

### 3. AI Email Inbox

#### AI Analyse Features
Elke email wordt automatisch geanalyseerd voor:
- **Samenvatting** (2-3 zinnen)
- **Sentiment** (positive, negative, neutral, urgent)
- **Categorie** (support, sales, newsletter, spam, personal)
- **Priority** (high, normal, low)
- **Suggested Reply** (AI-gegenereerde antwoord suggestie)

#### Manual AI Reply
Genereer handmatig AI antwoorden met:
- Tone selector (professional, friendly, formal, casual)
- Custom instructies
- Automatic signature toevoeging

**API Endpoints:**
- `GET /api/admin/email-marketing/inbox` - Inbox emails
- `POST /api/admin/email-marketing/inbox/[id]/reply` - Genereer AI reply

**Credit Kosten:**
- AI email analyse: 5 credits
- AI reply generatie: 10 credits

### 4. Auto-Reply Systeem

#### Configuratie Opties
- **Business Hours Only**: Reageer alleen tijdens kantooruren
- **Business Days**: Selecteer werkdagen (maandag-vrijdag standaard)
- **Allowed Categories**: Alleen auto-reply voor specifieke categorieën
- **Excluded Senders**: Blacklist voor specifieke email adressen
- **Tone of Voice**: Professional, friendly, formal, casual
- **Include Signature**: Automatisch signature toevoegen

#### Regels
Auto-reply wordt verstuurd als:
1. Config is actief
2. Sender is NIET in exclude lijst
3. Email categorie is toegestaan (of geen filter actief)
4. Binnen business hours (als enabled)
5. Op een werkdag (als enabled)

**API Endpoints:**
- `GET /api/admin/email-marketing/auto-reply` - Alle configs
- `POST /api/admin/email-marketing/auto-reply` - Nieuwe config

**Credit Kosten:**
- AI auto-reply: 8 credits per email
- Totaal met analyse: 13 credits (5 analyse + 8 auto-reply)

## 💰 Credit Systeem

| Actie | Credits |
|-------|---------|
| Marketing email versturen | 1 per 10 emails |
| AI email analyseren | 5 |
| AI antwoord genereren | 10 |
| AI auto-reply | 8 |
| Inbox synchroniseren | Gratis |

## 🗄️ Database Schema

### Nieuwe Modellen

#### EmailList
- Email lijst voor subscribers
- Bevat: naam, beschrijving, subscriber count

#### EmailSubscriber
- Individuele subscriber in een lijst
- Status: active, unsubscribed, bounced
- Tracking: open count, click count, last email sent

#### MarketingCampaign
- Email campagne details
- Template HTML en JSON (voor editor)
- Analytics: opens, clicks, bounces, unsubscribes

#### MarketingCampaignAnalytics
- Per-subscriber tracking
- Open en click events met timestamps

#### EmailAutomation & EmailAutomationStep
- Drip campagnes / email flows
- Configureerbare delays en conditions

#### MailboxConnection
- Email account koppeling
- OAuth tokens of IMAP/SMTP credentials
- Sync frequency en status

#### InboxEmail
- Inkomende email
- AI analyse resultaten
- Auto-reply status

#### EmailAutoReplyConfig
- Auto-reply regels per mailbox
- Business hours, categories, exclusions

#### EmailAutoReply
- Log van verzonden auto-replies
- Success/failure tracking

## 🚀 Deployment Checklist

### Vóór Productie

1. **Beveiliging**
   - [ ] Implementeer proper password encryption (AES-256-GCM of KMS)
   - [ ] Vervang unsubscribe URL met token-based systeem
   - [ ] Security audit van alle API endpoints
   - [ ] Rate limiting op email endpoints

2. **Email Infrastructure**
   - [ ] Implementeer IMAP synchronisatie (imap-simple of nodemailer)
   - [ ] Implementeer SMTP sending voor replies
   - [ ] Complete Gmail OAuth 2.0 flow
   - [ ] Complete Outlook OAuth 2.0 flow
   - [ ] Test email deliverability

3. **Features**
   - [ ] Drag-drop email template editor
   - [ ] Email automation triggers implementeren
   - [ ] Cron job voor mailbox sync (elke 15 min)
   - [ ] Analytics dashboard met charts
   - [ ] A/B testing voor campagnes

4. **Testing**
   - [ ] Unit tests voor alle libraries
   - [ ] Integration tests voor email sending
   - [ ] E2E tests voor complete flows
   - [ ] Load testing voor bulk emails

## 📍 UI Toegang

### Admin Dashboard
Ga naar: `/dashboard/email-marketing`

Tabs:
1. **Campaigns** - Maak en beheer campagnes
2. **Lists** - Beheer subscriber lijsten
3. **AI Inbox** - Bekijk en beantwoord emails met AI
4. **Mailboxes** - Koppel email accounts
5. **Auto-Reply** - Configureer auto-reply regels

## 🔧 Development

### Environment Variables

```env
# AIML API (voor AI features)
AIML_API_KEY=your_key_here

# Gmail OAuth (optioneel)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret

# Outlook OAuth (optioneel)
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_secret
```

### Database Migratie

```bash
# Genereer Prisma client
npx prisma generate

# Run migraties (als database bestaat)
npx prisma migrate deploy

# Of push schema naar database
npx prisma db push
```

### Development Server

```bash
npm run dev
```

## 🐛 Known Issues & TODOs

1. **Password Encryption** - Momenteel base64, moet proper encryption worden
2. **IMAP Sync** - Placeholder implementatie, moet echte IMAP library gebruiken
3. **OAuth Flows** - Gmail en Outlook OAuth moet compleet geïmplementeerd worden
4. **Unsubscribe Links** - Email in URL is privacy issue, gebruik tokens
5. **Template Editor** - Drag-drop editor nog niet geïmplementeerd
6. **Cron Jobs** - Mailbox sync cron job moet opgezet worden
7. **Email Sending** - Gebruikt MailerLite, kan SMTP direct ook gebruiken voor replies

## 📞 Support

Voor vragen of issues:
- Email: info@writgo.nl
- GitHub Issues: https://github.com/Mikeyy1405/Writgoai.nl/issues

## 📄 Licentie

Private Project - Alle rechten voorbehouden © 2024 WritGo AI
