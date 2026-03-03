'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON — IntelPanel
// Right-side intelligence panel with ASSESSMENTS and NEWS tabs.
// Renders AI-fused multi-source assessments with cryptographic
// provenance and real-time news feed with trust scoring.
//
// Now accepts live data as props (from usePanopticonStream)
// with fallback to simulated data when stream is offline.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import type { Assessment, NewsItem } from './types';
import { C } from './constants';
import { ASSESSMENTS as STATIC_ASSESSMENTS, NEWS_FEED as STATIC_NEWS } from './simulated-data';

// ─── Props ───────────────────────────────────────────────

interface IntelPanelProps {
  news: NewsItem[];
  assessments: Assessment[];
  selectedAssessment: Assessment | null;
  setSelectedAssessment: (a: Assessment) => void;
  onViewDag: (a: Assessment) => void;
}

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

// ─── Severity Badge ──────────────────────────────────────

function severityColor(level: Assessment['level']): string {
  switch (level) {
    case 'CRITICAL':
      return C.red;
    case 'HIGH':
      return C.amber;
    case 'ELEVATED':
      return '#cc8844';
    case 'LOW':
      return C.dimText;
    default:
      return C.dimText;
  }
}

// ─── News Type Badge ─────────────────────────────────────

function newsTypeColor(type: NewsItem['type']): string {
  switch (type) {
    case 'FLASH':
      return C.red;
    case 'OFFICIAL':
      return C.cyan;
    case 'BREAKING':
      return C.amber;
    case 'GEOINT':
      return C.green;
    case 'OSINT':
      return '#aa66ff';
    case 'ANALYSIS':
      return '#8866cc';
    default:
      return C.dimText;
  }
}

// ─── Trust Score Indicator ───────────────────────────────

function trustColor(score: number): string {
  if (score >= 80) return C.green;
  if (score >= 60) return C.amber;
  return C.red;
}

// ─── Assessment Card ─────────────────────────────────────
// Renders a single assessment. When selected, expands to show
// full detail with AI consensus, sources breakdown, and action buttons.

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
      {/* Clickable card header */}
      <div
        onClick={onSelect}
        style={{
          padding: '8px 10px',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'rgba(0,180,255,0.04)';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'transparent';
        }}
      >
        {/* Time + Severity Badge + Collapse indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: C.dimText }}>{assessment.time}</span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#000',
              background: sevColor,
              padding: '1px 5px',
              borderRadius: 2,
              letterSpacing: 0.5,
            }}
          >
            {assessment.level}
          </span>
          {/* Expand/collapse chevron */}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: C.dimText, transition: 'transform 0.2s', transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▾
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: C.brightText,
            lineHeight: 1.3,
            marginBottom: 4,
          }}
        >
          {assessment.title}
        </div>

        {/* Summary (truncated when collapsed, full when expanded) */}
        <div
          style={{
            fontSize: 10,
            color: C.text,
            lineHeight: 1.4,
            marginBottom: 6,
            maxHeight: isSelected ? 'none' : 40,
            overflow: isSelected ? 'visible' : 'hidden',
          }}
        >
          {assessment.summary}
        </div>

        {/* Source Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
          {assessment.sources.map((src) => (
            <span
              key={src}
              style={{
                fontSize: 9,
                color: '#000',
                background: C.cyan,
                padding: '1px 4px',
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              {src}
            </span>
          ))}
        </div>

        {/* Confidence Bar + DAG Hash */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, color: C.dimText }}>CONF</span>
            <div
              style={{
                flex: 1,
                height: 4,
                background: 'rgba(0,180,255,0.1)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${confPct}%`,
                  height: '100%',
                  background: confPct >= 85 ? C.green : confPct >= 70 ? C.amber : C.red,
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <span style={{ fontSize: 9, color: C.dimText }}>
              {confPct}%
            </span>
          </div>
          <span
            style={{
              fontSize: 9,
              color: '#aa66ff',
              fontFamily: 'monospace',
            }}
            title={`DAG Hash: ${assessment.dagHash}`}
          >
            {assessment.dagHash.slice(0, 10)}...
          </span>
        </div>
      </div>

      {/* ── Expanded Detail Panel ─────────────────────────── */}
      {isSelected && (
        <div
          style={{
            padding: '0 10px 10px',
            borderTop: `1px solid ${C.panelBorder}`,
            marginTop: 2,
          }}
        >
          {/* AI Consensus */}
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${C.panelBorder}`,
              borderRadius: 4,
              padding: '8px 10px',
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 8, color: C.dimText, letterSpacing: 1, marginBottom: 3 }}>
              AI CONSENSUS
            </div>
            <div style={{ fontSize: 10, color: C.brightText, lineHeight: 1.5 }}>
              {assessment.aiConsensus}
            </div>
          </div>

          {/* Source Detail List */}
          <div style={{ fontSize: 8, color: C.dimText, letterSpacing: 1, marginBottom: 4 }}>
            SOURCE BREAKDOWN
          </div>
          {assessment.sources.map((src, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 0',
                fontSize: 9,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, display: 'inline-block', boxShadow: `0 0 4px ${C.green}` }} />
              <span style={{ color: C.text, flex: 1 }}>{src}</span>
              <span style={{ color: C.green, fontSize: 8 }}>VERIFIED</span>
            </div>
          ))}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onViewDag(); }}
              style={{
                flex: 1,
                padding: '6px 0',
                background: 'rgba(170,102,255,0.15)',
                border: `1px solid rgba(170,102,255,0.4)`,
                borderRadius: 4,
                color: '#aa66ff',
                fontSize: 9,
                fontWeight: 700,
                fontFamily: 'monospace',
                letterSpacing: 0.5,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(170,102,255,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(170,102,255,0.15)'; }}
            >
              VIEW PROVENANCE DAG
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              style={{
                padding: '6px 12px',
                background: 'rgba(0,180,255,0.1)',
                border: `1px solid ${C.panelBorder}`,
                borderRadius: 4,
                color: C.dimText,
                fontSize: 9,
                fontWeight: 700,
                fontFamily: 'monospace',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
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
        background: isNew ? 'rgba(0,212,255,0.06)' : 'transparent',
        transition: 'background 1s ease-out',
      }}
    >
      {/* Time + Source Type Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: C.dimText }}>{item.time}</span>
        {item.type && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#000',
              background: typeColor,
              padding: '1px 5px',
              borderRadius: 2,
              letterSpacing: 0.5,
            }}
          >
            {item.type}
          </span>
        )}

        {/* Trust Score Indicator */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: tColor,
              display: 'inline-block',
              boxShadow: `0 0 4px ${tColor}`,
            }}
          />
          <span style={{ fontSize: 9, color: tColor }}>{item.trust}</span>
        </span>
      </div>

      {/* Source Name + Text */}
      <div style={{ fontSize: 10, color: C.text, lineHeight: 1.4 }}>
        <span style={{ fontWeight: 700, color: C.brightText }}>{item.source}</span>
        {' -- '}
        {item.text}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export default function IntelPanel({
  news,
  assessments,
  selectedAssessment,
  setSelectedAssessment,
  onViewDag,
}: IntelPanelProps) {
  const [activeTab, setActiveTab] = useState<'assessments' | 'news'>('assessments');

  // Use live data when available, fall back to static
  const displayAssessments = assessments.length > 0 ? assessments : STATIC_ASSESSMENTS;
  const displayNews = news.length > 0 ? news : STATIC_NEWS;

  return (
    <div style={panelStyle}>
      {/* Tab Bar */}
      <div style={tabBarStyle}>
        {(['assessments', 'news'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${C.cyan}` : '2px solid transparent',
              color: activeTab === tab ? C.cyan : C.dimText,
              fontSize: 9,
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: 1,
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              textTransform: 'uppercase',
            }}
          >
            {tab === 'assessments' ? `ASSESSMENTS (${displayAssessments.length})` : `NEWS (${displayNews.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'assessments' ? (
          <>
            {/* Section Header */}
            <div
              style={{
                padding: '6px 10px',
                fontSize: 9,
                color: C.dimText,
                borderBottom: `1px solid ${C.panelBorder}`,
                letterSpacing: 1,
              }}
            >
              AI-FUSED MULTI-SOURCE ASSESSMENTS
            </div>

            {/* Assessment Cards */}
            {displayAssessments.map((assessment) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                isSelected={selectedAssessment?.id === assessment.id}
                onSelect={() => setSelectedAssessment(assessment)}
                onViewDag={() => onViewDag(assessment)}
              />
            ))}
          </>
        ) : (
          <>
            {/* Section Header */}
            <div
              style={{
                padding: '6px 10px',
                fontSize: 9,
                color: C.dimText,
                borderBottom: `1px solid ${C.panelBorder}`,
                letterSpacing: 1,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>MULTI-SOURCE INTELLIGENCE FEED</span>
              {news.length > 0 && (
                <span style={{ color: C.green, fontWeight: 700 }}>LIVE</span>
              )}
            </div>

            {/* News Items */}
            {displayNews.map((item, idx) => (
              <NewsRow key={`${item.time}-${idx}`} item={item} isNew={idx < 2 && news.length > 0} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
