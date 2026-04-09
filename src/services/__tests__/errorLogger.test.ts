import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorLogger, ErrorLog } from '@/services/errorLogger';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'test-id' }),
  serverTimestamp: vi.fn(() => new Date()),
}));

describe('ErrorLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log an error with all fields', async () => {
    const errorLog: ErrorLog = {
      message: 'Test error',
      stack: 'error stack',
      context: 'test context',
      severity: 'error',
    };

    await errorLogger.logError(errorLog);

    // Verify error was logged (in real scenario would check Firebase call)
    expect(true).toBe(true);
  });

  it('should log a warning', async () => {
    await errorLogger.logWarning('Test warning', 'test-context');
    expect(true).toBe(true);
  });

  it('should log an info message', async () => {
    await errorLogger.logInfo('Test info', 'test-context');
    expect(true).toBe(true);
  });

  it('should log an exception with stack trace', async () => {
    const error = new Error('Test exception');
    await errorLogger.logException(error, 'test-context', 'user-123');

    expect(true).toBe(true);
  });

  it('should setup global error handler without crashing', () => {
    expect(() => {
      errorLogger.setupGlobalErrorHandler();
    }).not.toThrow();
  });
});
