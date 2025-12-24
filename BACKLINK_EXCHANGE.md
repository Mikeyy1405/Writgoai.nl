# 🔗 WritGo Backlink Exchange Network

## Wat is het?

Het **Backlink Exchange Network** is een systeem waarmee alle WritGo gebruikers automatisch backlinks kunnen uitwisselen met elkaar. Dit betekent betere SEO voor iedereen door wederzijdse linkbuilding.

## Hoe werkt het?

### Voor Gebruikers

1. **Opt-in**: Zet in je project instellingen de optie `participate_in_backlink_exchange` aan
2. **Kies categorie**: Selecteer een categorie (bijv. "SEO", "WordPress", "Marketing") om te matchen met relevante sites
3. **Automatisch**: Alle gegenereerde content bevat nu automatisch 2-4 backlinks naar andere WritGo gebruikers
4. **Win-Win**: Andere WritGo gebruikers linken ook naar jouw artikelen

### Instellingen

- **`participate_in_backlink_exchange`**: Opt-in voor het netwerk (standaard: false)
- **`backlink_exchange_category`**: Categorie voor matching (bijv. "SEO", "WordPress")
- **`max_outbound_backlinks`**: Max aantal externe links per artikel (standaard: 5)
- **`enable_backlinks`**: Master switch voor alle backlinks (standaard: true)

## Backlink Prioriteit

Gegenereerde content bevat backlinks in deze volgorde:

1. **Interne links** (3-5): Links naar andere artikelen op dezelfde website
2. **Same-user projects** (max 3): Links naar andere websites van dezelfde gebruiker
3. **Backlink Exchange Network** (max 3): Links naar websites van andere WritGo gebruikers
4. **Totaal max**: Bepaald door `max_outbound_backlinks` (standaard: 5)

## Matching Algoritme

- **Categorie matching**: Sites met dezelfde categorie krijgen voorrang
- **Random shuffle**: Eerlijke distributie van backlinks over het hele netwerk
- **Recente content**: Alleen gepubliceerde artikelen uit de laatste periode
- **Kwaliteit**: Alleen actieve, gepubliceerde content

## Voorbeelden

### Website A (User 1, Categorie: "SEO")
Genereert artikel over "WordPress SEO tips"
- Bevat 3 interne links naar eigen artikelen
- Bevat 2 backlinks naar Website B en C (andere SEO sites in het netwerk)

### Website B (User 2, Categorie: "SEO")
Genereert artikel over "Content Marketing"
- Bevat 3 interne links naar eigen artikelen
- Bevat 2 backlinks naar Website A en C (andere SEO sites in het netwerk)

**Resultaat**: Alle 3 websites linken naar elkaar = betere SEO!

## Privacy & Controle

- **Opt-in only**: Gebruikers moeten actief deelnemen
- **Per project**: Elke website kan apart opt-in/opt-out
- **Uitzetten**: Zet `participate_in_backlink_exchange` uit om te stoppen
- **Limit control**: Bepaal zelf max aantal externe links

## Database Schema

```sql
-- Projects table
ALTER TABLE projects
ADD COLUMN participate_in_backlink_exchange BOOLEAN DEFAULT FALSE,
ADD COLUMN backlink_exchange_category VARCHAR(100),
ADD COLUMN max_outbound_backlinks INTEGER DEFAULT 5;

-- Stats table (optioneel)
CREATE TABLE backlink_exchange_stats (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  article_id UUID REFERENCES articles(id),
  linked_to_project_id UUID REFERENCES projects(id),
  linked_to_article_id UUID REFERENCES articles(id),
  created_at TIMESTAMP
);
```

## Implementatie

De backlink exchange is volledig geïntegreerd in:

- `lib/project-context.ts` - Haalt externe links op uit het netwerk
- `lib/advanced-content-generator.ts` - Voegt backlinks toe aan content
- `app/api/generate/article/route.ts` - Content generatie met backlinks
- `app/api/writgo/generate-content/route.ts` - WritGo content generatie

## Statistieken (Toekomstig)

De `backlink_exchange_stats` tabel houdt bij:
- Hoeveel backlinks je hebt gegeven
- Hoeveel backlinks je hebt ontvangen
- Naar welke websites je linkt
- Welke websites naar jou linken

Dit kan later gebruikt worden voor een dashboard met analytics.

## SEO Voordelen

✅ **Betere domain authority**: Meer backlinks = hoger in Google
✅ **Diversiteit**: Links van verschillende domeinen
✅ **Relevant**: Categorie-matching zorgt voor topische relevantie
✅ **Natuurlijk**: Links worden contextual geplaatst in de content
✅ **Win-win**: Iedereen profiteert, geen kosten

## Installatie

Run deze SQL migratie:

```bash
psql -h <host> -U <user> -d <database> < add_backlink_exchange_network.sql
```

Of via Supabase Dashboard > SQL Editor:
- Kopieer inhoud van `add_backlink_exchange_network.sql`
- Plak in SQL Editor
- Klik "Run"
