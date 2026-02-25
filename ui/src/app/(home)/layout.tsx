/**
 * Home Layout — wraps the landing page (/) with AppHeader and Footer.
 *
 * The dashboard layout (app/(dashboard)/layout.tsx) handles authenticated
 * routes with AppHeader + Sidebar + Footer. The other public routes (verify,
 * pricing, about, docs) each have their own layout.tsx with AppHeader +
 * Footer. The root landing page was the only page missing this wrapper.
 *
 * Using a route group (home) keeps the URL path as "/" while providing
 * a dedicated layout without affecting any other routes.
 */

import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
