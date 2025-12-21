/**
 * Author Profile for E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
 */

export interface AuthorProfile {
  name: string;
  role: string;
  bio: string;
  expertise: string[];
  experience: string;
  achievements: string[];
  image: string;
  social: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
  };
}

export const MIKE_SCHONEWILLE: AuthorProfile = {
  name: 'Mike Schonewille',
  role: 'Founder & SEO Expert',
  bio: 'Mike Schonewille is een ervaren SEO-specialist en ondernemer met meer dan 10 jaar ervaring in content marketing en affiliate marketing. Als oprichter van WritGo combineert hij zijn diepgaande kennis van zoekmachine-optimalisatie met cutting-edge AI-technologie om bedrijven te helpen hun online zichtbaarheid te maximaliseren.',
  expertise: [
    'SEO & Content Marketing',
    'Affiliate Marketing',
    'AI-Powered Content Generation',
    'WordPress Optimalisatie',
    'Google Algorithm Updates',
    'Link Building Strategieën'
  ],
  experience: '10+ jaar ervaring in content marketing en SEO, met een portfolio van 50+ succesvolle affiliate websites die consistent hoog ranken in Google.',
  achievements: [
    '50+ succesvolle affiliate websites gebouwd en geoptimaliseerd',
    '10+ jaar hands-on ervaring met Google SEO',
    'Oprichter van WritGo - AI-powered SEO platform',
    'Expert in WordPress SEO en content automation',
    'Specialist in Google Core Updates en algorithm changes'
  ],
  image: '/images/mike-schonewille.jpg', // Placeholder
  social: {
    linkedin: 'https://nl.linkedin.com/in/mike-schonewille',
    twitter: 'https://x.com/writgonl',
    instagram: 'https://www.instagram.com/writgonl/',
    facebook: 'https://www.facebook.com/mike.schonewille.50/',
    website: 'https://writgo.nl'
  }
};

export function getAuthorSchema(author: AuthorProfile, articleUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": author.name,
    "jobTitle": author.role,
    "description": author.bio,
    "url": author.social.website,
    "image": author.image,
    "sameAs": Object.values(author.social).filter(Boolean),
    "knowsAbout": author.expertise,
    "hasCredential": author.achievements.map(achievement => ({
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "professional achievement",
      "name": achievement
    }))
  };
}
