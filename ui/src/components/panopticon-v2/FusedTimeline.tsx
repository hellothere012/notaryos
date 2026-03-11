'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON V2 — FusedTimeline
// Unified chronological feed merging all 6 OSINT data types.
// Replaces the 5-tab IntelPanel with filter toggles (pills).
// ═══════════════════════════════════════════════════════════

import { useMemo, useState, useRef, useEffect } from 'react';
import { C } from '../panopticon/constants';
import type { FlightTrack, VesselTrack, NewsItem, Assessment, LiveEvent } from '../panopticon/types';
import TimelineItem, { type TimelineEntry, type TimelineEntryType } from './TimelineItem';
import AnalystInput from './AnalystInput';

// ─── Props ─────────────────────────────────────────────────

interface FusedTimelineProps {
  flights: FlightTrack[];
  vessels: VesselTrack[];
  news: NewsItem[];
  assessments: Assessment[];
  events: LiveEvent[];
  onViewCorrelation?: (assessment: Assessment) => void;
}

// ─── Filter Pill Config ────────────────────────────────────

const FILTER_PILLS: { type: TimelineEntryType; label: string; color: string }[] = [
  { type: 'event',      label: 'EVENTS',  color: '#ffffff' },
  { type: 'assessment', label: 'ASSESS',  color: C.green },
  { type: 'news',       label: 'NEWS',    color: C.amber },
  { type: 'official',   label: 'OFFICIAL', color: '#cc4488' },
  { type: 'flight',     label: 'FLIGHTS', color: C.cyan },
  { type: 'vessel',     label: 'VESSELS', color: '#4488cc' },
];

// ─── Time Parsing ──────────────────────────────────────────
// News and assessments have "HH:MM UTC" strings. We convert
// to today's epoch for consistent sorting across all types.

function parseTimeToEpoch(timeStr: string): number {
  if (!timeStr) return Date.now();
  // Match "HH:MM UTC" or "HH:MM"
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    const now = new Date();
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m));
    // If time is in the future (tomorrow's data wrapped), subtract a day
    if (d.getTime() > Date.now() + 3600000) {
      d.setUTCDate(d.getUTCDate() - 1);
    }
    return d.getTime();
  }
  // Try ISO parse
  const ts = Date.parse(timeStr);
  return isNaN(ts) ? Date.now() : ts;
}

function formatTimeLabel(epochMs: number): string {
  const d = new Date(epochMs);
  const hh = d.getUTCHours().toString().padStart(2, '0');
  const mm = d.getUTCMinutes().toString().padStart(2, '0');
  return `${hh}:${mm} UTC`;
}

// ─── Panel Style ───────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  width: 320,
  minWidth: 280,
  maxWidth: '100vw',
  background: C.panel,
  borderLeft: `1px solid ${C.panelBorder}`,
  fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
};

// ─── Component ─────────────────────────────────────────────

export default function FusedTimeline({
  flights,
  vessels,
  news,
  assessments,
  events,
  onViewCorrelation,
}: FusedTimelineProps) {
  // Filter state — all types visible by default
  const [activeFilters, setActiveFilters] = useState<Set<TimelineEntryType>>(
    new Set(['flight', 'vessel', 'news', 'official', 'assessment', 'event'])
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Toggle a filter pill
  const toggleFilter = (type: TimelineEntryType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // ─── Merge all data into sorted timeline entries ─────────

  const entries = useMemo<TimelineEntry[]>(() => {
    const all: TimelineEntry[] = [];

    // Flights — use lastSeen or current time
    for (const f of flights) {
      all.push({
        id: `f-${f.id}`,
        type: 'flight',
        timestamp: f.lastSeen || Date.now(),
        timeLabel: formatTimeLabel(f.lastSeen || Date.now()),
        data: f,
      });
    }

    // Vessels — use lastSeen or current time
    for (const v of vessels) {
      all.push({
        id: `v-${v.id}`,
        type: 'vessel',
        timestamp: v.lastSeen || Date.now(),
        timeLabel: formatTimeLabel(v.lastSeen || Date.now()),
        data: v,
      });
    }

    // News — parse "HH:MM UTC" time string
    for (const n of news) {
      const isOfficial = n.type === 'OFFICIAL';
      const ts = parseTimeToEpoch(n.time);
      all.push({
        id: `n-${n.text.slice(0, 30)}-${n.source}`,
        type: isOfficial ? 'official' : 'news',
        timestamp: ts,
        timeLabel: n.time,
        data: n,
      });
    }

    // Assessments
    for (const a of assessments) {
      const ts = parseTimeToEpoch(a.time);
      all.push({
        id: `a-${a.id}`,
        type: 'assessment',
        timestamp: ts,
        timeLabel: a.time,
        data: a,
      });
    }

    // Events — have epoch seconds in timestamp field
    for (const e of events) {
      all.push({
        id: `e-${e.id}`,
        type: 'event',
        timestamp: e.timestamp * 1000, // convert seconds to ms
        timeLabel: e.time,
        data: e,
      });
    }

    // Sort newest first, cap at 200
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.slice(0, 200);
  }, [flights, vessels, news, assessments, events]);

  // ─── Filtered entries ────────────────────────────────────

  const filteredEntries = useMemo(
    () => entries.filter((e) => activeFilters.has(e.type)),
    [entries, activeFilters]
  );

  // ─── Auto-scroll to top on new items ─────────────────────

  const prevCountRef = useRef(filteredEntries.length);
  useEffect(() => {
    if (autoScroll && filteredEntries.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    prevCountRef.current = filteredEntries.length;
  }, [filteredEntries.length, autoScroll]);

  // Detect manual scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    setAutoScroll(scrollRef.current.scrollTop < 20);
  };

  // ─── Render ──────────────────────────────────────────────

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div
        style={{
          padding: '8px 10px',
          fontSize: 10,
          fontWeight: 700,
          color: C.cyan,
          borderBottom: `1px solid ${C.panelBorder}`,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>INTELLIGENCE FEED</span>
        <span style={{ fontSize: 9, color: C.dimText, fontWeight: 400 }}>
          {filteredEntries.length}/{entries.length}
        </span>
      </div>

      {/* Filter pills */}
      <div
        style={{
          padding: '6px 8px',
          borderBottom: `1px solid ${C.panelBorder}`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
        }}
      >
        {FILTER_PILLS.map((pill) => {
          const active = activeFilters.has(pill.type);
          const count = entries.filter((e) => e.type === pill.type).length;
          return (
            <button
              key={pill.type}
              onClick={() => toggleFilter(pill.type)}
              style={{
                fontSize: 8,
                fontWeight: 700,
                fontFamily: 'monospace',
                letterSpacing: 0.5,
                padding: '2px 6px',
                borderRadius: 3,
                border: `1px solid ${active ? pill.color : 'rgba(255,255,255,0.1)'}`,
                background: active ? `${pill.color}15` : 'transparent',
                color: active ? pill.color : C.dimText,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {pill.label} {count > 0 && <span style={{ opacity: 0.6 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Analyst input — human analysis submission */}
      <AnalystInput />

      {/* Scrollable feed */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {filteredEntries.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', fontSize: 10, color: C.dimText }}>
            {entries.length === 0 ? 'Awaiting intelligence data...' : 'No items match active filters'}
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <TimelineItem
              key={entry.id}
              entry={entry}
              onViewCorrelation={onViewCorrelation}
            />
          ))
        )}
      </div>

      {/* Footer status */}
      <div
        style={{
          padding: '4px 10px',
          fontSize: 8,
          color: C.dimText,
          borderTop: `1px solid ${C.panelBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          {entries.filter((e) => e.type === 'assessment').length} assessments sealed
        </span>
        <span>
          {autoScroll ? 'AUTO-SCROLL ON' : 'SCROLL PAUSED'}
        </span>
      </div>
    </div>
  );
}
