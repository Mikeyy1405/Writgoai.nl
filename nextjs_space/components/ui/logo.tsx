import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = "h-10 w-auto", width = 150, height = 40 }: LogoProps) {
  return (
    <Image 
      src="https://computerstartgids.nl/wp-content/uploads/2025/12/Writgo-Media-logo-4.png"
      alt="Writgo"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
