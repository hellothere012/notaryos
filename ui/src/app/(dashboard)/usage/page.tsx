'use client';

import { UsageDashboard } from '@/components/usage/UsageDashboard';

/**
 * /usage route page
 *
 * Thin wrapper that renders the UsageDashboard component within
 * the dashboard layout. All usage analytics logic, charting,
 * and tier tracking live in the component.
 */
export default function UsageRoute() {
  return <UsageDashboard />;
}
