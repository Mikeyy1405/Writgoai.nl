
'use client';

/**
 * Tekstlink - Inline affiliate link in content
 * Simpel, clean en past naadloos in lopende tekst
 */

interface AffiliateTextLinkProps {
  text: string;
  url: string;
  className?: string;
}

export default function AffiliateTextLink({ 
  text, 
  url,
  className = ''
}: AffiliateTextLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="nofollow noopener noreferrer sponsored"
      className={`
        inline-flex items-center gap-1
        text-orange-600 hover:text-orange-700 
        font-medium
        underline decoration-1 underline-offset-2
        hover:decoration-2
        transition-all duration-200
        ${className}
      `}
    >
      {text}
      <svg 
        className="w-3.5 h-3.5 opacity-70" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
        />
      </svg>
    </a>
  );
}
