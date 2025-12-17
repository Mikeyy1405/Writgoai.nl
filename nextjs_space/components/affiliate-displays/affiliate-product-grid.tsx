
'use client';

import AffiliateProductCard, { ProductCardData } from './affiliate-product-card';

/**
 * Product Grid - Meerdere producten in grid layout
 * Responsive: 1 kolom op mobile, 2-3 op desktop
 */

interface AffiliateProductGridProps {
  products: ProductCardData[];
  columns?: 2 | 3 | 4;
  variant?: 'default' | 'compact' | 'detailed';
  title?: string;
  description?: string;
  className?: string;
}

export default function AffiliateProductGrid({
  products,
  columns = 3,
  variant = 'default',
  title,
  description,
  className = ''
}: AffiliateProductGridProps) {
  const gridClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4'
  }[columns];

  return (
    <div className={`my-8 ${className}`}>
      {/* Header */}
      {(title || description) && (
        <div className="mb-6 text-center">
          {title && (
            <h3 className="text-2xl font-bold text-slate-300 mb-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-gray-600 max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Grid */}
      <div className={`grid grid-cols-1 ${gridClass} gap-6`}>
        {products.map((product, index) => (
          <AffiliateProductCard
            key={index}
            product={product}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
}
