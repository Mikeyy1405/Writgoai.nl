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
    image: { width: 80, height: 24 },
  },
  sm: {
    container: 'h-8',
    text: 'text-sm',
    tagline: 'text-xs',
    image: { width: 100, height: 32 },
  },
  md: {
    container: 'h-10',
    text: 'text-base',
    tagline: 'text-sm',
    image: { width: 140, height: 40 },
  },
  lg: {
    container: 'h-14',
    text: 'text-xl',
    tagline: 'text-base',
    image: { width: 176, height: 56 },
  },
  xl: {
    container: 'h-20',
    text: 'text-3xl',
    tagline: 'text-lg',
    image: { width: 240, height: 80 },
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
    return brand.logoUrl || 'https://computerstartgids.nl/wp-content/uploads/2025/12/Writgo-Media-logo-4.png';
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
          className="object-contain"
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
          className="object-contain object-left"
          priority
        />
      </div>
      {showTagline && brand.tagline && (
        <span className={cn('text-gray-400 mt-1', sizeConfig.tagline)}>{brand.tagline}</span>
      )}
    </div>
  );
}
