import type { Metadata } from 'next';
import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Tamper Detection Simulator -- NotaryOS',
  description:
    'Try breaking a cryptographically signed receipt. Edit any field and watch Ed25519 signature verification fail in real time. See why tamper-evident receipts matter.',
  openGraph: {
    title: 'Tamper Detection Simulator -- NotaryOS',
    description:
      'Edit a signed receipt. Watch it break. Understand why tamper-evident AI agent receipts matter.',
    url: 'https://notaryos.org/tamper',
    siteName: 'NotaryOS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NotaryOS Tamper Simulator',
    description:
      'Can you break a cryptographic receipt? Try editing any field and watch the signature fail.',
  },
};

export default function TamperLayout({
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
