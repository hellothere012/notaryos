'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON — IntelPanel
// Right-side intelligence panel with ASSESSMENTS and NEWS tabs.
// Renders AI-fused multi-source assessments with cryptographic
// provenance and real-time news feed with trust scoring.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import type { Assessment, NewsItem } from './types';
import { C } from './constants';
import { ASSESSMENTS, NEWS_FEED } from './simulated-data';

// ─── Props ───────────────────────────────────────────────

interface IntelPanelProps {
  selectedAssessment: Assessment | null;
  setSelectedAssessment: (a: Assessment) => void;
}

// ─── Style Constants ─────────────────────────────────────
// Panel and element styles derived from the C color palette.
// All measurements use inline styles for zero-dependency rendering.

const panelStyle: React.CSSProperties = {
  width: 280,
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
// Maps assessment severity levels to their display colors.

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
// Maps news item types to their display colors for the badge.

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
// Returns a colored dot representing the trust level of a source.
// >=80 green (reliable), >=60 amber (moderate), <60 red (low trust).

function trustColor(score: number): string {
  if (score >= 80) return C.green;
  if (score >= 60) return C.amber;
  return C.red;
}

// ─── Assessment Card ─────────────────────────────────────
// Renders a single assessment entry with severity badge,
// source pills, confidence bar, and DAG hash link.

function AssessmentCard({
  assessment,
  isSelected,
  onSelect,
}: {
  assessment: Assessment;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const sevColor = severityColor(assessment.level);

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '8px 10px',
        borderBottom: `1px solid ${C.panelBorder}`,
        cursor: 'pointer',
        background: isSelected ? 'rgba(0,180,255,0.08)' : 'transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'rgba(0,180,255,0.04)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Time + Severity Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 7, color: C.dimText }}>{assessment.time}</span>
        <span
          style={{
            fontSize: 7,
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
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: C.brightText,
          lineHeight: 1.3,
          marginBottom: 4,
        }}
      >
        {assessment.title}
      </div>

      {/* Summary */}
      <div
        style={{
          fontSize: 8,
          color: C.text,
          lineHeight: 1.4,
          marginBottom: 6,
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
              fontSize: 7,
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
        {/* Confidence bar */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 7, color: C.dimText }}>CONF</span>
          <div
            style={{
              flex: 1,
              height: 4,
              background: 'rgba(0,180,255,0.1)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            {/* confidence may be 0-1 (float) or 0-100 (int) — normalize to percentage */}
            <div
              style={{
                width: `${assessment.confidence <= 1 ? assessment.confidence * 100 : assessment.confidence}%`,
                height: '100%',
                background:
                  (assessment.confidence <= 1 ? assessment.confidence * 100 : assessment.confidence) >= 85
                    ? C.green
                    : (assessment.confidence <= 1 ? assessment.confidence * 100 : assessment.confidence) >= 70
                      ? C.amber
                      : C.red,
                borderRadius: 2,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <span style={{ fontSize: 7, color: C.dimText }}>
            {Math.round(assessment.confidence <= 1 ? assessment.confidence * 100 : assessment.confidence)}%
          </span>
        </div>

        {/* DAG hash link */}
        <span
          style={{
            fontSize: 7,
            color: '#aa66ff',
            cursor: 'pointer',
            textDecoration: 'none',
            fontFamily: 'monospace',
          }}
          title={`Provenance: ${assessment.dagHash}`}
          onClick={(e) => {
            e.stopPropagation();
            // DAG hash click could open a provenance viewer in future
          }}
        >
          {assessment.dagHash}
        </span>
      </div>
    </div>
  );
}

// ─── News Item Row ───────────────────────────────────────
// Renders a single news feed entry with type badge,
// trust score indicator, source name, and text content.

function NewsRow({ item }: { item: NewsItem }) {
  const typeColor = newsTypeColor(item.type);
  const tColor = trustColor(item.trust);

  return (
    <div
      style={{
        padding: '6px 10px',
        borderBottom: `1px solid ${C.panelBorder}`,
      }}
    >
      {/* Time + Source Type Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 7, color: C.dimText }}>{item.time}</span>
        {item.type && (
          <span
            style={{
              fontSize: 7,
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
          <span style={{ fontSize: 7, color: tColor }}>{item.trust}</span>
        </span>
      </div>

      {/* Source Name + Text */}
      <div style={{ fontSize: 8, color: C.text, lineHeight: 1.4 }}>
        <span style={{ fontWeight: 700, color: C.brightText }}>{item.source}</span>
        {' -- '}
        {item.text}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export default function IntelPanel({ selectedAssessment, setSelectedAssessment }: IntelPanelProps) {
  const [activeTab, setActiveTab] = useState<'assessments' | 'news'>('assessments');

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
            {tab === 'assessments' ? 'ASSESSMENTS' : 'NEWS'}
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
                fontSize: 7,
                color: C.dimText,
                borderBottom: `1px solid ${C.panelBorder}`,
                letterSpacing: 1,
              }}
            >
              AI-FUSED MULTI-SOURCE ASSESSMENTS ({ASSESSMENTS.length})
            </div>

            {/* Assessment Cards */}
            {ASSESSMENTS.map((assessment) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                isSelected={selectedAssessment?.id === assessment.id}
                onSelect={() => setSelectedAssessment(assessment)}
              />
            ))}
          </>
        ) : (
          <>
            {/* Section Header */}
            <div
              style={{
                padding: '6px 10px',
                fontSize: 7,
                color: C.dimText,
                borderBottom: `1px solid ${C.panelBorder}`,
                letterSpacing: 1,
              }}
            >
              MULTI-SOURCE INTELLIGENCE FEED ({NEWS_FEED.length})
            </div>

            {/* News Items */}
            {NEWS_FEED.map((item, idx) => (
              <NewsRow key={`${item.time}-${idx}`} item={item} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
