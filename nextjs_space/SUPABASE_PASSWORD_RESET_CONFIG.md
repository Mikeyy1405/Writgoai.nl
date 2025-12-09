# Supabase Password Reset - Configuratie Guide

Deze guide beschrijft de configuratie stappen om de Supabase Auth password reset functionaliteit correct in te stellen.

## Overzicht

De password reset functionaliteit is gemigreerd naar Supabase Auth. Dit betekent:
- ✅ Supabase handelt token generatie en expiry automatisch
- ✅ Supabase stuurt de password reset emails
- ✅ Geen custom `PasswordResetToken` tabel meer nodig
- ✅ Ingebouwde beveiliging en rate limiting via Supabase

## Vereiste Configuratie in Supabase Dashboard

### 1. Email Templates Instellen

Ga naar je Supabase Dashboard → Authentication → Email Templates

#### Reset Password Template

Pas het **"Reset Password"** template aan voor Nederlandse gebruikers:

**Subject:**
```
Wachtwoord resetten - WritgoAI
```

**Body (HTML):**
```html
<h2>Wachtwoord resetten</h2>
<p>Hallo,</p>
<p>Je hebt een wachtwoord reset aangevraagd voor je WritgoAI account.</p>
<p>Klik op de onderstaande link om je wachtwoord te resetten:</p>
<p><a href="{{ .ConfirmationURL }}">Reset mijn wachtwoord</a></p>
<p>Deze link is 1 uur geldig.</p>
<p>Als je deze email niet hebt aangevraagd, kun je deze email negeren.</p>
<br>
<p>Met vriendelijke groet,<br>
Team WritgoAI</p>
```

**Note:** De `{{ .ConfirmationURL }}` placeholder wordt automatisch vervangen door Supabase met de juiste reset URL.

### 2. Redirect URLs Configureren

Ga naar: Supabase Dashboard → Authentication → URL Configuration

Voeg de volgende **Redirect URLs** toe:

**Voor Productie:**
```
https://writgoai.nl/wachtwoord-resetten
```

**Voor Development (optioneel):**
```
http://localhost:3000/wachtwoord-resetten
```

⚠️ **Belangrijk:** Zonder deze redirect URLs zal Supabase de reset emails niet versturen!

### 3. Email Rate Limiting

Ga naar: Supabase Dashboard → Authentication → Rate Limits

Aanbevolen instellingen:
- **Password Reset**: 3 requests per 60 minuten per email adres

Dit voorkomt abuse terwijl legitieme gebruikers genoeg pogingen hebben.

### 4. SMTP Configuratie (Optioneel)

Standaard gebruikt Supabase hun eigen email service. Voor productie wordt aangeraden om je eigen SMTP provider te configureren voor betere deliverability:

Ga naar: Supabase Dashboard → Project Settings → Auth → SMTP Settings

**Aanbevolen SMTP Providers:**
- SendGrid
- AWS SES
- Mailgun
- Postmark

Configureer met je eigen SMTP credentials voor:
- ✅ Betere email deliverability
- ✅ Custom sender naam/email
- ✅ Betere tracking en monitoring

## Environment Variables

Zorg dat de volgende environment variables correct zijn ingesteld in `.env`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Base URL voor redirects (gebruikt door API)
NEXTAUTH_URL=https://writgoai.nl
```

## Hoe het werkt

### Flow Overview:

1. **Gebruiker vraagt password reset aan** (`/wachtwoord-vergeten`)
   - Frontend: Gebruiker vult email in
   - Backend: `/api/client-auth/forgot-password`
   - Controleert of user bestaat in Client/User tabel
   - Creëert Supabase Auth user indien nog niet bestaat
   - Roept `supabase.auth.resetPasswordForEmail()` aan

2. **Supabase verstuurt email**
   - Supabase genereert veilige token
   - Stuurt email met reset link naar gebruiker
   - Link bevat: `access_token`, `refresh_token`, en `type=recovery`

3. **Gebruiker klikt op link in email**
   - Wordt geredirect naar: `https://writgoai.nl/wachtwoord-resetten#access_token=xxx&type=recovery`
   - Frontend extraheert `access_token` uit URL hash

4. **Gebruiker stelt nieuw wachtwoord in**
   - Frontend: Gebruiker vult nieuw wachtwoord in
   - Backend: `/api/client-auth/reset-password`
   - Valideert access_token via Supabase
   - Update password in Client/User tabel (bcrypt hash)
   - Synct password naar Supabase Auth

## Testen

### Test Flow:

1. **Lokaal testen:**
   ```bash
   cd nextjs_space
   npm run dev
   ```

2. **Open browser:**
   - Ga naar `http://localhost:3000/wachtwoord-vergeten`
   - Vul een bestaand email adres in
   - Check je email inbox voor de reset link

3. **Klik op reset link**
   - Wordt geredirect naar `/wachtwoord-resetten` met token in URL
   - Vul nieuw wachtwoord in
   - Submit en verifieer dat wachtwoord is gewijzigd

4. **Test login met nieuw wachtwoord**
   - Ga naar `/inloggen`
   - Login met nieuwe credentials

### Troubleshooting

**Problem:** Email wordt niet ontvangen
- ✅ Check Supabase Dashboard → Authentication → Logs
- ✅ Verifieer dat redirect URL is toegevoegd
- ✅ Check spam folder
- ✅ Verifieer SMTP configuratie (indien gebruikt)

**Problem:** "Ongeldige of verlopen reset link"
- ✅ Token is 1 uur geldig, vraag nieuwe aan indien verlopen
- ✅ Token kan maar 1x gebruikt worden
- ✅ Check of `SUPABASE_SERVICE_ROLE_KEY` correct is ingesteld

**Problem:** "Gebruiker niet gevonden"
- ✅ Email bestaat niet in Client of User tabel
- ✅ Check spelling van email adres
- ✅ Verifieer database verbinding

## Migratie van Oude Systeem

### Oude vs Nieuwe Flow

**Oud (Prisma + Custom Email):**
- ❌ Custom token generatie met `crypto`
- ❌ Manual token storage in `PasswordResetToken` tabel
- ❌ Custom email sending via `sendPasswordResetEmail()`
- ❌ Manual token expiry management

**Nieuw (Supabase Auth):**
- ✅ Supabase Auth token generatie (veilig & automatic)
- ✅ Geen custom database tabel nodig
- ✅ Supabase email infrastructure (betrouwbaar)
- ✅ Automatic token expiry (1 uur standaard)

### Database Cleanup (Optioneel)

Na succesvolle migratie kun je de oude `PasswordResetToken` tabel verwijderen:

```sql
-- Alleen uitvoeren als je zeker weet dat alles werkt!
DROP TABLE IF EXISTS "PasswordResetToken";
```

⚠️ **Let op:** Test eerst uitgebreid in productie voordat je deze tabel verwijdert.

## Security Features

### Ingebouwde Beveiliging:

1. **Rate Limiting**
   - API level: 3 requests per uur per email (via `rateLimiters.forgotPassword`)
   - Supabase level: Configureerbaar in dashboard

2. **Token Security**
   - Tokens zijn single-use
   - 1 uur geldigheid
   - Cryptografisch veilig via Supabase

3. **Email Enumeration Prevention**
   - API retourneert altijd success message
   - Geen informatie over of email bestaat

4. **Password Requirements**
   - Minimaal 6 karakters
   - Bcrypt hashing met salt rounds: 10

## Support

Voor vragen of problemen:
- Check Supabase Dashboard → Logs voor errors
- Bekijk application logs via `/lib/logger.ts`
- Contact: info@writgoai.nl

## Referenties

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Reset Password](https://supabase.com/docs/guides/auth/passwords#reset-password)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
