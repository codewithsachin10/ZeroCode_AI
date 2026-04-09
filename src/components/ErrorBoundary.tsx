import React, { ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to external service here (Sentry, LogRocket, etc.)
    console.error('Error caught by boundary:', error, errorInfo);
    
    // You can also log to Firebase or other service
    if (window.logError) {
      window.logError({
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
          <div className="max-w-md w-full bg-[#1a1a1a] border border-red-500/30 rounded-xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="text-red-500" />
              <h1 className="text-xl font-bold text-white">Something went wrong</h1>
            </div>

            <p className="text-text-muted text-sm mb-6">
              {this.state.error.message || 'An unexpected error occurred. Please try refreshing the page.'}
            </p>

            <details className="mb-6 bg-[#0a0a0a] p-3 rounded border border-white/10 text-xs text-text-muted">
              <summary className="cursor-pointer font-semibold mb-2">Error details</summary>
              <pre className="overflow-auto max-h-32 whitespace-pre-wrap break-words">
                {this.state.error.stack}
              </pre>
            </details>

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-black font-semibold py-2 rounded-lg transition-all"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg transition-all"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
