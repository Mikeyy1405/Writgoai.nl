export function Logo({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean }) {
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center">
      <span className={`font-bold tracking-tight ${textSizeClasses[size]}`}>
        <span className="text-white">Writgo</span>
        <span className="text-[#FF6B35]">Media</span>
      </span>
    </div>
  );
}
