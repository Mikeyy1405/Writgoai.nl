
'use client';

import { ExternalLink, Star, CheckCircle } from 'lucide-react';
import Image from 'next/image';

/**
 * CTA Box - Call-to-Action box met grote button
 * Perfect voor featured/aanbevolen product
 */

interface AffiliateCTABoxProps {
  title: string;
  description: string;
  price: string;
  oldPrice?: string;
  imageUrl?: string;
  url: string;
  ctaText?: string;
  features?: string[];
  rating?: number;
  badge?: string;
  className?: string;
  variant?: 'default' | 'gradient' | 'bordered';
}

export default function AffiliateCTABox({
  title,
  description,
  price,
  oldPrice,
  imageUrl,
  url,
  ctaText = 'Bekijk Product →',
  features,
  rating,
  badge,
  className = '',
  variant = 'default'
}: AffiliateCTABoxProps) {
  const variants = {
    default: 'bg-white border-2 border-gray-200',
    gradient: 'bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200',
    bordered: 'bg-white border-3 border-orange-400 shadow-lg'
  };

  return (
    <div className={`my-8 ${className}`}>
      <div className={`
        ${variants[variant]}
        rounded-2xl p-6 md:p-8
        hover:shadow-xl transition-all duration-300
        relative overflow-hidden
      `}>
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-100 rounded-full -mr-20 -mt-20 opacity-50" />
        
        {/* Badge */}
        {badge && (
          <div className="absolute top-4 left-4 z-10">
            <span className="px-4 py-1.5 bg-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
              {badge}
            </span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 relative z-10">
          {/* Image */}
          {imageUrl && (
            <div className="flex-shrink-0">
              <div className="relative w-full md:w-48 h-48 bg-white rounded-xl overflow-hidden shadow-md">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, 192px"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {title}
              </h3>

              {rating && (
                <div className="flex items-center gap-1.5 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                </div>
              )}

              <p className="text-gray-700 mb-4 text-lg">
                {description}
              </p>

              {features && features.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Price & CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-orange-600">
                  {price}
                </span>
                {oldPrice && (
                  <span className="text-xl text-gray-400 line-through">
                    {oldPrice}
                  </span>
                )}
              </div>

              <a
                href={url}
                target="_blank"
                rel="nofollow noopener noreferrer sponsored"
                className="
                  px-8 py-4 bg-orange-500 text-white font-bold text-lg rounded-xl
                  hover:bg-orange-600 hover:scale-105
                  transition-all duration-200
                  flex items-center gap-2 justify-center
                  shadow-lg hover:shadow-xl
                  whitespace-nowrap
                  w-full sm:w-auto
                "
              >
                {ctaText}
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
