# WordPress Proxy Setup Guide

## Probleem
Render.com (en andere cloud providers) worden vaak geblokkeerd door Nederlandse hosting providers. Dit veroorzaakt connection timeouts bij WordPress API requests.

## Oplossing: Proxy Server

Door een proxy server te gebruiken, kunnen we WordPress API requests doorsturen via een IP dat niet geblokkeerd wordt.

---

## Optie 1: Gratis Proxy Services (Voor Testen)

### Let op
Gratis proxies zijn **NIET** geschikt voor productie:
- Vaak traag en onbetrouwbaar
- Kunnen verkeer monitoren
- Geen uptime garantie

**Voor productie**: Gebruik altijd een betaalde proxy of je eigen VPS!

---

## Optie 2: Betaalde Proxy Services (Aanbevolen)

### BrightData (voorheen Luminati)
- Betrouwbare residential proxies
- Nederlandse IP's beschikbaar
- Prijs: vanaf $500/maand

**Setup:**
```bash
# In Render.com dashboard, ga naar je service > Environment
# Voeg toe:
WORDPRESS_PROXY_URL=http://username:password@proxy.brightdata.com:22225
```

### Smartproxy
- Goed alternatief voor BrightData
- Goedkoper: vanaf $75/maand
- Nederlandse proxies beschikbaar

**Setup:**
```bash
WORDPRESS_PROXY_URL=http://username:password@gate.smartproxy.com:7000
```

### Oxylabs
- Enterprise-level proxies
- Zeer stabiel
- Prijs: vanaf $300/maand

**Setup:**
```bash
WORDPRESS_PROXY_URL=http://username:password@pr.oxylabs.io:7777
```

---

## Optie 3: Eigen VPS als Proxy (Beste Prijs/Kwaliteit) 🎯

### Waarom Dit De Beste Optie Is
✅ Volledig onder jouw controle
✅ Nederlandse IP (niet geblokkeerd)
✅ Goedkoop (~€5-10/maand)
✅ Geen verkeerslimiet
✅ Privacy gegarandeerd

### Stap 1: VPS Huren in Nederland

**Aanbevolen providers:**

**TransIP** (Nederlands, goede support)
- VPS Blade X1: €6/maand
- Locatie: Amsterdam
- Website: transip.nl

**DigitalOcean** (Internationaal, betrouwbaar)
- Basic Droplet: $4/maand
- Locatie: Amsterdam
- Website: digitalocean.com

**Hetzner** (Duits, zeer goedkoop)
- CX11: €4.15/maand
- Locatie: Falkenstein (DE) of Helsinki (FI)
- Website: hetzner.com

### Stap 2: Proxy Server Installeren op VPS

SSH naar je VPS:
```bash
ssh root@your-vps-ip
```

**Installeer Squid Proxy:**
```bash
# Ubuntu/Debian
apt update
apt install squid apache2-utils -y

# Configureer Squid
cat > /etc/squid/squid.conf << 'EOF'
# Squid Proxy Configuratie voor Writgo WordPress API

# Poort waarop proxy luistert
http_port 3128

# Authenticatie setup
auth_param basic program /usr/lib/squid/basic_ncsa_auth /etc/squid/passwords
auth_param basic realm Writgo Proxy
acl authenticated proxy_auth REQUIRED

# Sta alleen geauthenticeerde requests toe
http_access allow authenticated
http_access deny all

# Logs
access_log /var/log/squid/access.log squid

# Cache instellingen (optioneel, kan helpen met performance)
cache_dir ufs /var/spool/squid 100 16 256
maximum_object_size 4096 KB

# DNS settings
dns_nameservers 8.8.8.8 1.1.1.1

# Timeout settings (belangrijk voor WordPress)
connect_timeout 120 seconds
read_timeout 120 seconds
request_timeout 120 seconds

# Forward all requests
never_direct allow all
EOF

# Maak gebruiker aan voor authenticatie
htpasswd -c /etc/squid/passwords writgo
# Je wordt gevraagd een wachtwoord in te voeren

# Start Squid
systemctl restart squid
systemctl enable squid
```

**Firewall Configureren:**
```bash
# UFW (Ubuntu Firewall)
ufw allow 22/tcp    # SSH
ufw allow 3128/tcp  # Squid Proxy
ufw enable
```

### Stap 3: Test De Proxy

Vanaf je lokale machine:
```bash
# Test zonder authenticatie (zou moeten falen)
curl -x http://your-vps-ip:3128 https://yogastartgids.nl/wp-json

# Test met authenticatie (zou moeten werken)
curl -x http://writgo:your-password@your-vps-ip:3128 https://yogastartgids.nl/wp-json
```

### Stap 4: Configureer in Render.com

1. Ga naar je Render.com dashboard
2. Selecteer je service
3. Ga naar **Environment** tab
4. Voeg toe:
   ```
   Key: WORDPRESS_PROXY_URL
   Value: http://writgo:your-password@your-vps-ip:3128
   ```
5. Klik **Save Changes**
6. Render zal je service automatisch herstarten

---

## Verificatie

Na het instellen van de proxy, check de logs in Render:

**Succesvolle proxy verbinding:**
```
[WP-PROXY] Proxy configured: http://writgo:****@your-vps-ip:3128
[WP-TEST] [Attempt 1/4] Fetching https://yogastartgids.nl/wp-json/...
[WP-TEST] ✓ Request completed in 450ms with status 200
```

**Proxy werkt niet:**
```
[WP-PROXY] Proxy configured: http://writgo:****@wrong-ip:3128
[WP-TEST] ✗ Attempt 1 failed: connect ECONNREFUSED
```

---

## Troubleshooting

### Error: "Connection refused"
- Check of Squid draait: `systemctl status squid`
- Check firewall: `ufw status`
- Verify poort 3128 is open

### Error: "Authentication required"
- Controleer username/password in WORDPRESS_PROXY_URL
- Regenerate password: `htpasswd /etc/squid/passwords writgo`

### Error: "Timeout"
- Verhoog timeouts in squid.conf
- Restart squid: `systemctl restart squid`

### WordPress API nog steeds geblokkeerd
- Mogelijk blokkeert de WordPress host ook je VPS IP
- Probeer een VPS in een andere locatie
- Contact WordPress hosting support

---

## Kosten Overzicht

| Oplossing | Kosten/maand | Uptime | Privacy | Support |
|-----------|--------------|--------|---------|---------|
| Gratis Proxy | €0 | ⭐ | ⚠️ | ❌ |
| BrightData | €450+ | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| Smartproxy | €70+ | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| Eigen VPS | €5-10 | ⭐⭐⭐⭐ | ✅✅ | ⭐⭐⭐ |

**Aanbeveling**: Start met een eigen VPS (TransIP of DigitalOcean). Kost €5-10/maand en geeft je volledige controle.

---

## Beveiliging Tips

1. **Gebruik altijd authenticatie** op je proxy
2. **Rotate wachtwoorden** regelmatig
3. **Monitor logs** voor ongebruikelijk verkeer:
   ```bash
   tail -f /var/log/squid/access.log
   ```
4. **Beperk toegang** tot alleen Render IP's (optioneel):
   ```squid
   acl render_ips src 1.2.3.4/32
   http_access allow render_ips authenticated
   ```

---

## Support

Vragen? Check de logs:
- Render logs: Render Dashboard > Logs tab
- Proxy logs: `ssh root@vps-ip "tail -100 /var/log/squid/access.log"`

Voor problemen: open een issue op GitHub.
