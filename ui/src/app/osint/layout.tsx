import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Open Situation Board — NotaryOS',
  description:
    'Real-time open-source intelligence dashboard. Track aircraft, vessels, news events, and AI assessments — all cryptographically verified.',
  openGraph: {
    title: 'Open Situation Board — NotaryOS',
    description:
      'Real-time OSINT transparency dashboard. Every data point backed by a cryptographic receipt.',
    url: 'https://notaryos.org/osint',
    siteName: 'NotaryOS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Situation Board — NotaryOS',
    description:
      'Live OSINT counters: aircraft, vessels, events, assessments. All verified.',
  },
};

export default function OSINTLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No AppHeader/Footer — the OpenSituationBoard has its own immersive header
  return <>{children}</>;
}
