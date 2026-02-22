/**
 * Pricing Layout (/pricing) - Server Component for pricing route
 *
 * Wraps the PricingPage with AppHeader and Footer for consistent
 * navigation. Previously the pricing page was an orphan route
 * with no navigation header.
 *
 * Metadata is exported from page.tsx (which is a Server Component).
 */

import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';

export default function PricingLayout({
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
