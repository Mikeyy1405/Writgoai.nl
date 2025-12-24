# Snelle Database Setup - Writgo.ai

## Het Probleem

De error `relation "subscribers" does not exist` betekent dat de subscribers tabel nog niet is aangemaakt in je Supabase database.

## De Oplossing (1 Minuut)

### Stap 1: Open Supabase

1. Ga naar [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Open je Writgo.ai project
3. Klik op **SQL Editor** in de linker sidebar

### Stap 2: Voer het Complete Setup Script Uit

1. Klik op **New Query**
2. Kopieer de **volledige inhoud** van het bestand: `setup_database_complete.sql`
3. Plak in de SQL Editor
4. Klik op **Run** (of druk Ctrl+Enter)

### Stap 3: Controleer het Resultaat

Als het succesvol is, zie je onderaan:

```
✓ SUCCESS: info@writgo.nl is now an admin!
```

En een tabel met admin gebruikers:

| email | is_admin | subscription_active | subscription_tier | credits_remaining | monthly_credits |
|-------|----------|---------------------|-------------------|-------------------|-----------------|
| info@writgo.nl | true | true | enterprise | 999999 | 999999 |

### Stap 4: Test de Admin Pagina

1. **Log uit** van je applicatie
2. **Log opnieuw in** met info@writgo.nl
3. Je ziet nu het **👑 Admin** menu item in de sidebar
4. Klik erop om naar `/dashboard/admin` te gaan
5. Je ziet het klantenbeheer dashboard met statistieken!

## Wat Doet Dit Script?

Het `setup_database_complete.sql` script:

✅ Maakt de `subscribers` tabel aan
✅ Maakt de `credit_usage_logs` tabel aan
✅ Voegt de `is_admin` kolom toe
✅ Configureert Row Level Security (RLS) policies
✅ Maakt automatische triggers voor nieuwe gebruikers
✅ Geeft `info@writgo.nl` admin rechten met onbeperkte credits
✅ Maakt subscriber records aan voor bestaande gebruikers

## Als het Nog Steeds Niet Werkt

### Controleer 1: Is de Tabel Aangemaakt?

Voer dit uit in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'subscribers';
```

Als je niets ziet, is de tabel niet aangemaakt. Probeer het setup script opnieuw.

### Controleer 2: Ben Je Admin?

Voer dit uit in SQL Editor:

```sql
SELECT
  u.email,
  s.is_admin,
  s.credits_remaining
FROM subscribers s
JOIN auth.users u ON s.user_id = u.id
WHERE u.email = 'info@writgo.nl';
```

Je zou moeten zien:
- `is_admin`: true
- `credits_remaining`: 999999

### Controleer 3: Bestaat de Gebruiker?

Voer dit uit in SQL Editor:

```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'info@writgo.nl';
```

Als je niets ziet, bestaat de gebruiker nog niet. Registreer eerst een account met dat email adres.

## Andere Gebruikers Admin Maken

Om een andere gebruiker admin te maken, voer dit uit in SQL Editor:

```sql
UPDATE subscribers
SET
  is_admin = true,
  subscription_active = true,
  subscription_tier = 'enterprise',
  credits_remaining = 999999,
  monthly_credits = 999999
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'EMAIL_HIER@example.com'
);
```

Vervang `EMAIL_HIER@example.com` met het gewenste email adres.

## Hulp Nodig?

Als je problemen blijft ervaren, check:

1. **Supabase Project URL** - Is dit de juiste database?
2. **Environment Variables** - Zijn `NEXT_PUBLIC_SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY` correct ingesteld?
3. **SQL Editor Rechten** - Heb je admin rechten in Supabase?

## Veiligheidsnotitie

Het `SUPABASE_SERVICE_ROLE_KEY` moet geheim blijven en alleen server-side gebruikt worden. Deel deze nooit in client-side code of commit deze niet naar git!
