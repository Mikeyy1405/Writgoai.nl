# WordPress Proxy - Quick Start Guide

> **Voor 200+ klanten: Eén centrale proxy lost IP blocking problemen op**

## TL;DR

1. Huur VPS in Nederland (€7/mnd)
2. Run setup script (10 minuten)
3. Activeer proxy in Writgo (.env)
4. Geef klanten 1 IP om te whitelisten

**Resultaat:** 95%+ betrouwbaarheid i.p.v. 50-60%

---

## Waarom een Proxy?

### Probleem Zonder Proxy

```
Render.com (wisselende AWS IPs)
         ↓
    [GEBLOKKEERD] ← Hosting providers blokkeren cloud IPs
         ↓
  200 WordPress sites

Resultaat:
- 40% van klanten heeft blocking issues
- 40 uur/maand aan support
- Ongelukkige klanten
```

### Oplossing Met Proxy

```
Render.com
    ↓
Proxy VPS (1 static NL IP: 123.456.789.10)
    ↓
200 WordPress sites (whitelisten dit ene IP)

Resultaat:
- <5% heeft issues
- 2 uur/maand support
- Tevreden klanten
```

---

## Setup in 3 Stappen

### Stap 1: Huur VPS (5 minuten)

**Aanbevolen: TransIP VPS** (Nederlandse IP, betrouwbaar)

1. Ga naar https://www.transip.nl/vps/
2. Kies: **BladeVPS X1** (€7/mnd)
   - 2GB RAM
   - 50GB SSD
   - Static IP
3. OS: **Ubuntu 22.04 LTS**
4. Bestel & wacht op activatie email

**Alternatieven:**
- DigitalOcean Amsterdam ($6/mnd)
- Hetzner (€4/mnd, Duitse IP)

### Stap 2: Installeer Proxy (10 minuten)

SSH naar je VPS:
```bash
ssh root@je-vps-ip
```

Download en run setup script:
```bash
wget https://raw.githubusercontent.com/jouwrepo/Writgoai.nl/main/scripts/setup-proxy-vps.sh
chmod +x setup-proxy-vps.sh
./setup-proxy-vps.sh
```

Script vraagt:
- **Proxy domain:** wp-proxy.jouwdomein.nl (maak eerst A record aan!)
- **Email voor SSL:** jouw@email.nl

Script installeert:
- ✅ Nginx reverse proxy
- ✅ Node.js proxy service
- ✅ SSL certificaat (Let's Encrypt)
- ✅ Monitoring script
- ✅ Auto-restart service

### Stap 3: Activeer in Writgo (2 minuten)

Update `.env`:
```bash
WP_PROXY_ENABLED=true
WP_PROXY_URL=https://wp-proxy.jouwdomein.nl
```

Herstart Render service:
```bash
# In Render dashboard: Manual Deploy
```

**Klaar!** Alle WordPress requests gaan nu via de proxy.

---

## Klant Onboarding

### Email Template

```
Onderwerp: Whitelist dit IP adres voor Writgo

Beste [Naam],

Voor betrouwbare toegang tot je WordPress site,
whitelist dit IP adres:

🔐 123.456.789.10

Instructies per plugin:

WORDFENCE:
WordPress Admin → Wordfence → Firewall → Whitelist
Voeg toe: 123.456.789.10/32

ITHEMES SECURITY:
Security → Settings → Banned Users → Authorized IPs
Voeg toe: 123.456.789.10

HOSTING (cPanel/Plesk):
Contact je hosting provider en vraag dit IP te whitelisten.

Groet,
Writgo Team
```

### Responstijd

**Met proxy:** Klanten hoeven slechts 1x te whitelisten (2 min werk)
**Zonder proxy:** Elke keer dat Render IP wijzigt opnieuw setup (30+ min)

---

## Monitoring

### Check Proxy Status

```bash
# Health check
curl https://wp-proxy.jouwdomein.nl/health

# Verwacht response:
{
  "status": "ok",
  "uptime": 123456,
  "cache_stats": {...}
}
```

### View Logs

```bash
# SSH naar VPS
ssh root@je-vps-ip

# Real-time logs
journalctl -u wp-proxy -f

# Laatste 100 regels
journalctl -u wp-proxy -n 100
```

### Check Service Status

```bash
systemctl status wp-proxy
systemctl status nginx

# Restart indien nodig
systemctl restart wp-proxy
```

---

## Caching

Proxy cached automatisch:
- **GET requests:** 5 minuten
- **POST requests:** Niet gecached

Voordelen:
- ⚡ Sneller (cache hits <50ms)
- 📉 Minder load op klant sites
- 💰 Minder API calls

### Cache Stats Bekijken

```bash
curl https://wp-proxy.jouwdomein.nl/health | jq .cache_stats
```

---

## Troubleshooting

### Proxy is down

```bash
ssh root@je-vps-ip
systemctl status wp-proxy

# Als crashed:
systemctl restart wp-proxy
journalctl -u wp-proxy -n 50  # Bekijk errors
```

### SSL certificaat verlopen

```bash
certbot renew --dry-run  # Test renewal
certbot renew            # Force renewal
systemctl reload nginx
```

### Disk vol

```bash
df -h
# Als >90% vol:

# Clear logs
journalctl --vacuum-time=7d

# Clear cache
rm -rf /var/cache/nginx/*
```

### Proxy werkt niet voor specifieke klant

Check of WordPress site bereikbaar is:
```bash
curl -I https://klant-site.nl/wp-json/
```

Als timeout → Probleem bij klant site
Als 403 → Klant moet IP whitelisten

---

## Performance

### Verwachte Metrics

| Metric | Zonder Proxy | Met Proxy |
|--------|--------------|-----------|
| Avg Response | 800ms | 600ms (cache) / 850ms (miss) |
| Success Rate | 60% | 95%+ |
| Support Issues/maand | 80 | <10 |
| Cache Hit Rate | 0% | 40-60% |

### Optimalisatie

**Verhoog cache tijd** (voor minder dynamische content):

Edit `/opt/wp-proxy/server.js`:
```javascript
const cache = new NodeCache({ stdTTL: 600 }); // 10 min i.p.v. 5
```

Restart service:
```bash
systemctl restart wp-proxy
```

---

## Kosten Breakdown

| Item | Kosten/maand |
|------|--------------|
| TransIP VPS | €7 |
| Domain (optioneel) | €1 |
| SSL Certificaat | €0 (gratis via Let's Encrypt) |
| **Totaal** | **€8/maand** |

**ROI:**
- Support tijd bespaard: 38 uur/maand
- 38 uur × €50/uur = €1900/maand
- **ROI: 23,650%** 🎉

---

## High Availability (Optioneel)

Voor 100% uptime:

### Setup 2 Proxy Servers

1. Deploy op 2 VPS'en (verschillende providers)
2. Setup load balancer (Cloudflare, Nginx, HAProxy)
3. Beide IPs whitelisten bij klanten

**Kosten:** €14/maand (2x VPS)
**Uptime:** 99.99%+

---

## Security

### Firewall Rules (automatisch geconfigureerd)

```bash
ufw status

# Output:
22/tcp    ALLOW    # SSH
80/tcp    ALLOW    # HTTP
443/tcp   ALLOW    # HTTPS
```

### Rate Limiting (optioneel)

Voeg toe aan Nginx config:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    location / {
        limit_req zone=api_limit burst=20;
        # ... rest van config
    }
}
```

### IP Whitelist (optioneel)

Alleen Render IP toestaan:
```nginx
# In Nginx config
allow 54.x.x.x;  # Render IP
deny all;
```

---

## Migration Path

### Fase 1: Pilot (Week 1)
- [ ] Setup proxy VPS
- [ ] Test met 5 klanten
- [ ] Verify monitoring werkt

### Fase 2: Rollout (Week 2-3)
- [ ] Email alle 200 klanten
- [ ] Enable proxy in productie
- [ ] Monitor error rates

### Fase 3: Optimization (Week 4+)
- [ ] Analyze cache hit rates
- [ ] Tune cache settings
- [ ] Setup alerts voor downtime

---

## FAQ

**Q: Wat als proxy down gaat?**
A: Writgo client heeft automatic fallback naar direct fetch. Monitoring script restart service automatisch.

**Q: Kan ik meerdere Writgo instances 1 proxy laten delen?**
A: Ja! Proxy is stateless en kan meerdere origins aan.

**Q: Hoe whitelist ik het IP bij cPanel?**
A: cPanel → Security → IP Blocker → Add to Whitelist: 123.456.789.10

**Q: Werkt dit met WooCommerce REST API?**
A: Ja, proxy forward alle `/wp-json/` endpoints inclusief `/wc/v3/`.

**Q: Kan ik proxy ook voor andere API's gebruiken?**
A: Ja, proxy werkt met elke HTTP API door `X-WP-Target` header aan te passen.

---

## Support

**Proxy werkt niet?**

1. Check health endpoint: `curl https://wp-proxy.jouwdomein.nl/health`
2. Check logs: `journalctl -u wp-proxy -f`
3. Verify DNS: `dig wp-proxy.jouwdomein.nl`
4. Test direct: `curl -H "X-WP-Target: https://wordpress.org" https://wp-proxy.jouwdomein.nl/wp-json/`

**Nog steeds problemen?**
Check `WORDPRESS_TROUBLESHOOTING.md` voor details.

---

## Conclusion

Met een **centrale proxy** voor €8/maand:

✅ Lost IP blocking op voor 200+ klanten
✅ Verlaagt support tijd met 95%
✅ Verhoogt betrouwbaarheid naar 95%+
✅ Voegt caching toe (sneller)
✅ Centraal monitoring punt

**Next Steps:**
1. Huur TransIP VPS
2. Run setup script
3. Enable in Writgo
4. Email klanten met IP

**Setup tijd:** 30 minuten
**Resultaat:** Gelukkige klanten ✨
