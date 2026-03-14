'use client';

/**
 * Explore Page (/explore) - Client Component
 *
 * Renders the ReceiptExplorer component which is heavily interactive:
 * - Search, filter, and pagination state
 * - API calls to browse public receipts
 * - Slide-in detail drawer for individual receipts
 *
 * Metadata is exported from the sibling layout.tsx since this file
 * must be a client component.
 */

import { ReceiptExplorer } from '@/components/explore/ReceiptExplorer';

export default function ExplorePage() {
  return <ReceiptExplorer />;
}
