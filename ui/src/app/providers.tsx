'use client';

import { ThemeProvider } from 'next-themes';
import { ClerkUserSync } from '@/lib/clerk-user-sync';
import { ClerkTokenProvider } from '@/lib/clerk-token-provider';

/**
 * Client-side provider tree.
 *
 * Provider order (outer to inner):
 * 1. ThemeProvider       - injects the `dark` class on <html>
 * 2. ClerkTokenProvider  - wires Clerk's getToken into the Axios client
 * 3. ClerkUserSync       - upserts Clerk user to backend on login
 *
 * Note: ClerkProvider wraps this in layout.tsx (Server Component).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ClerkTokenProvider>
        <ClerkUserSync />
        {children}
      </ClerkTokenProvider>
    </ThemeProvider>
  );
}
