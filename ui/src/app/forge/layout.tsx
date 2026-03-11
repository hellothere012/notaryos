import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reasoning Forge — Multi-AI Analysis | NotaryOS',
  description: 'Compare how multiple AI models reason about the same prompt. Every thought sealed as a cryptographic receipt.',
};

export default function ForgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-[#060a12] overflow-hidden">
      {children}
    </div>
  );
}
