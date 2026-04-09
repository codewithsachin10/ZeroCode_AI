import { useEffect, useState } from 'react';
import { firestoreCache } from '@/services/firestoreCache';

interface UseFirestoreCachedQueryOptions {
  ttl?: number;
  skip?: boolean;
}

/**
 * Hook to use Firestore cache
 * First checks cache, then makes query if cache miss
 */
export function useFirestoreCachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  options?: UseFirestoreCachedQueryOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(!firestoreCache.has(cacheKey));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options?.skip) {
      return;
    }

    const loadData = async () => {
      try {
        // Check cache first
        const cachedData = firestoreCache.get<T>(cacheKey);

        if (cachedData) {
          setData(cachedData);
          setIsLoading(false);
          return;
        }

        // Cache miss - fetch data
        setIsLoading(true);
        const result = await queryFn();

        // Store in cache
        firestoreCache.set(cacheKey, result, { ttl: options?.ttl });

        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [cacheKey, queryFn, options?.ttl, options?.skip]);

  const refresh = async () => {
    try {
      setIsLoading(true);
      const result = await queryFn();
      firestoreCache.set(cacheKey, result, { ttl: options?.ttl });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const invalidateCache = () => {
    firestoreCache.remove(cacheKey);
    setData(null);
  };

  return {
    data,
    isLoading,
    error,
    refresh,
    invalidateCache,
  };
}

export default useFirestoreCachedQuery;
