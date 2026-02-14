'use client';

import { ProfilePage } from '@/components/account/ProfilePage';

/**
 * /profile route page
 *
 * Thin wrapper that renders the ProfilePage component within
 * the dashboard layout. Profile editing, usage statistics,
 * and password changes are handled by the component.
 */
export default function ProfileRoute() {
  return <ProfilePage />;
}
