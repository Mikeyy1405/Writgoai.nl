
# Direct Client Aanmaken - Gebruikershandleiding

## Overzicht

Je kunt nu **direct een client account aanmaken** met een zelfgekozen wachtwoord, zonder dat de client eerst een uitnodigingsmail hoeft te accepteren. Dit maakt het veel sneller en eenvoudiger om toegang te geven aan je klanten.

---

## 🎯 Twee Manieren om Toegang te Geven

### **Optie 1: Uitnodigen (via email)**
- Stuurt een uitnodigingsmail naar het emailadres
- Client moet de uitnodiging accepteren via de link in de email
- Geschikt voor professionele situaties waar je de client wil informeren

### **Optie 2: Direct Aanmaken** ⭐ **NIEUW**
- Maakt direct een volledig account aan
- Jij stelt het wachtwoord in
- Geen email nodig, je krijgt direct de inloggegevens
- Je kunt de gegevens direct delen met je client

---

## 📝 Hoe te Gebruiken

### Stap 1: Ga naar je Project
1. Log in op WritgoAI
2. Ga naar **Client Portal > Projects**
3. Klik op het project waarvoor je toegang wilt geven
4. Scroll naar beneden naar **"Project Collaborators"**

### Stap 2: Kies "Direct Aanmaken"
1. Klik op de **"Uitnodigen"** knop
2. Je ziet nu twee opties:
   - 📧 **Uitnodigen (via email)**
   - ✅ **Direct aanmaken** ← Klik hierop!

### Stap 3: Vul de Gegevens In
Vul het formulier in:
- **Email adres*** - Het emailadres van je client
- **Naam*** - Volledige naam van je client
- **Wachtwoord*** - Kies een sterk wachtwoord (minimaal 8 tekens)
- **Rol** - Kies tussen:
  - **Klant** - Ziet alleen content planning en gepubliceerde artikelen
  - **Medewerker** - Heeft volledige toegang tot alle project onderdelen

### Stap 4: Klik op "Client Aanmaken"
Zodra je op de knop klikt:
1. ✅ Het account wordt direct aangemaakt
2. 📋 Je ziet een bevestiging met de inloggegevens:
   ```
   ✅ Client succesvol aangemaakt!
   📧 Email: client@example.com
   🔑 Wachtwoord: jouw_gekozen_wachtwoord
   
   Deel deze gegevens met de client
   ```
3. Deze melding blijft 10 seconden zichtbaar, noteer de gegevens!

### Stap 5: Deel de Inloggegevens
Deel met je client:
- **Login URL**: https://WritgoAI.nl/client-login
- **Email**: [het opgegeven emailadres]
- **Wachtwoord**: [het door jou gekozen wachtwoord]

---

## 🔐 Beveiliging

### Wachtwoord Vereisten
- Minimaal 8 tekens lang
- Gebruik een combinatie van letters, cijfers en symbolen
- Maak voor elke client een uniek wachtwoord

### Wachtwoord Opslag
- Wachtwoorden worden veilig opgeslagen met bcrypt hashing
- Je kunt het wachtwoord NIET meer opvragen na het aanmaken
- Noteer het wachtwoord direct bij het aanmaken!

### Best Practices
1. ✅ Gebruik een wachtwoordmanager om sterke wachtwoorden te genereren
2. ✅ Deel wachtwoorden via een veilig kanaal (niet per email!)
3. ✅ Vraag je client om het wachtwoord te wijzigen na eerste login
4. ✅ Gebruik unieke wachtwoorden voor elke client

---

## 📱 Client Login

### Voor je Client
Je client kan nu inloggen via:
- **URL**: https://WritgoAI.nl/client-login
- **Inloggegevens**: De email en wachtwoord die jij hebt aangemaakt

### Wat Ziet de Client?
Afhankelijk van de rol:
- **Klant rol**: 
  - Content planning overzicht
  - Gepubliceerde artikelen
  - Project voortgang
- **Medewerker rol**:
  - Volledige toegang tot alle tools
  - Kan content genereren
  - Kan instellingen aanpassen

---

## 🆚 Verschil tussen Rollen

### Klant (Client)
```
✅ Content planning bekijken
✅ Gepubliceerde artikelen lezen
✅ Project voortgang volgen
❌ Artikelen genereren
❌ Instellingen aanpassen
❌ WordPress publiceren
```

### Medewerker (Employee)
```
✅ Alles wat een Klant kan
✅ Artikelen genereren
✅ Content bewerken
✅ WordPress publiceren
✅ Project instellingen aanpassen
✅ Affiliate links beheren
```

---

## ⚠️ Veelvoorkomende Fouten

### "Dit emailadres is al in gebruik"
- Dit emailadres heeft al een WritgoAI account
- Gebruik een ander emailadres, of
- Gebruik de "Uitnodigen" functie voor bestaande accounts

### "Wachtwoord moet minimaal 8 tekens bevatten"
- Kies een langer wachtwoord
- Gebruik een mix van letters, cijfers en symbolen

### "Project niet gevonden"
- Je kunt alleen clients toevoegen aan je eigen projects
- Check of je wel eigenaar bent van het project

---

## 🔄 Client Beheer

### Client Toegang Intrekken
1. Ga naar je project
2. Scroll naar "Project Collaborators"
3. Klik op het prullenbak icoon bij de client
4. Bevestig de intrekking

**Let op:** Ingetrokken toegang kan niet meer gebruikt worden voor login!

### Client Rol Wijzigen
Op dit moment moet je:
1. De huidige toegang intrekken
2. Een nieuwe toegang aanmaken met de juiste rol

---

## 💡 Tips & Tricks

### 1. **Wachtwoord Delen**
```
Beste [Client Naam],

Je account voor WritgoAI is aangemaakt!

Login URL: https://WritgoAI.nl/client-login
Email: [client@example.com]
Wachtwoord: [wachtwoord]

Je kunt hier de voortgang van je contentproject volgen.

Met vriendelijke groet,
[Jouw Naam]
```

### 2. **Meerdere Clients Tegelijk**
Je kunt meerdere clients toevoegen aan hetzelfde project. Elk krijgt zijn eigen inloggegevens.

### 3. **Veilige Wachtwoorden Genereren**
Gebruik een wachtwoordmanager zoals:
- 1Password
- LastPass
- Bitwarden

Deze kunnen automatisch sterke wachtwoorden genereren!

---

## 🐛 Troubleshooting

### Client Kan Niet Inloggen
1. ✅ Check of de inloggegevens correct zijn
2. ✅ Verifieer dat de toegang niet is ingetrokken
3. ✅ Zorg dat client de juiste login URL gebruikt: `https://WritgoAI.nl/client-login`

### Wachtwoord Vergeten
1. Ga naar je project
2. Trek de huidige toegang in
3. Maak een nieuwe client aan met een nieuw wachtwoord

### Client Ziet Verkeerde Project
- Elke client kan toegang hebben tot meerdere projecten
- Client ziet een lijst van alle projecten waar hij toegang tot heeft
- Hij kan schakelen tussen projecten via het project menu

---

## 🔧 Technische Details

### API Endpoint
```
POST /api/client/create-project-client
```

### Request Body
```json
{
  "projectId": "project_id",
  "email": "client@example.com",
  "name": "Client Naam",
  "password": "secure_password_123",
  "role": "client"
}
```

### Response
```json
{
  "success": true,
  "client": {
    "id": "client_id",
    "email": "client@example.com",
    "name": "Client Naam"
  },
  "credentials": {
    "email": "client@example.com",
    "password": "secure_password_123"
  },
  "loginUrl": "https://WritgoAI.nl/client-login"
}
```

---

## 📊 Vergelijking

| Feature | Uitnodigen | Direct Aanmaken |
|---------|------------|-----------------|
| **Snelheid** | Langzaam (email nodig) | ⚡ Instant |
| **Email Vereist** | ✅ Ja | ❌ Nee |
| **Wachtwoord** | Client kiest zelf | Jij kiest |
| **Acceptatie Nodig** | ✅ Ja | ❌ Nee |
| **Direct Toegang** | ❌ Nee | ✅ Ja |
| **Geschikt Voor** | Professioneel | Snel & Eenvoudig |

---

## 🎓 Voorbeeld Scenario's

### Scenario 1: Nieuwe Client Onboarding
```
1. Client tekent contract
2. Jij maakt direct een account aan
3. Je stuurt de inloggegevens via WhatsApp/Signal
4. Client kan direct aan de slag
```

### Scenario 2: Demo Account voor Prospect
```
1. Prospect wil platform zien
2. Maak snel een demo account
3. Deel gegevens tijdens videocall
4. Prospect kan live meekijken
```

### Scenario 3: Tijdelijke Toegang
```
1. Freelancer werkt tijdelijk mee
2. Maak account met medewerker rol
3. Na project: trek toegang in
4. Veilig en gecontroleerd
```

---

## ✅ Checklist voor Gebruik

Voordat je een client aanmaakt:
- [ ] Heb je het correcte emailadres?
- [ ] Heb je een sterk wachtwoord gekozen (8+ tekens)?
- [ ] Heb je het wachtwoord genoteerd?
- [ ] Weet je welke rol de client moet hebben?
- [ ] Heb je een veilige manier om het wachtwoord te delen?

Na het aanmaken:
- [ ] Wachtwoord direct genoteerd?
- [ ] Inloggegevens gedeeld met client?
- [ ] Client heeft succesvol kunnen inloggen?
- [ ] Client ziet het juiste project?

---

## 📞 Support

Heb je vragen of problemen?
1. Check deze documentatie eerst
2. Test de login zelf voordat je deelt met client
3. Verifieer dat alle gegevens correct zijn
4. Bij blijvende problemen: neem contact op met support

---

**Laatste Update:** 7 November 2025  
**Versie:** 1.0  
**Status:** ✅ Live en Operationeel

