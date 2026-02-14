'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/auth-context';

/**
 * Client-side provider tree.
 *
 * Combines all context providers required by the application into a single
 * wrapper consumed by the root layout. Keeping providers in a dedicated
 * Client Component avoids forcing the entire root layout to become a
 * Client Component.
 *
 * Provider order (outer to inner):
 * 1. ThemeProvider  - injects the `dark` class on <html>, must be outermost
 *                     so all children (including AuthProvider UI) respect
 *                     the active theme.
 * 2. AuthProvider   - manages JWT token lifecycle, user state, and
 *                     Axios interceptors.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
