import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { STUDIO_IMAGES } from '../data/initialCatalog';

interface StudioImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  cutout?: boolean;
  priority?: boolean;
}

export const StudioImage: React.FC<StudioImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  cutout = true,
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);

  // Studio-cutout (mix-blend-mode: multiply) should ONLY be applied to transparent studio assets
  // that live in /src/assets/images/. NEVER apply multiply blend to user photos, data URLs,
  // camera pictures, or uploads, as it darkens or makes real photos transparent.
  const isStudioAsset = typeof src === 'string' && src.startsWith('/src/assets/images/');
  const applyCutout = cutout && isStudioAsset;

  // If the provided src is broken, fallback to clean studio hardware image
  const displaySrc = hasError || !src ? STUDIO_IMAGES.laptopPro : src;

  return (
    <div className={`relative overflow-hidden flex items-center justify-center ${containerClassName}`}>
      <img
        src={displaySrc}
        alt={alt || 'TECH SOKONI HARDWARE'}
        loading={priority || !isStudioAsset ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => {
          if (!hasError) setHasError(true);
        }}
        className={`w-full h-full object-contain ${applyCutout ? 'studio-cutout' : ''} ${className}`}
      />
    </div>
  );
};
