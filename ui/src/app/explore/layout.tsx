/**
 * Explore Layout (/explore) - Server Component for explore route metadata
 *
 * Wraps the ReceiptExplorer page with AppHeader and Footer for consistent
 * navigation across the site. Metadata is exported for SEO since
 * the page.tsx renders a client component.
 */

import type { Metadata } from 'next';
import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Receipt Explorer -- NotaryOS',
  description:
    'Browse, search, and verify cryptographic receipts. Explore the NotaryOS hash chain in real-time.',
  openGraph: {
    title: 'Receipt Explorer -- NotaryOS',
    description:
      'Browse, search, and verify cryptographic receipts in real-time.',
    url: 'https://notaryos.org/explore',
    siteName: 'NotaryOS',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'NotaryOS Receipt Explorer',
    description:
      'Browse and verify cryptographic receipts on the NotaryOS chain.',
  },
};

export default function ExploreLayout({
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
