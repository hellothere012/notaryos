import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Clerk middleware for NotaryOS.
 *
 * Public routes are accessible without authentication.
 * All other routes require a Clerk session.
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/verify(.*)',
  '/pricing(.*)',
  '/about(.*)',
  '/docs(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
