'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BlogFeaturedImageProps {
  src: string;
  alt: string;
  title: string;
}

export default function BlogFeaturedImage({ src, alt, title }: BlogFeaturedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(true);
  const [validatedSrc, setValidatedSrc] = useState<string | null>(null);

  const isExternalImage = src.includes('pixabay.com') || src.includes('unsplash.com') || src.includes('pexels.com');

  // Validate external image URLs before rendering
  useEffect(() => {
    if (!isExternalImage) {
      setValidatedSrc(src);
      setIsValidating(false);
      return;
    }

    // For external images, validate they're accessible
    const img = new window.Image();
    img.onload = () => {
      setValidatedSrc(src);
      setIsValidating(false);
    };
    img.onerror = () => {
      console.log(`Skipping broken external image: ${src}`);
      setHasError(true);
      setIsValidating(false);
    };
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, isExternalImage]);

  // Don't render if image failed validation or loading
  if (hasError || (!isValidating && !validatedSrc)) {
    return null;
  }

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-12 shadow-lg ring-1 ring-gray-800">
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-12 shadow-lg ring-1 ring-gray-800">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}
      <Image
        src={validatedSrc!}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        priority
        unoptimized={isExternalImage}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
