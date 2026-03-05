'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON V2 — Time Scrubber
// Horizontal slider for replaying buffered SSE data.
// Shows LIVE (green) or REPLAY (amber) mode.
// ═══════════════════════════════════════════════════════════

import { useCallback, useMemo } from 'react';
import { C } from '../panopticon/constants';

interface TimeScrubberProps {
  /** null = live mode, number = replay at this epoch ms */
  scrubberTime: number | null;
  onScrubberChange: (time: number | null) => void;
  /** Time range of buffered data */
  timeRange: { start: number; end: number } | null;
  snapshotCount: number;
}

function formatTime(epochMs: number): string {
  const d = new Date(epochMs);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
}

function formatTimeTick(epochMs: number): string {
  const d = new Date(epochMs);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export default function TimeScrubber({ scrubberTime, onScrubberChange, timeRange, snapshotCount }: TimeScrubberProps) {
  const isLive = scrubberTime === null;

  // Generate tick marks every 30 minutes
  const ticks = useMemo(() => {
    if (!timeRange) return [];
    const result: { position: number; label: string }[] = [];
    const duration = timeRange.end - timeRange.start;
    if (duration < 60_000) return []; // Less than 1 min of data

    // Round start up to next 30-min boundary
    const thirtyMin = 30 * 60 * 1000;
    const firstTick = Math.ceil(timeRange.start / thirtyMin) * thirtyMin;

    for (let t = firstTick; t <= timeRange.end; t += thirtyMin) {
      const position = (t - timeRange.start) / duration;
      result.push({ position, label: formatTimeTick(t) });
    }
    return result;
  }, [timeRange]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!timeRange) return;
    const val = Number(e.target.value);
    const duration = timeRange.end - timeRange.start;
    const time = timeRange.start + (val / 1000) * duration;
    onScrubberChange(time);
  }, [timeRange, onScrubberChange]);

  const sliderValue = useMemo(() => {
    if (!timeRange || isLive) return 1000;
    const duration = timeRange.end - timeRange.start;
    if (duration === 0) return 1000;
    return Math.round(((scrubberTime! - timeRange.start) / duration) * 1000);
  }, [timeRange, scrubberTime, isLive]);

  // Don't render if no buffered data yet
  if (!timeRange || snapshotCount < 2) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 208,
        right: 320,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        background: 'rgba(6,10,18,0.85)',
        borderRadius: 6,
        border: `1px solid ${C.panelBorder}`,
        backdropFilter: 'blur(4px)',
        fontFamily: '"SF Mono", "Fira Code", monospace',
      }}
    >
      {/* Live/Replay button */}
      <button
        onClick={() => onScrubberChange(null)}
        style={{
          background: isLive ? 'rgba(0,255,136,0.15)' : 'rgba(255,170,0,0.15)',
          border: `1px solid ${isLive ? C.green : C.amber}`,
          color: isLive ? C.green : C.amber,
          fontSize: 9,
          fontWeight: 700,
          fontFamily: 'monospace',
          padding: '3px 8px',
          borderRadius: 3,
          cursor: 'pointer',
          letterSpacing: 0.8,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {isLive ? '\u25B6 LIVE' : 'REPLAY'}
      </button>

      {/* Slider container */}
      <div style={{ flex: 1, position: 'relative', height: 24 }}>
        {/* Tick marks */}
        {ticks.map((tick) => (
          <div
            key={tick.label}
            style={{
              position: 'absolute',
              left: `${tick.position * 100}%`,
              top: 0,
              transform: 'translateX(-50%)',
              fontSize: 7,
              color: C.dimText,
              pointerEvents: 'none',
            }}
          >
            {tick.label}
          </div>
        ))}

        {/* HTML range input styled */}
        <input
          type="range"
          min={0}
          max={1000}
          value={sliderValue}
          onChange={handleSliderChange}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 4,
            appearance: 'none',
            background: `linear-gradient(to right, ${isLive ? C.green : C.amber}44 0%, ${isLive ? C.green : C.amber} ${sliderValue / 10}%, ${C.panelBorder} ${sliderValue / 10}%, ${C.panelBorder} 100%)`,
            borderRadius: 2,
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Current time label */}
      <span style={{ fontSize: 9, color: C.dimText, flexShrink: 0, whiteSpace: 'nowrap' }}>
        {isLive ? formatTime(Date.now()) : formatTime(scrubberTime!)}
      </span>
    </div>
  );
}
