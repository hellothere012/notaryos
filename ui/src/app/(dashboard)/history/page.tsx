'use client';

import { HistoryPage } from '@/components/history/HistoryPage';

/**
 * /history route page
 *
 * Thin wrapper that renders the HistoryPage component within
 * the dashboard layout. All verification history logic, filtering,
 * pagination, and export functionality lives in the component.
 */
export default function HistoryRoute() {
  return <HistoryPage />;
}
