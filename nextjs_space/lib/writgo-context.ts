/**
 * Writgo.nl Business Context
 * Hardcoded context from business plan for auto-generating blog content
 */

export const WRITGO_CONTEXT = {
  bedrijf: "Writgo.nl",
  type: "AI-First Omnipresence Content Agency",
  doelgroep: "Lokale dienstverleners in Nederland (kappers, installateurs, fysiotherapeuten, advocaten, horeca, etc.)",
  
  kernboodschap: "100% autonome, AI-gedreven omnipresence marketing die SEO, social media en video content combineert",
  
  usps: [
    "100% Autonoom - Geen calls, geen meetings",
    "Platform Flexibiliteit - Klant bepaalt waar gepost wordt",
    "AI-First - Beste AI modellen voor elke taak",
    "Omnipresence - SEO + Social + Video in één",
    "Nederlands - Cultuur, taal, facturatie",
    "Betaalbaar - Vanaf €197/maand"
  ],
  
  pakketten: [
    { naam: "INSTAPPER", prijs: "€197/maand", posts: 16, videos: 4, artikelen: 2 },
    { naam: "STARTER", prijs: "€297/maand", posts: 16, videos: 4, artikelen: "1P+2C" },
    { naam: "GROEI", prijs: "€497/maand", posts: 24, videos: 8, artikelen: "1P+3C", bestseller: true },
    { naam: "DOMINANT", prijs: "€797/maand", posts: 40, videos: 12, artikelen: "2P+4C" }
  ],
  
  targetKeywords: [
    "omnipresence marketing",
    "social media + SEO pakket",
    "AI content agency",
    "lokale marketing",
    "content marketing MKB",
    "automatische social media",
    "faceless video marketing",
    "multi-platform posting",
    "social media automatisering"
  ],
  
  pillarArticles: [
    "De Complete Gids voor Omnipresence Marketing in 2026",
    "SEO voor Lokale Dienstverleners: Van 0 naar #1",
    "AI Content Creatie: Alles wat je moet weten",
    "Social Media Marketing voor MKB: Het Complete Handboek",
    "Video Marketing zonder Gezicht: De Faceless Video Strategie",
    "LinkedIn voor Ondernemers: Van Onzichtbaar naar Thought Leader",
    "Google My Business Optimalisatie: De Ultieme Gids",
    "Content Marketing ROI: Hoe Meet je Succes?",
    "Multi-Platform Social Media: Eén Strategie, Alle Kanalen",
    "De Toekomst van Marketing: AI, Automatisering en Omnipresence"
  ],
  
  tone: "Professioneel maar toegankelijk, Nederlands, resultaatgericht",
  
  cta: "Start vandaag met Writgo.nl - vanaf €197/maand"
} as const;
