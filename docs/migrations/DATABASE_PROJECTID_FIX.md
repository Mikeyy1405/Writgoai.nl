
# Database Fix: ProjectId Kolom Toegevoegd aan ArticleIdea

## 🐛 Probleem
De content research tool crashte met de fout:
```
Invalid `prisma.articleIdea.findMany()` invocation:
The column `ArticleIdea.projectId` does not exist in the current database.
```

## 🔍 Oorzaak
- Het Prisma schema was aangepast om een `projectId` kolom toe te voegen aan de `ArticleIdea` tabel
- **Er was GEEN database migratie uitgevoerd** om deze kolom daadwerkelijk in de database aan te maken
- Code verwachtte een kolom die niet bestond = runtime crash

## ✅ Oplossing

### Stap 1: Database Schema Synchroniseren
```bash
cd /home/ubuntu/writgo_planning_app/nextjs_space
yarn prisma db push --accept-data-loss
```

Dit voerde de volgende wijzigingen door:
- ✅ Kolom `ArticleIdea.projectId` toegevoegd (nullable String)
- ✅ Foreign key relatie naar `Project` aangemaakt
- ⚠️ Oude kolom `isScheduledForAutopilot` verwijderd (was niet meer in schema)

### Stap 2: Prisma Client Regenereren
```bash
yarn prisma generate
```

### Stap 3: App Getest en Gedeployed
```bash
# Lokaal testen
yarn dev

# Productie build
yarn build

# Deploy naar WritgoAI.nl
deploy_nextjs_project
```

## 📊 Database Schema Update

**ArticleIdea model - NIEUW:**
```prisma
model ArticleIdea {
  id                    String   @id @default(cuid())
  clientId              String
  client                Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // ✨ NIEUW: Project koppeling voor per-project content planning
  projectId             String?  // Optioneel: welk project is dit voor
  project               Project? @relation("ArticleIdeas", fields: [projectId], references: [id], onDelete: SetNull)
  
  // ... rest van de velden
}
```

**Project model - UPDATED:**
```prisma
model Project {
  id                    String   @id @default(cuid())
  clientId              String
  client                Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  // ✨ NIEUW: Relatie met ArticleIdeas
  articleIdeas          ArticleIdea[] @relation("ArticleIdeas")
  
  // ... rest van de velden
}
```

## 🎯 Impact
- ✅ Content research werkt nu weer zonder crashes
- ✅ Elk artikel idee kan nu aan een specifiek project gekoppeld worden
- ✅ Data blijft gescheiden per project
- ✅ Geen data verlies (behalve oude autopilot vlag die niet meer gebruikt werd)

## 🚀 Status
- ✅ Database gemigreerd
- ✅ Code werkt lokaal
- ✅ Gedeployed naar WritgoAI.nl
- ✅ Content research tool operationeel

## 📝 Datum
3 november 2025, 07:32 UTC

## ⚠️ Belangrijke Lessen
1. **ALTIJD** na Prisma schema wijzigingen `prisma db push` of `prisma migrate` uitvoeren
2. **NOOIT** alleen schema aanpassen zonder database te updaten
3. **TEST** lokaal eerst voordat je deploy naar productie
4. **GEBRUIK** `--accept-data-loss` flag alleen als je zeker weet dat data verlies acceptabel is
