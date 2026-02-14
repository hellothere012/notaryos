/**
 * Verify Layout (/verify) - Server Component for verify route metadata
 *
 * Since the verify page.tsx is a client component (VerifyPanel uses hooks
 * like useSearchParams, useState, useEffect at the top level), we export
 * metadata from this layout instead. Layout files are always Server
 * Components in Next.js App Router.
 */

import type { Metadata } from 'next';

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
  return <>{children}</>;
}
