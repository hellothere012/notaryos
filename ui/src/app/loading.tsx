/**
 * Global loading skeleton displayed by Next.js while a route segment
 * streams its content. Matches the dark glassmorphism aesthetic used
 * throughout NotaryOS.
 *
 * Uses only CSS animations (Tailwind animate-pulse + a custom shimmer
 * gradient) so it renders instantly without hydrating any JS.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="glass w-full max-w-lg p-8 space-y-6">
        {/* Title placeholder */}
        <div className="h-6 w-3/5 rounded-lg bg-gray-700/60 animate-pulse" />

        {/* Subtitle placeholder */}
        <div className="h-4 w-4/5 rounded-md bg-gray-700/40 animate-pulse" />

        {/* Content block placeholders */}
        <div className="space-y-3 pt-2">
          <div className="h-3 w-full rounded bg-gray-700/30 animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-gray-700/30 animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-gray-700/30 animate-pulse" />
        </div>

        {/* Shimmer overlay for visual polish */}
        <div className="relative h-10 w-full rounded-lg bg-gray-800/50 overflow-hidden">
          <div className="absolute inset-0 animate-shimmer" />
        </div>

        {/* Action button placeholder */}
        <div className="flex justify-end pt-2">
          <div className="h-9 w-28 rounded-lg bg-purple-600/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
