/**
 * Privacy Layout (/privacy) - Server Component
 *
 * Wraps the Privacy Policy page with AppHeader and Footer for consistent
 * navigation across all public routes.
 */

import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyLayout({
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
