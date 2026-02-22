'use client';

import { AdminPage } from '@/components/admin/AdminPage';

/**
 * /admin route page
 *
 * Thin wrapper that renders the AdminPage component within
 * the dashboard layout. Signer configuration, key rotation,
 * and system statistics are handled by the component.
 *
 * Access control: middleware.ts restricts this route to admin-role
 * users. The AdminPage component also checks role internally.
 */
export default function AdminRoute() {
  return <AdminPage />;
}
