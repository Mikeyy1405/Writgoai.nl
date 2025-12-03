
# 📧 WritgoAI Email Systeem - Complete Documentatie

## 📋 Overzicht

Het WritgoAI email systeem bevat complete templates en automatisering voor:
1. **Welkomst emails** - Voor nieuwe klanten en admin gebruikers
2. **Onboarding email reeks** - 5 emails met tips en beste practices
3. **Promotionele emails** - Black Friday, Kerst, Nieuwjaar
4. **Automatische scheduling** - Via cron jobs

---

## 🎯 Welkomst Emails

### 1. Client Welkomst Email
**Wanneer:** Direct na registratie  
**Template:** `sendWelcomeEmail()`  
**Inhoud:**
- Welkomstboodschap met naam
- Overzicht van gratis cadeau (1 artikel + 1 reel)
- Eerste stappen instructies
- Link naar dashboard

**Gebruik:**
```typescript
import { sendWelcomeEmail } from '@/lib/email';

await sendWelcomeEmail({
  to: 'klant@email.com',
  name: 'Jan Jansen',
  email: 'klant@email.com',
});
```

### 2. Admin Welkomst Email
**Wanneer:** Wanneer een nieuwe admin wordt aangemaakt  
**Template:** `sendAdminWelcomeEmail()`  
**Inhoud:**
- Welkom als admin gebruiker
- Tijdelijke login gegevens (email + wachtwoord)
- Lijst van admin functies
- Waarschuwing om wachtwoord te wijzigen
- Link naar admin dashboard

**Gebruik:**
```typescript
import { sendAdminWelcomeEmail } from '@/lib/email';

await sendAdminWelcomeEmail(
  'admin@WritgoAI.nl',
  'Admin Naam',
  'TijdelijkWachtwoord123'
);
```

---

## 📬 Onboarding Email Reeks (5 Emails)

### Email 1: Welkom & Eerste Stappen (Dag 0)
**Subject:** 👋 Welkom bij WritgoAI - Je eerste stappen!  
**Inhoud:**
- Welkomstboodschap
- 3 eerste stappen (profiel, WordPress, eerste artikel)
- Pro tip over gratis credits

### Email 2: SEO Tips (Dag 1)
**Subject:** 📊 5 SEO-tips voor betere Google rankings  
**Inhoud:**
- 5 Gouden SEO-regels
- Long-tail keywords uitleg
- FAQ secties
- Wat WritgoAI automatisch doet
- Link naar Writgo Writer

### Email 3: Autopilot Uitleg (Dag 3)
**Subject:** ⏰ Bespaar 10+ uur per week met deze functie  
**Inhoud:**
- Wat doet Autopilot?
- 3-minuten setup instructies
- Rekenvoorbeeld (12 uur bespaard!)
- Link naar Autopilot pagina

### Email 4: Affiliate Marketing (Dag 5)
**Subject:** 💰 Verdien €245+ per maand met affiliate marketing  
**Inhoud:**
- Hoe affiliate links werken
- Bol.com integratie
- Rekenvoorbeeld €245/maand
- Pro tips (reviews, top 10 lijsten)

### Email 5: Referral Programma (Dag 7)
**Subject:** 🎁 Verdien €145+ per maand met ons affiliate programma  
**Inhoud:**
- 30% commissie lifetime earnings
- Unieke affiliate code
- Rekenvoorbeeld (5, 10, 20 referrals)
- Doelgroep tips

### Gebruik Onboarding Emails:
```typescript
import { sendOnboardingEmail } from '@/lib/email';

// Email 1 (direct)
await sendOnboardingEmail(
  'klant@email.com',
  'Jan Jansen',
  1,
  'https://WritgoAI.nl/client-portal'
);

// Email 2 (dag 1)
await sendOnboardingEmail(
  'klant@email.com',
  'Jan Jansen',
  2,
  'https://WritgoAI.nl/client-portal'
);

// Email 5 met affiliate code
await sendOnboardingEmail(
  'klant@email.com',
  'Jan Jansen',
  5,
  'https://WritgoAI.nl/client-portal',
  'AFF12345' // Optionele affiliate code
);
```

---

## 🎉 Promotionele Emails

### 1. Black Friday Email
**Template:** `getBlackFridayEmailTemplate()`  
**Design:** Zwarte achtergrond, oranje accenten  
**Inhoud:**
- Grote korting aankondiging
- Exclusieve discount code
- Einddatum urgentie
- Lifetime deal messaging
- Bonus credits (2000)

### 2. Kerst Email
**Template:** `getChristmasEmailTemplate()`  
**Design:** Groen/rood kleuren, feestelijk  
**Inhoud:**
- Kerst cadeau aankondiging
- Discount code
- 1500 bonus credits
- Gratis WordPress plugin
- Persoonlijke onboarding

### 3. Nieuwjaar Email
**Template:** `getNewYearEmailTemplate()`  
**Design:** Blauw/paars gradiënt  
**Inhoud:**
- Nieuwjaars voornemens
- Content doelen voor 2026
- 2000 bonus credits
- Gratis strategy sessie (€149 waarde)
- Lifetime pricing guarantee

### Gebruik Promotionele Emails:
```typescript
import { sendPromotionalEmail } from '@/lib/email';

// Black Friday
await sendPromotionalEmail(
  'klant@email.com',
  'Jan Jansen',
  'black-friday',
  'BLACKFRIDAY30',
  30,
  '30 november 2025',
  'https://WritgoAI.nl/client-portal'
);

// Kerst
await sendPromotionalEmail(
  'klant@email.com',
  'Jan Jansen',
  'christmas',
  'KERST25',
  25,
  '31 december 2025',
  'https://WritgoAI.nl/client-portal'
);

// Nieuwjaar
await sendPromotionalEmail(
  'klant@email.com',
  'Jan Jansen',
  'new-year',
  'NEWYEAR2026',
  35,
  '15 januari 2026',
  'https://WritgoAI.nl/client-portal'
);
```

---

## 🤖 Automatische Email Scheduling

### Onboarding Email Cron Job
**Endpoint:** `/api/client/onboarding-emails`  
**Schedule:** Dagelijks om 09:00 UTC (10:00 CET)  
**Functie:**
- Controleert welke klanten welke email moeten ontvangen
- Gebruikt venster van ±1 uur voor flexibiliteit
- Logt alle verzonden emails in database
- Voorkomt dubbele verzending

**Planning:**
- Email 1: Direct na registratie
- Email 2: 24 uur na registratie
- Email 3: 72 uur (3 dagen)
- Email 4: 120 uur (5 dagen)
- Email 5: 168 uur (7 dagen)

**Vercel Cron Setup:**
```json
{
  "crons": [
    {
      "path": "/api/client/onboarding-emails",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Email Tracking
Alle emails worden gelogd in de `EmailLog` tabel:
```typescript
{
  clientId: string;
  templateCode: string; // bijv. "onboarding-1", "black-friday"
  subject: string;
  recipientEmail: string;
  status: 'sent' | 'failed';
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
}
```

---

## 🎛️ Admin Panel - Email Campaign Manager

### Locatie
**URL:** https://WritgoAI.nl/admin/dashboard → "Emails" tab  
**Component:** `EmailCampaignManager`

### Functies

#### 1. Onboarding Emails Versturen
- Kies email nummer (1-5)
- Selecteer doelgroep
- Verstuur handmatig naar specifieke groepen

#### 2. Promotionele Emails Versturen
- Kies promotie type (Black Friday, Kerst, Nieuwjaar)
- Vul discount code in
- Stel korting percentage in
- Kies einddatum
- Selecteer doelgroep

#### 3. Doelgroep Selectie
- **Alle Klanten:** Iedereen in de database
- **Nieuwe Klanten:** < 30 dagen geleden aangemeld
- **Actieve Klanten:** Met actief abonnement
- **Inactieve Klanten:** Zonder abonnement

#### 4. Email Statistieken
- Totaal verzonden
- Open rate
- Click rate
- Actieve campagnes

### Gebruik Admin Panel:
1. Login als admin op https://WritgoAI.nl/admin
2. Ga naar "Dashboard" → "Emails" tab
3. Kies email type (Onboarding of Promotioneel)
4. Vul relevante velden in
5. Selecteer doelgroep
6. Klik "Verstuur Email"

---

## 📊 API Endpoints

### 1. Verzend Email Campagne
**Endpoint:** `POST /api/admin/email-campaigns/send`  
**Auth:** Admin only  
**Body:**
```json
{
  "campaignType": "onboarding" | "promotional",
  "emailNumber": 1-5, // Voor onboarding
  "promoType": "black-friday" | "christmas" | "new-year", // Voor promotional
  "discountCode": "PROMO30",
  "discountPercentage": 30,
  "expiryDate": "31-12-2025",
  "targetAudience": "all" | "new" | "active" | "inactive"
}
```

**Response:**
```json
{
  "success": true,
  "sent": 45,
  "failed": 2,
  "total": 47,
  "errors": ["email@failed.com: reason"]
}
```

### 2. Onboarding Emails Cron
**Endpoint:** `GET /api/client/onboarding-emails`  
**Auth:** Cron secret (Bearer token)  
**Schedule:** Dagelijks 09:00 UTC

**Response:**
```json
{
  "success": true,
  "results": [
    { "emailNumber": 1, "sent": 3, "failed": 0 },
    { "emailNumber": 2, "sent": 5, "failed": 1 },
    ...
  ],
  "timestamp": "2025-11-07T09:00:00.000Z"
}
```

---

## 🔧 SMTP Configuratie

### Vereiste Environment Variables
```env
# SMTP Settings (Cloud86 of andere provider)
SMTP_HOST=writgoai.nl
SMTP_PORT=587
SMTP_USER=info@writgoai.nl
SMTP_PASS=your_password_here
SMTP_SECURE=false

# Cron Secret (voor automatische emails)
CRON_SECRET=your_secure_random_string
```

### Poort Configuratie
- **Port 587 (Recommended):** STARTTLS - Gebruik `SMTP_SECURE=false`
- **Port 465:** SSL/TLS - Gebruik `SMTP_SECURE=true`

De configuratie ondersteunt beide poorten en past automatisch de juiste beveiligingsmethode toe.

### Test Email Functie
```typescript
import { sendTestEmail } from '@/lib/email';

// Test of SMTP werkt
await sendTestEmail('test@email.com');
```

---

## 📈 Best Practices

### 1. Email Timing
- **Onboarding:** Verzend op werkdagen 9:00-17:00
- **Promotioneel:** Verzend op beste dagen (di/wo/do)
- **Weekend:** Vermijd zondagen

### 2. Personalisatie
- Gebruik altijd de naam van de klant
- Pas content aan op basis van gedrag
- Segment doelgroepen

### 3. Testing
- Test altijd eerst met 1-2 emails
- Controleer alle links werken
- Test op mobiel EN desktop
- Controleer spam score

### 4. Monitoring
- Check EmailLog tabel dagelijks
- Monitor open rates
- Analyseer click-through rates
- Pas templates aan op basis van data

### 5. Compliance
- Voeg altijd "unsubscribe" link toe
- Include company info in footer
- Respecteer GDPR regels
- Log alle email activiteit

---

## 🐛 Troubleshooting

### Email wordt niet verzonden
1. Check SMTP credentials in .env
2. Verify email service is enabled
3. Check logs: `console.log` in email functions
4. Test with `sendTestEmail()`

### Emails komen in spam
1. Setup SPF record voor domain
2. Add DKIM signature
3. Verify sender reputation
4. Avoid spam trigger words

### Cron job werkt niet
1. Verify CRON_SECRET is correct
2. Check Vercel cron logs
3. Test endpoint manually met Bearer token
4. Verify timezone (UTC vs CET)

### Dubbele emails
1. Check EmailLog voor duplicates
2. Verify cron schedule
3. Add unique constraint op templateCode + clientId + sentAt

---

## 📝 Toekomstige Uitbreidingen

### 1. Extra Promoties
- Zomer sale
- Pasen actie
- Cyber Monday
- Valentine's Day

### 2. Behavioral Emails
- Abandoned cart
- Re-engagement (inactive users)
- Upgrade prompts
- Usage milestones

### 3. A/B Testing
- Test verschillende subject lines
- Test send times
- Test content variants
- Measure conversion rates

### 4. Advanced Segmentation
- By industry
- By usage level
- By feature usage
- By subscription tier

---

## 📞 Support

Voor vragen over het email systeem:
- **Email:** info@WritgoAI.nl
- **Admin Dashboard:** https://WritgoAI.nl/admin
- **Logs:** Check `/api/admin/email-logs` (te bouwen)

---

**Laatste update:** 7 november 2025  
**Versie:** 1.0.0  
**Ontwikkelaar:** WritgoAI Team
