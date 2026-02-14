/**
 * About Page (/about) - Server Component wrapper for AboutPage
 *
 * Exports static metadata for SEO. Renders the AboutPage client component
 * which uses Framer Motion animations, useNavigate, and useScroll.
 */

import type { Metadata } from 'next';
import { AboutPage } from '@/components/about/AboutPage';

export const metadata: Metadata = {
  title: 'About NotaryOS -- Digital Notarization for AI Agents',
  description:
    'NotaryOS creates tamper-evident, cryptographically signed receipts for every AI agent action. Learn how per-agent hash chains, counterfactual receipts, and provenance DAGs provide accountability.',
  openGraph: {
    title: 'About NotaryOS -- Digital Notarization for AI Agents',
    description:
      'Per-agent hash chains, counterfactual receipts, and provenance DAGs for AI agent accountability.',
    url: 'https://notaryos.org/about',
    siteName: 'NotaryOS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About NotaryOS',
    description:
      'Digital notarization for the age of AI agents. Tamper-evident, cryptographically signed receipts.',
  },
};

export default function AboutRoute() {
  return <AboutPage />;
}
