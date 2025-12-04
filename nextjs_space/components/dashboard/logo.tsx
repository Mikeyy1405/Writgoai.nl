export function Logo({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean }) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-[#FF9933] to-[#FFAD33] rounded-lg flex items-center justify-center`}
      >
        <span className={`text-white font-bold ${textSizeClasses[size]}`}>W</span>
      </div>
      {showText && (
        <span className={`font-semibold ${textSizeClasses[size]}`}>
          <span className="text-white">Writgo</span>
          <span className="text-[#FF6B35]">Media</span>
        </span>
      )}
    </div>
  );
}
