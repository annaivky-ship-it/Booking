import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-red-500/20 p-4 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Oops! Something went wrong
                </h1>
                <p className="text-zinc-400 mt-1">
                  We encountered an unexpected error
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-red-400 mb-2">
                  Error Details (Development Only):
                </p>
                <p className="text-sm text-zinc-300 font-mono mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs text-zinc-400 font-mono mt-2">
                    <summary className="cursor-pointer hover:text-zinc-300">
                      Component Stack
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={this.handleReset}
                className="btn-primary flex-1"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary flex-1"
              >
                Reload Page
              </button>
            </div>

            <p className="text-sm text-zinc-500 mt-6 text-center">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
