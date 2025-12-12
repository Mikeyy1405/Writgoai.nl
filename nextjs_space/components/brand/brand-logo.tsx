'use client';

import { useBrand } from '@/lib/brand-context';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  variant?: 'full' | 'icon' | 'text';
  theme?: 'light' | 'dark' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

const sizeClasses = {
  xs: {
    container: 'h-6',
    text: 'text-xs',
    tagline: 'text-[10px]',
    image: { width: 60, height: 24 },
  },
  sm: {
    container: 'h-8',
    text: 'text-sm',
    tagline: 'text-xs',
    image: { width: 80, height: 32 },
  },
  md: {
    container: 'h-9',
    text: 'text-base',
    tagline: 'text-sm',
    image: { width: 110, height: 32 },
  },
  lg: {
    container: 'h-12',
    text: 'text-xl',
    tagline: 'text-base',
    image: { width: 140, height: 44 },
  },
  xl: {
    container: 'h-16',
    text: 'text-3xl',
    tagline: 'text-lg',
    image: { width: 180, height: 64 },
  },
};

export function BrandLogo({
  variant = 'full',
  theme = 'auto',
  size = 'md',
  className,
  showTagline = false,
}: BrandLogoProps) {
  const brand = useBrand();
  const sizeConfig = sizeClasses[size];

  // Determine which logo to use based on theme
  const getLogoUrl = () => {
    if (variant === 'icon' && brand.logoIconUrl) {
      return brand.logoIconUrl;
    }

    if (theme === 'dark' && brand.logoDarkUrl) {
      return brand.logoDarkUrl;
    }

    if (theme === 'light' && brand.logoLightUrl) {
      return brand.logoLightUrl;
    }

    // Default logo
    return brand.logoUrl || '/writgo-media-logo-transparent.png';
  };

  // Text-only variant (fallback if no logo is set)
  if (variant === 'text' || !brand.logoUrl) {
    return (
      <div className={cn('flex flex-col', className)}>
        <span className={cn('font-bold tracking-tight', sizeConfig.text)}>
          <span className="text-white">{brand.companyName.slice(0, -2)}</span>
          <span style={{ color: brand.primaryColor }}>{brand.companyName.slice(-2)}</span>
        </span>
        {showTagline && brand.tagline && (
          <span className={cn('text-gray-400', sizeConfig.tagline)}>{brand.tagline}</span>
        )}
      </div>
    );
  }

  // Icon variant - just the icon, no text
  if (variant === 'icon') {
    return (
      <div className={cn('relative', sizeConfig.container, className)}>
        <Image
          src={getLogoUrl()}
          alt={brand.companyName}
          width={sizeConfig.image.width}
          height={sizeConfig.image.height}
          className="object-contain max-w-full max-h-full"
          style={{ maxHeight: '100%', width: 'auto', height: 'auto' }}
          priority
        />
      </div>
    );
  }

  // Full variant - logo with optional tagline
  return (
    <div className={cn('flex flex-col', className)}>
      <div className={cn('relative', sizeConfig.container)}>
        <Image
          src={getLogoUrl()}
          alt={brand.companyName}
          width={sizeConfig.image.width}
          height={sizeConfig.image.height}
          className="object-contain object-left max-w-full max-h-full"
          style={{ maxHeight: '100%', width: 'auto', height: 'auto' }}
          priority
        />
      </div>
      {showTagline && brand.tagline && (
        <span className={cn('text-gray-400 mt-1', sizeConfig.tagline)}>{brand.tagline}</span>
      )}
    </div>
  );
}
