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
  title: 'NotaryOS — AI Decision Plane | Multi-Model Reasoning with Cryptographic Proof',
  description:
    'See how AI thinks. Run your prompt through DeepSeek, Gemini, Sonnet, and Kimi in parallel. Visualize reasoning trees, compare decisions, and seal every step with Ed25519 cryptographic proof.',
  authors: [{ name: 'Harris Abbaali' }],
  creator: 'Harris Abbaali',
  openGraph: {
    title: 'NotaryOS — AI Decision Plane',
    description: 'Multi-model AI reasoning with cryptographic provenance. See where AIs agree and diverge.',
    url: 'https://notaryos.org',
    siteName: 'NotaryOS',
    type: 'website',
    images: [
      {
        url: 'https://notaryos.org/api/og/home',
        width: 1200,
        height: 630,
        alt: 'NotaryOS - AI Decision Plane with multi-model reasoning',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NotaryOS — AI Decision Plane',
    description: 'Multi-model AI reasoning with cryptographic provenance. See where AIs agree and diverge.',
  },
};

export default function HomePage() {
  return <LandingPage />;
}
