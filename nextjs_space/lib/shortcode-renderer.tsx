
'use client';

import { Package, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

interface ShortcodeData {
  [key: string]: string;
}

function parseShortcode(shortcode: string): { type: string; data: ShortcodeData } | null {
  // Match [product-box ...] or [cta-box ...]
  const match = shortcode.match(/^\[(product-box|cta-box)(.*?)\]$/);
  if (!match) return null;

  const type = match[1];
  const attrs = match[2];
  
  // Parse attributes
  const data: ShortcodeData = {};
  const attrRegex = /(\w+)="([^"]*)"/g;
  let attrMatch;
  
  while ((attrMatch = attrRegex.exec(attrs)) !== null) {
    data[attrMatch[1]] = attrMatch[2];
  }

  return { type, data };
}

function ProductBox({ data }: { data: ShortcodeData }) {
  const { title, price, image, link, ean } = data;
  
  // Sample pros/cons (in productie zou je dit uit de database halen of AI laten genereren)
  const pros = [
    'Hoogwaardige kwaliteit',
    'Snel geleverd',
    'Goede prijs-kwaliteit verhouding',
  ];
  
  const cons = [
    'Alleen online verkrijgbaar',
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-sm mx-auto my-6">
      {/* Image */}
      {image && (
        <div className="w-full aspect-video overflow-hidden relative bg-gray-100">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover object-center"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <div>
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h2>

          {/* Price */}
          {price && parseFloat(price) > 0 && (
            <p className="text-3xl font-bold text-green-600 mb-4">
              € {parseFloat(price).toFixed(2)}
            </p>
          )}

          {/* Description */}
          <p className="text-gray-700 text-base mb-6">
            Een uitstekende keuze voor wie op zoek is naar kwaliteit en betrouwbaarheid.
          </p>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-6">
            {/* Pros */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Voordelen</h3>
              <ul className="space-y-2">
                {pros.map((pro, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Nadelen</h3>
              <ul className="space-y-2">
                {cons.map((con, index) => (
                  <li key={index} className="flex items-start">
                    <XCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Button */}
        <div>
          <a
            href={link || '#'}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center justify-center gap-2"
          >
            <Package className="w-5 h-5" />
            Bekijk op Bol.com
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function CTABox({ data }: { data: ShortcodeData }) {
  const { title, description, button, link } = data;

  return (
    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg overflow-hidden p-8 my-6 text-white">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-3">
          {title}
        </h2>
        
        {description && (
          <p className="text-lg mb-6 opacity-90">
            {description}
          </p>
        )}

        <a
          href={link || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
        >
          {button || 'Bekijk nu'}
          <ExternalLink className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}

export function renderShortcodes(content: string): JSX.Element[] {
  const elements: JSX.Element[] = [];
  const shortcodeRegex = /\[(product-box|cta-box).*?\]/g;
  
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = shortcodeRegex.exec(content)) !== null) {
    // Add text before shortcode
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index);
      elements.push(
        <div 
          key={`text-${key++}`}
          dangerouslySetInnerHTML={{ __html: textBefore }} 
        />
      );
    }

    // Parse and render shortcode
    const parsed = parseShortcode(match[0]);
    if (parsed) {
      if (parsed.type === 'product-box') {
        elements.push(<ProductBox key={`product-${key++}`} data={parsed.data} />);
      } else if (parsed.type === 'cta-box') {
        elements.push(<CTABox key={`cta-${key++}`} data={parsed.data} />);
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const textAfter = content.substring(lastIndex);
    elements.push(
      <div 
        key={`text-${key++}`}
        dangerouslySetInnerHTML={{ __html: textAfter }} 
      />
    );
  }

  return elements;
}

export function ContentWithShortcodes({ content }: { content: string }) {
  const elements = renderShortcodes(content);
  return <div className="prose prose-lg max-w-none">{elements}</div>;
}
