import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panopticon V2 — OSINT Intelligence Dashboard',
  description: 'Real-time global intelligence monitoring with NotaryOS cryptographic receipts',
};

export default function PanopticonV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-[#060a12] overflow-hidden">
      {children}
    </div>
  );
}
