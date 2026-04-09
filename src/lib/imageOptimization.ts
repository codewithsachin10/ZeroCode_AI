import React, { useEffect } from 'react';

/**
 * Utility to cache and optimize YouTube thumbnail URLs
 */
class YouTubeThumbnailCache {
  private cache: Map<string, string> = new Map();

  /**
   * Get optimized YouTube thumbnail URL
   */
  getThumbnail(videoId: string, quality: 'maxres' | 'standard' | 'high' | 'medium' | 'default' = 'standard'): string {
    const cacheKey = `${videoId}-${quality}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // YouTube thumbnail URL format
    const qualityMap = {
      maxres: 'maxresdefault',
      standard: 'sddefault',
      high: 'hqdefault',
      medium: 'mqdefault',
      default: 'default',
    };

    const url = `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
    this.cache.set(cacheKey, url);

    return url;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }
}

export const YouTubeThumbnailService = new YouTubeThumbnailCache();

/**
 * Hook for intersection observer based lazy loading
 */
export function useIntersectionObserver(ref: React.RefObject<HTMLElement>, callback?: () => void) {
  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && callback) {
          callback();
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);

    return () => {
      // Store ref in a variable to avoid closure issues
      const element = ref.current;
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [ref, callback]);
}

export default {
  YouTubeThumbnailService,
  useIntersectionObserver,
};
