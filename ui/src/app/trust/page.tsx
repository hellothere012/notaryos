/**
 * Trust Page (/trust) - Server Component wrapper for TrustPage
 *
 * Exports static metadata for SEO. Renders the TrustPage client component
 * which uses Framer Motion animations, live verification demo, and
 * comprehensive security/compliance information.
 */

import type { Metadata } from 'next';
import { TrustPage } from '@/components/trust/TrustPage';

export const metadata: Metadata = {
  title: 'Security & Trust -- NotaryOS',
  description:
    'Ed25519 cryptographic signing, hash-chain integrity, and enterprise compliance. See how NotaryOS protects every AI agent action.',
  authors: [{ name: 'Harris Abbaali' }],
  creator: 'Harris Abbaali',
  openGraph: {
    title: 'Security & Trust -- NotaryOS',
    description:
      'Ed25519 cryptographic signing, hash-chain integrity, and enterprise compliance.',
    url: 'https://notaryos.org/trust',
    siteName: 'NotaryOS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Security & Trust -- NotaryOS',
    description:
      'Ed25519 cryptographic signing, hash-chain integrity, and enterprise compliance for AI agents.',
  },
};

export default function TrustRoute() {
  return <TrustPage />;
}
