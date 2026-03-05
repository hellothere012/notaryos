'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON V2 — CorrelationTree
// Assessment provenance tree modal showing the debate chain:
// Source Observations → RED Team → BLUE Team → SYNTHESIS →
// Sealed Assessment with NotaryOS receipt.
// ═══════════════════════════════════════════════════════════

import { C } from '../panopticon/constants';
import type { Assessment } from '../panopticon/types';
import ReceiptSeal from './ReceiptSeal';

// ─── Props ─────────────────────────────────────────────────

interface CorrelationTreeProps {
  assessment: Assessment;
  onClose: () => void;
}

// ─── Tree Node Config ──────────────────────────────────────

interface TreeNode {
  label: string;
  role: string;
  color: string;
  borderColor: string;
  description: string;
}

const DEBATE_CHAIN: TreeNode[] = [
  {
    label: 'SOURCE OBSERVATIONS',
    role: 'RAW DATA',
    color: C.dimText,
    borderColor: 'rgba(255,255,255,0.15)',
    description: 'OSINT feeds from SKYWATCH, NEPTUNE, GAZETTE, HERALD, WIRE agents',
  },
  {
    label: 'RED TEAM ANALYSIS',
    role: 'ADVERSARIAL',
    color: C.red,
    borderColor: 'rgba(255,51,68,0.4)',
    description: 'Identifies threats, worst-case scenarios, and overlooked risks',
  },
  {
    label: 'BLUE TEAM REVIEW',
    role: 'DEFENSIVE',
    color: '#4488cc',
    borderColor: 'rgba(68,136,204,0.4)',
    description: 'Challenges assumptions, finds counter-evidence, validates sources',
  },
  {
    label: 'SYNTHESIS',
    role: 'CONSENSUS',
    color: C.green,
    borderColor: 'rgba(0,255,136,0.4)',
    description: 'Reconciles RED and BLUE perspectives into a balanced assessment',
  },
];

// ─── Component ─────────────────────────────────────────────

export default function CorrelationTree({ assessment, onClose }: CorrelationTreeProps) {
  const levelColor =
    assessment.level === 'CRITICAL' ? C.red
    : assessment.level === 'HIGH' ? C.amber
    : assessment.level === 'ELEVATED' ? '#ffcc44'
    : C.green;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: '90vw',
          maxHeight: '85vh',
          background: 'rgba(8,16,28,0.98)',
          border: `1px solid ${C.panelBorder}`,
          borderRadius: 8,
          padding: '20px 24px',
          fontFamily: '"SF Mono", "Fira Code", monospace',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: C.dimText, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
              CORRELATION GENEALOGY
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.brightText, lineHeight: 1.3 }}>
              {assessment.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: C.dimText,
              fontSize: 18,
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Level + Confidence row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            color: '#000',
            background: levelColor,
            padding: '2px 6px',
            borderRadius: 2,
          }}>
            {assessment.level}
          </span>
          <span style={{ fontSize: 9, color: C.dimText }}>
            CONFIDENCE: <span style={{ color: assessment.confidence >= 80 ? C.green : C.amber }}>{assessment.confidence}%</span>
          </span>
          {assessment.dagHash && (
            <span style={{ marginLeft: 'auto' }}>
              <ReceiptSeal hash={assessment.dagHash} size={18} />
            </span>
          )}
        </div>

        {/* SVG Vertical Tree */}
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          {/* Vertical connector line */}
          <div
            style={{
              position: 'absolute',
              left: 10,
              top: 0,
              bottom: 0,
              width: 2,
              background: 'rgba(0,180,255,0.12)',
            }}
          />

          {DEBATE_CHAIN.map((node, i) => (
            <div key={node.label} style={{ position: 'relative', marginBottom: i < DEBATE_CHAIN.length - 1 ? 12 : 0 }}>
              {/* Node dot */}
              <div
                style={{
                  position: 'absolute',
                  left: -15,
                  top: 8,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: C.bg,
                  border: `2px solid ${node.color}`,
                  zIndex: 1,
                }}
              />

              {/* Node card */}
              <div
                style={{
                  border: `1px solid ${node.borderColor}`,
                  borderLeft: `3px solid ${node.color}`,
                  borderRadius: 4,
                  padding: '8px 10px',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: node.color }}>
                    {node.label}
                  </span>
                  <span style={{
                    fontSize: 7,
                    color: node.color,
                    background: `${node.color}15`,
                    padding: '1px 4px',
                    borderRadius: 2,
                    letterSpacing: 0.5,
                  }}>
                    {node.role}
                  </span>
                </div>
                <div style={{ fontSize: 9, color: C.dimText, lineHeight: 1.4 }}>
                  {node.description}
                </div>

                {/* Source observations show the actual sources */}
                {i === 0 && assessment.sources.length > 0 && (
                  <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {assessment.sources.map((src) => (
                      <span
                        key={src}
                        style={{
                          fontSize: 8,
                          color: C.text,
                          background: 'rgba(255,255,255,0.06)',
                          padding: '1px 4px',
                          borderRadius: 2,
                        }}
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Final sealed assessment node */}
          <div style={{ position: 'relative', marginTop: 12 }}>
            {/* Node dot — gold for sealed */}
            <div
              style={{
                position: 'absolute',
                left: -15,
                top: 8,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#d4a82b',
                border: '2px solid #d4a82b',
                boxShadow: '0 0 8px rgba(212, 168, 43, 0.4)',
                zIndex: 1,
              }}
            />

            <div
              style={{
                border: '1px solid rgba(212, 168, 43, 0.3)',
                borderLeft: '3px solid #d4a82b',
                borderRadius: 4,
                padding: '8px 10px',
                background: 'rgba(212, 168, 43, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#d4a82b' }}>
                  SEALED ASSESSMENT
                </span>
                <span style={{
                  fontSize: 7,
                  color: '#d4a82b',
                  background: 'rgba(212, 168, 43, 0.1)',
                  padding: '1px 4px',
                  borderRadius: 2,
                  letterSpacing: 0.5,
                }}>
                  NOTARYOS
                </span>
              </div>
              <div style={{ fontSize: 9, color: C.text, lineHeight: 1.4, marginBottom: 4 }}>
                {assessment.summary || assessment.title}
              </div>
              {assessment.aiConsensus && (
                <div style={{ fontSize: 9, color: C.dimText, fontStyle: 'italic', marginBottom: 4 }}>
                  AI Consensus: {assessment.aiConsensus}
                </div>
              )}
              {assessment.dagHash && (
                <div style={{ fontSize: 8, color: C.dimText, fontFamily: 'monospace' }}>
                  RECEIPT: <span style={{ color: '#d4a82b' }}>{assessment.dagHash.slice(0, 16)}...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.panelBorder}`, fontSize: 8, color: C.dimText, textAlign: 'center' }}>
          Provenance chain verified by NotaryOS Ed25519 cryptographic receipts
        </div>
      </div>
    </div>
  );
}
