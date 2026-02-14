/**
 * Docs Page (/docs) - Server Component wrapper for DocsPage
 *
 * Exports static metadata for SEO. Renders the DocsPage client component
 * which uses Framer Motion animations, IntersectionObserver, and
 * interactive code blocks with copy-to-clipboard.
 */

import type { Metadata } from 'next';
import { DocsPage } from '@/components/docs/DocsPage';

export const metadata: Metadata = {
  title: 'Documentation -- NotaryOS',
  description:
    'NotaryOS developer documentation. Quickstart guide, API reference, counterfactual receipts, SDK examples (Python, TypeScript, Go), and self-hosting instructions.',
  openGraph: {
    title: 'Documentation -- NotaryOS',
    description:
      'Cryptographic receipts for AI agent actions. Issue, verify, and chain receipts in three lines of code.',
    url: 'https://notaryos.org/docs',
    siteName: 'NotaryOS',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'NotaryOS Docs',
    description:
      'Issue, verify, and chain cryptographic receipts in three lines of code.',
  },
};

export default function DocsRoute() {
  return <DocsPage />;
}
