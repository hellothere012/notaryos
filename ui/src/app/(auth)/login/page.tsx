import { redirect } from 'next/navigation';

/**
 * Legacy /login route — redirects to Clerk's /sign-in page.
 */
export default function LoginRoute() {
  redirect('/sign-in');
}
