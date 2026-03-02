import type { Metadata } from 'next';
import { AppHeader } from '@/components/layout/AppHeader';

export const metadata: Metadata = {
  title: 'Panopticon -- 4D OSINT Intelligence Dashboard',
  description:
    'Real-time multi-source intelligence platform fusing ADS-B, AIS, satellite imagery, social media, and news into cryptographically provenance-tracked assessments on a 4D globe.',
  openGraph: {
    title: 'Panopticon -- 4D OSINT Intelligence Dashboard',
    description:
      'Multi-source OSINT fusion with AI-powered assessments and cryptographic provenance. Built on ATS Protocol + NotaryOS.',
    url: 'https://notaryos.org/panopticon',
    siteName: 'NotaryOS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Panopticon -- 4D OSINT Intelligence',
    description:
      'Real-time intelligence fusion with cryptographic provenance. Watch AI agents collect, correlate, and assess.',
  },
};

export default function PanopticonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#060a12]">
      <main className="flex-1">{children}</main>
    </div>
  );
}
