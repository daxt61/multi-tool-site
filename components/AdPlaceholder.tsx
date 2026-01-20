interface AdPlaceholderProps {
  size?: 'small' | 'medium' | 'large' | 'banner';
  className?: string;
}

export function AdPlaceholder({ size = 'medium', className = '' }: AdPlaceholderProps) {
  const sizeClasses = {
    small: 'h-24',
    medium: 'h-32',
    large: 'h-48',
    banner: 'h-24'
  };

  return (
    <div className={`bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <div className="text-center text-gray-400">
        <div className="text-sm font-semibold">Espace publicitaire</div>
        <div className="text-xs mt-1">Publicité ici</div>
      </div>
    </div>
  );
}
