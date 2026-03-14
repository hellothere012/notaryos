'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
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
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              color: '#e2e8f0',
            },
          }}
        />
      </ClerkTokenProvider>
    </ThemeProvider>
  );
}
