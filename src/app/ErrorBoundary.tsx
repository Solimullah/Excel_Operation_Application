import { Component, type ErrorInfo, type ReactNode } from 'react';

import { logger } from '@/lib/logger';

/**
 * Top-level error boundary — the counterpart to a backend's error-handling
 * middleware. It is the last line of defence: without it, a render error in any
 * panel unmounts the whole tree and the user loses every loaded file with no
 * explanation.
 *
 * React only surfaces render-phase errors to a boundary. Errors thrown inside
 * event handlers (which is where most of this app's work happens) must still be
 * caught locally and surfaced through the panel's own error state.
 *
 * This must remain a class component: there is no hook equivalent.
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Rendered instead of the default panel when provided. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Local only. Never ship this anywhere — a component stack can contain
    // prop values, and prop values here are spreadsheet data.
    logger.error('ui.render_failed', {
      name: error.name,
      message: error.message,
      componentStack: info.componentStack?.split('\n').slice(0, 4).join('\n'),
    });
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (!error) return children;
    if (fallback) return fallback(error, this.reset);

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
        <div className="max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong</h1>

          <p className="mb-6 text-gray-500">
            The application hit an unexpected error and stopped rendering. Your files were held in
            memory only, so they have been lost — you will need to upload them again.
          </p>

          <pre className="mb-6 overflow-x-auto rounded-lg bg-gray-50 p-4 text-left text-xs text-gray-700">
            {error.name}: {error.message}
          </pre>

          <button
            type="button"
            onClick={this.reset}
            className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}
