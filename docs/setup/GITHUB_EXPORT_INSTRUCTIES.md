# GitHub Export Instructies voor WritGo

## 🎉 Goed nieuws!

Je repository is succesvol voorbereid voor GitHub export. Alle grote bestanden (> 24 MB) zijn verwijderd en de repository is schoon.

## 📊 Repository Status

✅ **Geen bestanden groter dan 24 MB**  
✅ **Grootste bestand**: 2.69 MB (.abacus.donotdelete)  
✅ **Schone Git geschiedenis**: 3 commits op `github-export` branch  
✅ **README.md toegevoegd** met volledige documentatie  
✅ **.env.example toegevoegd** met alle benodigde variabelen  
✅ **.gitignore updated** om grote bestanden te excluderen  

## 🚀 Stappen om naar GitHub te pushen

### Optie 1: Nieuwe GitHub Repository

1. **Maak een nieuwe repository op GitHub**
   - Ga naar https://github.com/new
   - Repository naam: bijv. `writgo-platform`
   - Zet op **Private** (aanbevolen voor propriëtaire code)
   - **NIET** initializeren met README, .gitignore of license

2. **Push de code naar GitHub**
   ```bash
   cd /home/ubuntu/writgo_planning_app
   
   # Voeg GitHub remote toe (vervang YOUR_USERNAME en REPO_NAME)
   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
   
   # Push de github-export branch als main branch
   git push -u origin github-export:main
   ```

3. **Klaar!** Je code staat nu op GitHub.

### Optie 2: Bestaande Repository Overschrijven

Als je al een GitHub repository hebt:

```bash
cd /home/ubuntu/writgo_planning_app

# Voeg remote toe (of update bestaande)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
# Of als remote al bestaat:
git remote set-url origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Force push de schone branch (dit overschrijft de bestaande code!)
git push -f origin github-export:main
```

⚠️ **Let op**: `-f` (force) overschrijft de bestaande repository geschiedenis!

## 🔒 Authenticatie

### Met Personal Access Token (Aanbevolen)

1. Maak een Personal Access Token op GitHub:
   - Ga naar: Settings > Developer settings > Personal access tokens > Tokens (classic)
   - Genereer nieuwe token met `repo` scope
   - Kopieer de token

2. Gebruik de token bij push:
   ```bash
   # Gebruik username + token in plaats van password
   Username: YOUR_GITHUB_USERNAME
   Password: YOUR_PERSONAL_ACCESS_TOKEN
   ```

### Met SSH (Alternatief)

1. Setup SSH key op GitHub (als je dat nog niet hebt)
2. Gebruik SSH URL in plaats van HTTPS:
   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git
   git push -u origin github-export:main
   ```

## 📝 Na de Push

### Repository Settings Aanpassen

1. **Branch Protection Rules** (aanbevolen):
   - Settings > Branches > Add rule
   - Branch name pattern: `main`
   - Require pull request reviews
   - Require status checks

2. **Secrets toevoegen** (voor CI/CD):
   - Settings > Secrets and variables > Actions
   - Voeg toe: `DATABASE_URL`, `AIML_API_KEY`, etc.

3. **Collaborators toevoegen** (indien nodig):
   - Settings > Collaborators
   - Add people

### README Aanpassen

✏️ Open `README.md` en update:
- Repository URL in clone command
- Contact informatie
- License informatie
- Deployment URL

## 🛡️ Gevoelige Data Bescherming

✅ **Al geïmplementeerd**:
- `.env` is in `.gitignore`
- `.env.example` zonder echte credentials
- Database dumps excluded
- Build artifacts excluded
- Core dumps excluded

⚠️ **Controleer altijd**:
```bash
# Check of .env NIET in repository zit
cd /home/ubuntu/writgo_planning_app
git ls-files | grep -E '\.env$'
# Moet LEEG zijn (alleen .env.example is ok)
```

## 🔍 Genegeerde Bestanden

De volgende bestanden/folders worden NIET naar GitHub gepusht:
- `node_modules/`
- `.next/`, `.build/`, `.cache/`
- `.deploy/`, `logs/`
- `*.db`, `*.sqlite`
- `core` (crash dumps)
- `*.pack`, `*.tgz` (grote archive bestanden)

## ✅ Verificatie

Na het pushen, check of alles werkt:

```bash
# Clone in een nieuwe folder om te testen
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git writgo_test
cd writgo_test/nextjs_space

# Installeer en test
yarn install
yarn build
```

## 💬 Support

Als je problemen hebt bij het pushen:

1. **Authentication errors**: Check je Personal Access Token
2. **File too large errors**: Run `git ls-tree -r -l HEAD | awk '$4 > 25000000'` om grote bestanden te vinden
3. **Permission denied**: Check repository settings en je access rights

## 📦 Export Complete!

Je WritGo platform is nu klaar voor GitHub! 🎉

**Huidige branch**: `github-export`  
**Commits**: 3 (schone geschiedenis)  
**Grootte**: ~50-100 MB (zonder node_modules en builds)  

---

**Volgende stappen**:
1. ✅ Push naar GitHub (zie boven)
2. 📝 Update README.md met je repository URL
3. 🔒 Setup GitHub Secrets voor CI/CD
4. 🚀 Optioneel: Setup GitHub Actions voor auto-deploy
