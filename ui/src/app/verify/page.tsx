'use client';

/**
 * Verify Page (/verify) - Client Component
 *
 * Renders the VerifyPanel component which is heavily interactive:
 * - useSearchParams for ?sample=true query handling
 * - useState for receipt text, verification state, demo type
 * - useEffect for keyboard shortcuts and sample loading
 * - Drag-and-drop file upload
 * - API calls to verify receipts
 *
 * Metadata is exported from the sibling layout.tsx since this file
 * must be a client component.
 */

import { VerifyPanel } from '@/components/verification/VerifyPanel';

export default function VerifyPage() {
  return <VerifyPanel />;
}
