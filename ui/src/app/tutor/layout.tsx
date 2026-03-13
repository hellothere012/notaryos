import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Tutor — Step-by-Step Reasoning | NotaryOS',
  description: 'Learn with multiple AI models. See step-by-step reasoning, not just answers. Every reasoning step sealed as a verifiable receipt.',
};

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#141210]">
      {children}
    </div>
  );
}
