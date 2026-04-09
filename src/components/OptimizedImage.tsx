import React, { useState, useEffect } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderSrc?: string;
  width?: number;
  height?: number;
}

/**
 * OptimizedImage Component
 * Provides lazy loading, placeholder, and error handling for images
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  placeholderSrc,
  width,
  height,
  className = '',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholderSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const img = new Image();

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };

    img.src = src;
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      <img
        {...props}
        src={imageSrc}
        alt={alt}
        loading="lazy"
        width={width}
        height={height}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'} ${hasError ? 'opacity-30' : ''}`}
      />

      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
          <span className="text-xs text-text-muted">Image failed to load</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
