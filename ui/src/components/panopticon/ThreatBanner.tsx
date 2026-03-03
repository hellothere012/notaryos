'use client';

import { C } from './constants';
import type { StreamStatus } from './usePanopticonStream';

interface ThreatBannerProps {
  level: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'LOW';
  isLive?: boolean;
  streamStatus?: StreamStatus;
  activeAgents?: number;
}

const levelColors: Record<string, string> = {
  CRITICAL: C.red,
  HIGH: C.amber,
  ELEVATED: '#dd8800',
  LOW: C.green,
};

export default function ThreatBanner({ level, isLive, streamStatus, activeAgents }: ThreatBannerProps) {
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

          {/* Live/Simulated status badge */}
          {streamStatus && (
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 2,
                fontFamily: 'monospace',
                letterSpacing: 0.5,
                ...(isLive
                  ? {
                      color: '#000',
                      background: C.green,
                      animation: 'banner-live-pulse 2s ease-in-out infinite',
                    }
                  : streamStatus === 'connecting'
                    ? {
                        color: C.amber,
                        background: 'rgba(255,170,0,0.15)',
                        border: `1px solid rgba(255,170,0,0.3)`,
                      }
                    : {
                        color: C.amber,
                        background: 'rgba(255,170,0,0.1)',
                        border: `1px solid rgba(255,170,0,0.2)`,
                      }),
              }}
            >
              {isLive ? `LIVE ${activeAgents ?? 0}/6` : streamStatus === 'connecting' ? 'CONNECTING...' : 'SIMULATED'}
            </span>
          )}
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
      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes banner-live-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
      `}</style>
    </>
  );
}
