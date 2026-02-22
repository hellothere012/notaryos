'use client';

import { ApiKeysPage } from '@/components/apikeys/ApiKeysPage';

/**
 * /api-keys route page
 *
 * Thin wrapper that renders the ApiKeysPage component within
 * the dashboard layout. All API key management logic -- creation,
 * revocation, and listing -- lives in the component.
 */
export default function ApiKeysRoute() {
  return <ApiKeysPage />;
}
