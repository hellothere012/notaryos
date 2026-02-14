'use client';

import { SignupPage } from '@/components/auth/SignupPage';

/**
 * /signup route page
 *
 * Thin wrapper that renders the SignupPage component within
 * the auth layout (centered, no sidebar). All signup form logic,
 * password strength validation, and terms acceptance lives in
 * the component.
 */
export default function SignupRoute() {
  return <SignupPage />;
}
