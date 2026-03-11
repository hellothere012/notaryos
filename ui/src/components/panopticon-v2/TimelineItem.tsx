'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON V2 — TimelineItem
// Individual feed item with type-specific rendering,
// expand/collapse, inline receipt seal, external link modal,
// confidence bars, and clickable event source pills.
//
// V2 feature parity with V1 IntelPanel + V2 enhancements.
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

// ─── Trust → Color ─────────────────────────────────────────

function trustColor(trust: number): string {
  if (trust >= 80) return C.green;
  if (trust >= 60) return C.amber;
  return C.red;
}

// ─── Domain Extraction ─────────────────────────────────────

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

// ─── Props ─────────────────────────────────────────────────

interface TimelineItemProps {
  entry: TimelineEntry;
  onViewCorrelation?: (assessment: Assessment) => void;
}

// ─── External Link Warning Modal ───────────────────────────

function ExternalLinkModal({
  url,
  domain,
  onConfirm,
  onCancel,
}: {
  url: string;
  domain: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a1428',
          border: `1px solid ${C.panelBorder}`,
          borderRadius: 8,
          padding: '20px 24px',
          maxWidth: 400,
          width: '90%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>&#x1F6E1;</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.amber, letterSpacing: 0.5 }}>
            LEAVING NOTARYOS
          </span>
        </div>
        <div style={{ fontSize: 11, color: C.text, lineHeight: 1.6, marginBottom: 16 }}>
          You are about to visit <span style={{ color: C.brightText, fontWeight: 700 }}>{domain}</span> —
          an external site not controlled by NotaryOS. We cannot guarantee the security
          or accuracy of external content.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'rgba(0,180,255,0.15)',
              border: `1px solid ${C.cyan}`,
              borderRadius: 4,
              color: C.cyan,
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'monospace',
              cursor: 'pointer',
              letterSpacing: 0.5,
            }}
          >
            CONTINUE TO {domain.toUpperCase().slice(0, 20)}
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: `1px solid ${C.panelBorder}`,
              borderRadius: 4,
              color: C.dimText,
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────

export default function TimelineItem({ entry, onViewCorrelation }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [pendingLink, setPendingLink] = useState<{ url: string; domain: string } | null>(null);
  const config = TYPE_CONFIG[entry.type];

  const handleExternalLink = (url: string, domain?: string) => {
    setPendingLink({ url, domain: domain || extractDomain(url) });
  };

  const confirmLink = () => {
    if (pendingLink) {
      window.open(pendingLink.url, '_blank', 'noopener,noreferrer');
      setPendingLink(null);
    }
  };

  return (
    <>
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

          {/* Receipt seal + DAG hash for assessments */}
          {entry.type === 'assessment' && (entry.data as Assessment).dagHash && (
            <span onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 8, color: '#aa66ff', fontFamily: 'monospace' }} title={`DAG Hash: ${(entry.data as Assessment).dagHash}`}>
                {(entry.data as Assessment).dagHash.slice(0, 10)}...
              </span>
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
            {renderExpanded(entry, onViewCorrelation, handleExternalLink)}
          </div>
        )}
      </div>

      {/* External link warning modal */}
      {pendingLink && (
        <ExternalLinkModal
          url={pendingLink.url}
          domain={pendingLink.domain}
          onConfirm={confirmLink}
          onCancel={() => setPendingLink(null)}
        />
      )}
    </>
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
  onExternalLink?: (url: string, domain?: string) => void,
): React.ReactNode {
  switch (entry.type) {
    case 'flight': {
      const f = entry.data as FlightTrack;
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
          <span>ALT: <span style={{ color: C.text }}>{(f.alt / 1000).toFixed(0)}K ft</span></span>
          <span>SPD: <span style={{ color: C.text }}>{f.speed} kts</span></span>
          <span>HDG: <span style={{ color: C.text }}>{Math.round(f.heading)}&deg;</span></span>
          <span>SRC: <span style={{ color: C.text }}>{f.source}</span></span>
          <span>TRUST: <span style={{ color: f.trustScore >= 80 ? C.green : C.amber }}>{f.trustScore}%</span></span>
          <span>POS: <span style={{ color: C.text }}>{f.lat.toFixed(2)}&deg;N {f.lon.toFixed(2)}&deg;E</span></span>
        </div>
      );
    }
    case 'vessel': {
      const v = entry.data as VesselTrack;
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
          <span>CLASS: <span style={{ color: C.text }}>{v.classification || '\u2014'}</span></span>
          <span>SPD: <span style={{ color: C.text }}>{v.speed ?? '\u2014'} kts</span></span>
          <span>HDG: <span style={{ color: C.text }}>{v.heading != null ? `${Math.round(v.heading)}\u00B0` : '\u2014'}</span></span>
          <span>FLAG: <span style={{ color: C.text }}>{v.flag || '\u2014'}</span></span>
          <span>TRUST: <span style={{ color: v.trustScore >= 80 ? C.green : C.amber }}>{v.trustScore}%</span></span>
          <span>SRC: <span style={{ color: C.text }}>{v.source}</span></span>
        </div>
      );
    }
    case 'news':
    case 'official': {
      const n = entry.data as NewsItem;
      const tColor = trustColor(n.trust);
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span>SRC: <span style={{ color: C.text, fontWeight: 700 }}>{n.source}</span></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: tColor, display: 'inline-block', boxShadow: `0 0 4px ${tColor}` }} />
              <span style={{ color: tColor }}>{n.trust}%</span>
            </span>
          </div>
          {n.url && (
            <button
              onClick={(e) => { e.stopPropagation(); onExternalLink?.(n.url!, n.source); }}
              style={{
                background: 'rgba(0,180,255,0.08)',
                border: `1px solid ${C.panelBorder}`,
                borderRadius: 3,
                color: C.cyan,
                fontSize: 8,
                fontWeight: 700,
                fontFamily: 'monospace',
                padding: '2px 8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                letterSpacing: 0.3,
              }}
            >
              VIEW SOURCE <span style={{ fontSize: 7 }}>{'\u2197'}</span>
            </button>
          )}
        </div>
      );
    }
    case 'assessment': {
      const a = entry.data as Assessment;
      const confPct = a.confidence;
      return (
        <div>
          {/* Summary */}
          <div style={{ color: C.text, marginBottom: 6, lineHeight: 1.4 }}>{a.summary}</div>

          {/* Confidence progress bar (ported from V1) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 8, color: C.dimText, flexShrink: 0 }}>CONF</span>
            <div style={{ flex: 1, height: 4, background: 'rgba(0,180,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${confPct}%`,
                height: '100%',
                background: confPct >= 85 ? C.green : confPct >= 70 ? C.amber : C.red,
                borderRadius: 2,
                transition: 'width 0.3s',
              }} />
            </div>
            <span style={{ fontSize: 8, color: C.dimText, flexShrink: 0 }}>{confPct}%</span>
          </div>

          {/* AI Consensus box (ported from V1) */}
          {a.aiConsensus && (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${C.panelBorder}`,
              borderRadius: 4,
              padding: '6px 8px',
              marginBottom: 6,
            }}>
              <div style={{ fontSize: 7, color: C.dimText, letterSpacing: 1, marginBottom: 2 }}>AI CONSENSUS</div>
              <div style={{ fontSize: 9, color: C.brightText, lineHeight: 1.5 }}>{a.aiConsensus}</div>
            </div>
          )}

          {/* Source breakdown with verified dots (ported from V1) */}
          {a.sources.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 7, color: C.dimText, letterSpacing: 1, marginBottom: 3 }}>SOURCE BREAKDOWN</div>
              {a.sources.map((src, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, display: 'inline-block', boxShadow: `0 0 4px ${C.green}`, flexShrink: 0 }} />
                  <span style={{ color: C.text, flex: 1 }}>{src}</span>
                  <span style={{ color: C.green, fontSize: 7, flexShrink: 0 }}>VERIFIED</span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {onViewCorrelation && (
              <button
                onClick={(e) => { e.stopPropagation(); onViewCorrelation(a); }}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  background: 'rgba(0,255,136,0.1)',
                  border: `1px solid ${C.green}`,
                  color: C.green,
                  fontSize: 9,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  borderRadius: 3,
                  cursor: 'pointer',
                  letterSpacing: 0.5,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,255,136,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,255,136,0.1)'; }}
              >
                VIEW CORRELATION
              </button>
            )}
          </div>
        </div>
      );
    }
    case 'event': {
      const ev = entry.data as LiveEvent;
      return (
        <div>
          {ev.summary && <div style={{ color: C.text, marginBottom: 4, lineHeight: 1.4 }}>{ev.summary}</div>}

          <div style={{ marginBottom: 4 }}>
            REGION: <span style={{ color: C.text }}>{ev.region}</span>
          </div>

          {/* Clickable source pills with trust colors (ported from V1) */}
          {ev.sources && ev.sources.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
              {ev.sources.map((src, i) => {
                const tColor = trustColor(src.trust);
                return (
                  <span
                    key={`${src.domain}-${i}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (src.url) onExternalLink?.(src.url, src.domain);
                    }}
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: '#000',
                      background: tColor,
                      padding: '1px 5px',
                      borderRadius: 2,
                      cursor: src.url ? 'pointer' : 'default',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      transition: 'opacity 0.15s',
                    }}
                    title={src.url ? `Open ${src.domain} (external)` : src.domain}
                  >
                    {src.name}
                    {src.url && (
                      <span style={{ fontSize: 7, opacity: 0.7 }}>{'\u2197'}</span>
                    )}
                  </span>
                );
              })}
            </div>
          )}

          {/* Fallback: source count if no detailed sources */}
          {(!ev.sources || ev.sources.length === 0) && ev.source_count > 0 && (
            <div style={{ marginBottom: 3 }}>
              SOURCES: <span style={{ color: C.text }}>{ev.source_count}</span>
            </div>
          )}

          {/* Keyword tags */}
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
