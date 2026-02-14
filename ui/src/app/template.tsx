'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

/**
 * Custom easing curve that gives a smooth, slightly springy feel.
 * Modelled after Material Design's standard easing.
 */
const EASE_SMOOTH: [number, number, number, number] = [0.22, 1, 0.2, 1];

/**
 * Route transition duration in seconds.
 * Kept short to feel snappy without being jarring.
 */
const TRANSITION_DURATION = 0.3;

/**
 * Template component (Client Component).
 *
 * Next.js re-mounts <Template> on every route change, which makes it the
 * ideal place for route-level enter/exit animations via Framer Motion's
 * AnimatePresence.
 *
 * - Uses `mode="wait"` so the exiting page finishes before the entering
 *   page begins, preventing layout overlap.
 * - Respects `prefers-reduced-motion` via Framer Motion's
 *   `useReducedMotion()` hook -- when the user or OS requests reduced
 *   motion, the component renders children without any animation.
 * - The motion.div is keyed by `pathname` so AnimatePresence can track
 *   route changes and trigger exit animations properly.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  // Respect user preference for reduced motion by skipping all animation.
  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: TRANSITION_DURATION,
          ease: EASE_SMOOTH,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
