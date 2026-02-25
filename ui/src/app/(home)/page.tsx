/**
 * Home Page (/) - Server Component wrapper for LandingPage
 *
 * This is a Server Component that exports static metadata for SEO and
 * Open Graph tags. It renders the LandingPage client component which
 * handles all interactivity (Framer Motion, useNavigate, useState).
 *
 * The metadata export only works in Server Components, so this file
 * must NOT have 'use client'. The LandingPage component itself uses
 * 'use client' internally.
 */

import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'NotaryOS -- Agent Accountability Infrastructure',
  description:
    'Cryptographic proof of AI agent actions. Verify AI agent receipts with Ed25519 signatures, chain integrity, and timestamps.',
  openGraph: {
    title: 'NotaryOS -- Agent Accountability Infrastructure',
    description: 'Cryptographic proof of AI agent actions.',
    url: 'https://notaryos.org',
    siteName: 'NotaryOS',
    type: 'website',
    images: [
      {
        url: 'https://notaryos.org/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NotaryOS - Cryptographic receipts for AI agents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NotaryOS -- Agent Accountability Infrastructure',
    description: 'Cryptographic proof of AI agent actions.',
  },
};

export default function HomePage() {
  return <LandingPage />;
}
