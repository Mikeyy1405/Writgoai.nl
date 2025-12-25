# Simpele Fix: IP Whitelisting

## Waarom Dit De Beste Eerste Stap Is

Je hoeft GEEN proxy server op te zetten. Vraag gewoon de hosting provider van yogastartgids.nl om Render's IP adressen te whitelisten.

---

## Stap 1: Vind Render's IP Adressen

### Via Render Dashboard:
1. Ga naar https://dashboard.render.com
2. Klik op je service (Writgoai)
3. Ga naar **Settings** → scroll naar **Outbound IP Addresses**
4. Kopieer alle IP adressen

### Of: Maak een diagnostic endpoint

Ik kan een simpel endpoint maken dat je IP toont. Dan roep je die 1x aan en je hebt je IP.

---

## Stap 2: Wie Host yogastartgids.nl?

LiteSpeed server = vaak deze hosting providers:

### Check Wie De Host Is:

```bash
whois yogastartgids.nl | grep -i "registrar\|hosting"
```

### Veelvoorkomende LiteSpeed Hosters:
- **TransIP** (my.transip.nl)
- **Antagonist** (my.antagonist.nl)
- **Vimexx** (my.vimexx.nl)
- **Byte** (my.byte.nl)
- **Hostnet** (my.hostnet.nl)

---

## Stap 3: Contact Hosting Support

### Email Template:

```
Onderwerp: Whitelist verzoek - API toegang voor Render.com

Hallo,

Ik gebruik een externe service (Render.com) die API requests maakt
naar mijn WordPress site yogastartgids.nl via de REST API.

Momenteel worden deze requests geblokkeerd met een timeout error.
Kunnen jullie de volgende IP adressen whitelisten voor mijn website?

IP adressen van Render.com:
- [IP 1]
- [IP 2]
- [IP 3]

Dit is voor legitieme API toegang naar wp-json endpoints voor
geautomatiseerde content publicatie.

Alvast bedankt!

[Je naam]
```

### Support Kanalen Per Provider:

**TransIP:**
- Login: https://my.transip.nl
- Support → Ticket aanmaken
- Of: Live chat (9-17u)

**Antagonist:**
- Email: support@antagonist.nl
- Tel: 085 48 88 555
- Ticket via: https://my.antagonist.nl

**Vimexx:**
- Login: https://my.vimexx.nl
- Support → Nieuw ticket
- Live chat beschikbaar

---

## Stap 4: Wacht Op Respons

De meeste hosters reageren binnen 24 uur.

### Als Ze Nee Zeggen:

Vraag dan of ze een **whitelist IP range** accepteren of
welk alternatief ze voorstellen.

---

## Stap 5: Test Na Whitelist

Zodra ze de IPs hebben gewhitelist, test direct:

1. Ga naar je Writgo app
2. Probeer WordPress verbinding opnieuw
3. Check de logs in Render

Moet nu werken! ✅

---

## Waarom Dit Beter Is Dan Proxy:

| Aspect | Whitelist | Proxy Server |
|--------|-----------|--------------|
| **Kosten** | Gratis | €6/maand |
| **Setup tijd** | 5 min | 30 min |
| **Onderhoud** | Geen | Regelmatig |
| **Snelheid** | Direct | Via proxy (trager) |
| **Complexiteit** | Simpel | Complex |

---

## Als Whitelist Niet Werkt:

Dan pas gaan we naar:
1. Render Static IP (betaald add-on bij Render)
2. Proxy server (zie PROXY_SETUP_GUIDE.md)
3. Ander hosting platform

Maar probeer EERST whitelist - het is verreweg het makkelijkst!
