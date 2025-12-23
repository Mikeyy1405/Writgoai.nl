'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textClassName?: string;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

export default function Logo({
  className = '',
  size = 'md',
  showText = true,
  textClassName = 'text-xl font-bold text-white'
}: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch logo URL from API
    fetch('/api/branding/logo')
      .then(res => res.json())
      .then(data => {
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
        }
      })
      .catch(err => console.error('Failed to fetch logo:', err))
      .finally(() => setLoading(false));
  }, []);

  const sizeClass = sizeMap[size];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {loading ? (
        // Loading state - show gradient
        <div className={`${sizeClass} bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg animate-pulse`}></div>
      ) : logoUrl ? (
        // Show uploaded logo
        <div className={`${sizeClass} relative overflow-hidden rounded-lg`}>
          <Image
            src={logoUrl}
            alt="Writgo Media Logo"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 32px, 40px"
          />
        </div>
      ) : (
        // Fallback to gradient
        <div className={`${sizeClass} bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg`}></div>
      )}
      {showText && <span className={textClassName}>Writgo Media</span>}
    </div>
  );
}
