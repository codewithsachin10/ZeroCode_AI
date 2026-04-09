/**
 * Service Worker Registration and Management
 */

interface ServiceWorkerOptions {
  skipWaiting?: boolean;
  clientsClaim?: boolean;
  onUpdateAvailable?: () => void;
  onOffline?: () => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;

  /**
   * Register the service worker
   */
  async register(options: ServiceWorkerOptions = {}): Promise<void> {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported in this browser');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully');

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available');
              options.onUpdateAvailable?.();
            }
          });
        }
      });

      // Skip waiting if requested
      if (options.skipWaiting) {
        const waitingWorker = this.registration.waiting;
        if (waitingWorker) {
          waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      }

      return;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Check if service worker is active
   */
  isActive(): boolean {
    return this.registration?.active !== undefined;
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<void> {
    if (this.registration) {
      const success = await this.registration.unregister();
      if (success) {
        this.registration = null;
        console.log('Service Worker unregistered successfully');
      }
    }
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    const cacheNames = await caches.keys();

    await Promise.all(
      cacheNames.map((name) => caches.delete(name))
    );

    console.log('All caches cleared');
  }

  /**
   * Send message to service worker
   */
  postMessage(message: Record<string, unknown>): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }

  /**
   * Handle online/offline status
   */
  setupOfflineHandler(onOffline?: () => void, onOnline?: () => void): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Back online');
      onOnline?.();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Gone offline');
      onOffline?.();
    });
  }

  /**
   * Check if app is currently online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export const swManager = new ServiceWorkerManager();

export default swManager;
