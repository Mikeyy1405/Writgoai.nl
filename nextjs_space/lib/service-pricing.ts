// Service pricing configuration
export const SERVICE_PRICING = {
  // Content & Writing
  blog: {
    label: 'Blog & Content',
    credits: 50,
    description: 'SEO artikelen, blogs, product beschrijvingen',
    details: 'Tot 2000 woorden, SEO geoptimaliseerd, met afbeeldingen',
  },
  
  // Video Production
  video: {
    label: 'Video',
    credits: 200,
    description: 'Video productie, editing, YouTube content',
    details: 'Tot 5 minuten video, professionele montage, voice-over',
  },
  
  // AI Chatbot
  chatbot: {
    label: 'Chatbot',
    credits: 500,
    description: 'AI chatbot voor je website of klantenservice',
    details: 'Custom trained chatbot, integratie met je website',
  },
  
  // Workflow Automation
  automation: {
    label: 'Automatisering',
    credits: 300,
    description: 'Workflows, integraties, automatische processen',
    details: 'Process automation, API integraties, workflow setup',
  },
  
  // Website Development
  website: {
    label: 'Website',
    credits: 750,
    description: 'Website ontwikkeling, landing pages, webshops',
    details: 'Responsive design, tot 5 pagina\'s, hosting advies',
  },
  
  // Design Services
  design: {
    label: 'Design',
    credits: 100,
    description: 'Grafisch ontwerp, logo, branding, social media',
    details: 'Logo design, branding pakket, social media templates',
  },
  
  // Custom/Other
  other: {
    label: 'Anders',
    credits: 100,
    description: 'Overige AI-gerelateerde diensten',
    details: 'Custom AI oplossingen op maat, prijs op aanvraag',
  },
  
  // Email Marketing Suite
  email_marketing_send: {
    label: 'Marketing Email Versturen',
    credits: 1, // Per 10 emails
    description: 'Marketing emails versturen naar je lijst',
    details: '1 credit per 10 emails, inclusief tracking',
  },
  
  email_ai_analysis: {
    label: 'AI Email Analyse',
    credits: 5,
    description: 'AI analyse van inkomende emails',
    details: 'Sentiment analyse, categorisatie, samenvatting',
  },
  
  email_ai_reply: {
    label: 'AI Email Antwoord',
    credits: 10,
    description: 'AI gegenereerd email antwoord',
    details: 'Handmatig gegenereerd AI antwoord met tone selector',
  },
  
  email_auto_reply: {
    label: 'AI Auto-Reply',
    credits: 8,
    description: 'Automatisch AI email antwoord',
    details: 'Automatische beantwoording met configureerbare regels',
  },
} as const;

export type ServiceType = keyof typeof SERVICE_PRICING;

export function getServiceCost(serviceType: string): number {
  return SERVICE_PRICING[serviceType as ServiceType]?.credits || 100;
}

export function getServiceDetails(serviceType: string) {
  return SERVICE_PRICING[serviceType as ServiceType] || SERVICE_PRICING.other;
}
