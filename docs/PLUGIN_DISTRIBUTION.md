# Writgo Connector Plugin - Download & Distributie

## 📦 Download Locatie

De plugin is beschikbaar als zip bestand:

**Bestand:** `writgo-connector-v1.1.0.zip`
**Locatie:** `/home/user/Writgoai.nl/writgo-connector-v1.1.0.zip`
**Grootte:** ~7.2 KB

---

## 🚀 Distributie Opties

### Optie 1: Direct Download (Snelst - Aanbevolen voor Nu)

**Setup (5 minuten):**

1. **Upload naar je website:**
```bash
# Upload writgo-connector-v1.1.0.zip naar je server
# Bijv. naar: /public/downloads/writgo-connector.zip
```

2. **Maak download link:**
```
https://writgo.nl/downloads/writgo-connector.zip
```

3. **Email naar klanten:**
```
Download: https://writgo.nl/downloads/writgo-connector.zip

Installatie:
1. WordPress → Plugins → Upload Plugin
2. Kies het zip bestand
3. Klik "Install Now" → "Activate"
4. Settings → Writgo → "Genereer API Key"
```

**Voordelen:**
- ✅ Meteen beschikbaar
- ✅ Volledige controle
- ✅ Eigen branding

**Nadelen:**
- ⚠️ Geen automatische updates
- ⚠️ Handmatige versie tracking

---

### Optie 2: WordPress.org Plugin Directory (Beste op Lange Termijn)

**Setup (1-2 weken review tijd):**

1. **Maak WordPress.org account:**
   - Ga naar https://wordpress.org/support/register.php
   - Registreer met je email

2. **Submit plugin:**
   - Ga naar https://wordpress.org/plugins/developers/add/
   - Upload `writgo-connector-v1.1.0.zip`
   - Vul plugin details in
   - Submit voor review

3. **Wacht op goedkeuring:**
   - WordPress team reviewed de code (1-2 weken)
   - Je krijgt email bij goedkeuring
   - Plugin verschijnt in WordPress.org directory

4. **Na goedkeuring:**
   - Klanten kunnen installeren via: Plugins → Add New → Search "Writgo"
   - Automatische update notificaties
   - Statistieken (downloads, reviews, etc.)

**Voordelen:**
- ✅ Automatische updates (WordPress notificeert users)
- ✅ Vertrouwd (officiële WordPress directory)
- ✅ Betere vindbaarheid (SEO)
- ✅ Download statistieken
- ✅ User reviews mogelijk
- ✅ Gratis hosting

**Nadelen:**
- ⚠️ Review proces (1-2 weken wachten)
- ⚠️ Code moet aan WordPress richtlijnen voldoen
- ⚠️ Updates moeten ook ge-reviewed worden

---

### Optie 3: GitHub Releases (Voor Tech-Savvy Users)

**Setup (10 minuten):**

1. **Commit naar GitHub:**
```bash
git add wordpress-plugin/
git commit -m "Add WordPress plugin v1.1.0"
git tag v1.1.0
git push origin main --tags
```

2. **Create GitHub Release:**
   - Ga naar GitHub → Releases → "Create new release"
   - Tag: v1.1.0
   - Upload `writgo-connector-v1.1.0.zip` as asset
   - Publish release

3. **Download link:**
```
https://github.com/jouw-org/Writgoai.nl/releases/download/v1.1.0/writgo-connector-v1.1.0.zip
```

**Voordelen:**
- ✅ Versie tracking
- ✅ Changelog visible
- ✅ Gratis hosting

**Nadelen:**
- ⚠️ Alleen voor tech-savvy users
- ⚠️ Geen automatische updates in WordPress

---

## 📧 Email Templates voor Klanten

### Template 1: Direct Download Link

```
Onderwerp: Writgo WordPress Plugin - Download & Installeer in 2 Minuten

Beste [Naam],

Download de Writgo Connector plugin en verbind je WordPress in 2 minuten!

📥 DOWNLOAD PLUGIN:
https://writgo.nl/downloads/writgo-connector.zip

📝 INSTALLATIE (2 minuten):

Stap 1: Installeer Plugin
- Log in op WordPress
- Ga naar Plugins → Upload Plugin
- Kies writgo-connector.zip
- Klik "Install Now" → "Activate"

Stap 2: Genereer API Key
- Ga naar Settings → Writgo
- Klik "Genereer API Key"
- Kopieer de API Key en Endpoint URL

Stap 3: Verbind met Writgo
- Ga naar Writgo.nl → Project Settings
- Kies "WordPress Connector Plugin"
- Plak API Key en Endpoint
- Klik "Test Connection"

✅ Klaar!

De plugin werkt automatisch met:
- Yoast SEO
- RankMath SEO
- Alle hosting providers (geen IP whitelisting nodig)

Video tutorial: [link naar tutorial]

Vragen? Antwoord op deze email.

Groet,
Writgo Team
```

### Template 2: WordPress.org (Na Goedkeuring)

```
Onderwerp: Writgo Plugin Nu Beschikbaar in WordPress Directory!

Beste [Naam],

Goed nieuws! De Writgo Connector plugin is nu beschikbaar in de officiële WordPress plugin directory.

📥 INSTALLEER DIRECT VANUIT WORDPRESS:

Stap 1: Zoek Plugin
- WordPress Admin → Plugins → Add New
- Zoek naar "Writgo Connector"
- Klik "Install Now" → "Activate"

Stap 2: [Rest hetzelfde als Template 1]

Voordelen van de officiële plugin:
✅ Automatische updates
✅ Veilig (ge-reviewed door WordPress)
✅ Eenvoudige installatie

Groet,
Writgo Team
```

---

## 🛠️ Plugin Handmatig Testen

**Voor jezelf testen voordat je distribueert:**

1. **Setup test WordPress site:**
```bash
# Lokaal met Local by Flywheel of
# Online test site op bijv. InstaWP.com (gratis)
```

2. **Upload plugin:**
```
WordPress → Plugins → Upload Plugin
→ Kies writgo-connector-v1.1.0.zip
→ Activeer
```

3. **Genereer API key:**
```
WordPress → Settings → Writgo
→ "Genereer API Key"
→ Kopieer API Key + Endpoint
```

4. **Test connectie:**
```bash
curl -H "X-Writgo-API-Key: [jouw-key]" \
     https://test-site.com/wp-json/writgo/v1/test

# Verwacht response:
{
  "success": true,
  "wordpress_version": "6.4",
  "plugin_version": "1.1.0",
  "seo_plugin": "yoast"  # of "rankmath" of "none"
}
```

5. **Test publish:**
```bash
curl -X POST \
     -H "X-Writgo-API-Key: [jouw-key]" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Post",
       "content": "<p>Test content</p>",
       "status": "publish",
       "seo_title": "SEO Title",
       "seo_description": "SEO Description"
     }' \
     https://test-site.com/wp-json/writgo/v1/posts
```

6. **Verify in WordPress:**
```
WordPress → Posts → Check nieuwe post
→ Verify SEO data (Yoast/RankMath sectie)
```

---

## 📊 Distributie Aanbeveling

**Voor NU (Vandaag):**
1. ✅ **Direct Download** - Upload zip naar writgo.nl/downloads/
2. ✅ Email eerste 10-20 klanten met download link
3. ✅ Verzamel feedback
4. ✅ Fix eventuele bugs

**Over 1-2 Weken (Na Testing):**
1. ✅ Submit naar **WordPress.org**
2. ✅ Wacht op goedkeuring
3. ✅ Email alle klanten met nieuwe install methode

**Lange Termijn:**
1. ✅ Updates via WordPress.org (automatisch)
2. ✅ Direct download als backup
3. ✅ Nieuwe klanten krijgen WordPress.org link

---

## 🔄 Updates Pushen

### Direct Download Method

**Bij nieuwe versie (bijv. v1.2.0):**

1. Update versie nummers:
```php
// In writgo-connector.php
Version: 1.2.0

// In readme.txt
Stable tag: 1.2.0
```

2. Maak nieuwe zip:
```bash
cd wordpress-plugin
zip -r writgo-connector-v1.2.0.zip writgo-connector/
```

3. Upload nieuwe versie:
```bash
# Upload naar writgo.nl/downloads/writgo-connector.zip
# (Overschrijf oude versie)
```

4. Email klanten:
```
Update beschikbaar: v1.2.0
Download: https://writgo.nl/downloads/writgo-connector.zip
Deactiveer oude versie → Upload nieuwe versie → Activeer
```

### WordPress.org Method

**Bij nieuwe versie:**

1. Update versie nummers (zie boven)

2. SVN commit (WordPress.org gebruikt SVN):
```bash
svn co https://plugins.svn.wordpress.org/writgo-connector
cd writgo-connector/trunk
# Copy nieuwe bestanden
svn commit -m "Version 1.2.0"
```

3. **WordPress notificeert automatisch alle users!**
   - Users krijgen update notificatie in WordPress dashboard
   - One-click update

---

## 📞 Support Setup

**Maak support pagina:**

`https://writgo.nl/support/wordpress-plugin`

**Include:**
- FAQ
- Installatie video
- Troubleshooting guide
- Contact formulier

**Support email template:**

```
Voor plugin support, email naar:
support@writgo.nl

Of bezoek: https://writgo.nl/support/wordpress-plugin
```

---

## ✅ Checklist Voor Launch

**Voor eerste distributie:**

- [ ] Plugin getest op test WordPress site
- [ ] Getest met Yoast SEO
- [ ] Getest met RankMath SEO
- [ ] Getest zonder SEO plugin
- [ ] ZIP bestand gemaakt (writgo-connector-v1.1.0.zip)
- [ ] Upload locatie gekozen (writgo.nl/downloads/)
- [ ] Email template klaar
- [ ] Support pagina gemaakt
- [ ] Video tutorial opgenomen (optioneel maar aanbevolen)
- [ ] Eerste 10 beta testers gekozen
- [ ] Feedback formulier klaar

**Na beta testing (week 1-2):**

- [ ] Feedback verwerkt
- [ ] Eventuele bugs gefixed
- [ ] WordPress.org account aangemaakt
- [ ] Plugin submitted naar WordPress.org
- [ ] Wacht op goedkeuring

**Na WordPress.org goedkeuring:**

- [ ] Email alle klanten met nieuwe install methode
- [ ] Update documentatie
- [ ] Monitor reviews op WordPress.org
- [ ] Setup automatische updates

---

## 🎯 Download Link voor Klanten

**Korte URL (Aanbevolen):**
```
https://writgo.nl/plugin

→ Redirect naar: /downloads/writgo-connector.zip
```

**Of direct:**
```
https://writgo.nl/downloads/writgo-connector.zip
```

**Plugin info pagina:**
```
https://writgo.nl/wordpress-plugin
```

Bevat:
- Download link
- Installatie instructies
- Video tutorial
- FAQ
- Support link

---

## 📝 Conclusie

**Aanbevolen Aanpak:**

**Week 1 (NU):**
- Upload zip naar writgo.nl/downloads/
- Email 10-20 klanten voor beta test
- Verzamel feedback

**Week 2-3:**
- Fix bugs uit feedback
- Submit naar WordPress.org
- Email rest van klanten met direct download

**Week 4+ (Na WP.org goedkeuring):**
- Email alle klanten met WordPress.org link
- Automatische updates via WordPress
- Direct download als backup

**De plugin is klaar en kan morgen al gedistribueerd worden!** 🚀
