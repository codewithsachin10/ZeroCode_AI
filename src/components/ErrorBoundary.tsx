import React, { ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

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
    console.error('ZeroCode AI - Node Failure:', error, errorInfo);
    
    // Auto-recovery for Vercel/Vite Chunk Load Errors
    const isChunkError = error.message.includes('Failed to fetch dynamically imported module') || 
                        error.message.includes('Loading chunk');
    
    if (isChunkError) {
      const hasReloaded = sessionStorage.getItem('chunk_error_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_error_reload', 'true');
        window.location.reload();
      }
    }
  }

  handleRetry = () => {
    sessionStorage.removeItem('chunk_error_reload');
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 selection:bg-primary/30">
          {/* Background Ambient Glow */}
          <div className="fixed inset-0 pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 blur-[120px] rounded-full opacity-30" />
          </div>

          <div className="relative max-w-xl w-full">
            <div className="glass rounded-[40px] border border-white/5 bg-white/[0.02] p-12 shadow-2xl overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
               
               <div className="flex flex-col items-center text-center mb-10">
                  <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                     <AlertCircle size={32} className="text-red-500" />
                  </div>
                  <h1 className="text-3xl font-bold text-white tracking-tight mb-3">Something went wrong</h1>
                  <p className="text-text-secondary opacity-60 text-sm leading-relaxed max-w-sm">
                     The system encountered an unexpected disruption in the node mesh. 
                     {this.state.error.message.includes('fetch') && " A clean refresh may be required to synchronize with the latest update."}
                  </p>
               </div>

               <div className="bg-black/40 rounded-3xl border border-white/5 p-6 mb-10">
                  <div className="flex items-center gap-2 mb-3 text-[10px] uppercase font-bold tracking-widest text-text-muted opacity-40">
                     <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                     Error Diagnostics
                  </div>
                  <pre className="text-xs font-mono text-red-400/80 overflow-auto max-h-32 whitespace-pre-wrap break-words leading-relaxed">
                     {this.state.error.message || 'An unexpected error occurred in the platform core.'}
                  </pre>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={this.handleRetry}
                    className="tactile-btn tactile-btn-green w-full"
                  >
                    <span className="btn-shadow"></span>
                    <span className="btn-edge"></span>
                    <span className="btn-front py-3 px-6 flex items-center justify-center gap-2">
                       <RefreshCw size={14} />
                       Try Again
                    </span>
                  </button>

                  <button
                    onClick={() => window.location.href = '/'}
                    className="tactile-btn w-full"
                  >
                    <span className="btn-shadow"></span>
                    <span className="btn-edge bg-white/10"></span>
                    <span className="btn-front bg-[#1a1a1a] py-3 px-6 text-white flex items-center justify-center gap-2">
                       <Home size={14} />
                       Go Home
                    </span>
                  </button>
               </div>
            </div>
            
            <p className="text-center mt-8 text-[10px] uppercase font-bold tracking-[0.3em] text-text-muted opacity-20">
               ZeroCode AI - Resilience Mesh Active
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
