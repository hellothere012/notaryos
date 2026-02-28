import type { Metadata } from 'next';
import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Live Receipt Stream -- NotaryOS',
  description:
    'Watch AI agent receipts being issued in real time. See global activity, verification metrics, and the NotaryOS network in action.',
  openGraph: {
    title: 'Live Receipt Stream -- NotaryOS',
    description:
      'Real-time feed of cryptographically signed AI agent receipts flowing across the network.',
    url: 'https://notaryos.org/live',
    siteName: 'NotaryOS',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'NotaryOS Live Stream',
    description: 'Watch AI agent receipts flow in real time.',
  },
};

export default function LiveLayout({
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
