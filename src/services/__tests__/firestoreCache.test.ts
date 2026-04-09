import { describe, it, expect, beforeEach, vi } from 'vitest';
import firestoreCache from '@/services/firestoreCache';

describe('FirestoreCache', () => {
  beforeEach(() => {
    firestoreCache.clear();
  });

  it('should set and get a cache entry', () => {
    const testData = { id: 1, name: 'Test' };
    firestoreCache.set('test-key', testData);

    const retrieved = firestoreCache.get('test-key');
    expect(retrieved).toEqual(testData);
  });

  it('should return null for non-existent keys', () => {
    const result = firestoreCache.get('non-existent');
    expect(result).toBeNull();
  });

  it('should check if key exists with has()', () => {
    firestoreCache.set('test-key', { data: 'test' });
    expect(firestoreCache.has('test-key')).toBe(true);
    expect(firestoreCache.has('non-existent')).toBe(false);
  });

  it('should remove a cache entry', () => {
    firestoreCache.set('test-key', { data: 'test' });
    expect(firestoreCache.has('test-key')).toBe(true);

    firestoreCache.remove('test-key');
    expect(firestoreCache.has('test-key')).toBe(false);
  });

  it('should clear all cache entries', () => {
    firestoreCache.set('key1', { data: 'test1' });
    firestoreCache.set('key2', { data: 'test2' });

    firestoreCache.clear();

    expect(firestoreCache.has('key1')).toBe(false);
    expect(firestoreCache.has('key2')).toBe(false);
  });

  it('should expire entries after TTL', () => {
    vi.useFakeTimers();

    const testData = { id: 1 };
    firestoreCache.set('test-key', testData, { ttl: 1000 }); // 1 second TTL

    expect(firestoreCache.get('test-key')).toEqual(testData);

    // Advance time by 2 seconds
    vi.advanceTimersByTime(2000);

    expect(firestoreCache.get('test-key')).toBeNull();

    vi.useRealTimers();
  });

  it('should use default TTL', () => {
    vi.useFakeTimers();

    firestoreCache.setDefaultTTL(2000);
    firestoreCache.set('test-key', { data: 'test' });

    // Should exist before TTL
    vi.advanceTimersByTime(1000);
    expect(firestoreCache.has('test-key')).toBe(true);

    // Should expire after TTL
    vi.advanceTimersByTime(1500);
    expect(firestoreCache.has('test-key')).toBe(false);

    vi.useRealTimers();
  });

  it('should get cache stats', () => {
    firestoreCache.set('key1', { data: 'test1' });
    firestoreCache.set('key2', { data: 'test2' });

    const stats = firestoreCache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.keys).toContain('key1');
    expect(stats.keys).toContain('key2');
  });
});
