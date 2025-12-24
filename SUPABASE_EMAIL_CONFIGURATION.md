# Supabase Email Configuration Guide

## Problem
Password reset emails en registratie confirmation emails komen niet aan bij Gmail.

## Oorzaak
Supabase gebruikt standaard hun eigen SMTP server voor emails, maar deze worden vaak geblokkeerd door Gmail's spam filters of hebben deliverability issues.

## Oplossing: Custom SMTP Configuratie

Om emails betrouwbaar te laten aankomen, moet je een custom SMTP server configureren in Supabase.

### Stappen:

1. **Ga naar Supabase Dashboard**
   - Log in op [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecteer je WritGo project

2. **Navigeer naar Email Settings**
   - Ga naar: `Project Settings` → `Auth` → `Email Templates`
   - Scroll naar beneden naar `SMTP Settings`

3. **Kies een Email Provider**

   **Optie A: SendGrid (Aanbevolen - Gratis tier 100 emails/dag)**
   - Maak account aan op [https://sendgrid.com](https://sendgrid.com)
   - Ga naar `Settings` → `API Keys` → `Create API Key`
   - Configureer in Supabase:
     ```
     SMTP Host: smtp.sendgrid.net
     SMTP Port: 587
     SMTP User: apikey
     SMTP Password: [Your SendGrid API Key]
     Sender Email: noreply@writgo.nl
     Sender Name: WritGo
     ```

   **Optie B: Mailgun**
   - Maak account aan op [https://mailgun.com](https://mailgun.com)
   - Configureer domain: writgo.nl
   - Configureer in Supabase:
     ```
     SMTP Host: smtp.mailgun.org
     SMTP Port: 587
     SMTP User: [Your Mailgun SMTP Username]
     SMTP Password: [Your Mailgun SMTP Password]
     Sender Email: noreply@writgo.nl
     Sender Name: WritGo
     ```

   **Optie C: Gmail SMTP (Minder betrouwbaar)**
   - Maak een dedicated Gmail account aan voor WritGo
   - Schakel 2FA in op het account
   - Genereer een App Password
   - Configureer in Supabase:
     ```
     SMTP Host: smtp.gmail.com
     SMTP Port: 587
     SMTP User: your-writgo-email@gmail.com
     SMTP Password: [Your App Password]
     Sender Email: your-writgo-email@gmail.com
     Sender Name: WritGo
     ```

4. **Test de Configuratie**
   - Klik op `Send Test Email` in Supabase dashboard
   - Check of de email aankomt
   - Test ook password reset vanuit de WritGo app

5. **Email Templates Aanpassen (Optioneel)**

   Je kunt de email templates aanpassen in Supabase:

   - **Confirmation Email** (voor nieuwe registraties)
   - **Reset Password Email**
   - **Magic Link Email**
   - **Change Email Email**

   Pas de templates aan met WritGo branding en Nederlandse tekst.

## Email Confirmatie In/Uitschakelen

### Optie 1: Email Confirmatie UITSCHAKELEN (Snelste registratie)
1. Ga naar `Project Settings` → `Auth` → `Email Auth`
2. Zet `Enable email confirmations` op **OFF**
3. Gebruikers worden direct ingelogd na registratie (zoals nu geïmplementeerd in de code)

### Optie 2: Email Confirmatie INSCHAKELEN (Veiliger)
1. Ga naar `Project Settings` → `Auth` → `Email Auth`
2. Zet `Enable email confirmations` op **ON**
3. Configureer de `Confirm Email` redirect URL: `https://writgo.nl/auth/callback`
4. Gebruikers moeten email bevestigen voordat ze kunnen inloggen

**Let op:** De code in `app/api/auth/register/route.ts` is al voorbereid om beide scenario's te handlen!

## Aanbeveling voor WritGo

Voor een professionele ervaring:

1. ✅ Gebruik SendGrid of Mailgun voor email delivery
2. ✅ Schakel email confirmatie **UIT** voor snellere onboarding (gebruikers krijgen direct 25 credits)
3. ✅ Voeg later een "verify email" optie toe in het dashboard voor extra security
4. ✅ Configureer SPF en DKIM records voor writgo.nl domain

## SPF en DKIM Configuratie (voor betere deliverability)

Als je SendGrid of Mailgun gebruikt, moet je DNS records toevoegen aan je writgo.nl domain:

### Voor SendGrid:
Voeg deze DNS records toe bij je domain provider:
```
TXT record: v=spf1 include:sendgrid.net ~all
CNAME record: em1234.writgo.nl → u1234.wl.sendgrid.net
CNAME record: s1._domainkey.writgo.nl → s1.domainkey.u1234.wl.sendgrid.net
CNAME record: s2._domainkey.writgo.nl → s2.domainkey.u1234.wl.sendgrid.net
```

SendGrid geeft je de exacte records in hun dashboard.

## Verificatie

Na configuratie, test de volgende flows:

1. ✅ Nieuwe registratie met een test email
2. ✅ Password reset aanvragen
3. ✅ Check spam folder als emails niet aankomen
4. ✅ Test met verschillende email providers (Gmail, Outlook, etc.)

## Huidige Status

❌ **Niet geconfigureerd** - Standaard Supabase SMTP (niet betrouwbaar)
⏳ **Moet nog gedaan worden** - Custom SMTP setup

## Contact

Voor vragen over deze configuratie: info@writgo.nl
