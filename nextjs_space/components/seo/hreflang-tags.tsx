/**
 * HreflangTags Component
 * Generates SEO-friendly hreflang tags for multilingual support
 * 
 * Supports: Dutch (nl), English US (en-US), German (de)
 */

interface HreflangTagsProps {
  path?: string;
}

export function HreflangTags({ path = '' }: HreflangTagsProps) {
  const baseUrl = 'https://writgoai.nl';
  
  return (
    <>
      <link rel="alternate" hrefLang="nl" href={`${baseUrl}${path}`} />
      <link rel="alternate" hrefLang="en-US" href={`${baseUrl}/en${path}`} />
      <link rel="alternate" hrefLang="de" href={`${baseUrl}/de${path}`} />
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}${path}`} />
    </>
  );
}
