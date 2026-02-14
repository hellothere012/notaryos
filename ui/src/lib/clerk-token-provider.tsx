'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { setClerkTokenGetter } from '@/lib/api-client';

/**
 * ClerkTokenProvider — wires Clerk's `getToken()` into the Axios auth client.
 *
 * On mount it passes the async token-getter to `api-client.ts` so every
 * authenticated request automatically includes the Clerk session JWT.
 */
export function ClerkTokenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getToken } = useAuth();

  useEffect(() => {
    setClerkTokenGetter(getToken);
  }, [getToken]);

  return <>{children}</>;
}
