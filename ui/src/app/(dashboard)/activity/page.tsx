'use client';

import { ActivityPage } from '@/components/activity/ActivityPage';

/**
 * /activity route page
 *
 * Thin wrapper that renders the ActivityPage component within
 * the dashboard layout. All activity feed logic, filtering,
 * pagination, and stats live in the component.
 */
export default function ActivityRoute() {
  return <ActivityPage />;
}
