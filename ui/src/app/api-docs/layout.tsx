import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';

export default function ApiDocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      <AppHeader />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
