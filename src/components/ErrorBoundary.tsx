import React from 'react';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Admin ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
            <div className="card p-8 max-w-lg w-full">
              <h1 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h1>
              <p className="text-sm text-gray-600 mb-4">{this.state.error?.message}</p>
              <pre className="text-xs text-gray-400 bg-gray-50 rounded p-3 overflow-auto max-h-40">
                {this.state.error?.stack}
              </pre>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
                className="btn-primary mt-4"
              >
                Reload
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
