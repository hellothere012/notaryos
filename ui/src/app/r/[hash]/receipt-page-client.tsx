'use client';

/**
 * ReceiptPageClient - Client component for /r/[hash]
 *
 * Receives pre-fetched receipt data from the Server Component parent.
 * Renders the full receipt verification card with animations, copy
 * buttons, and the 3D card flip for raw JSON view.
 *
 * This component mirrors the core rendering logic from PublicVerifyPage
 * but accepts data as props instead of fetching client-side. This design
 * allows the Server Component to handle data fetching, ISR, and metadata
 * generation while this component handles all interactivity.
 *
 * After the component migration is complete (react-router-dom -> next/navigation),
 * this can be simplified to just re-export PublicVerifyPage with a data prop.
 * For now, it imports and renders PublicVerifyPage directly since that component
 * will be migrated by another agent.
 */

import dynamic from 'next/dynamic';

/**
 * Dynamically import PublicVerifyPage to avoid SSR issues with Framer Motion
 * and react-router-dom (until migration is complete). The component is loaded
 * client-side only with a minimal loading fallback.
 */
const PublicVerifyPage = dynamic(
  () => import('@/components/verification/PublicVerifyPage'),
  {
    ssr: false,
    loading: () => <ReceiptSkeleton />,
  }
);

// ---------------------------------------------------------------------------
// Types
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

interface ReceiptPageClientProps {
  data: PublicReceiptResponse;
  hash: string;
}

// ---------------------------------------------------------------------------
// Skeleton (used while dynamic import loads)
// ---------------------------------------------------------------------------

function ReceiptSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Seal skeleton */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-white/5 animate-pulse mb-4" />
            <div className="h-6 w-48 bg-white/5 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-32 bg-white/5 rounded-lg animate-pulse" />
          </div>
          {/* Badges skeleton */}
          <div className="flex justify-center gap-3 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-7 w-24 bg-white/5 rounded-full animate-pulse"
              />
            ))}
          </div>
          {/* Detail rows skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/5 rounded-lg animate-pulse" />
                  <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="h-4 w-36 bg-white/5 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export function ReceiptPageClient({ data, hash }: ReceiptPageClientProps) {
  /**
   * NOTE: Once the PublicVerifyPage component is migrated from react-router-dom
   * to next/navigation (handled by another agent), we can pass `data` as a
   * prop directly to skip the client-side fetch. For now, PublicVerifyPage
   * fetches its own data using useParams().
   *
   * The Server Component parent has already validated that the receipt exists
   * (calling notFound() if it doesn't), so the client-side fetch in
   * PublicVerifyPage will succeed. The SSR + ISR metadata generation is the
   * primary value of this architecture.
   */
  return <PublicVerifyPage />;
}
