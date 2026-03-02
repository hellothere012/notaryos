'use client';

import { C } from './constants';

interface ThreatBannerProps {
  level: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'LOW';
}

const levelColors: Record<string, string> = {
  CRITICAL: C.red,
  HIGH: C.amber,
  ELEVATED: '#dd8800',
  LOW: C.green,
};

export default function ThreatBanner({ level }: ThreatBannerProps) {
  const color = levelColors[level] || C.amber;
  const pulseAnim = level === 'CRITICAL' ? 'pulse 1.5s ease-in-out infinite' : 'none';

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: `linear-gradient(90deg, ${color}15, ${C.panel}, ${color}15)`,
          borderBottom: `1px solid ${color}40`,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 14,
              fontWeight: 700,
              color: C.cyan,
              letterSpacing: 2,
            }}
          >
            PANOPTICON
          </span>
          <span style={{ fontSize: 9, color: C.dimText, fontFamily: 'monospace' }}>
            ATS PROTOCOL + NOTARYOS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, color: C.dimText, fontFamily: 'monospace' }}>
            THREAT LEVEL
          </span>
          <span
            style={{
              padding: '3px 12px',
              borderRadius: 2,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: 2,
              background: color + '25',
              color,
              border: `1px solid ${color}60`,
              animation: pulseAnim,
            }}
          >
            {level}
          </span>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
    </>
  );
}
