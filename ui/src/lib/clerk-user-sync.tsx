'use client';

import { useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { authClient } from '@/lib/api-client';

/**
 * ClerkUserSync — fires POST /v1/auth/clerk/sync after each Clerk login.
 *
 * This component renders nothing visible; it just watches for changes to
 * the Clerk user and upserts the profile to the NotaryOS backend so the
 * `notaryos_users` table stays in sync.
 */
export function ClerkUserSync() {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    // Don't re-sync the same user within a single session
    if (syncedRef.current === user.id) return;

    const sync = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        await authClient.post(
          '/v1/auth/clerk/sync',
          {
            email: user.primaryEmailAddress?.emailAddress,
            display_name: user.fullName || user.username,
            avatar_url: user.imageUrl,
            oauth_provider: user.externalAccounts?.[0]?.provider || null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        syncedRef.current = user.id;
      } catch (err) {
        console.error('[ClerkUserSync] failed:', err);
      }
    };

    sync();
  }, [isSignedIn, user, getToken]);

  return null;
}
