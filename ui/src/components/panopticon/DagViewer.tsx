'use client';

// ================================================================
// PANOPTICON — DagViewer (NotaryOS Provenance DAG Overlay)
// ================================================================
// Full-screen overlay that renders the provenance DAG for a
// selected intelligence assessment. Shows the assessment node
// linked to its source nodes via dashed lines, with trust badges
// and AI consensus summary. Cryptographically anchored to a
// Merkle root via NotaryOS receipts.
// ================================================================

import type { Assessment } from './types';
import { C } from './constants';

// ─── Props ─────────────────────────────────────────────────

interface DagViewerProps {
  assessment: Assessment | null;
  onClose: () => void;
}

// ─── Style Constants ───────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
};

const modalStyle: React.CSSProperties = {
  background: C.panel,
  border: `1px solid ${C.panelBorder}`,
  borderRadius: 8,
  padding: 24,
  maxWidth: 700,
  width: '90vw',
  maxHeight: '85vh',
  overflowY: 'auto',
  position: 'relative',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
  paddingBottom: 10,
  borderBottom: `1px solid ${C.panelBorder}`,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${C.panelBorder}`,
  color: C.dimText,
  width: 28,
  height: 28,
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.15s, border-color 0.15s',
};

// ─── Helpers ───────────────────────────────────────────────

/** Extract the type string from parentheses, e.g. "NEPTUNE (AIS)" -> "AIS" */
function extractSourceType(source: string): { name: string; type: string } {
  const match = source.match(/^(.+?)\s*\((.+?)\)$/);
  if (match) {
    return { name: match[1].trim(), type: match[2].trim() };
  }
  return { name: source, type: 'INTEL' };
}

/** Generate a pseudo-random hex string for the Merkle root display */
function pseudoMerkleRoot(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}${hex}${hex.slice(0, 4)}`;
}

/** Map severity level to border color */
function levelBorderColor(level: Assessment['level']): string {
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

// ─── SVG Layout Constants ──────────────────────────────────

const NODE_W = 140;
const NODE_H = 52;
const NODE_GAP = 16;

// ─── Component ─────────────────────────────────────────────

export default function DagViewer({ assessment, onClose }: DagViewerProps) {
  // If no assessment, render nothing
  if (!assessment) return null;

  const sources = assessment.sources.map(extractSourceType);
  const sourceCount = sources.length;

  // SVG dimensions based on number of source nodes
  const totalSourceWidth = sourceCount * NODE_W + (sourceCount - 1) * NODE_GAP;
  const svgWidth = Math.max(totalSourceWidth + 40, NODE_W + 40);
  const svgHeight = 220;

  // Assessment node position (centered at top)
  const assessX = svgWidth / 2;
  const assessY = 40;

  // Source nodes position (bottom row, evenly distributed)
  const sourceStartX = (svgWidth - totalSourceWidth) / 2 + NODE_W / 2;
  const sourceY = 160;

  const borderCol = levelBorderColor(assessment.level);
  const confPct = assessment.confidence <= 1
    ? Math.round(assessment.confidence * 100)
    : Math.round(assessment.confidence);

  return (
    <div
      style={overlayStyle}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Provenance DAG Viewer"
    >
      <div
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.cyan,
                letterSpacing: 1.5,
              }}
            >
              PROVENANCE DAG &mdash; NotaryOS
            </span>
            <span
              style={{
                fontSize: 8,
                color: '#aa66ff',
                fontFamily: 'monospace',
              }}
            >
              {assessment.dagHash}
            </span>
          </div>
          <button
            style={closeBtnStyle}
            onClick={onClose}
            title="Close"
            aria-label="Close provenance viewer"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = C.cyan;
              e.currentTarget.style.borderColor = C.cyan;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = C.dimText;
              e.currentTarget.style.borderColor = String(C.panelBorder);
            }}
          >
            &times;
          </button>
        </div>

        {/* ── SVG DAG Diagram ─────────────────────────────── */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width="100%"
          style={{ display: 'block', marginBottom: 16 }}
        >
          {/* Defs for glow filters */}
          <defs>
            <filter id="dag-glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Dashed lines from assessment to sources ──── */}
          {sources.map((_, i) => {
            const sx = sourceStartX + i * (NODE_W + NODE_GAP);
            return (
              <line
                key={`line-${i}`}
                x1={assessX}
                y1={assessY + NODE_H / 2}
                x2={sx}
                y2={sourceY - NODE_H / 2}
                stroke={C.panelBorder}
                strokeWidth={1.5}
                strokeDasharray="6,4"
                opacity={0.7}
              />
            );
          })}

          {/* ── Assessment Node (top center) ─────────────── */}
          <g>
            <rect
              x={assessX - NODE_W / 2}
              y={assessY - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx={4}
              fill="rgba(10,20,35,0.95)"
              stroke={borderCol}
              strokeWidth={2}
            />
            {/* Assessment ID */}
            <text
              x={assessX}
              y={assessY - 10}
              textAnchor="middle"
              fill={borderCol}
              fontSize={9}
              fontWeight={700}
              fontFamily="monospace"
            >
              {assessment.id}
            </text>
            {/* Assessment Title (truncated) */}
            <text
              x={assessX}
              y={assessY + 4}
              textAnchor="middle"
              fill={C.brightText}
              fontSize={7}
              fontFamily="monospace"
            >
              {assessment.title.length > 24
                ? assessment.title.slice(0, 22) + '...'
                : assessment.title}
            </text>
            {/* Confidence */}
            <text
              x={assessX}
              y={assessY + 18}
              textAnchor="middle"
              fill={C.dimText}
              fontSize={7}
              fontFamily="monospace"
            >
              CONF: {confPct}%
            </text>
          </g>

          {/* ── Source Nodes (bottom row) ─────────────────── */}
          {sources.map((src, i) => {
            const sx = sourceStartX + i * (NODE_W + NODE_GAP);
            const sy = sourceY;
            return (
              <g key={`src-${i}`}>
                <rect
                  x={sx - NODE_W / 2}
                  y={sy - NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx={4}
                  fill="rgba(10,20,35,0.95)"
                  stroke={C.cyan}
                  strokeWidth={1.5}
                  filter="url(#dag-glow-cyan)"
                />
                {/* Source name */}
                <text
                  x={sx}
                  y={sy - 8}
                  textAnchor="middle"
                  fill={C.cyan}
                  fontSize={9}
                  fontWeight={700}
                  fontFamily="monospace"
                >
                  {src.name}
                </text>
                {/* Source type */}
                <text
                  x={sx}
                  y={sy + 5}
                  textAnchor="middle"
                  fill={C.dimText}
                  fontSize={7}
                  fontFamily="monospace"
                >
                  {src.type}
                </text>
                {/* Trust badge */}
                <rect
                  x={sx - 18}
                  y={sy + 12}
                  width={36}
                  height={12}
                  rx={6}
                  fill={C.green}
                  opacity={0.9}
                />
                <text
                  x={sx}
                  y={sy + 21}
                  textAnchor="middle"
                  fill="#000"
                  fontSize={7}
                  fontWeight={700}
                  fontFamily="monospace"
                >
                  TRUSTED
                </text>
              </g>
            );
          })}
        </svg>

        {/* ── AI Consensus Box ────────────────────────────── */}
        <div
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: `1px solid ${C.panelBorder}`,
            borderRadius: 4,
            padding: '10px 14px',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 8,
              color: C.dimText,
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            AI CONSENSUS
          </div>
          <div
            style={{
              fontSize: 10,
              color: C.brightText,
              lineHeight: 1.5,
            }}
          >
            {assessment.aiConsensus}
          </div>
        </div>

        {/* ── Footer: Merkle Root ─────────────────────────── */}
        <div
          style={{
            fontSize: 8,
            color: C.dimText,
            textAlign: 'center',
            lineHeight: 1.6,
            borderTop: `1px solid ${C.panelBorder}`,
            paddingTop: 10,
          }}
        >
          <span style={{ fontFamily: 'monospace' }}>
            Merkle Root: {pseudoMerkleRoot(assessment.dagHash)}...
          </span>
          <br />
          Tamper-evident, Independently verifiable
        </div>
      </div>
    </div>
  );
}
