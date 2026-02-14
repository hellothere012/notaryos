/**
 * Public Receipt Page (/r/[hash]) - Server Component with ISR
 *
 * Fetches receipt data server-side for:
 *  1. SEO-friendly Open Graph meta tags (crawlers see real data)
 *  2. Fast initial load (no client-side loading spinner for first paint)
 *  3. ISR with 60s revalidation for cache efficiency
 *
 * In Next.js 16, params is a Promise that must be awaited.
 *
 * If the receipt is not found, we call notFound() which renders
 * the not-found.tsx file in this directory. While loading on the
 * client, loading.tsx provides a skeleton.
 *
 * The actual receipt visualization is delegated to the existing
 * PublicVerifyPage client component, which receives receipt data
 * as props to skip its own client-side fetch.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReceiptPageClient } from './receipt-page-client';

// ---------------------------------------------------------------------------
// Types (mirrored from PublicVerifyPage.tsx for server-side use)
// ---------------------------------------------------------------------------

interface VerificationDetail {
  valid: boolean;
  signature_ok: boolean;
  structure_ok: boolean;
  chain_ok: boolean;
  timestamp_ok: boolean;
  chain_position?: number;
  signed_at?: string;
  signature_type?: string;
  key_id?: string;
  algorithm?: string;
  errors?: string[];
}

interface ReceiptMeta {
  receipt_hash: string;
  agent_id?: string;
  action_type?: string;
  tier?: 'free' | 'starter' | 'pro' | 'enterprise';
}

interface PublicReceiptResponse {
  found: boolean;
  receipt: Record<string, unknown> | null;
  verification: VerificationDetail | null;
  meta: ReceiptMeta | null;
}

// ---------------------------------------------------------------------------
// API base URL (server-side, no browser env)
// ---------------------------------------------------------------------------

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.agenttownsquare.com';

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchReceipt(
  hash: string
): Promise<PublicReceiptResponse | null> {
  try {
    const res = await fetch(
      `${API_BASE}/v1/notary/r/${encodeURIComponent(hash)}`,
      {
        next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      return null;
    }

    const data: PublicReceiptResponse = await res.json();
    return data.found ? data : null;
  } catch {
    // Network error or JSON parse failure -- treat as not found
    return null;
  }
}

// ---------------------------------------------------------------------------
// Dynamic metadata generation for OG tags
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ hash: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { hash } = await params;
  const data = await fetchReceipt(hash);

  if (!data || !data.meta) {
    return {
      title: 'Receipt Not Found -- NotaryOS',
      description: 'This receipt could not be found or has expired.',
    };
  }

  const { meta, verification } = data;
  const isVerified = verification?.valid === true;
  const status = isVerified ? 'Verified' : 'Invalid';
  const agentId = meta.agent_id || 'Unknown Agent';
  const actionType = meta.action_type || 'Agent Action';

  return {
    title: `${status} Receipt -- ${actionType} -- NotaryOS`,
    description: `Cryptographic receipt from ${agentId}. Status: ${status}. Action: ${actionType}. Hash: ${meta.receipt_hash.slice(0, 16)}...`,
    openGraph: {
      title: `${status} Receipt -- NotaryOS`,
      description: `${agentId} performed "${actionType}". Cryptographically ${status.toLowerCase()}.`,
      url: `https://notaryos.org/r/${hash}`,
      siteName: 'NotaryOS',
      type: 'article',
      images: [
        {
          url: `https://notaryos.org/api/og/receipt?hash=${encodeURIComponent(hash)}&status=${status.toLowerCase()}`,
          width: 1200,
          height: 630,
          alt: `NotaryOS ${status} Receipt`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${status} Receipt -- NotaryOS`,
      description: `${agentId}: "${actionType}" -- cryptographically ${status.toLowerCase()}.`,
    },
  };
}

// ---------------------------------------------------------------------------
// Page component (Server Component)
// ---------------------------------------------------------------------------

export default async function ReceiptPage({ params }: PageProps) {
  const { hash } = await params;
  const data = await fetchReceipt(hash);

  // If the receipt was not found, render the not-found.tsx boundary
  if (!data) {
    notFound();
  }

  // Pass the pre-fetched data to the client component for rendering.
  // This avoids a second fetch on the client.
  return <ReceiptPageClient data={data} hash={hash} />;
}
