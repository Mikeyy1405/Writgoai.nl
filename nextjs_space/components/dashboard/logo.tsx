import { BrandLogo } from '@/components/brand/brand-logo';

export function Logo({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean }) {
  // Map the size parameter to BrandLogo size
  const brandLogoSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';
  
  return <BrandLogo variant={showText ? 'full' : 'text'} size={brandLogoSize} />;
}
