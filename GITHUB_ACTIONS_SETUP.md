# GitHub Actions Setup voor WritGo AutoPilot

## ✅ Wat is er geconfigureerd?

GitHub Actions draait nu automatisch de WritGo AutoPilot **elke 6 uur**.

### Workflow: `.github/workflows/autopilot.yml`

**Schedule:**
- Elke 6 uur: `0 */6 * * *`
- Tijden (UTC): 00:00, 06:00, 12:00, 18:00
- Tijden (CET): 01:00, 07:00, 13:00, 19:00

**Taken:**
1. Check 19 RSS feeds voor nieuwe content
2. Genereer AI artikelen (2500+ woorden)
3. Publiceer geplande artikelen

## 🚀 Hoe te gebruiken?

### Automatisch
De workflow draait automatisch elke 6 uur. Geen actie nodig!

### Handmatig triggeren
1. Ga naar GitHub repo: `Mikeyy1405/Writgoai.nl`
2. Klik op **Actions** tab
3. Selecteer **WritGo AutoPilot** workflow
4. Klik **Run workflow** → **Run workflow**

### Logs bekijken
1. Ga naar **Actions** tab
2. Klik op een workflow run
3. Zie output en status

## 📊 Monitoring

**Workflow Status:**
- ✅ Groen = Succesvol
- ❌ Rood = Gefaald
- 🟡 Geel = Bezig

**Email Notifications:**
GitHub stuurt automatisch een email bij failures (als je notifications aan hebt staan).

**Instellingen aanpassen:**
1. GitHub repo → Settings
2. Notifications → Actions
3. Kies wanneer je emails wilt ontvangen

## 🔧 Workflow aanpassen

### Schedule wijzigen

**Elke 3 uur:**
```yaml
schedule:
  - cron: '0 */3 * * *'
```

**Elke 12 uur:**
```yaml
schedule:
  - cron: '0 */12 * * *'
```

**Dagelijks om 10:00 UTC:**
```yaml
schedule:
  - cron: '0 10 * * *'
```

**Meerdere tijden:**
```yaml
schedule:
  - cron: '0 6,12,18 * * *'  # 06:00, 12:00, 18:00 UTC
```

### Cron Syntax

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

**Voorbeelden:**
- `0 */6 * * *` = Elke 6 uur
- `0 9 * * *` = Elke dag om 09:00
- `0 9 * * 1` = Elke maandag om 09:00
- `*/30 * * * *` = Elke 30 minuten

## ⚠️ Belangrijke Notes

### GitHub Actions Limits (Free tier)
- ✅ 2000 minuten per maand (gratis)
- ✅ Deze workflow gebruikt ~1 minuut per run
- ✅ 4 runs per dag × 30 dagen = 120 minuten/maand
- ✅ **Ruim binnen limiet!**

### Timezone
- GitHub Actions gebruikt **UTC** timezone
- Nederland is UTC+1 (winter) of UTC+2 (zomer)
- Reken tijden om als je specifieke tijden wilt

### Reliability
- GitHub Actions is zeer betrouwbaar (99.9% uptime)
- Bij failures wordt automatisch geretried
- Email notifications bij problemen

## 🐛 Troubleshooting

### Workflow draait niet?

**Check 1: Is workflow enabled?**
- GitHub repo → Actions
- Check of workflows enabled zijn

**Check 2: Zijn er recente commits?**
- GitHub Actions werkt alleen in actieve repos
- Push een commit als repo inactief is

**Check 3: Check workflow syntax**
- Ga naar Actions tab
- Kijk of er syntax errors zijn

### API endpoint bereikbaar?

**Test handmatig:**
```bash
curl -X POST https://writgo.nl/api/cron/autopilot
```

**Verwachte response:**
```json
{
  "success": true,
  "timestamp": "2024-12-21T13:00:00Z",
  "checkTriggers": {...},
  "autoPublish": {...}
}
```

### Workflow faalt steeds?

**Check logs:**
1. Actions tab → Failed workflow
2. Bekijk error message
3. Fix issue in code
4. Push nieuwe commit

**Common issues:**
- API endpoint down → Check Render deployment
- Database errors → Check Supabase
- Rate limits → Verlaag frequency

## 📈 Optimalisatie

### Snellere runs
Als je meer content wilt:
```yaml
schedule:
  - cron: '0 */3 * * *'  # Elke 3 uur
```

### Langzamere runs
Als je minder content wilt:
```yaml
schedule:
  - cron: '0 */12 * * *'  # Elke 12 uur
```

### Specifieke tijden
Alleen tijdens werkuren:
```yaml
schedule:
  - cron: '0 9,13,17 * * 1-5'  # 9am, 1pm, 5pm op werkdagen
```

## ✅ Checklist

- [x] GitHub Actions workflow aangemaakt
- [x] Schedule ingesteld (elke 6 uur)
- [x] Handmatig triggeren mogelijk
- [x] Error handling toegevoegd
- [x] Summary output geconfigureerd
- [ ] Test handmatig triggeren
- [ ] Wacht op eerste automatische run
- [ ] Check logs en output
- [ ] Verifieer artikelen worden gepubliceerd

## 🎯 Volgende Stappen

1. **Push deze changes naar GitHub**
   ```bash
   git add .github/workflows/autopilot.yml
   git commit -m "Add GitHub Actions for AutoPilot"
   git push
   ```

2. **Test handmatig**
   - Ga naar Actions tab
   - Run workflow handmatig
   - Check output

3. **Monitor eerste automatische run**
   - Wacht tot volgende scheduled tijd
   - Check logs
   - Verifieer content

4. **Optimaliseer schedule**
   - Pas aan op basis van resultaten
   - Meer/minder frequent

---

**Status:** ✅ Ready to Deploy
**Last Updated:** December 21, 2024
