import Link from 'next/link';

/**
 * Custom 404 page for the App Router.
 *
 * Next.js renders this component when `notFound()` is thrown or when no
 * route segment matches the requested path. It is a Server Component
 * by default -- no client JS is shipped.
 *
 * Design:
 *   - Dark theme with the standard glassmorphism card.
 *   - Shield icon reinforces the security/notary brand.
 *   - Single CTA linking back to the home page.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="glass w-full max-w-md p-10 space-y-6">
        {/* Shield icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10 ring-1 ring-purple-500/30">
          <svg
            className="h-8 w-8 text-purple-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
            />
          </svg>
        </div>

        {/* 404 indicator */}
        <p className="font-mono text-5xl font-bold tracking-tight gradient-text">
          404
        </p>

        {/* Heading */}
        <h1 className="text-xl font-semibold text-white">
          Page not found
        </h1>

        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed">
          The page you are looking for does not exist or has been moved.
          If you believe this is an error, please contact support.
        </p>

        {/* Back to home */}
        <Link
          href="/"
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
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Back to home
        </Link>
      </div>
    </div>
  );
}
