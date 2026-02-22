'use client';

import { SettingsPage } from '@/components/account/SettingsPage';

/**
 * /settings route page
 *
 * Thin wrapper that renders the SettingsPage component within
 * the dashboard layout. Notification preferences, verification
 * settings, data export, and account management live in the component.
 */
export default function SettingsRoute() {
  return <SettingsPage />;
}
