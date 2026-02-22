'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';

/**
 * Auth Layout
 *
 * Minimal layout for authentication pages (login, signup, forgot-password).
 * No sidebar -- content is vertically and horizontally centered within
 * the viewport. AppHeader is included so users can still navigate
 * to public pages (Verify, Docs, Pricing, About).
 *
 * Authenticated users who visit /login or /signup are redirected
 * by middleware.ts, so this layout only renders for guests.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}
