'use client';

interface MobileNavProps {
  activeView: 'globe' | 'feed' | 'agents';
  onViewChange: (view: 'globe' | 'feed' | 'agents') => void;
}

const tabs = [
  { id: 'globe' as const, label: 'GLOBE', glyph: '\u{1F310}' },
  { id: 'feed' as const, label: 'FEED', glyph: '\u{1F4F0}' },
  { id: 'agents' as const, label: 'AGENTS', glyph: '\u{1F916}' },
] as const;

export default function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around md:hidden"
      style={{
        height: 48,
        background: 'rgba(8, 16, 28, 0.95)',
        borderTop: '1px solid rgba(0, 180, 255, 0.15)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
            style={{
              color: isActive ? '#00d4ff' : '#4a7a9a',
              borderTop: isActive ? '2px solid #00d4ff' : '2px solid transparent',
            }}
          >
            <span className="text-base leading-none">{tab.glyph}</span>
            <span className="text-[9px] tracking-widest mt-0.5 uppercase">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
