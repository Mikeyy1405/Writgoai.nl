
'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AffiliateProductCard, { ProductCardData } from './affiliate-product-card';

/**
 * Product Carousel - Sliding carousel van producten
 * Met navigatie knoppen en auto-play optie
 */

interface AffiliateProductCarouselProps {
  products: ProductCardData[];
  itemsPerView?: number; // Hoeveel producten tegelijk tonen
  autoPlay?: boolean;
  autoPlayInterval?: number; // milliseconds
  title?: string;
  description?: string;
  className?: string;
}

export default function AffiliateProductCarousel({
  products,
  itemsPerView = 3,
  autoPlay = false,
  autoPlayInterval = 5000,
  title,
  description,
  className = ''
}: AffiliateProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalSlides = Math.ceil(products.length / itemsPerView);
  const canGoNext = currentIndex < totalSlides - 1;
  const canGoPrev = currentIndex > 0;

  const goToNext = () => {
    if (canGoNext) {
      setCurrentIndex(prev => prev + 1);
    } else if (autoPlay) {
      setCurrentIndex(0); // Loop terug naar begin
    }
  };

  const goToPrev = () => {
    if (canGoPrev) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play
  useEffect(() => {
    if (!autoPlay || isPaused) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [currentIndex, autoPlay, isPaused, autoPlayInterval]);

  // Responsive items per view
  const getItemsForCurrentView = () => {
    if (typeof window === 'undefined') return itemsPerView;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return itemsPerView;
  };

  const [responsiveItems, setResponsiveItems] = useState(itemsPerView);

  useEffect(() => {
    const handleResize = () => {
      setResponsiveItems(getItemsForCurrentView());
    };

    handleResize(); // Initial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerView]);

  const visibleProducts = products.slice(
    currentIndex * responsiveItems,
    (currentIndex + 1) * responsiveItems
  );

  return (
    <div 
      className={`my-8 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
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

      {/* Carousel */}
      <div className="relative">
        {/* Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProducts.map((product, index) => (
            <AffiliateProductCard
              key={currentIndex * responsiveItems + index}
              product={product}
              variant="default"
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={goToPrev}
              disabled={!canGoPrev}
              className={`
                absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4
                w-12 h-12 rounded-full bg-slate-900 shadow-lg
                flex items-center justify-center
                transition-all duration-200
                ${canGoPrev 
                  ? 'hover:bg-orange-500 hover:text-white cursor-pointer' 
                  : 'opacity-40 cursor-not-allowed'
                }
              `}
              aria-label="Vorige"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={goToNext}
              disabled={!canGoNext && !autoPlay}
              className={`
                absolute right-0 top-1/2 -translate-y-1/2 translate-x-4
                w-12 h-12 rounded-full bg-slate-900 shadow-lg
                flex items-center justify-center
                transition-all duration-200
                ${canGoNext || autoPlay
                  ? 'hover:bg-orange-500 hover:text-white cursor-pointer' 
                  : 'opacity-40 cursor-not-allowed'
                }
              `}
              aria-label="Volgende"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Dots Navigation */}
      {totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-200
                ${index === currentIndex 
                  ? 'bg-orange-500 w-8' 
                  : 'bg-gray-300 hover:bg-gray-400'
                }
              `}
              aria-label={`Ga naar slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
