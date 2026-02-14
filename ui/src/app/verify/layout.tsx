/**
 * Verify Layout (/verify) - Server Component for verify route metadata
 *
 * Wraps the VerifyPanel page with AppHeader and Footer for consistent
 * navigation across the site. Metadata is exported for SEO since
 * the page.tsx is a client component.
 *
 * Note: Server Components can render Client Components (AppHeader, Footer).
 * The client boundary starts at each 'use client' component.
 */

import type { Metadata } from 'next';
import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Receipt Verifier -- NotaryOS',
  description:
    'Verify AI agent receipts instantly. Paste JSON or upload a file to check Ed25519 signatures, chain integrity, and timestamps. No account required.',
  openGraph: {
    title: 'Receipt Verifier -- NotaryOS',
    description:
      'Paste a receipt. Get a cryptographic verdict. Signature, chain, and timestamp verification.',
    url: 'https://notaryos.org/verify',
    siteName: 'NotaryOS',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'NotaryOS Receipt Verifier',
    description:
      'Verify AI agent receipts with Ed25519 signatures, chain integrity, and timestamps.',
  },
};

export default function VerifyLayout({
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
