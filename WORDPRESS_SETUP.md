# WordPress REST API Setup met Application Passwords

WritGo gebruikt de standaard WordPress REST API met Application Password authenticatie. Geen plugin nodig!

## Wat zijn Application Passwords?

Application Passwords zijn een ingebouwde WordPress functie (sinds WordPress 5.6) waarmee je veilig externe applicaties toegang kunt geven tot je WordPress site zonder je hoofdwachtwoord te delen.

## Voordelen

✅ **Geen plugin nodig** - Gebruikt standaard WordPress functionaliteit
✅ **Veilig** - Genereer unieke wachtwoorden per applicatie
✅ **Eenvoudig te beheren** - Intrekken van toegang met één klik
✅ **REST API native** - Direct compatible met WordPress REST API

## WordPress Application Password Aanmaken

### Stap 1: Login in WordPress Admin
Login in je WordPress admin panel (bijvoorbeeld: `https://jouwsite.nl/wp-admin`)

### Stap 2: Ga naar je Profiel
1. Klik op je gebruikersnaam rechtsboven
2. Klik op "Profiel bewerken" of navigeer naar: **Gebruikers > Profiel**

### Stap 3: Genereer Application Password
1. Scroll naar beneden naar de sectie **"Application Passwords"**
2. Voer een naam in voor de applicatie (bijvoorbeeld: `WritGo`)
3. Klik op **"Add New Application Password"**
4. **Kopieer het gegenereerde wachtwoord direct!** (Je kunt het maar één keer zien)

Het wachtwoord ziet eruit als: `xxxx xxxx xxxx xxxx xxxx xxxx`

### Stap 4: Configureer in WritGo
1. Login in WritGo
2. Ga naar je project instellingen
3. Vul in:
   - **WordPress URL**: Je site URL (bijv. `https://jouwsite.nl`)
   - **Username**: Je WordPress gebruikersnaam
   - **Application Password**: Het gegenereerde wachtwoord (spaties worden automatisch verwijderd)

## Vereisten

### WordPress Versie
- **WordPress 5.6 of hoger** (Application Passwords is ingebouwd)

### Gebruikersrechten
De gebruiker moet de juiste rechten hebben:
- **Voor posts publiceren**: Editor of Administrator rol
- **Voor WooCommerce producten**: Shop Manager of Administrator rol

### REST API Moet Actief Zijn
De WordPress REST API moet bereikbaar zijn. Test dit:
```
https://jouwsite.nl/wp-json/wp/v2/posts
```

Als je een JSON response ziet, werkt de REST API! ✅

## Troubleshooting

### Application Passwords sectie niet zichtbaar?

**Oorzaak 1: HTTPS vereist**
Application Passwords werken alleen over HTTPS (behalve op localhost).

**Oplossing**:
- Zorg dat je site HTTPS gebruikt
- Of test lokaal op `localhost`

**Oorzaak 2: Security plugin blokkeert REST API**
Sommige security plugins (Wordfence, iThemes Security, etc.) blokkeren de REST API.

**Oplossing**:
1. Check je security plugin instellingen
2. Whitelist de REST API
3. Of schakel tijdelijk de plugin uit om te testen

**Oorzaak 3: XML-RPC is uitgeschakeld**
WordPress gebruikt XML-RPC voor Application Passwords authenticatie.

**Oplossing**:
Voeg toe aan `wp-config.php`:
```php
// Enable XML-RPC for Application Passwords
add_filter('xmlrpc_enabled', '__return_true');
```

### Authenticatie Fout (401 Unauthorized)

**Mogelijke oorzaken**:
1. **Verkeerd wachtwoord**: Controleer of je het Application Password correct hebt gekopieerd
2. **Verkeerde gebruikersnaam**: Gebruik je WordPress username (niet email)
3. **REST API disabled**: Check of de REST API bereikbaar is

**Test je credentials**:
```bash
# Vervang met jouw gegevens
curl -X GET https://jouwsite.nl/wp-json/wp/v2/posts \
  -u "username:xxxx xxxx xxxx xxxx xxxx xxxx"
```

Als je een lijst van posts ziet, werken je credentials! ✅

### REST API Niet Bereikbaar (404 Error)

**Oplossing 1: Permalink instellingen resetten**
1. Ga naar **Instellingen > Permalinks**
2. Klik op **"Wijzigingen opslaan"** (zonder iets te veranderen)
3. Dit regenereert de `.htaccess` regels

**Oplossing 2: Check .htaccess**
Controleer of `.htaccess` de juiste WordPress rewrite rules heeft:
```apache
# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
# END WordPress
```

### Hosting Provider Blokkeert Cloud IPs

Sommige Nederlandse hosting providers (Antagonist, TransIP, etc.) blokkeren cloud provider IPs (Render, Vercel, AWS).

**Oplossing 1: Cloudflare Worker Proxy** (aanbevolen)
Zie `CLOUDFLARE_WORKER_SETUP.md` voor instructies.

**Oplossing 2: IP Whitelisting**
Vraag je hosting provider om deze IPs te whitelisten:
- Render.com IP ranges
- Vercel IP ranges

**Oplossing 3: VPS Proxy**
Zie `PROXY_SETUP_GUIDE.md` voor het opzetten van een eigen proxy.

## Security Best Practices

### 1. Gebruik Unieke Application Passwords
Maak een apart Application Password voor elke externe applicatie.

### 2. Revoke Wanneer Niet Meer Nodig
Intrekken van toegang:
1. Ga naar **Gebruikers > Profiel**
2. Scroll naar **Application Passwords**
3. Klik op **"Revoke"** naast het wachtwoord

### 3. Monitor Gebruik
Check regelmatig welke Application Passwords actief zijn en verwijder ongebruikte.

### 4. Gebruik HTTPS
Application Passwords werken alleen over HTTPS (behalve localhost).

## Veelgestelde Vragen

### Kan ik mijn normale WordPress wachtwoord gebruiken?
Nee, de WordPress REST API accepteert alleen Application Passwords voor Basic Auth.

### Hoeveel Application Passwords kan ik maken?
Onbeperkt! Je kunt er zoveel maken als je wilt.

### Wat gebeurt er als ik mijn hoofdwachtwoord verander?
Application Passwords blijven werken. Ze zijn onafhankelijk van je hoofdwachtwoord.

### Kan ik Application Passwords uitschakelen?
Ja, maar dan werkt WritGo niet meer. Application Passwords zijn essentieel voor de integratie.

## Meer Informatie

- [WordPress Application Passwords Documentatie](https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/)
- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [WordPress REST API Authentication](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/)

## Support

Problemen met de WordPress integratie? Check:
1. Deze documentatie
2. `CLOUDFLARE_WORKER_SETUP.md` voor proxy setup
3. `PROXY_SETUP_GUIDE.md` voor VPS proxy setup
4. De error messages in WritGo (ze bevatten vaak specifieke instructies)
