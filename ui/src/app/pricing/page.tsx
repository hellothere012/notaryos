/**
 * Pricing Page (/pricing) - Server Component wrapper for PricingPage
 *
 * Exports static metadata for SEO. Renders the PricingPage client component
 * which uses Framer Motion animations, useNavigate, and Stripe checkout flows.
 */

import type { Metadata } from 'next';
import { PricingPage } from '@/components/pricing/PricingPage';

export const metadata: Metadata = {
  title: 'Pricing -- NotaryOS',
  description:
    'Simple, transparent pricing for cryptographic receipts. Start free with 100 receipts/month. Scale to Explorer ($59/mo), Pro ($159/mo), or Enterprise for high-volume workloads.',
  openGraph: {
    title: 'Pricing -- NotaryOS',
    description:
      'Cryptographic receipts for every scale. Start free, scale as you grow.',
    url: 'https://notaryos.org/pricing',
    siteName: 'NotaryOS',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'NotaryOS Pricing',
    description:
      'Start free with 100 receipts/month. Ed25519 signed and hash-chain linked.',
  },
};

export default function PricingRoute() {
  return <PricingPage />;
}
