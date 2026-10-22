import React, { useState, useEffect, useRef } from 'react';
import { Cpu } from 'lucide-react';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset error and loaded states whenever the image source changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      }
    }
  }, [src]);

  // Only apply studio-cutout (mix-blend-mode: multiply) to transparent studio assets.
  // Never apply multiply blend mode to user-uploaded photos, camera images, or data URLs
  // as it causes real photos to turn dark or invisible against container backgrounds.
  const isUserUpload =
    typeof src === 'string' &&
    (src.startsWith('/uploads/') ||
      src.startsWith('data:') ||
      src.startsWith('blob:') ||
      src.includes('firebasestorage'));
  const applyCutout = cutout && !isUserUpload;

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#EAE9E4] text-[#6E6D68] p-4 select-none ${containerClassName}`}
      >
        <Cpu className="w-8 h-8 stroke-[1.25] mb-2 text-[#141413]/50" />
        <span className="text-[10px] font-mono-num uppercase tracking-wider text-center line-clamp-2">
          {alt || 'TECH SOKONI HARDWARE'}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#E5E4DE] animate-pulse pointer-events-none"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${applyCutout ? 'studio-cutout' : ''} ${className}`}
      />
    </div>
  );
};
