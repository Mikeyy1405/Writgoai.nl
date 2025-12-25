# Render IP Whitelisting Gids

## Probleem
Render.com wordt geblokkeerd door Nederlandse hosting providers die cloud IP's als "bots" zien.

## Oplossing 1: Render IP Range Whitelisten

### Stap 1: Krijg je Render Outbound IP's
1. Ga naar je Render dashboard
2. Klik op je service
3. Ga naar "Settings" → "Outbound IPs"
4. Of gebruik deze API call:
```bash
curl https://api.ipify.org?format=json
```
Vanaf je Render service (via een diagnostics endpoint).

### Stap 2: Contact Hosting Provider
Neem contact op met de hosting provider van je WordPress site en vraag:

**Email Template:**
```
Onderwerp: Whitelist verzoek voor API toegang

Hallo,

Ik gebruik een external service (Render.com) die toegang nodig heeft tot mijn WordPress REST API.
De verbindingen worden momenteel geblokkeerd.

Kunnen jullie de volgende IP adressen whitelisten voor mijn website [SITE_URL]?

IP adressen:
- [RENDER_IP_1]
- [RENDER_IP_2]
- etc.

Dit is voor legitieme API toegang tot mijn eigen WordPress site.

Bedankt!
```

### Bekende Nederlandse Hosters
- **TransIP**: Support ticket via my.transip.nl
- **Antagonist**: Email naar support@antagonist.nl
- **Byte**: Support via byte.nl/support
- **Vimexx**: Ticket via my.vimexx.nl

## Oplossing 2: Render Static IP Add-on
Render biedt static IPs aan als add-on:
- Maakt whitelisting eenvoudiger
- Kost extra per maand
- Niet gegarandeerd dat het werkt (sommige hosters blokkeren alle cloud IPs)

## Oplossing 3: Tijdelijk Firewall Uitschakelen
Test of dit het probleem is:
1. Log in op WordPress admin
2. Ga naar security plugin (Wordfence/iThemes/etc)
3. Schakel tijdelijk firewall uit
4. Test opnieuw
5. Als het werkt: voeg whitelist regels toe in de plugin

## Oplossing 4: Alternatieve Deployment
Als Render geblokkeerd blijft:
- Vercel (heeft andere IP ranges)
- Railway.app
- Fly.io
- DigitalOcean App Platform

Let op: Deze kunnen ook geblokkeerd worden door sommige hosters.
