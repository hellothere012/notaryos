'use client';

// ================================================================
// PANOPTICON — TimeSlider
// Bottom timeline bar with playback controls, event density
// histogram, and current time display. Allows scrubbing through
// the OSINT timeline from 0 (earliest) to 100 (live).
// ================================================================

import { useMemo } from 'react';
import { C } from './constants';

// ─── Props ─────────────────────────────────────────────────

interface TimeSliderProps {
  timeOffset: number;       // 0-100 slider position
  setTimeOffset: (v: number) => void;
}

// ─── Style Constants ───────────────────────────────────────

const barStyle: React.CSSProperties = {
  background: C.panel,
  borderTop: `1px solid ${C.panelBorder}`,
  padding: '6px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
  flexShrink: 0,
  position: 'relative',
  zIndex: 10,
};

const controlBtnStyle: React.CSSProperties = {
  background: C.panelBorder,
  border: 'none',
  color: C.cyan,
  fontSize: 11,
  fontFamily: 'monospace',
  width: 24,
  height: 22,
  borderRadius: 3,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  lineHeight: 1,
  transition: 'background 0.15s',
};

// ─── Histogram Bar Generator ───────────────────────────────
// Pre-generates 100 random bars to simulate event density
// across the timeline. Heights are seeded pseudo-randomly so
// they stay stable across re-renders (via useMemo).

function generateHistogramBars(): number[] {
  const bars: number[] = [];
  // Deterministic pseudo-random using a simple LCG approach
  let seed = 42;
  for (let i = 0; i < 100; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const normalized = (seed % 1000) / 1000;
    // Bias toward higher values near the "live" end (right side)
    const positionBias = 0.3 + (i / 100) * 0.7;
    bars.push(Math.min(1, normalized * positionBias + Math.random() * 0.1));
  }
  return bars;
}

// ─── Bar Color ─────────────────────────────────────────────
// Maps intensity to a threat color: high=red, mid=amber, low=cyan

function barColor(intensity: number): string {
  if (intensity > 0.8) return C.red;
  if (intensity > 0.5) return C.amber;
  return C.cyan;
}

// ─── Component ─────────────────────────────────────────────

export default function TimeSlider({ timeOffset, setTimeOffset }: TimeSliderProps) {
  // Generate histogram bars once and keep stable across renders
  const histogramBars = useMemo(() => generateHistogramBars(), []);

  // Format current time as UTC string
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  // Playback control handlers
  const nudge = (delta: number) => {
    setTimeOffset(Math.max(0, Math.min(100, timeOffset + delta)));
  };

  return (
    <div style={barStyle}>
      {/* ── Left: Playback Controls ────────────────────────── */}
      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
        <button
          style={controlBtnStyle}
          onClick={() => setTimeOffset(0)}
          title="Jump to start"
          aria-label="Jump to start"
        >
          {'\u23EE'}
        </button>
        <button
          style={controlBtnStyle}
          onClick={() => nudge(-5)}
          title="Step back"
          aria-label="Step back"
        >
          {'\u23EA'}
        </button>
        <button
          style={controlBtnStyle}
          onClick={() => setTimeOffset(100)}
          title="Play / Live"
          aria-label="Play"
        >
          {'\u25B6'}
        </button>
        <button
          style={controlBtnStyle}
          onClick={() => nudge(5)}
          title="Step forward"
          aria-label="Step forward"
        >
          {'\u23E9'}
        </button>
        <button
          style={controlBtnStyle}
          onClick={() => setTimeOffset(100)}
          title="Jump to live"
          aria-label="Jump to live"
        >
          {'\u23ED'}
        </button>
      </div>

      {/* ── Center: Slider + Histogram ─────────────────────── */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          height: 32,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        {/* Event density histogram behind the slider */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 28,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        >
          {histogramBars.map((intensity, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${Math.max(4, intensity * 100)}%`,
                background: barColor(intensity),
                borderRadius: '1px 1px 0 0',
                opacity: 0.6,
                transition: 'height 0.2s',
              }}
            />
          ))}
        </div>

        {/* Playhead indicator — vertical cyan line with glow */}
        <div
          style={{
            position: 'absolute',
            left: `${timeOffset}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: C.cyan,
            boxShadow: `0 0 8px ${C.cyan}, 0 0 16px rgba(0,212,255,0.3)`,
            borderRadius: 1,
            pointerEvents: 'none',
            zIndex: 3,
            transition: 'left 0.1s',
          }}
        />

        {/* Range input — sits on top of histogram */}
        <input
          type="range"
          min={0}
          max={100}
          value={timeOffset}
          onChange={(e) => setTimeOffset(Number(e.target.value))}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 2,
            width: '100%',
            height: 28,
            cursor: 'pointer',
            opacity: 0,
            zIndex: 4,
            margin: 0,
          }}
          aria-label="Timeline scrubber"
        />
      </div>

      {/* ── Right: Current Time + LIVE Badge ───────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          flexShrink: 0,
          gap: 2,
        }}
      >
        <span style={{ fontSize: 9, color: C.dimText, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
          {timeStr}
        </span>
        {timeOffset >= 95 && (
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: '#000',
              background: C.red,
              padding: '1px 6px',
              borderRadius: 2,
              letterSpacing: 1,
              animation: 'panopticon-live-pulse 1.5s ease-in-out infinite',
            }}
          >
            LIVE
          </span>
        )}
      </div>

      {/* Inline keyframe for the LIVE pulse animation */}
      <style>{`
        @keyframes panopticon-live-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
