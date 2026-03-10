'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON V2 — Receipt Explosion Arcs
// Animated SVG overlay showing assessment provenance chain.
// Arcs "explode" outward from center to debate nodes.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { C } from '../panopticon/constants';
import type { Assessment, ReasoningNodeInfo } from '../panopticon/types';
import ReceiptSeal from './ReceiptSeal';

interface ReceiptExplosionProps {
  assessment: Assessment;
  onClose: () => void;
}

// ─── Node Layout ─────────────────────────────────────────

interface ExplosionNode {
  label: string;
  role: string;
  color: string;
  bg: string;
  x: number; // percentage from center (0-1 range, mapped to SVG coords)
  y: number;
  delay: number; // animation delay in ms
}

const NODES: ExplosionNode[] = [
  { label: 'SOURCE\nOBSERVATIONS', role: 'RAW DATA',     color: '#6b7d8e', bg: 'rgba(107,125,142,0.08)', x: 0.5,  y: 0.08, delay: 200 },
  { label: 'RED TEAM\nANALYSIS',   role: 'ADVERSARIAL',  color: '#ff3344', bg: 'rgba(255,51,68,0.08)',   x: 0.15, y: 0.38, delay: 350 },
  { label: 'BLUE TEAM\nREVIEW',    role: 'DEFENSIVE',    color: '#4488cc', bg: 'rgba(68,136,204,0.08)',  x: 0.85, y: 0.38, delay: 500 },
  { label: 'SYNTHESIS',            role: 'CONSENSUS',    color: '#00ff88', bg: 'rgba(0,255,136,0.08)',   x: 0.5,  y: 0.62, delay: 650 },
];

const SEALED_NODE = { x: 0.5, y: 0.82, delay: 800, color: '#d4a82b' };
const CENTER = { x: 0.5, y: 0.45 };

// ─── Arc Path Generator ─────────────────────────────────

function arcPath(x1: number, y1: number, x2: number, y2: number, w: number, h: number): string {
  const sx = x1 * w, sy = y1 * h;
  const ex = x2 * w, ey = y2 * h;
  // Cubic bezier with outward curve
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const dx = ex - sx;
  const dy = ey - sy;
  // Perpendicular offset for curve
  const offset = Math.sqrt(dx * dx + dy * dy) * 0.2;
  const cx1 = mx - dy * 0.3;
  const cy1 = my + dx * 0.3;
  return `M ${sx} ${sy} Q ${cx1} ${cy1} ${ex} ${ey}`;
}

// ─── Keyframes ──────────────────────────────────────────

const explosionKeyframes = `
@keyframes explosion-pulse {
  0% { r: 4; opacity: 1; }
  50% { r: 12; opacity: 0.6; }
  100% { r: 4; opacity: 1; }
}
@keyframes explosion-node-in {
  from { opacity: 0; transform: scale(0.7); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes explosion-arc-draw {
  from { stroke-dashoffset: 500; }
  to { stroke-dashoffset: 0; }
}
@keyframes explosion-glow {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(212,168,43,0.6)); }
  50% { filter: drop-shadow(0 0 16px rgba(212,168,43,0.9)); }
}
`;

// ─── Component ──────────────────────────────────────────

export default function ReceiptExplosion({ assessment, onClose }: ReceiptExplosionProps) {
  const [phase, setPhase] = useState(0); // 0=entering, 1=visible
  const levelColor =
    assessment.level === 'CRITICAL' ? C.red
    : assessment.level === 'HIGH' ? C.amber
    : assessment.level === 'ELEVATED' ? '#ffcc44'
    : C.green;

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 50);
    return () => clearTimeout(t);
  }, []);

  // SVG viewbox dimensions
  const W = 700;
  const H = 520;

  // Arcs: center → each node, then synthesis → sealed
  const arcs = [
    { from: CENTER, to: NODES[0], color: NODES[0].color, delay: NODES[0].delay },
    { from: NODES[0], to: NODES[1], color: NODES[1].color, delay: NODES[1].delay },
    { from: NODES[0], to: NODES[2], color: NODES[2].color, delay: NODES[2].delay },
    { from: NODES[1], to: NODES[3], color: NODES[3].color, delay: NODES[3].delay },
    { from: NODES[2], to: NODES[3], color: NODES[3].color, delay: NODES[3].delay },
    { from: NODES[3], to: SEALED_NODE, color: SEALED_NODE.color, delay: SEALED_NODE.delay },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `rgba(0,0,0,${phase === 1 ? 0.82 : 0})`,
        backdropFilter: phase === 1 ? 'blur(4px)' : 'none',
        transition: 'background 0.4s, backdrop-filter 0.4s',
        cursor: 'pointer',
      }}
    >
      <style>{explosionKeyframes}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90vw',
          maxWidth: 720,
          opacity: phase === 1 ? 1 : 0,
          transform: phase === 1 ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 0.3s, transform 0.3s',
          fontFamily: '"SF Mono", "Fira Code", monospace',
          cursor: 'default',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.dimText, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
            RECEIPT PROVENANCE
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.brightText, marginBottom: 6 }}>
            {assessment.title}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: '#000',
              background: levelColor, padding: '2px 6px', borderRadius: 2,
            }}>
              {assessment.level}
            </span>
            <span style={{ fontSize: 9, color: C.dimText }}>
              CONFIDENCE: <span style={{ color: assessment.confidence >= 80 ? C.green : C.amber }}>{assessment.confidence}%</span>
            </span>
          </div>
        </div>

        {/* SVG Explosion */}
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
          {/* Arcs */}
          {arcs.map((arc, i) => (
            <path
              key={i}
              d={arcPath(arc.from.x, arc.from.y, arc.to.x, arc.to.y, W, H)}
              fill="none"
              stroke={arc.color}
              strokeWidth={1.5}
              strokeDasharray={500}
              strokeDashoffset={0}
              opacity={0.5}
              style={{
                animation: `explosion-arc-draw 0.5s ease-out ${arc.delay}ms both`,
              }}
            />
          ))}

          {/* Center pulse */}
          <circle
            cx={CENTER.x * W}
            cy={CENTER.y * H}
            r={6}
            fill="#d4a82b"
            opacity={0.8}
            style={{ animation: 'explosion-pulse 2s ease-in-out infinite' }}
          />

          {/* Debate nodes */}
          {NODES.map((node, i) => (
            <g
              key={node.label}
              style={{
                animation: `explosion-node-in 0.4s ease-out ${node.delay}ms both`,
                transformOrigin: `${node.x * W}px ${node.y * H}px`,
              }}
            >
              <rect
                x={node.x * W - 72}
                y={node.y * H - 22}
                width={144}
                height={44}
                rx={4}
                fill={node.bg}
                stroke={node.color}
                strokeWidth={1}
              />
              <text
                x={node.x * W}
                y={node.y * H - 6}
                textAnchor="middle"
                fill={node.color}
                fontSize={9}
                fontWeight={700}
                fontFamily="monospace"
              >
                {node.label.split('\n').map((line, j) => (
                  <tspan key={j} x={node.x * W} dy={j === 0 ? 0 : 12}>{line}</tspan>
                ))}
              </text>
              <text
                x={node.x * W}
                y={node.y * H + 14}
                textAnchor="middle"
                fill={node.color}
                fontSize={7}
                fontFamily="monospace"
                opacity={0.6}
              >
                {node.role}
              </text>

              {/* Source badges on first node */}
              {i === 0 && assessment.sources.length > 0 && (
                <>
                  {assessment.sources.slice(0, 4).map((src, si) => (
                    <text
                      key={src}
                      x={node.x * W - 60 + si * 38}
                      y={node.y * H + 30}
                      fill={C.dimText}
                      fontSize={6}
                      fontFamily="monospace"
                    >
                      {src.slice(0, 6)}
                    </text>
                  ))}
                </>
              )}
            </g>
          ))}

          {/* Sealed receipt node */}
          <g
            style={{
              animation: `explosion-node-in 0.4s ease-out ${SEALED_NODE.delay}ms both, explosion-glow 2s ease-in-out ${SEALED_NODE.delay + 400}ms infinite`,
              transformOrigin: `${SEALED_NODE.x * W}px ${SEALED_NODE.y * H}px`,
            }}
          >
            <rect
              x={SEALED_NODE.x * W - 80}
              y={SEALED_NODE.y * H - 24}
              width={160}
              height={48}
              rx={4}
              fill="rgba(212,168,43,0.06)"
              stroke="#d4a82b"
              strokeWidth={1.5}
            />
            <text
              x={SEALED_NODE.x * W}
              y={SEALED_NODE.y * H - 6}
              textAnchor="middle"
              fill="#d4a82b"
              fontSize={10}
              fontWeight={700}
              fontFamily="monospace"
            >
              SEALED ASSESSMENT
            </text>
            <text
              x={SEALED_NODE.x * W}
              y={SEALED_NODE.y * H + 10}
              textAnchor="middle"
              fill="#d4a82b"
              fontSize={7}
              fontFamily="monospace"
              opacity={0.7}
            >
              {assessment.dagHash ? `${assessment.dagHash.slice(0, 12)}...` : 'NOTARYOS'}
            </text>
          </g>
        </svg>

        {/* Footer with receipt seal */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 8 }}>
          {assessment.dagHash && (
            <span onClick={(e) => e.stopPropagation()}>
              <ReceiptSeal hash={assessment.dagHash} size={22} />
            </span>
          )}
          <span style={{ fontSize: 8, color: C.dimText, letterSpacing: 1 }}>
            Provenance verified by NotaryOS Ed25519 receipts
          </span>
        </div>

        {/* AI Consensus (if present) */}
        {assessment.aiConsensus && (
          <div style={{
            marginTop: 10, padding: '8px 12px',
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${C.panelBorder}`,
            borderRadius: 4,
            fontSize: 9, color: C.dimText, fontStyle: 'italic', lineHeight: 1.5,
            textAlign: 'center',
          }}>
            AI Consensus: {assessment.aiConsensus}
          </div>
        )}

        {/* Reasoning Tree (if available from fusion debate) */}
        {assessment.reasoningTree && assessment.reasoningTree.nodes && assessment.reasoningTree.nodes.length > 0 && (
          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${C.panelBorder}`,
            borderRadius: 4,
            maxHeight: 220,
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 9, color: C.dimText, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                REASONING ANALYSIS ({assessment.reasoningTree.nodeCount} nodes)
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {Object.entries(assessment.reasoningTree.nodeTypes)
                  .filter(([, count]) => count > 0)
                  .map(([type, count]) => {
                    const tc: Record<string, string> = {
                      root: '#6b7d8e', branch: '#00b4ff', selected: '#00ff88',
                      pruned: '#ff3344', conclusion: '#d4a82b', observation: '#c8d0d8',
                    };
                    return (
                      <span key={type} style={{
                        fontSize: 7, color: tc[type] || '#6b7d8e',
                        background: `${tc[type] || '#6b7d8e'}15`,
                        padding: '1px 4px', borderRadius: 2,
                      }}>
                        {type.toUpperCase()}: {count}
                      </span>
                    );
                  })}
              </div>
            </div>

            {assessment.reasoningTree.nodes.map((node: ReasoningNodeInfo, i: number) => {
              const nc: Record<string, string> = {
                root: '#6b7d8e', branch: '#00b4ff', selected: '#00ff88',
                pruned: '#ff3344', conclusion: '#d4a82b', observation: '#c8d0d8',
              };
              const icons: Record<string, string> = {
                root: '\u25CE', branch: '\u25CB', selected: '\u25C9',
                pruned: '\u2715', conclusion: '\u25C6', observation: '\u25CB',
              };
              const color = nc[node.node_type] || '#6b7d8e';
              return (
                <div key={node.node_id} style={{
                  display: 'flex', gap: 6, marginBottom: i < (assessment.reasoningTree?.nodes?.length || 0) - 1 ? 4 : 0,
                  borderLeft: `2px solid ${color}40`,
                  paddingLeft: 8,
                }}>
                  <span style={{ fontSize: 8, color, flexShrink: 0, marginTop: 1 }}>
                    {icons[node.node_type] || '\u25CB'}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 7, fontWeight: 700, color, textTransform: 'uppercase' }}>
                        {node.node_type}
                      </span>
                      {node.confidence > 0 && (
                        <span style={{ fontSize: 7, color: C.dimText }}>
                          {Math.round(node.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 8, color: C.dimText, lineHeight: 1.3 }}>
                      {node.content.length > 120 ? node.content.slice(0, 120) + '...' : node.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
