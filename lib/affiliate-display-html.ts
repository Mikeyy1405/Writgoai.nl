
/**
 * Server-side HTML generation for affiliate product displays
 * WordPress-compatible HTML with inline styles
 */

export interface ProductData {
  id: string;
  title: string;
  price?: string;
  rating?: number;
  reviewCount?: number;
  image: string;
  affiliateUrl: string;
  description?: string;
  features?: string[];
  pros?: string[];
  cons?: string[];
  category?: string;
}

export type DisplayType = 
  | 'text-link'
  | 'product-box'
  | 'product-grid'
  | 'product-carousel'
  | 'cta-box'
  | 'comparison-table'
  | 'ai-mix';

/**
 * Generate product display with 16:9 image and Bol.com button
 * Optimized for Beste Lijstje template
 */
export function generateProductBoxHTML(product: ProductData): string {
  // ✅ AFBEELDING VALIDATIE & LOGGING
  const imageUrl = product.image || '';
  
  if (!imageUrl) {
    console.error(`❌ generateProductBoxHTML: GEEN AFBEELDING voor product "${product.title}"`);
    console.error(`   - product.image:`, product.image || 'undefined/empty');
  } else {
    console.log(`✅ generateProductBoxHTML: Product "${product.title}" heeft afbeelding`);
    console.log(`   - URL: ${imageUrl.substring(0, 100)}...`);
  }
  
  // 🎨 PRODUCT DISPLAY - Alleen pros/cons tonen als ze expliciet zijn meegegeven
  // Anders laat de AI ze al in de tekst plaatsen, dus voorkomen van dubbele weergave
  const hasProsOrCons = (product.pros && product.pros.length > 0) || (product.cons && product.cons.length > 0);
  
  let prosConsHTML = '';
  if (hasProsOrCons) {
    const pros = product.pros && product.pros.length > 0 
      ? product.pros.map(pro => `  • ${pro}`).join('\n')
      : '';
    
    const cons = product.cons && product.cons.length > 0
      ? product.cons.map(con => `  • ${con}`).join('\n')
      : '';
    
    if (pros) {
      prosConsHTML += `<p style="margin: 20px 0 10px 0; font-size: 17px; font-weight: 600; color: #111827;">Pluspunten:</p>
<p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.8; color: #374151; white-space: pre-line;">${pros}</p>\n\n`;
    }
    
    if (cons) {
      prosConsHTML += `<p style="margin: 20px 0 10px 0; font-size: 17px; font-weight: 600; color: #111827;">Minpunten:</p>
<p style="margin: 0 0 25px 0; font-size: 15px; line-height: 1.8; color: #374151; white-space: pre-line;">${cons}</p>\n\n`;
    }
  }
  
  // Prijs weergave
  const priceHTML = product.price ? `
<div style="margin: 20px 0; padding: 12px 20px; background: linear-gradient(135deg, #fff5f0 0%, #ffe9dc 100%); border-left: 4px solid #ff6b35; border-radius: 8px;">
  <span style="font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Beste prijs</span>
  <div style="font-size: 32px; font-weight: 700; color: #ff6b35; margin-top: 5px;">${product.price}</div>
</div>` : '';
  
  return `
<h2 style="margin: 30px 0 20px 0; font-size: 26px; font-weight: 700; color: #111827; line-height: 1.3;">${product.title}</h2>

<!-- 16:9 Product afbeelding van Bol.com -->
<div style="position: relative; width: 100%; max-width: 800px; aspect-ratio: 16/9; overflow: hidden; border-radius: 12px; margin: 20px 0; background: #f3f4f6;">
  <img src="${imageUrl}" alt="${product.title}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;" loading="lazy" onerror="this.src='https://placehold.co/1600x900/e5e7eb/6b7280?text=Product'" />
</div>

<p style="margin: 16px 0; font-size: 16px; line-height: 1.7; color: #374151;">${product.description || 'Een kwalitatief product met uitstekende prijs-kwaliteitverhouding.'}</p>

${prosConsHTML}
${priceHTML}

<!-- Bol.com affiliate knop -->
<div style="margin: 25px 0 40px 0; text-align: left;">
  <a href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer nofollow sponsored" style="display: inline-block; background: linear-gradient(135deg, #0066d9 0%, #0055b3 100%); color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-size: 18px; font-weight: 700; box-shadow: 0 4px 12px rgba(0, 102, 217, 0.3); transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0, 102, 217, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 102, 217, 0.3)'">
    🛒 Bekijk beste prijs op Bol.com
  </a>
</div>
`;
}

/**
 * Generate WordPress-compatible HTML for a CTA box
 * ULTRA PREMIUM DESIGN - Eye-catching hero-style product showcase
 */
export function generateCTABoxHTML(product: ProductData): string {
  // Ensure we have a valid image URL - use Bol.com image or quality fallback
  const imageUrl = product.image || 'https://placehold.co/800x500/e5e7eb/6b7280?text=Product+Image';
  
  return `
<!-- Affiliate CTA Box: ${product.title} -->
<div class="writgo-cta-box" style="all: initial !important; display: block !important; box-sizing: border-box !important; position: relative !important; max-width: 800px !important; width: 100% !important; background: linear-gradient(160deg, #ffffff 0%, #fff5f0 100%) !important; border: 5px solid transparent !important; border-image: linear-gradient(135deg, #ff6b35, #fbbf24, #10b981) 1 !important; border-radius: 28px !important; padding: 0 !important; margin: 60px auto !important; text-align: center !important; box-shadow: 0 20px 60px rgba(255, 107, 53, 0.25), 0 6px 20px rgba(0, 0, 0, 0.08) !important; color: #1f2937 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; overflow: hidden !important; line-height: 1.5 !important; font-size: 16px !important; transform: perspective(1000px) !important; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;" onmouseover="this.style.transform='perspective(1000px) translateY(-6px) scale(1.01)'; this.style.boxShadow='0 25px 80px rgba(255, 107, 53, 0.35), 0 10px 30px rgba(0, 0, 0, 0.12)'" onmouseout="this.style.transform='perspective(1000px) translateY(0) scale(1)'; this.style.boxShadow='0 20px 60px rgba(255, 107, 53, 0.25), 0 6px 20px rgba(0, 0, 0, 0.08)'">
  
  <!-- Decorative Top Bar -->
  <div style="all: initial !important; display: block !important; height: 6px !important; background: linear-gradient(90deg, #ff6b35 0%, #fbbf24 50%, #10b981 100%) !important; width: 100% !important;"></div>
  
  <!-- Product Image Section -->
  <div style="all: initial !important; display: flex !important; box-sizing: border-box !important; align-items: center !important; justify-content: center !important; width: 100% !important; min-height: 320px !important; background: radial-gradient(ellipse at center, #ffffff 0%, #fff8f5 100%) !important; padding: 40px !important; position: relative !important;">
    <img src="${imageUrl}" alt="${product.title}" style="all: initial !important; display: block !important; max-width: 90% !important; max-height: 260px !important; width: auto !important; height: auto !important; object-fit: contain !important; margin: 0 auto !important; border-radius: 16px !important; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12) !important; transform: scale(1) !important; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;" loading="lazy" onerror="this.src='https://placehold.co/800x500/e5e7eb/6b7280?text=Product'; this.style.opacity='0.7'" onmouseover="this.style.transform='scale(1.05) rotate(-1deg)'; this.style.boxShadow='0 16px 50px rgba(0, 0, 0, 0.16)'" onmouseout="this.style.transform='scale(1) rotate(0deg)'; this.style.boxShadow='0 12px 40px rgba(0, 0, 0, 0.12)'" />
    
    <!-- Animated Badge -->
    <div style="all: initial !important; display: inline-flex !important; box-sizing: border-box !important; position: absolute !important; top: 30px !important; right: 30px !important; background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important; color: white !important; padding: 12px 24px !important; border-radius: 30px !important; font-size: 13px !important; font-weight: 800 !important; text-transform: uppercase !important; letter-spacing: 1px !important; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5) !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1 !important; align-items: center !important; gap: 6px !important; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite !important;"><span style="all: initial !important; font-size: 16px !important; display: inline-block !important;">⭐</span><span style="all: initial !important; color: white !important; font-size: 13px !important; font-weight: 800 !important; display: inline-block !important;">BESTSELLER</span></div>
  </div>
  
  <!-- Content Section -->
  <div style="all: initial !important; display: block !important; box-sizing: border-box !important; padding: 50px 45px !important; background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%) !important;">
    <!-- Product Title -->
    <h3 style="all: initial !important; display: block !important; box-sizing: border-box !important; margin: 0 0 24px 0 !important; padding: 0 !important; font-size: 34px !important; font-weight: 900 !important; color: #ff6b35 !important; line-height: 1.2 !important; text-shadow: 0 2px 8px rgba(255, 107, 53, 0.12) !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; text-align: center !important; letter-spacing: -0.5px !important;">${product.title}</h3>
    
    ${product.description ? `<p style="all: initial !important; display: block !important; box-sizing: border-box !important; margin: 0 auto 32px auto !important; padding: 0 !important; font-size: 17px !important; line-height: 1.7 !important; color: #4b5563 !important; max-width: 650px !important; font-weight: 400 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; text-align: center !important;">${product.description}</p>` : ''}
    
    ${product.rating ? `
    <!-- Rating Display -->
    <div style="all: initial !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; margin-bottom: 28px !important;">
      <span style="all: initial !important; display: inline-block !important; color: #fbbf24 !important; font-size: 24px !important; line-height: 1 !important; letter-spacing: 2px !important;">★★★★★</span>
      <span style="all: initial !important; display: inline-block !important; font-weight: 800 !important; color: #111827 !important; font-size: 20px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1 !important;">${product.rating.toFixed(1)}/5</span>
      ${product.reviewCount ? `<span style="all: initial !important; display: inline-block !important; color: #9ca3af !important; font-size: 15px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1 !important;">(${product.reviewCount} reviews)</span>` : ''}
    </div>` : ''}
    
    ${product.price ? `<div style="all: initial !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; margin-bottom: 36px !important;"><span style="all: initial !important; display: inline-block !important; font-size: 18px !important; color: #6b7280 !important; text-decoration: line-through !important; font-weight: 500 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">Normaal: ${product.price}</span><span style="all: initial !important; display: inline-block !important; font-size: 52px !important; font-weight: 900 !important; background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; background-clip: text !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1 !important; letter-spacing: -1.5px !important;">${product.price}</span></div>` : ''}
    
    <!-- Mega CTA Button -->
    <a href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer nofollow sponsored" style="all: initial !important; display: inline-flex !important; box-sizing: border-box !important; background: linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%) !important; color: white !important; padding: 24px 64px !important; border-radius: 18px !important; text-decoration: none !important; font-weight: 900 !important; font-size: 22px !important; align-items: center !important; justify-content: center !important; gap: 14px !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; box-shadow: 0 12px 35px rgba(255, 107, 53, 0.5) !important; text-transform: none !important; letter-spacing: 0.3px !important; border: none !important; cursor: pointer !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1.2 !important; white-space: nowrap !important; position: relative !important; overflow: hidden !important;" onmouseover="this.style.transform='translateY(-4px) scale(1.04)'; this.style.boxShadow='0 16px 45px rgba(255, 107, 53, 0.6)'; this.style.background='linear-gradient(135deg, #ff5722 0%, #ff7043 100%)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 12px 35px rgba(255, 107, 53, 0.5)'; this.style.background='linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)'"><span style="all: initial !important; font-size: 26px !important; display: inline-block !important; line-height: 1 !important;">🛒</span><span style="all: initial !important; display: inline-block !important; color: white !important; font-size: 22px !important; font-weight: 900 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1.2 !important;">Direct Bestellen op Bol.com →</span></a>
    
    <!-- Trust Indicators -->
    <div style="all: initial !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 24px !important; margin-top: 36px !important; padding-top: 32px !important; border-top: 2px solid #e5e7eb !important; flex-wrap: wrap !important;">
      <div style="all: initial !important; display: flex !important; align-items: center !important; gap: 8px !important;"><span style="all: initial !important; font-size: 20px !important; display: inline-block !important;">✓</span><span style="all: initial !important; font-size: 14px !important; color: #111827 !important; font-weight: 600 !important; display: inline-block !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">Gratis verzending</span></div>
      <div style="all: initial !important; display: flex !important; align-items: center !important; gap: 8px !important;"><span style="all: initial !important; font-size: 20px !important; display: inline-block !important;">✓</span><span style="all: initial !important; font-size: 14px !important; color: #111827 !important; font-weight: 600 !important; display: inline-block !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">30 dagen retour</span></div>
      <div style="all: initial !important; display: flex !important; align-items: center !important; gap: 8px !important;"><span style="all: initial !important; font-size: 20px !important; display: inline-block !important;">✓</span><span style="all: initial !important; font-size: 14px !important; color: #111827 !important; font-weight: 600 !important; display: inline-block !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">Veilig betalen</span></div>
    </div>
  </div>
</div>
<!-- End Affiliate CTA Box -->
`;
}

/**
 * Generate WordPress-compatible HTML for a product grid
 */
export function generateProductGridHTML(products: ProductData[]): string {
  return `
<!-- Affiliate Product Grid -->
<div class="writgo-product-grid" style="display: grid !important; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important; gap: 28px !important; margin: 50px 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; box-sizing: border-box !important;">
  ${products.map(product => {
    const imageUrl = product.image || 'https://placehold.co/600x400/e5e7eb/6b7280?text=Product+Image';
    return `
  <div style="background: white !important; border-radius: 16px !important; overflow: hidden !important; box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; border: 2px solid #f0f0f0 !important; box-sizing: border-box !important; display: block !important;" onmouseover="this.style.boxShadow='0 8px 24px rgba(0,0,0,0.15)'; this.style.transform='translateY(-4px)'" onmouseout="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'; this.style.transform='translateY(0)'">
    <!-- Image -->
    <div style="width: 100% !important; height: 240px !important; overflow: hidden !important; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 24px !important; box-sizing: border-box !important;">
      <img src="${imageUrl}" alt="${product.title}" style="max-width: 100% !important; max-height: 100% !important; width: auto !important; height: auto !important; object-fit: contain !important; display: block !important; margin: 0 auto !important;" loading="lazy" onerror="this.src='https://placehold.co/600x400/e5e7eb/6b7280?text=Product'" />
    </div>
    
    <!-- Content -->
    <div style="padding: 24px !important; box-sizing: border-box !important;">
      <h4 style="margin: 0 0 12px 0 !important; padding: 0 !important; font-size: 19px !important; font-weight: 700 !important; color: #212529 !important; min-height: 50px !important; line-height: 1.4 !important; display: block !important;">${product.title}</h4>
      
      ${product.rating ? `<div style="margin-bottom: 14px !important; display: block !important;">${generateStarsHTML(product.rating)}</div>` : ''}
      
      ${product.description ? `<p style="margin: 0 0 18px 0 !important; padding: 0 !important; font-size: 14px !important; line-height: 1.6 !important; color: #6c757d !important; display: block !important;">${product.description.substring(0, 110)}${product.description.length > 110 ? '...' : ''}</p>` : ''}
      
      <div style="display: flex !important; justify-content: space-between !important; align-items: center !important; margin-top: 20px !important; padding-top: 18px !important; border-top: 2px solid #f0f0f0 !important; box-sizing: border-box !important;">
        ${product.price ? `<div style="font-size: 24px !important; font-weight: 800 !important; color: #10b981 !important; line-height: 1 !important; display: inline-block !important;">${product.price}</div>` : '<div></div>'}
        
        <a href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer nofollow sponsored" style="background: linear-gradient(135deg, #5865f2 0%, #7289da 100%) !important; color: white !important; padding: 12px 24px !important; border-radius: 10px !important; text-decoration: none !important; font-weight: 700 !important; font-size: 15px !important; display: inline-flex !important; align-items: center !important; gap: 6px !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; box-shadow: 0 4px 12px rgba(88, 101, 242, 0.35) !important; white-space: nowrap !important; box-sizing: border-box !important; line-height: 1.2 !important;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(88, 101, 242, 0.45)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(88, 101, 242, 0.35)'">🛒 Bekijk →</a>
      </div>
    </div>
  </div>
  `;
  }).join('')}
</div>
<!-- End Affiliate Product Grid -->
`;
}

/**
 * Generate WordPress-compatible HTML for a comparison table
 */
export function generateComparisonTableHTML(products: ProductData[]): string {
  return `
<!-- Affiliate Comparison Table -->
<div class="writgo-comparison-table" style="overflow-x: auto !important; margin: 50px 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; box-sizing: border-box !important;">
  <table style="width: 100% !important; border-collapse: collapse !important; background: white !important; border-radius: 16px !important; overflow: hidden !important; box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important; border: 3px solid #f0f0f0 !important; box-sizing: border-box !important;">
    <thead>
      <tr style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important; border-bottom: 3px solid #dee2e6 !important;">
        <th style="padding: 20px !important; text-align: left !important; color: #212529 !important; font-weight: 800 !important; font-size: 16px !important; box-sizing: border-box !important;">Product</th>
        <th style="padding: 20px !important; text-align: center !important; color: #212529 !important; font-weight: 800 !important; font-size: 16px !important; box-sizing: border-box !important;">Beoordeling</th>
        <th style="padding: 20px !important; text-align: center !important; color: #212529 !important; font-weight: 800 !important; font-size: 16px !important; box-sizing: border-box !important;">Prijs</th>
        <th style="padding: 20px !important; text-align: center !important; color: #212529 !important; font-weight: 800 !important; font-size: 16px !important; box-sizing: border-box !important;">Actie</th>
      </tr>
    </thead>
    <tbody>
      ${products.map((product, index) => {
        const imageUrl = product.image || 'https://placehold.co/600x400/e5e7eb/6b7280?text=Product+Image';
        return `
      <tr style="border-bottom: 2px solid #f0f0f0 !important; ${index % 2 === 0 ? 'background: #fafafa !important;' : 'background: white !important;'} transition: background 0.2s !important;" onmouseover="this.style.background='#f0f7ff'" onmouseout="this.style.background='${index % 2 === 0 ? '#fafafa' : 'white'}'">
        <td style="padding: 20px !important; box-sizing: border-box !important;">
          <div style="display: flex !important; align-items: center !important; gap: 16px !important;">
            <img src="${imageUrl}" alt="${product.title}" style="width: 90px !important; height: 90px !important; object-fit: contain !important; border-radius: 12px !important; background: #ffffff !important; padding: 8px !important; border: 2px solid #e5e7eb !important; box-sizing: border-box !important; display: block !important;" loading="lazy" onerror="this.src='https://placehold.co/600x400/e5e7eb/6b7280?text=Product'" />
            <div style="flex: 1 !important;">
              <div style="font-weight: 700 !important; color: #212529 !important; margin-bottom: 6px !important; font-size: 17px !important; line-height: 1.3 !important; display: block !important;">${product.title}</div>
              ${product.category ? `<div style="font-size: 13px !important; color: #6c757d !important; display: inline-block !important; background: #f8f9fa !important; padding: 3px 10px !important; border-radius: 10px !important; font-weight: 600 !important;">${product.category}</div>` : ''}
            </div>
          </div>
        </td>
        <td style="padding: 20px !important; text-align: center !important; box-sizing: border-box !important; vertical-align: middle !important;">
          ${product.rating ? generateStarsHTML(product.rating) : '<span style="color: #adb5bd !important; font-size: 14px !important;">-</span>'}
        </td>
        <td style="padding: 20px !important; text-align: center !important; box-sizing: border-box !important; vertical-align: middle !important;">
          <div style="font-size: 22px !important; font-weight: 800 !important; color: #10b981 !important; line-height: 1 !important; display: inline-block !important;">${product.price || '-'}</div>
        </td>
        <td style="padding: 20px !important; text-align: center !important; box-sizing: border-box !important; vertical-align: middle !important;">
          <a href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer nofollow sponsored" style="background: linear-gradient(135deg, #5865f2 0%, #7289da 100%) !important; color: white !important; padding: 12px 24px !important; border-radius: 10px !important; text-decoration: none !important; font-weight: 700 !important; font-size: 15px !important; display: inline-flex !important; align-items: center !important; gap: 6px !important; white-space: nowrap !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; box-shadow: 0 4px 12px rgba(88, 101, 242, 0.35) !important; box-sizing: border-box !important; line-height: 1.2 !important;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(88, 101, 242, 0.45)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(88, 101, 242, 0.35)'">🛒 Bekijk →</a>
        </td>
      </tr>
      `;
      }).join('')}
    </tbody>
  </table>
</div>
<!-- End Affiliate Comparison Table -->
`;
}

/**
 * Generate WordPress-compatible HTML for a text link
 */
export function generateTextLinkHTML(product: ProductData, customText?: string): string {
  return `<a href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer nofollow sponsored" style="color: #3b82f6; text-decoration: underline; text-decoration-color: #3b82f6; font-weight: 600; transition: color 0.2s;" onmouseover="this.style.color='#2563eb'" onmouseout="this.style.color='#3b82f6'">${customText || product.title}</a>`;
}

/**
 * Generate stars HTML for rating
 */
function generateStarsHTML(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let starsHTML = '<span style="display: inline-flex !important; align-items: center !important; gap: 3px !important; color: #fbbf24 !important; font-size: 18px !important; line-height: 1 !important;">';
  
  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<span style="color: #fbbf24 !important; display: inline-block !important;">★</span>';
  }
  
  // Half star
  if (hasHalfStar) {
    starsHTML += '<span style="color: #fbbf24 !important; display: inline-block !important;">☆</span>';
  }
  
  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<span style="color: #e5e7eb !important; display: inline-block !important;">☆</span>';
  }
  
  starsHTML += `<span style="margin-left: 6px !important; font-size: 15px !important; font-weight: 700 !important; color: #212529 !important; display: inline-block !important; line-height: 1 !important;">${rating.toFixed(1)}</span>`;
  starsHTML += '</span>';
  
  return starsHTML;
}

/**
 * Main function to generate affiliate display HTML
 */
export function generateAffiliateDisplayHTML(
  products: ProductData | ProductData[],
  displayType: DisplayType = 'product-box'
): string {
  const productsArray = Array.isArray(products) ? products : [products];
  
  if (productsArray.length === 0) {
    return '';
  }
  
  switch (displayType) {
    case 'text-link':
      return generateTextLinkHTML(productsArray[0]);
    
    case 'product-box':
      return generateProductBoxHTML(productsArray[0]);
    
    case 'cta-box':
      return generateCTABoxHTML(productsArray[0]);
    
    case 'product-grid':
      return generateProductGridHTML(productsArray);
    
    case 'comparison-table':
      return generateComparisonTableHTML(productsArray);
    
    case 'product-carousel':
      // Carousel wordt een grid in WordPress (geen JavaScript)
      return generateProductGridHTML(productsArray);
    
    default:
      return generateProductBoxHTML(productsArray[0]);
  }
}

/**
 * Convert Bol.com product to ProductData format
 */
export function bolcomToProductData(bolcomProduct: any): ProductData {
  // Try multiple sources for the image - use real Bol.com images only
  let imageUrl = '';
  
  if (bolcomProduct.image?.url) {
    imageUrl = bolcomProduct.image.url;
  } else if (bolcomProduct.image && typeof bolcomProduct.image === 'string') {
    imageUrl = bolcomProduct.image;
  } else if (bolcomProduct.images?.[0]?.url) {
    imageUrl = bolcomProduct.images[0].url;
  } else if (bolcomProduct.media?.images?.[0]?.url) {
    imageUrl = bolcomProduct.media.images[0].url;
  }
  
  // Log warning if no image found (for debugging)
  if (!imageUrl) {
    console.warn('No image found for Bol.com product:', bolcomProduct.title || bolcomProduct.name);
  }
  
  return {
    id: bolcomProduct.id || bolcomProduct.productId || '',
    title: bolcomProduct.title || bolcomProduct.name || '',
    price: bolcomProduct.price || bolcomProduct.offerData?.offers?.[0]?.price || '',
    rating: bolcomProduct.rating || bolcomProduct.ratingMethod?.rating || 0,
    reviewCount: bolcomProduct.reviewCount || 0,
    image: imageUrl,
    affiliateUrl: bolcomProduct.affiliateUrl || bolcomProduct.urls?.main || '',
    description: bolcomProduct.description || bolcomProduct.shortDescription || '',
    features: bolcomProduct.features || [],
    category: bolcomProduct.category || '',
  };
}
