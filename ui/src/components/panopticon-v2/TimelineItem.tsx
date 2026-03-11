'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON V2 — TimelineItem
// Individual feed item with type-specific rendering,
// expand/collapse, and inline receipt seal for assessments.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { C } from '../panopticon/constants';
import type { FlightTrack, VesselTrack, NewsItem, Assessment, LiveEvent } from '../panopticon/types';
import ReceiptSeal from './ReceiptSeal';

// ─── Unified Timeline Entry ────────────────────────────────

export type TimelineEntryType = 'flight' | 'vessel' | 'news' | 'official' | 'assessment' | 'event';

export interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  timestamp: number; // epoch ms for sorting
  timeLabel: string; // display string "HH:MM UTC"
  data: FlightTrack | VesselTrack | NewsItem | Assessment | LiveEvent;
}

// ─── Type → Color + Glyph Mapping ─────────────────────────

const TYPE_CONFIG: Record<TimelineEntryType, { color: string; glyph: string; label: string }> = {
  flight:     { color: C.cyan,    glyph: '\u2708', label: 'FLIGHT' },
  vessel:     { color: '#4488cc', glyph: '\u2693', label: 'VESSEL' },
  news:       { color: C.amber,   glyph: '\u25CF', label: 'NEWS' },
  official:   { color: '#cc4488', glyph: '\u2605', label: 'OFFICIAL' },
  assessment: { color: C.green,   glyph: '\u25B2', label: 'ASSESS' },
  event:      { color: '#ffffff', glyph: '\u26A0', label: 'EVENT' },
};

// ─── Severity → Color ─────────────────────────────────────

function severityColor(severity: string): string {
  switch (severity) {
    case 'FLASH':
    case 'CRITICAL': return C.red;
    case 'HIGH':
    case 'MAJOR': return C.amber;
    case 'ELEVATED':
    case 'DEVELOPING': return '#ffcc44';
    case 'LOW': return C.green;
    default: return C.dimText;
  }
}

// ─── Props ─────────────────────────────────────────────────

interface TimelineItemProps {
  entry: TimelineEntry;
  onViewCorrelation?: (assessment: Assessment) => void;
}

// ─── Component ─────────────────────────────────────────────

export default function TimelineItem({ entry, onViewCorrelation }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[entry.type];

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="timeline-item-slide"
      style={{
        padding: '6px 10px',
        borderBottom: `1px solid ${C.panelBorder}`,
        cursor: 'pointer',
        transition: 'background 0.15s',
        background: 'transparent',
        animation: 'intel-news-slide-in 0.3s ease-out',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,180,255,0.04)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* ── Header Row ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Type glyph */}
        <span style={{ fontSize: 11, color: config.color, flexShrink: 0, width: 16, textAlign: 'center' }}>
          {config.glyph}
        </span>

        {/* Time */}
        <span style={{ fontSize: 9, color: C.dimText, fontFamily: 'monospace', flexShrink: 0, width: 52 }}>
          {entry.timeLabel}
        </span>

        {/* Main text — varies by type */}
        <span style={{ fontSize: 10, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded ? 'normal' : 'nowrap' }}>
          {renderTitle(entry)}
        </span>

        {/* Receipt seal for assessments */}
        {entry.type === 'assessment' && (entry.data as Assessment).dagHash && (
          <span onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
            <ReceiptSeal hash={(entry.data as Assessment).dagHash} size={14} />
          </span>
        )}

        {/* Severity/trust badge */}
        {renderBadge(entry)}
      </div>

      {/* ── Expanded Detail ──────────────────────────── */}
      {expanded && (
        <div
          style={{
            overflow: 'visible',
            marginTop: 6,
            marginLeft: 22,
            fontSize: 9,
            color: C.dimText,
          }}
        >
          {renderExpanded(entry, onViewCorrelation)}
        </div>
      )}
    </div>
  );
}

// ─── Render Helpers ────────────────────────────────────────

function renderTitle(entry: TimelineEntry): string {
  switch (entry.type) {
    case 'flight': {
      const f = entry.data as FlightTrack;
      return `${f.callsign} — ${f.aircraft} [${f.type.toUpperCase()}]`;
    }
    case 'vessel': {
      const v = entry.data as VesselTrack;
      return `${v.name} — ${v.classification || v.type}${v.flag ? ` [${v.flag}]` : ''}`;
    }
    case 'news':
    case 'official':
      return (entry.data as NewsItem).text;
    case 'assessment':
      return (entry.data as Assessment).title;
    case 'event':
      return (entry.data as LiveEvent).title;
    default:
      return '';
  }
}

function renderBadge(entry: TimelineEntry): React.ReactNode {
  const badgeStyle: React.CSSProperties = {
    fontSize: 8,
    fontWeight: 700,
    padding: '1px 4px',
    borderRadius: 2,
    flexShrink: 0,
    fontFamily: 'monospace',
    letterSpacing: 0.3,
  };

  switch (entry.type) {
    case 'flight': {
      const f = entry.data as FlightTrack;
      return (
        <span style={{ ...badgeStyle, color: '#000', background: f.type === 'adversary' ? C.red : C.cyan }}>
          {f.type === 'adversary' ? 'ADV' : f.type.slice(0, 3).toUpperCase()}
        </span>
      );
    }
    case 'vessel': {
      const v = entry.data as VesselTrack;
      return (
        <span style={{ ...badgeStyle, color: '#000', background: v.type === 'adversary' ? C.red : '#4488cc' }}>
          {v.type.slice(0, 3).toUpperCase()}
        </span>
      );
    }
    case 'news':
    case 'official': {
      const n = entry.data as NewsItem;
      return (
        <span style={{ ...badgeStyle, color: '#000', background: n.type === 'FLASH' ? C.red : n.type === 'OFFICIAL' ? '#cc4488' : C.amber }}>
          {n.type || 'NEWS'}
        </span>
      );
    }
    case 'assessment': {
      const a = entry.data as Assessment;
      return (
        <span style={{ ...badgeStyle, color: '#000', background: severityColor(a.level) }}>
          {a.level}
        </span>
      );
    }
    case 'event': {
      const e = entry.data as LiveEvent;
      return (
        <span style={{ ...badgeStyle, color: '#000', background: severityColor(e.severity) }}>
          {e.severity}
        </span>
      );
    }
    default:
      return null;
  }
}

function renderExpanded(
  entry: TimelineEntry,
  onViewCorrelation?: (assessment: Assessment) => void,
): React.ReactNode {
  switch (entry.type) {
    case 'flight': {
      const f = entry.data as FlightTrack;
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
          <span>ALT: <span style={{ color: C.text }}>{(f.alt / 1000).toFixed(0)}K ft</span></span>
          <span>SPD: <span style={{ color: C.text }}>{f.speed} kts</span></span>
          <span>HDG: <span style={{ color: C.text }}>{Math.round(f.heading)}°</span></span>
          <span>SRC: <span style={{ color: C.text }}>{f.source}</span></span>
          <span>TRUST: <span style={{ color: f.trustScore >= 80 ? C.green : C.amber }}>{f.trustScore}%</span></span>
          <span>POS: <span style={{ color: C.text }}>{f.lat.toFixed(2)}°N {f.lon.toFixed(2)}°E</span></span>
        </div>
      );
    }
    case 'vessel': {
      const v = entry.data as VesselTrack;
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
          <span>CLASS: <span style={{ color: C.text }}>{v.classification || '—'}</span></span>
          <span>SPD: <span style={{ color: C.text }}>{v.speed ?? '—'} kts</span></span>
          <span>HDG: <span style={{ color: C.text }}>{v.heading != null ? `${Math.round(v.heading)}°` : '—'}</span></span>
          <span>FLAG: <span style={{ color: C.text }}>{v.flag || '—'}</span></span>
          <span>TRUST: <span style={{ color: v.trustScore >= 80 ? C.green : C.amber }}>{v.trustScore}%</span></span>
          <span>SRC: <span style={{ color: C.text }}>{v.source}</span></span>
        </div>
      );
    }
    case 'news':
    case 'official': {
      const n = entry.data as NewsItem;
      return (
        <div>
          <div style={{ marginBottom: 3 }}>
            SRC: <span style={{ color: C.text }}>{n.source}</span>
            {' · '}
            TRUST: <span style={{ color: n.trust >= 80 ? C.green : n.trust >= 60 ? C.amber : C.red }}>{n.trust}%</span>
          </div>
          {n.url && (
            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ color: C.cyan, fontSize: 9, textDecoration: 'underline' }}
            >
              View Source
            </a>
          )}
        </div>
      );
    }
    case 'assessment': {
      const a = entry.data as Assessment;
      return (
        <div>
          <div style={{ color: C.text, marginBottom: 4, lineHeight: 1.4 }}>{a.summary}</div>
          <div style={{ marginBottom: 3 }}>
            CONFIDENCE: <span style={{ color: a.confidence >= 80 ? C.green : C.amber }}>{a.confidence}%</span>
            {a.sources.length > 0 && <span> · SOURCES: <span style={{ color: C.text }}>{a.sources.join(', ')}</span></span>}
          </div>
          {a.aiConsensus && (
            <div style={{ color: C.dimText, fontStyle: 'italic', marginBottom: 4 }}>
              AI: {a.aiConsensus}
            </div>
          )}
          {onViewCorrelation && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewCorrelation(a); }}
              style={{
                background: 'rgba(0,255,136,0.1)',
                border: `1px solid ${C.green}`,
                color: C.green,
                fontSize: 9,
                fontFamily: 'monospace',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 3,
                cursor: 'pointer',
                letterSpacing: 0.5,
              }}
            >
              VIEW CORRELATION
            </button>
          )}
        </div>
      );
    }
    case 'event': {
      const ev = entry.data as LiveEvent;
      return (
        <div>
          {ev.summary && <div style={{ color: C.text, marginBottom: 4, lineHeight: 1.4 }}>{ev.summary}</div>}
          <div style={{ marginBottom: 3 }}>
            REGION: <span style={{ color: C.text }}>{ev.region}</span>
            {' · '}
            SOURCES: <span style={{ color: C.text }}>{ev.source_count}</span>
          </div>
          {ev.keywords_matched.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3 }}>
              {ev.keywords_matched.slice(0, 5).map((kw) => (
                <span
                  key={kw}
                  style={{
                    fontSize: 8,
                    color: C.text,
                    background: 'rgba(255,255,255,0.06)',
                    padding: '1px 4px',
                    borderRadius: 2,
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }
    default:
      return null;
  }
}
