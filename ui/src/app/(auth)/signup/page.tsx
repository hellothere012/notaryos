import { redirect } from 'next/navigation';

/**
 * Legacy /signup route — redirects to Clerk's /sign-up page.
 */
export default function SignUpRoute() {
  redirect('/sign-up');
}
