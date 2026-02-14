/**
 * Loading skeleton for /r/[hash] receipt page
 *
 * Displayed by Next.js App Router while the Server Component
 * fetches receipt data from the API. Matches the visual layout
 * of the final receipt card to prevent layout shift.
 *
 * Dark theme (slate-950 background) with pulsing card placeholder.
 */

export default function ReceiptLoading() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Animated mesh background (static version for loading) */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle, rgba(67, 56, 202, 0.25) 0%, transparent 70%)',
            top: '-10%',
            left: '-5%',
          }}
        />
        <div
          className="absolute right-0 bottom-0 w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background:
              'radial-gradient(circle, rgba(8, 145, 178, 0.3) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Header skeleton */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/50 to-cyan-500/50 animate-pulse" />
          <div className="h-5 w-16 bg-white/5 rounded animate-pulse hidden sm:block" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-7 w-28 bg-white/5 rounded animate-pulse" />
        </div>
      </header>

      {/* Main card skeleton */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-2xl mx-auto">
          {/* Spinner */}
          <div className="text-center mb-8">
            <div className="inline-block">
              <svg
                className="w-8 h-8 text-purple-400 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-gray-400 text-sm mt-3">Verifying receipt...</p>
          </div>

          {/* Card skeleton */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Seal skeleton */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full bg-white/5 animate-pulse mb-4" />
              <div className="h-7 w-52 bg-white/5 rounded-lg animate-pulse mb-3" />
              <div className="h-4 w-80 bg-white/5 rounded-lg animate-pulse" />
            </div>

            {/* Verification badges skeleton */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-7 w-24 bg-white/5 rounded-full animate-pulse"
                />
              ))}
            </div>

            {/* Section label skeleton */}
            <div className="h-3 w-24 bg-white/5 rounded animate-pulse mb-4" />

            {/* Detail rows skeleton */}
            <div className="bg-white/[0.02] rounded-xl border border-white/5 px-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/5 rounded-lg animate-pulse" />
                    <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-36 bg-white/5 rounded animate-pulse" />
                </div>
              ))}
            </div>

            {/* Signature section skeleton */}
            <div className="mt-8">
              <div className="h-3 w-28 bg-white/5 rounded animate-pulse mb-4" />
              <div className="bg-white/[0.02] rounded-xl border border-white/5 px-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/5 rounded-lg animate-pulse" />
                      <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Action bar skeleton */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
              <div className="h-9 w-36 bg-white/5 rounded-lg animate-pulse" />
              <div className="flex gap-3">
                <div className="h-8 w-28 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-8 w-24 bg-white/5 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer skeleton */}
      <footer className="relative z-10 text-center py-6 border-t border-white/5">
        <div className="h-3 w-64 bg-white/5 rounded animate-pulse mx-auto" />
      </footer>
    </div>
  );
}
