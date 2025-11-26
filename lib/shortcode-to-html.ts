
/**
 * Convert shortcodes to HTML for WordPress publishing
 */

export function convertShortcodesToHTML(content: string): string {
  let processedContent = content;

  // Replace [product-box] shortcodes
  const productBoxRegex = /\[product-box ([^\]]+)\]/g;
  processedContent = processedContent.replace(productBoxRegex, (match, attrs) => {
    // Parse attributes
    const attrObj: Record<string, string> = {};
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      attrObj[attrMatch[1]] = attrMatch[2];
    }

    const { title, price, image, link } = attrObj;

    return `
<div class="product-box" style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; max-width: 400px; margin: 24px auto;">
  ${image ? `<div style="width: 100%; aspect-ratio: 16/9; overflow: hidden; background: #f3f4f6;">
    <img src="${image}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover;">
  </div>` : ''}
  <div style="padding: 24px;">
    <h2 style="font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 8px;">${title}</h2>
    ${price && parseFloat(price) > 0 ? `<p style="font-size: 28px; font-weight: bold; color: #16a34a; margin-bottom: 16px;">€ ${parseFloat(price).toFixed(2)}</p>` : ''}
    <p style="color: #4b5563; margin-bottom: 24px;">Een uitstekende keuze voor wie op zoek is naar kwaliteit en betrouwbaarheid.</p>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
      <div>
        <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 12px;">Voordelen</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <span style="color: #16a34a; margin-right: 8px;">✓</span>
            <span style="color: #4b5563;">Hoogwaardige kwaliteit</span>
          </li>
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <span style="color: #16a34a; margin-right: 8px;">✓</span>
            <span style="color: #4b5563;">Snel geleverd</span>
          </li>
          <li style="display: flex; align-items: flex-start;">
            <span style="color: #16a34a; margin-right: 8px;">✓</span>
            <span style="color: #4b5563;">Goede prijs-kwaliteit</span>
          </li>
        </ul>
      </div>
      <div>
        <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 12px;">Nadelen</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="display: flex; align-items: flex-start;">
            <span style="color: #ef4444; margin-right: 8px;">✕</span>
            <span style="color: #4b5563;">Alleen online verkrijgbaar</span>
          </li>
        </ul>
      </div>
    </div>
    <a href="${link}" target="_blank" rel="noopener noreferrer nofollow" style="display: block; width: 100%; background: #16a34a; color: white; font-weight: bold; padding: 12px 16px; border-radius: 8px; text-align: center; text-decoration: none; transition: background 0.3s;">
      Bekijk op Bol.com →
    </a>
  </div>
</div>
`;
  });

  // Replace [cta-box] shortcodes
  const ctaBoxRegex = /\[cta-box ([^\]]+)\]/g;
  processedContent = processedContent.replace(ctaBoxRegex, (match, attrs) => {
    // Parse attributes
    const attrObj: Record<string, string> = {};
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      attrObj[attrMatch[1]] = attrMatch[2];
    }

    const { title, description, button, link } = attrObj;

    return `
<div class="cta-box" style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); border-radius: 12px; padding: 32px; margin: 24px 0; text-align: center; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  <h2 style="font-size: 32px; font-weight: bold; margin-bottom: 12px;">${title}</h2>
  ${description ? `<p style="font-size: 18px; margin-bottom: 24px; opacity: 0.9;">${description}</p>` : ''}
  <a href="${link}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: white; color: #ff6b35; font-weight: bold; padding: 12px 32px; border-radius: 8px; text-decoration: none; transition: background 0.3s;">
    ${button || 'Bekijk nu'} →
  </a>
</div>
`;
  });

  return processedContent;
}

/**
 * Check if content contains any shortcodes
 */
export function hasShortcodes(content: string): boolean {
  return /\[(product-box|cta-box)/.test(content);
}

/**
 * Extract all product EANs from content
 */
export function extractProductEANs(content: string): string[] {
  const eans: string[] = [];
  const regex = /\[product-box [^>]*ean="([^"]+)"/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    eans.push(match[1]);
  }

  return eans;
}
