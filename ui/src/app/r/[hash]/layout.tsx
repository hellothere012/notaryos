/**
 * Public Receipt Layout (/r/[hash]) - Server Component
 *
 * Wraps the receipt lookup page with AppHeader and Footer for
 * consistent navigation. Visitors verifying receipts can still
 * navigate to the rest of the site.
 */

import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';

export default function ReceiptLayout({
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
