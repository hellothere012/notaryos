/**
 * Trust Layout (/trust) - Server Component for trust route
 *
 * Wraps the TrustPage with AppHeader and Footer for consistent
 * navigation. Metadata is exported from page.tsx.
 */

import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';

export default function TrustLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
