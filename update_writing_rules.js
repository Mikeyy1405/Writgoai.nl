
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// Read .env file
const envContent = fs.readFileSync('/home/ubuntu/writgo_planning_app/.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

// Set DATABASE_URL
process.env.DATABASE_URL = envVars.DATABASE_URL;

const prisma = new PrismaClient();

const FORBIDDEN_WORDS = [
  'wereld van',
  'cruciaal',
  'essentieel',
  'kortom',
  'conclusie',
  'duik',
  'duiken',
  'vriend',
  'wereld',
  'jungle',
  'duiken in',
  'de sleutel',
  'key',
  'superheld',
  'spul',
  'induiken',
  'veilige haven',
  'gids',
  'voordelen',
  'zonder gedoe',
  'gedoe',
  'voordelen van',
  'digitaal tijdperk',
  'of je',
  'of je nu'
];

const WRITING_INSTRUCTIONS = `
🛑 VERBODEN WOORDEN - Deze mogen NOOIT in de tekst voorkomen:
${FORBIDDEN_WORDS.join(', ')}

⚙️ AI STRUCTUUR voor SEO-artikelen

Doel: 100% menselijk klinkende SEO-artikelen die Originality AI volledig passeren.
Schrijfstijl: Conversational, natuurlijk ritme, B1-niveau, afwisselende zinslengtes.

🧱 BASISSTRUCTUUR:

1. H1-titel
   - Kort en pakkend
   - Bevat hoofd-keyword
   - Geen dubbele punt of bijzin

2. Intro (3-4 zinnen)
   - Natuurlijke afwisseling in lengte
   - Keyword één keer noemen
   - Geen cliché-openingen
   - Mag beginnen met een persoonlijke of concrete observatie

3. H2/H3-secties
   - Iedere H2/H3 gevolgd door minimaal één alinea tekst
   - Geen twee headings direct na elkaar
   - Eén keyword per alinea
   - Geen herhaling van woorden uit de titel
   - Gebruik overgangswoorden: daarnaast, bovendien, ook, ondertussen, daarna, tenslotte

4. Alineastijl
   - 8-12 woorden (kort), 15-20 (gemiddeld), enkele lange (25+)
   - Geen opsomming tenzij functioneel
   - Geen herhaling binnen dezelfde alinea
   - Begin zinnen gevarieerd (niet steeds met "Je" of "Het")
   - Spreektaal toegestaan ("best handig", "even checken", "dat scheelt een hoop")
   - Concrete voorbeelden of scenario's gebruiken
   - Emotionele woorden voor betrokkenheid

5. Afsluiting (4-5 zinnen)
   - Samenvattend, niet formeel
   - Geen "kortom", "conclusie" of vergelijkbare woorden
   - Eindig met natuurlijke afronding of lichte reflectie

📘 SCHRIJFREGELS:
- Taalniveau: B1, eenvoudig en menselijk
- Perspectief: Jij/je-vorm
- Toon: Conversatie, persoonlijk, menselijk
- Herhaling: Vermijden binnen één sectie
- Clichés: Vermijden
- SEO: Keyword 1x per heading + 1x in alinea
- Opsommingen: Spaarzaam gebruiken
- Links: Verspreiden door tekst, niet clusteren
- CTA's: Alleen als het past bij context
- Interne links: Natuurlijk verweven, nooit als blok onderaan

🧠 AI-GEDRAGSSTRUCTUUR (inhoudsaanpak):
- Start vanuit menselijkheid – schrijf alsof je iets uitlegt aan een vriend (zonder het woord "vriend")
- Schrijf hardop in gedachten – korte, losse zinnen, alsof je vertelt
- Vermijd voorspelbare patronen – variatie in lengte, tempo en ritme
- Gebruik observatie > uitleg – beschrijf wat iemand zou zien, doen of merken
- Sluit natuurlijk af – niet met samenvatting, maar met afrondende gedachte

BELANGRIJK: Deze regels zijn VERPLICHT en mogen NOOIT worden overtreden.
`;

async function updateWritingRules() {
  try {
    console.log('🔄 Updating writing rules for all AI profiles...\n');

    const profiles = await prisma.clientAIProfile.findMany({
      include: {
        Client: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    for (const profile of profiles) {
      console.log(`Updating profile for ${profile.Client.email}...`);
      
      await prisma.clientAIProfile.update({
        where: { id: profile.id },
        data: {
          forbiddenWords: FORBIDDEN_WORDS,
          customBlogInstructions: WRITING_INSTRUCTIONS
        }
      });

      console.log(`✅ Updated ${profile.Client.email}\n`);
    }

    console.log('✅ All profiles updated with writing rules!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateWritingRules();
