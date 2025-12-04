/**
 * HreflangTags Component
 * Generates SEO-friendly hreflang tags for multilingual support
 * 
 * Supports: Dutch (nl), English US (en-US), German (de)
 */

/**
 * Props for the HreflangTags component
 * @property {string} [path] - The URL path for which to generate hreflang tags.
 *                              Should start with a forward slash (e.g., '/about', '/pricing').
 *                              Defaults to empty string for the root path.
 */
interface HreflangTagsProps {
  path?: string;
}

export function HreflangTags({ path = '' }: HreflangTagsProps) {
  // Use environment variable if available, fallback to production URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://writgoai.nl';
  
  return (
    <>
      <link rel="alternate" hrefLang="nl" href={`${baseUrl}${path}`} />
      <link rel="alternate" hrefLang="en-US" href={`${baseUrl}/en${path}`} />
      <link rel="alternate" hrefLang="de" href={`${baseUrl}/de${path}`} />
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}${path}`} />
    </>
  );
}
