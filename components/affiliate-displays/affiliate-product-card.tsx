
'use client';

import { Star, ShoppingCart, TrendingUp, ExternalLink } from 'lucide-react';
import Image from 'next/image';

/**
 * Modern Product Card - Verbeterde product display
 * Mooi design met hover effects, rating, prijs en CTA
 */

export interface ProductCardData {
  title: string;
  price: string;
  oldPrice?: string; // Voor strikethrough prijs
  rating?: number; // 0-5
  ratingCount?: number;
  imageUrl?: string;
  description?: string;
  url: string;
  badge?: string; // "Bestseller", "Aanbieding", etc.
  features?: string[]; // Bullet points
}

interface AffiliateProductCardProps {
  product: ProductCardData;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export default function AffiliateProductCard({ 
  product,
  className = '',
  variant = 'default'
}: AffiliateProductCardProps) {
  const renderRating = () => {
    if (!product.rating) return null;
    
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex">
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
        {product.ratingCount && (
          <span className="text-sm text-gray-600">
            ({product.ratingCount})
          </span>
        )}
      </div>
    );
  };

  if (variant === 'compact') {
    return (
      <a
        href={product.url}
        target="_blank"
        rel="nofollow noopener noreferrer sponsored"
        className={`
          group block p-4 bg-white border-2 border-gray-200 rounded-xl
          hover:border-orange-400 hover:shadow-lg
          transition-all duration-300
          ${className}
        `}
      >
        <div className="flex gap-4">
          {/* Image */}
          <div className="relative w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.title}
                fill
                className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                sizes="80px"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ShoppingCart className="h-8 w-8 text-gray-300" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
              {product.title}
            </h4>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-bold text-orange-600">
                {product.price}
              </span>
              {product.oldPrice && (
                <span className="text-sm text-gray-400 line-through">
                  {product.oldPrice}
                </span>
              )}
            </div>
            {renderRating()}
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 flex items-center">
            <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={product.url}
      target="_blank"
      rel="nofollow noopener noreferrer sponsored"
      className={`
        group block bg-white border-2 border-gray-200 rounded-xl overflow-hidden
        hover:border-orange-400 hover:shadow-xl
        transition-all duration-300
        ${className}
      `}
    >
      {/* Badge */}
      {product.badge && (
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
            {product.badge}
          </span>
        </div>
      )}

      {/* Image */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ShoppingCart className="h-16 w-16 text-gray-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {product.title}
        </h3>

        {product.description && variant === 'detailed' && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {product.features && variant === 'detailed' && (
          <ul className="mb-3 space-y-1">
            {product.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-1">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {renderRating()}

        {/* Price & CTA */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-600">
              {product.price}
            </span>
            {product.oldPrice && (
              <span className="text-sm text-gray-400 line-through">
                {product.oldPrice}
              </span>
            )}
          </div>
          <button className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 group-hover:scale-105 transition-transform">
            Bekijken
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </a>
  );
}
