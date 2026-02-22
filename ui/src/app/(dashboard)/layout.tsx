'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';

/**
 * Dashboard Layout
 *
 * Wraps all authenticated dashboard pages with the persistent
 * AppHeader, Sidebar navigation, and Footer. The sidebar provides
 * navigation between protected routes (History, API Keys, Profile,
 * Settings, Admin) while the header handles auth state display
 * and top-level navigation.
 *
 * Auth protection is handled by middleware.ts -- no ProtectedRoute
 * wrapper is needed at the layout level.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
