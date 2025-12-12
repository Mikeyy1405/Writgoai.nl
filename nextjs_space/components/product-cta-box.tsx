
'use client';

import { ShoppingBag, Star, ExternalLink, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface ProductCTABoxProps {
  title: string;
  description?: string;
  price?: string;
  rating?: string;
  imageUrl?: string;
  affiliateUrl: string;
  className?: string;
}

export default function ProductCTABox({
  title,
  description,
  price,
  rating,
  imageUrl,
  affiliateUrl,
  className = '',
}: ProductCTABoxProps) {
  return (
    <div className={`my-8 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50 border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="grid md:grid-cols-[300px_1fr] gap-6 p-6">
        {/* Product Image */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-white shadow-md">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-contain p-4"
              sizes="300px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <ShoppingBag className="h-20 w-20 text-gray-300" />
            </div>
          )}
          
          {/* Rating Badge */}
          {rating && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-700">{rating}</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-gray-700 leading-tight">
              {title}
            </h3>
            
            {description && (
              <p className="text-gray-600 text-base leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Price & CTA */}
          <div className="flex items-end justify-between gap-4 mt-6">
            <div className="space-y-1">
              {price && (
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    Vanaf
                  </span>
                  <span className="text-3xl font-bold text-orange-600">
                    {price}
                  </span>
                </div>
              )}
            </div>

            <a
              href={affiliateUrl}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Bekijk Product</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
            <ExternalLink className="h-3 w-3" />
            <span>Veilig bestellen via onze partner</span>
          </div>
        </div>
      </div>
    </div>
  );
}
