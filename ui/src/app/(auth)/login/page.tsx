'use client';

import { LoginPage } from '@/components/auth/LoginPage';

/**
 * /login route page
 *
 * Thin wrapper that renders the LoginPage component within
 * the auth layout (centered, no sidebar). All login form logic,
 * validation, and redirect handling lives in the component.
 */
export default function LoginRoute() {
  return <LoginPage />;
}
