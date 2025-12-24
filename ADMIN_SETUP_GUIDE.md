# Admin Gebruikers Setup Guide

## Overzicht

Het admin dashboard geeft beheerders toegang tot klantenbeheer functionaliteit op `/dashboard/admin`.

## Admin Rechten Toekennen

### Stap 1: SQL Script Uitvoeren

Om een gebruiker admin rechten te geven, voer je het volgende SQL script uit in je Supabase SQL Editor:

```sql
-- Vervang 'email@example.com' met het email adres van de gebruiker
UPDATE subscribers
SET
  is_admin = true,
  subscription_active = true,
  subscription_tier = 'enterprise',
  credits_remaining = 999999,
  monthly_credits = 999999
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'email@example.com'
);
```

### Stap 2: Verifieer de Wijziging

Controleer of de gebruiker admin rechten heeft gekregen:

```sql
SELECT
  s.id,
  s.user_id,
  u.email,
  s.is_admin,
  s.subscription_active,
  s.subscription_tier,
  s.credits_remaining,
  s.monthly_credits
FROM subscribers s
JOIN auth.users u ON s.user_id = u.id
WHERE u.email = 'email@example.com';
```

### Stap 3: Herlaad de Pagina

De gebruiker moet uitloggen en opnieuw inloggen, of de pagina herladen om de wijzigingen te zien.

## Admin Dashboard Functies

Admin gebruikers hebben toegang tot:

### 1. Klantenbeheer Dashboard (`/dashboard/admin`)

#### Statistieken
- **Totaal Klanten**: Aantal geregistreerde gebruikers
- **Actieve Klanten**: Gebruikers met actief abonnement
- **Inactieve Klanten**: Gebruikers zonder actief abonnement
- **Totaal Credits**: Som van alle credits over alle gebruikers
- **Administrators**: Aantal admin gebruikers

#### Zoek & Filter Functionaliteit
- Zoeken op email of naam
- Filteren op abonnement status (actief/inactief)
- Filteren op subscription tier

#### Klant Management
- Credits aanpassen per gebruiker
- Maandelijkse credits instellen
- Overzicht van alle klant gegevens:
  - Email adres
  - Naam
  - Credits remaining
  - Maandelijkse credits
  - Subscription tier
  - Abonnement status
  - Admin status
  - Aanmaak datum

### 2. Sidebar Menu Item

Admin gebruikers zien een extra "👑 Admin" menu item in de sidebar.

## Technische Details

### Database Schema

De `subscribers` tabel heeft de volgende relevante velden:

- `is_admin` (BOOLEAN): Geeft aan of een gebruiker admin rechten heeft
- `credits_remaining` (INTEGER): Huidige credit saldo
- `monthly_credits` (INTEGER): Maandelijkse credit limiet
- `subscription_tier` (TEXT): Type abonnement (bijv. 'enterprise')
- `subscription_active` (BOOLEAN): Of het abonnement actief is

### API Endpoints

- `GET /api/admin/users`: Haalt alle gebruikers op (alleen toegankelijk voor admins)
- `POST /api/admin/credits`: Update credits voor een gebruiker (alleen toegankelijk voor admins)

### Row Level Security (RLS)

Admins hebben volledige toegang tot de subscribers tabel via de RLS policies. Normale gebruikers kunnen alleen hun eigen gegevens zien en wijzigen.

## Snelle Setup voor info@writgo.nl

Er is een kant-en-klaar script in het project:

```bash
# Voer dit bestand uit in Supabase SQL Editor
cat make_admin.sql
```

Dit maakt `info@writgo.nl` direct admin met onbeperkte credits.

## Probleemoplossing

### Admin Menu Item Niet Zichtbaar

1. Controleer of de gebruiker is ingelogd met het juiste account
2. Verifieer in de database of `is_admin = true`
3. Log uit en log opnieuw in
4. Clear browser cache en cookies

### "Unauthorized" Foutmelding

De gebruiker heeft geen admin rechten. Controleer de database en voer het SQL script opnieuw uit.

### Credits Wijziging Mislukt

Controleer of:
- De admin correct is ingelogd
- De RLS policies correct zijn ingesteld
- De API endpoint bereikbaar is

## Beveiliging

- Alleen gebruikers met `is_admin = true` kunnen de admin pagina's bekijken
- API endpoints controleren admin status bij elke request
- RLS policies beschermen de database tegen ongeautoriseerde toegang
- Admin sessies verlopen na 1 uur inactiviteit
