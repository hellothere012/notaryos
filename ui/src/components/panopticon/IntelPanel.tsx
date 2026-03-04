'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON — IntelPanel
// Right-side intelligence panel with 4 tabs:
//   ASSESSMENTS | NEWS | FLIGHTS | VESSELS
// Features severity filters, sort controls, news animations,
// and live data from usePanopticonStream (no fallback).
// ═══════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import type { Assessment, NewsItem, FlightTrack, VesselTrack, LiveEvent, EventSource } from './types';
import { C } from './constants';

// ─── Props ───────────────────────────────────────────────

interface IntelPanelProps {
  news: NewsItem[];
  assessments: Assessment[];
  flights: FlightTrack[];
  vessels: VesselTrack[];
  events: LiveEvent[];
  selectedAssessment: Assessment | null;
  setSelectedAssessment: (a: Assessment) => void;
  onViewDag: (a: Assessment) => void;
}

// ─── Tab Type ────────────────────────────────────────────

type TabId = 'events' | 'assessments' | 'news' | 'flights' | 'vessels';

// ─── Style Constants ─────────────────────────────────────

const panelStyle: React.CSSProperties = {
  width: 300,
  background: C.panel,
  borderLeft: `1px solid ${C.panelBorder}`,
  fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  height: '100%',
};

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: `1px solid ${C.panelBorder}`,
  flexShrink: 0,
};

// ─── CSS Keyframes ───────────────────────────────────────
// News entry animations for live feed items.

const newsAnimKeyframes = `
@keyframes intel-news-slide-in {
  0% { transform: translateY(-20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes intel-news-glow {
  0% { background-color: rgba(0,212,255,0.12); }
  100% { background-color: transparent; }
}
@keyframes panopticon-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
`;

// ─── Severity Colors ─────────────────────────────────────

const SEVERITY_LEVELS: Assessment['level'][] = ['CRITICAL', 'HIGH', 'ELEVATED', 'LOW'];

function severityColor(level: Assessment['level']): string {
  switch (level) {
    case 'CRITICAL': return C.red;
    case 'HIGH': return C.amber;
    case 'ELEVATED': return '#cc8844';
    case 'LOW': return C.dimText;
    default: return C.dimText;
  }
}

// Severity rank for sort (higher = more severe)
function severityRank(level: Assessment['level']): number {
  switch (level) {
    case 'CRITICAL': return 4;
    case 'HIGH': return 3;
    case 'ELEVATED': return 2;
    case 'LOW': return 1;
    default: return 0;
  }
}

// ─── News Type Badge ─────────────────────────────────────

function newsTypeColor(type: NewsItem['type']): string {
  switch (type) {
    case 'FLASH': return C.red;
    case 'OFFICIAL': return C.cyan;
    case 'BREAKING': return C.amber;
    case 'GEOINT': return C.green;
    case 'OSINT': return '#aa66ff';
    case 'ANALYSIS': return '#8866cc';
    default: return C.dimText;
  }
}

// ─── Trust Score Indicator ───────────────────────────────

function trustColor(score: number): string {
  if (score >= 80) return C.green;
  if (score >= 60) return C.amber;
  return C.red;
}

// ─── Flight Type Color ───────────────────────────────────

function flightTypeColor(type: FlightTrack['type']): string {
  switch (type) {
    case 'adversary': return C.red;
    case 'strike': return C.amber;
    case 'bomber': return '#ff6600';
    case 'isr': return C.green;
    case 'tanker': return '#8888ff';
    case 'transport': return '#66aadd';
    case 'civilian': return C.cyan;
    default: return C.cyan;
  }
}

// ─── Vessel Type Color ───────────────────────────────────

function vesselTypeColor(type: VesselTrack['type']): string {
  switch (type) {
    case 'carrier': return C.cyan;
    case 'escort': return '#66aadd';
    case 'adversary': return C.red;
    case 'commercial': return C.amber;
    case 'tanker': return '#8888ff';
    default: return C.cyan;
  }
}

// ─── Type Badge Component ────────────────────────────────

function TypeBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 8,
        fontWeight: 700,
        color: '#000',
        background: color,
        padding: '1px 4px',
        borderRadius: 2,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

// ─── Severity Filter Pills ───────────────────────────────

function SeverityFilters({
  activeFilters,
  onToggle,
  sortMode,
  onToggleSort,
}: {
  activeFilters: Set<Assessment['level']>;
  onToggle: (level: Assessment['level']) => void;
  sortMode: 'time' | 'severity';
  onToggleSort: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 10px',
        borderBottom: `1px solid ${C.panelBorder}`,
        flexWrap: 'wrap',
      }}
    >
      {SEVERITY_LEVELS.map((level) => {
        const color = severityColor(level);
        const isActive = activeFilters.has(level);
        return (
          <button
            key={level}
            onClick={() => onToggle(level)}
            style={{
              fontSize: 8,
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: 0.5,
              padding: '2px 5px',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.15s',
              border: `1px solid ${color}`,
              background: isActive ? color : 'transparent',
              color: isActive ? '#000' : color,
              opacity: isActive ? 1 : 0.6,
            }}
          >
            {level}
          </button>
        );
      })}
      <button
        onClick={onToggleSort}
        style={{
          fontSize: 8,
          fontWeight: 700,
          fontFamily: 'monospace',
          padding: '2px 6px',
          borderRadius: 2,
          cursor: 'pointer',
          marginLeft: 'auto',
          border: `1px solid ${C.panelBorder}`,
          background: 'transparent',
          color: C.dimText,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = C.cyan; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = String(C.dimText); }}
      >
        {sortMode === 'time' ? 'TIME \u2193' : 'SEV \u2193'}
      </button>
    </div>
  );
}

// ─── Assessment Card ─────────────────────────────────────

function AssessmentCard({
  assessment,
  isSelected,
  onSelect,
  onViewDag,
}: {
  assessment: Assessment;
  isSelected: boolean;
  onSelect: () => void;
  onViewDag: () => void;
}) {
  const sevColor = severityColor(assessment.level);
  const confPct = assessment.confidence <= 1
    ? Math.round(assessment.confidence * 100)
    : Math.round(assessment.confidence);

  return (
    <div
      style={{
        borderBottom: `1px solid ${C.panelBorder}`,
        background: isSelected ? 'rgba(0,180,255,0.08)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <div
        onClick={onSelect}
        style={{ padding: '8px 10px', cursor: 'pointer' }}
        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(0,180,255,0.04)'; }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: C.dimText }}>{assessment.time}</span>
          <span
            style={{
              fontSize: 9, fontWeight: 700, color: '#000',
              background: sevColor, padding: '1px 5px', borderRadius: 2, letterSpacing: 0.5,
            }}
          >
            {assessment.level}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: C.dimText, transition: 'transform 0.2s', transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▾
          </span>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: C.brightText, lineHeight: 1.3, marginBottom: 4 }}>
          {assessment.title}
        </div>

        <div style={{ fontSize: 10, color: C.text, lineHeight: 1.4, marginBottom: 6, maxHeight: isSelected ? 'none' : 40, overflow: isSelected ? 'visible' : 'hidden' }}>
          {assessment.summary}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
          {assessment.sources.map((src) => (
            <span key={src} style={{ fontSize: 9, color: '#000', background: C.cyan, padding: '1px 4px', borderRadius: 2, fontWeight: 600 }}>
              {src}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, color: C.dimText }}>CONF</span>
            <div style={{ flex: 1, height: 4, background: 'rgba(0,180,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${confPct}%`, height: '100%', background: confPct >= 85 ? C.green : confPct >= 70 ? C.amber : C.red, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 9, color: C.dimText }}>{confPct}%</span>
          </div>
          <span style={{ fontSize: 9, color: '#aa66ff', fontFamily: 'monospace' }} title={`DAG Hash: ${assessment.dagHash}`}>
            {assessment.dagHash.slice(0, 10)}...
          </span>
        </div>
      </div>

      {isSelected && (
        <div style={{ padding: '0 10px 10px', borderTop: `1px solid ${C.panelBorder}`, marginTop: 2 }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.panelBorder}`, borderRadius: 4, padding: '8px 10px', marginTop: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 8, color: C.dimText, letterSpacing: 1, marginBottom: 3 }}>AI CONSENSUS</div>
            <div style={{ fontSize: 10, color: C.brightText, lineHeight: 1.5 }}>{assessment.aiConsensus}</div>
          </div>

          <div style={{ fontSize: 8, color: C.dimText, letterSpacing: 1, marginBottom: 4 }}>SOURCE BREAKDOWN</div>
          {assessment.sources.map((src, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 9 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, display: 'inline-block', boxShadow: `0 0 4px ${C.green}` }} />
              <span style={{ color: C.text, flex: 1 }}>{src}</span>
              <span style={{ color: C.green, fontSize: 8 }}>VERIFIED</span>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onViewDag(); }}
              style={{ flex: 1, padding: '6px 0', background: 'rgba(170,102,255,0.15)', border: '1px solid rgba(170,102,255,0.4)', borderRadius: 4, color: '#aa66ff', fontSize: 9, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 0.5, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(170,102,255,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(170,102,255,0.15)'; }}
            >
              VIEW PROVENANCE DAG
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              style={{ padding: '6px 12px', background: 'rgba(0,180,255,0.1)', border: `1px solid ${C.panelBorder}`, borderRadius: 4, color: C.dimText, fontSize: 9, fontWeight: 700, fontFamily: 'monospace', cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.cyan; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = String(C.dimText); }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── News Item Row ───────────────────────────────────────

function NewsRow({ item, isNew }: { item: NewsItem; isNew?: boolean }) {
  const typeColor = newsTypeColor(item.type);
  const tColor = trustColor(item.trust);

  return (
    <div
      style={{
        padding: '6px 10px',
        borderBottom: `1px solid ${C.panelBorder}`,
        background: 'transparent',
        animation: isNew ? 'intel-news-slide-in 0.4s ease-out, intel-news-glow 2s ease-out' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: C.dimText }}>{item.time}</span>
        {item.type && <TypeBadge label={item.type} color={typeColor} />}
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: tColor, display: 'inline-block', boxShadow: `0 0 4px ${tColor}` }} />
          <span style={{ fontSize: 9, color: tColor }}>{item.trust}</span>
        </span>
      </div>

      <div style={{ fontSize: 10, color: C.text, lineHeight: 1.4 }}>
        <span style={{ fontWeight: 700, color: C.brightText }}>{item.source}</span>
        {' -- '}
        {item.text}
      </div>
    </div>
  );
}

// ─── Flight Row ──────────────────────────────────────────

function FlightRow({ flight }: { flight: FlightTrack }) {
  const color = flightTypeColor(flight.type);
  const tColor = trustColor(flight.trustScore);

  return (
    <div
      style={{
        padding: '6px 10px',
        borderBottom: `1px solid ${C.panelBorder}`,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,180,255,0.04)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Callsign + Type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace' }}>
          {flight.callsign}
        </span>
        <TypeBadge label={flight.type} color={color} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: tColor, display: 'inline-block', boxShadow: `0 0 4px ${tColor}` }} />
          <span style={{ fontSize: 9, color: tColor }}>{flight.trustScore}</span>
        </span>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 10px', fontSize: 9, marginLeft: 2 }}>
        <div>
          <span style={{ color: C.dimText }}>ALT </span>
          <span style={{ color: C.text }}>{(flight.alt / 1000).toFixed(0)}K ft</span>
        </div>
        <div>
          <span style={{ color: C.dimText }}>SPD </span>
          <span style={{ color: C.text }}>{flight.speed} kts</span>
        </div>
        <div>
          <span style={{ color: C.dimText }}>HDG </span>
          <span style={{ color: C.text }}>{Math.round(flight.heading)}&deg;</span>
        </div>
        <div>
          <span style={{ color: C.dimText }}>SRC </span>
          <span style={{ color: C.text }}>{flight.source}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Vessel Row ──────────────────────────────────────────

function VesselRow({ vessel }: { vessel: VesselTrack }) {
  const color = vesselTypeColor(vessel.type);
  const tColor = trustColor(vessel.trustScore);

  return (
    <div
      style={{
        padding: '6px 10px',
        borderBottom: `1px solid ${C.panelBorder}`,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,180,255,0.04)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Name + Type badge + Flag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace' }}>
          {vessel.name}
        </span>
        <TypeBadge label={vessel.type} color={color} />
        {vessel.flag && (
          <span style={{ fontSize: 8, color: C.dimText }}>{vessel.flag}</span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: tColor, display: 'inline-block', boxShadow: `0 0 4px ${tColor}` }} />
          <span style={{ fontSize: 9, color: tColor }}>{vessel.trustScore}</span>
        </span>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 10px', fontSize: 9, marginLeft: 2 }}>
        <div>
          <span style={{ color: C.dimText }}>CLASS </span>
          <span style={{ color: C.text }}>{vessel.classification || '\u2014'}</span>
        </div>
        <div>
          <span style={{ color: C.dimText }}>SPD </span>
          <span style={{ color: C.text }}>{vessel.speed != null ? `${vessel.speed} kts` : '\u2014'}</span>
        </div>
        <div>
          <span style={{ color: C.dimText }}>HDG </span>
          <span style={{ color: C.text }}>{vessel.heading != null ? `${Math.round(vessel.heading)}\u00B0` : '\u2014'}</span>
        </div>
        <div>
          <span style={{ color: C.dimText }}>SRC </span>
          <span style={{ color: C.text }}>{vessel.source}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Event Severity Color ────────────────────────────────

function eventSeverityColor(severity: LiveEvent['severity']): string {
  switch (severity) {
    case 'FLASH': return C.red;
    case 'CRITICAL': return '#ff4444';
    case 'MAJOR': return C.amber;
    case 'DEVELOPING': return C.cyan;
    default: return C.dimText;
  }
}

// ─── Relative Time Helper ────────────────────────────────

function relativeTime(ts: number): string {
  const now = Date.now() / 1000;
  const diff = Math.max(0, now - ts);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── External Link Warning Modal ─────────────────────────

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

// ─── Event Row Component ─────────────────────────────────

function EventRow({
  event,
  isNew,
  onExternalLink,
}: {
  event: LiveEvent;
  isNew?: boolean;
  onExternalLink: (url: string, domain: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sevColor = eventSeverityColor(event.severity);
  const isFlash = event.severity === 'FLASH';

  return (
    <div
      style={{
        padding: '8px 10px',
        borderBottom: `1px solid ${C.panelBorder}`,
        background: 'transparent',
        animation: isNew ? 'intel-news-slide-in 0.4s ease-out, intel-news-glow 2s ease-out' : 'none',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header: timestamp + severity badge + source count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: C.dimText }}>{relativeTime(event.timestamp)}</span>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: '#000',
            background: sevColor,
            padding: '1px 5px',
            borderRadius: 2,
            letterSpacing: 0.5,
            animation: isFlash ? 'panopticon-pulse 1.5s ease-in-out infinite' : 'none',
          }}
        >
          {event.severity}
        </span>
        <span style={{ fontSize: 8, color: C.dimText, marginLeft: 'auto' }}>
          {event.source_count} {event.source_count === 1 ? 'source' : 'sources'}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 11, fontWeight: 700, color: C.brightText, lineHeight: 1.4, marginBottom: 6 }}>
        {event.title}
      </div>

      {/* Source pills — clickable with external link icon */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: expanded ? 6 : 0 }}>
        {event.sources.map((src, i) => {
          const tColor = trustColor(src.trust);
          return (
            <span
              key={`${src.domain}-${i}`}
              onClick={(e) => {
                e.stopPropagation();
                if (src.url) onExternalLink(src.url, src.domain);
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

      {/* Expanded: summary + keywords */}
      {expanded && (
        <div style={{ marginTop: 4 }}>
          {event.summary && (
            <div style={{ fontSize: 10, color: C.text, lineHeight: 1.4, marginBottom: 4 }}>
              {event.summary}
            </div>
          )}
          {event.keywords_matched.length > 0 && (
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {event.keywords_matched.map((kw) => (
                <span
                  key={kw}
                  style={{
                    fontSize: 7,
                    color: C.dimText,
                    border: `1px solid ${C.panelBorder}`,
                    padding: '0 3px',
                    borderRadius: 2,
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export default function IntelPanel({
  news,
  assessments,
  flights,
  vessels,
  events,
  selectedAssessment,
  setSelectedAssessment,
  onViewDag,
}: IntelPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('events');

  // External link warning modal state
  const [pendingLink, setPendingLink] = useState<{ url: string; domain: string } | null>(null);
  const externalLinkDismissed = typeof window !== 'undefined'
    ? localStorage.getItem('notaryos_external_link_warning_dismissed') === 'true'
    : false;

  const handleExternalLink = useCallback((url: string, domain: string) => {
    // Security: only allow http(s) URLs — reject javascript: and data: schemes
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return;
    } catch { return; }
    if (externalLinkDismissed) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      setPendingLink({ url, domain });
    }
  }, [externalLinkDismissed]);

  const confirmExternalLink = useCallback(() => {
    if (pendingLink) {
      // Security: re-validate scheme on confirmation
      try {
        const parsed = new URL(pendingLink.url);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return;
      } catch { return; }
      window.open(pendingLink.url, '_blank', 'noopener,noreferrer');
      setPendingLink(null);
    }
  }, [pendingLink]);

  // Severity filter state (all active by default)
  const [severityFilters, setSeverityFilters] = useState<Set<Assessment['level']>>(
    () => new Set(SEVERITY_LEVELS)
  );
  const [sortMode, setSortMode] = useState<'time' | 'severity'>('time');

  // Toggle a severity filter
  const toggleFilter = (level: Assessment['level']) => {
    setSeverityFilters((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        // Don't allow removing last filter
        if (next.size > 1) next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  // Live data only — no fallback
  const rawAssessments = assessments;
  const displayNews = news;

  // Filtered + sorted assessments
  const displayAssessments = useMemo(() => {
    const filtered = rawAssessments.filter((a) => severityFilters.has(a.level));
    if (sortMode === 'severity') {
      return [...filtered].sort((a, b) => severityRank(b.level) - severityRank(a.level));
    }
    return filtered; // already in time order from stream
  }, [rawAssessments, severityFilters, sortMode]);

  // Tab definitions with counts
  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'events', label: 'EVENTS', count: events.length },
    { id: 'assessments', label: 'ASSESS', count: displayAssessments.length },
    { id: 'news', label: 'NEWS', count: displayNews.length },
    { id: 'flights', label: 'FLIGHTS', count: flights.length },
    { id: 'vessels', label: 'VESSELS', count: vessels.length },
  ];

  return (
    <div style={panelStyle}>
      {/* Inject news animation keyframes */}
      <style>{newsAnimKeyframes}</style>

      {/* Tab Bar — 4 tabs */}
      <div style={tabBarStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `2px solid ${C.cyan}` : '2px solid transparent',
              color: activeTab === tab.id ? C.cyan : C.dimText,
              fontSize: 8,
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: 0.5,
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              textTransform: 'uppercase',
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* External Link Warning Modal */}
      {pendingLink && (
        <ExternalLinkModal
          url={pendingLink.url}
          domain={pendingLink.domain}
          onConfirm={confirmExternalLink}
          onCancel={() => setPendingLink(null)}
        />
      )}

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── EVENTS TAB ─────────────────────────────────────── */}
        {activeTab === 'events' && (
          <>
            <div
              style={{
                padding: '6px 10px', fontSize: 9, color: C.dimText,
                borderBottom: `1px solid ${C.panelBorder}`, letterSpacing: 1,
                display: 'flex', justifyContent: 'space-between',
              }}
            >
              <span>LIVE WIRE — REAL-TIME EVENT FEED</span>
              {events.length > 0 && (
                <span style={{ color: C.green, fontWeight: 700 }}>LIVE</span>
              )}
            </div>
            {events.length > 0 ? (
              events.map((event, idx) => (
                <EventRow
                  key={event.id}
                  event={event}
                  isNew={idx < 3}
                  onExternalLink={handleExternalLink}
                />
              ))
            ) : (
              <div style={{ padding: '20px 10px', fontSize: 10, color: C.dimText, textAlign: 'center' }}>
                Monitoring live feeds...
              </div>
            )}
          </>
        )}

        {/* ── ASSESSMENTS TAB ──────────────────────────────── */}
        {activeTab === 'assessments' && (
          <>
            <div
              style={{
                padding: '6px 10px', fontSize: 9, color: C.dimText,
                borderBottom: `1px solid ${C.panelBorder}`, letterSpacing: 1,
              }}
            >
              AI-FUSED MULTI-SOURCE ASSESSMENTS
            </div>

            {/* Severity filter pills + sort toggle */}
            <SeverityFilters
              activeFilters={severityFilters}
              onToggle={toggleFilter}
              sortMode={sortMode}
              onToggleSort={() => setSortMode((m) => m === 'time' ? 'severity' : 'time')}
            />

            {displayAssessments.map((assessment) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                isSelected={selectedAssessment?.id === assessment.id}
                onSelect={() => setSelectedAssessment(assessment)}
                onViewDag={() => onViewDag(assessment)}
              />
            ))}

            {displayAssessments.length === 0 && (
              <div style={{ padding: '20px 10px', fontSize: 10, color: C.dimText, textAlign: 'center' }}>
                {assessments.length === 0 ? 'Awaiting live assessment data...' : 'No assessments match filters'}
              </div>
            )}
          </>
        )}

        {/* ── NEWS TAB ─────────────────────────────────────── */}
        {activeTab === 'news' && (
          <>
            <div
              style={{
                padding: '6px 10px', fontSize: 9, color: C.dimText,
                borderBottom: `1px solid ${C.panelBorder}`, letterSpacing: 1,
                display: 'flex', justifyContent: 'space-between',
              }}
            >
              <span>MULTI-SOURCE INTELLIGENCE FEED</span>
              {news.length > 0 && (
                <span style={{ color: C.green, fontWeight: 700 }}>LIVE</span>
              )}
            </div>
            {displayNews.length > 0 ? (
              displayNews.map((item, idx) => (
                <NewsRow key={`${item.time}-${idx}`} item={item} isNew={idx < 2} />
              ))
            ) : (
              <div style={{ padding: '20px 10px', fontSize: 10, color: C.dimText, textAlign: 'center' }}>
                Awaiting GAZETTE / HERALD feed data...
              </div>
            )}
          </>
        )}

        {/* ── FLIGHTS TAB ──────────────────────────────────── */}
        {activeTab === 'flights' && (
          <>
            <div
              style={{
                padding: '6px 10px', fontSize: 9, color: C.dimText,
                borderBottom: `1px solid ${C.panelBorder}`, letterSpacing: 1,
                display: 'flex', justifyContent: 'space-between',
              }}
            >
              <span>ADS-B / OPENSKY FLIGHT TRACKS</span>
              {flights.length > 0 && (
                <span style={{ color: C.green, fontWeight: 700 }}>LIVE</span>
              )}
            </div>
            {flights.length > 0 ? (
              flights.map((f) => <FlightRow key={f.id} flight={f} />)
            ) : (
              <div style={{ padding: '20px 10px', fontSize: 10, color: C.dimText, textAlign: 'center' }}>
                Waiting for SKYWATCH data...
              </div>
            )}
          </>
        )}

        {/* ── VESSELS TAB ──────────────────────────────────── */}
        {activeTab === 'vessels' && (
          <>
            <div
              style={{
                padding: '6px 10px', fontSize: 9, color: C.dimText,
                borderBottom: `1px solid ${C.panelBorder}`, letterSpacing: 1,
                display: 'flex', justifyContent: 'space-between',
              }}
            >
              <span>AIS MARITIME VESSEL TRACKS</span>
              {vessels.length > 0 && (
                <span style={{ color: C.green, fontWeight: 700 }}>LIVE</span>
              )}
            </div>
            {vessels.length > 0 ? (
              vessels.map((v) => <VesselRow key={v.id} vessel={v} />)
            ) : (
              <div style={{ padding: '20px 10px', fontSize: 10, color: C.dimText, textAlign: 'center' }}>
                Waiting for NEPTUNE data...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
