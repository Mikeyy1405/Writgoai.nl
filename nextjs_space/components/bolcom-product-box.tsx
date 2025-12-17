

'use client';

import { Star, ShoppingBag } from 'lucide-react';
import Image from 'next/image';

interface BolcomProductBoxProps {
  title: string;
  price: string;
  rating?: string;
  imageUrl?: string;
  affiliateUrl: string;
  className?: string;
}

export default function BolcomProductBox({
  title,
  price,
  rating,
  imageUrl,
  affiliateUrl,
  className = '',
}: BolcomProductBoxProps) {
  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="nofollow noopener noreferrer"
      className={`block my-6 p-4 bg-slate-900 border-2 border-slate-700 rounded-lg hover:border-orange-300 hover:shadow-lg transition-all ${className}`}
    >
      <div className="flex gap-4">
        <div className="relative w-20 h-20 flex-shrink-0 bg-slate-800 rounded overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-contain"
              sizes="80px"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ShoppingBag className="h-8 w-8 text-gray-300" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-300 mb-1 line-clamp-2">
            {title}
          </h4>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-orange-600">{price}</span>
            {rating && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

