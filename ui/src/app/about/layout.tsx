/**
 * About Layout (/about) - Server Component for about route
 *
 * Wraps the AboutPage with AppHeader and Footer for consistent
 * navigation. Metadata is exported from page.tsx.
 */

import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';

export default function AboutLayout({
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
