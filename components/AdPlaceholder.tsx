interface AdPlaceholderProps {
  size?: 'small' | 'medium' | 'large' | 'banner';
  className?: string;
}

import { useEffect } from 'react';

export function AdPlaceholder({ size = 'medium', className = '' }: AdPlaceholderProps) {
  const sizeClasses = {
    small: 'h-24',
    medium: 'h-32',
    large: 'h-48',
    banner: 'h-24'
  };

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense might not be loaded or blocked by adblock
    }
  }, []);

  return (
    <div className={`overflow-hidden rounded-lg flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-6396545501693467"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}
