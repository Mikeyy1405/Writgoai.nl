# Admin Dashboard 2.0 - Quick Start Guide

## 🚀 Snelstart in 5 Minuten

### 1. Verifieer Environment Variables

Zorg dat deze variabelen zijn ingesteld:

```bash
MONEYBIRD_ACCESS_TOKEN=your_moneybird_token
MONEYBIRD_ADMINISTRATION_ID=your_admin_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 2. Start de Applicatie

```bash
cd nextjs_space
npm run dev
```

### 3. Open Dashboard

Navigate naar: **http://localhost:3000/admin**

Login met admin credentials (info@writgo.nl)

### 4. Verken het Dashboard

- **KPI's**: Bovenaan zie je 6 KPI kaarten met key metrics
- **Grafieken**: Omzet trends, klanten groei, factuur status
- **Activiteit**: Recente transacties uit Moneybird
- **Top Klanten**: Ranglijst op omzet
- **Vandaag**: Acties voor vandaag

### 5. Sync Data

Klik op **Sync** knop rechtsboven om data te verversen.

---

## 📁 Belangrijke Bestanden

### API
- `app/api/admin/dashboard-stats/route.ts` - Main data endpoint

### Components
- `components/admin/dashboard/kpi-cards.tsx` - KPI kaarten
- `components/admin/dashboard/revenue-chart.tsx` - Omzet grafiek
- `components/admin/dashboard/client-growth-chart.tsx` - Groei grafiek
- `components/admin/dashboard/invoice-status-chart.tsx` - Status donut
- `components/admin/dashboard/activity-feed.tsx` - Activiteit feed
- `components/admin/dashboard/top-clients.tsx` - Top klanten
- `components/admin/dashboard/today-widget.tsx` - Vandaag widget

### Page
- `app/admin/page.tsx` - Main dashboard page

---

## 🔧 Troubleshooting

### Dashboard laadt niet
```bash
# Check Moneybird credentials
echo $MONEYBIRD_ACCESS_TOKEN
echo $MONEYBIRD_ADMINISTRATION_ID

# Check browser console voor errors
# Check /api/admin/dashboard-stats direct
curl http://localhost:3000/api/admin/dashboard-stats
```

### Geen data zichtbaar
- Verifieer Moneybird heeft data
- Check API token is niet expired
- Verifieer database connectivity

### Sync werkt niet
- Check network tab in browser
- Verifieer API response in console
- Check error messages

---

## 📊 Dashboard Features

### KPI Kaarten (6x)
1. **Klanten** - Totaal + actieve percentage
2. **MRR** - Monthly Recurring Revenue + ARR
3. **Omzet** - Deze maand vs vorige maand
4. **Openstaand** - Te ontvangen bedrag
5. **Te Laat** - Verlopen facturen
6. **Credits** - Gebruikt deze maand

### Grafieken (4x)
1. **Omzet & Uitgaven** - Area chart, 12 maanden
2. **Klanten Groei** - Line chart, totaal + nieuw
3. **Factuur Status** - Donut chart, 4 categorieën
4. *(Client Growth geïntegreerd in #2)*

### Widgets (3x)
1. **Recente Activiteit** - Laatste 10 transacties
2. **Top 5 Klanten** - Gerangschikt op omzet
3. **Vandaag** - Dagelijkse acties

---

## 🎨 UI Highlights

### Kleuren
- **Primary**: #FF6B35 (WritGo orange)
- **Success**: #10b981 (green)
- **Warning**: #eab308 (yellow)
- **Danger**: #ef4444 (red)
- **Info**: #3b82f6 (blue)

### Responsive
- **Desktop**: 6-column KPI grid
- **Tablet**: 3-column KPI grid
- **Mobile**: 2-column KPI grid

### Dark Theme
Consistent met bestaande WritGo UI

---

## 🔒 Security

✅ **Authentication Required**
- Admin/superadmin role only
- Session-based auth met NextAuth

✅ **Data Validation**
- All external data validated
- Safe parsing with fallbacks

✅ **No Vulnerabilities**
- CodeQL scan: 0 issues
- Code review: All fixed

---

## 📚 Volledige Documentatie

1. **README** - `ADMIN_DASHBOARD_20_README.md`
   - Complete implementatie details
   - API documentation
   - Troubleshooting

2. **Security** - `SECURITY_SUMMARY_ADMIN_DASHBOARD_20.md`
   - Security analysis
   - CodeQL results
   - Best practices

3. **Visual Guide** - `ADMIN_DASHBOARD_20_VISUAL_GUIDE.md`
   - Dashboard layout
   - Component details
   - Accessibility

---

## ⚡ Quick Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Start production
npm run start

# Test API endpoint
curl -X GET http://localhost:3000/api/admin/dashboard-stats \
  -H "Cookie: next-auth.session-token=..."
```

---

## 🎯 Key Endpoints

### API
- **GET** `/api/admin/dashboard-stats` - Dashboard data

### Pages
- **GET** `/admin` - Main dashboard
- **GET** `/admin/clients` - Client management
- **GET** `/admin/financien` - Financial details

---

## 💡 Tips

1. **Gebruik Sync** regelmatig voor actuele data
2. **Check Vandaag widget** voor dagelijkse acties
3. **Monitor Top Klanten** voor opportunities
4. **Review Activiteit** voor recente changes
5. **Analyseer Grafieken** voor trends

---

## 🆘 Hulp Nodig?

1. Check deze Quick Start
2. Lees de volledige README
3. Check Security Summary voor security vragen
4. Review Visual Guide voor UI details
5. Contact development team

---

## ✅ Checklist voor Eerste Gebruik

- [ ] Environment variables ingesteld
- [ ] Applicatie gestart
- [ ] Admin login succesvol
- [ ] Dashboard laadt
- [ ] KPI's tonen data
- [ ] Grafieken renderen
- [ ] Sync werkt
- [ ] Responsive op mobile
- [ ] Nederlandse labels OK

---

**Quick Start Version**: 1.0  
**Last Updated**: 2025-12-09  
**Status**: ✅ Production Ready

Voor vragen: Check volledige documentatie of contact development team.
