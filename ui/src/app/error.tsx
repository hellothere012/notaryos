'use client';

import { useEffect } from 'react';

/**
 * Global error boundary for the App Router.
 *
 * Next.js renders this component whenever an unhandled error is thrown
 * within a route segment. It receives:
 *   - error:  the Error instance (message is safe to display)
 *   - reset:  a function that re-renders the segment, retrying the
 *             render tree from scratch
 *
 * Design notes:
 *   - Red-tinted glassmorphism alert to clearly distinguish from normal
 *     UI while staying within the dark theme.
 *   - Logs the error to the console on mount so it surfaces in
 *     monitoring tools (Sentry, DataDog, etc.) that hook console.error.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[NotaryOS] Unhandled route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="glass w-full max-w-lg border-red-500/30 bg-red-950/20 p-8 text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/30">
          <svg
            className="h-7 w-7 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-xl font-semibold text-red-300">
          Something went wrong
        </h2>

        {/* Error message */}
        <p className="text-sm text-gray-400 leading-relaxed">
          {error.message || 'An unexpected error occurred.'}
        </p>

        {/* Digest (useful for server-side error correlation) */}
        {error.digest && (
          <p className="font-mono text-xs text-gray-600">
            Error ID: {error.digest}
          </p>
        )}

        {/* Retry button */}
        <button
          onClick={reset}
          className="btn-primary inline-flex items-center gap-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
            />
          </svg>
          Try again
        </button>
      </div>
    </div>
  );
}
