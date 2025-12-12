
'use client';

import { Check, X, Star, ExternalLink } from 'lucide-react';
import Image from 'next/image';

/**
 * Comparison Table - Vergelijk meerdere producten side-by-side
 * Perfect voor top 3, best vs rest, etc.
 */

export interface ComparisonProduct {
  title: string;
  price: string;
  imageUrl?: string;
  url: string;
  rating?: number;
  features: {
    label: string;
    value: boolean | string | number;
  }[];
  badge?: string;
  isRecommended?: boolean;
}

interface AffiliateComparisonTableProps {
  products: ComparisonProduct[];
  title?: string;
  description?: string;
  className?: string;
}

export default function AffiliateComparisonTable({
  products,
  title,
  description,
  className = ''
}: AffiliateComparisonTableProps) {
  // Get all unique feature labels
  const allFeatures = Array.from(
    new Set(
      products.flatMap(p => p.features.map(f => f.label))
    )
  );

  const renderFeatureValue = (value: boolean | string | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-red-300 mx-auto" />
      );
    }
    return <span className="text-gray-700">{value}</span>;
  };

  return (
    <div className={`my-8 overflow-x-auto ${className}`}>
      {/* Header */}
      {(title || description) && (
        <div className="mb-6 text-center">
          {title && (
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
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

      <div className="min-w-[768px]">
        <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${products.length}, 1fr)` }}>
          {/* Header Row */}
          <div className="bg-gray-50 p-4 rounded-t-xl border border-gray-200">
            <h4 className="font-semibold text-gray-600">Specificaties</h4>
          </div>

          {products.map((product, index) => (
            <div
              key={index}
              className={`
                p-4 rounded-t-xl border-2 relative
                ${product.isRecommended 
                  ? 'border-orange-400 bg-orange-50' 
                  : 'border-gray-200 bg-white'
                }
              `}
            >
              {/* Badge */}
              {product.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg whitespace-nowrap">
                    {product.badge}
                  </span>
                </div>
              )}

              {/* Image */}
              {product.imageUrl && (
                <div className="relative w-full h-32 mb-3 bg-white rounded-lg overflow-hidden">
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    className="object-contain p-2"
                    sizes="200px"
                  />
                </div>
              )}

              {/* Title */}
              <h4 className="font-bold text-gray-700 mb-2 line-clamp-2 min-h-[2.5rem]">
                {product.title}
              </h4>

              {/* Rating */}
              {product.rating && (
                <div className="flex items-center justify-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= product.rating!
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Price */}
              <div className="text-center mb-3">
                <span className="text-2xl font-bold text-orange-600">
                  {product.price}
                </span>
              </div>

              {/* CTA */}
              <a
                href={product.url}
                target="_blank"
                rel="nofollow noopener noreferrer sponsored"
                className={`
                  block w-full py-2.5 px-4 rounded-lg font-semibold text-center
                  transition-all duration-200
                  flex items-center justify-center gap-2
                  ${product.isRecommended
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                Bekijken
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}

          {/* Feature Rows */}
          {allFeatures.map((featureLabel, featureIndex) => (
            <>
              {/* Feature Label */}
              <div 
                key={`label-${featureIndex}`}
                className={`
                  p-4 font-medium text-gray-700 border-l border-r border-gray-200
                  ${featureIndex === allFeatures.length - 1 ? 'rounded-b-xl border-b' : ''}
                  ${featureIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                `}
              >
                {featureLabel}
              </div>

              {/* Feature Values */}
              {products.map((product, productIndex) => {
                const feature = product.features.find(f => f.label === featureLabel);
                return (
                  <div
                    key={`value-${featureIndex}-${productIndex}`}
                    className={`
                      p-4 text-center border-r border-gray-200
                      ${featureIndex === allFeatures.length - 1 ? 'rounded-b-xl border-b' : ''}
                      ${featureIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                      ${product.isRecommended ? 'border-l-2 border-r-2 border-orange-400' : ''}
                    `}
                  >
                    {feature ? renderFeatureValue(feature.value) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
