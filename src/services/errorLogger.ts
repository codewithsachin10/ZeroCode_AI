import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ErrorLog {
  message: string;
  stack?: string;
  context?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: unknown;
  severity: 'error' | 'warning' | 'info';
}

class ErrorLogger {
  private isDevelopment = import.meta.env.DEV;

  /**
   * Log an error to Firebase and console
   */
  async logError(error: ErrorLog): Promise<void> {
    const errorData = {
      ...error,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: serverTimestamp(),
    };

    // Log to console in development
    if (this.isDevelopment) {
      console.error('[ErrorLogger]', errorData);
    }

    try {
      // Log to Firebase
      await addDoc(collection(db, 'error_logs'), errorData);
    } catch (firebaseError) {
      // Fallback: log to console if Firebase fails
      console.error('Failed to log error to Firebase:', firebaseError, errorData);
    }
  }

  /**
   * Log a warning
   */
  async logWarning(message: string, context?: string, userId?: string): Promise<void> {
    await this.logError({
      message,
      context,
      userId,
      severity: 'warning',
    });
  }

  /**
   * Log an info message
   */
  async logInfo(message: string, context?: string, userId?: string): Promise<void> {
    await this.logError({
      message,
      context,
      userId,
      severity: 'info',
    });
  }

  /**
   * Log an exception with stack trace
   */
  async logException(
    error: Error,
    context?: string,
    userId?: string
  ): Promise<void> {
    await this.logError({
      message: error.message,
      stack: error.stack,
      context,
      userId,
      severity: 'error' as const,
    });
  }

  /**
   * Set up global error handler
   */
  setupGlobalErrorHandler() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.logException(
        event.error || new Error(event.message),
        'globalErrorHandler'
      );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

      this.logException(error, 'unhandledRejection');
    });
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Make it globally available for error boundaries
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).logError = (error: ErrorLog) => errorLogger.logError(error);
}

export default errorLogger;
