'use client';

// ═══════════════════════════════════════════════════════════
// FORGE — Synthesis Panel
// Renders the Master Synthesizer's converged assessment at
// the bottom of the forge view. Pure UI — no backend logic.
// ═══════════════════════════════════════════════════════════

import type { ForgeCompleteEvent } from './types';
import ForgeReceipt from './ForgeReceipt';

interface SynthesisPanelProps {
  assessment: string | null;
  modelWeights: Record<string, number>;
  parsedJson: Record<string, any> | null;
  receipt: string | null;
  complete: ForgeCompleteEvent | null;
  phase: string;
}

export default function SynthesisPanel({
  assessment,
  modelWeights,
  parsedJson,
  receipt,
  complete,
  phase,
}: SynthesisPanelProps) {
  const isSynthesizing = phase === 'synthesizing';
  const isComplete = phase === 'complete';

  if (phase === 'idle' || phase === 'started') return null;

  return (
    <div
      style={{
        borderTop: '2px solid rgba(255,170,0,0.3)',
        background: 'rgba(8,16,28,0.95)',
        padding: '12px 16px',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isComplete ? '#00ff88' : '#ffaa00',
              boxShadow: `0 0 8px ${isComplete ? '#00ff88' : '#ffaa00'}`,
              animation: isSynthesizing ? 'pulse 1s infinite' : 'none',
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#ffaa00',
              fontFamily: 'monospace',
              letterSpacing: 1.5,
            }}
          >
            {isComplete ? 'SYNTHESIS COMPLETE' : 'SYNTHESIZING...'}
          </span>
        </div>

        {complete && (
          <span style={{ fontSize: 8, color: '#4a7a9a', fontFamily: 'monospace' }}>
            {complete.total_receipts} receipts | {(complete.elapsed_ms / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Convergence lines from models */}
      {phase === 'analyzing' && (
        <div
          style={{
            textAlign: 'center',
            color: '#4a7a9a',
            fontSize: 9,
            fontFamily: 'monospace',
            padding: '8px 0',
          }}
        >
          Waiting for model analyses to complete...
        </div>
      )}

      {/* Model weights */}
      {Object.keys(modelWeights).length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          {Object.entries(modelWeights).map(([model, weight]) => (
            <div
              key={model}
              style={{
                fontSize: 8,
                fontFamily: 'monospace',
                padding: '2px 6px',
                borderRadius: 3,
                border: `1px solid ${weight >= 0.6 ? '#00ff8840' : weight >= 0.3 ? '#ffaa0040' : '#ff334440'}`,
                background: `${weight >= 0.6 ? '#00ff88' : weight >= 0.3 ? '#ffaa00' : '#ff3344'}10`,
                color: weight >= 0.6 ? '#00ff88' : weight >= 0.3 ? '#ffaa00' : '#ff3344',
              }}
            >
              {model}: {(weight * 100).toFixed(0)}%
            </div>
          ))}
        </div>
      )}

      {/* Assessment text */}
      {assessment && (
        <div
          style={{
            fontSize: 11,
            fontFamily: 'monospace',
            color: '#d0e8ff',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            padding: '8px 0',
            borderTop: '1px solid rgba(255,170,0,0.1)',
          }}
        >
          {assessment}
        </div>
      )}

      {/* Consensus / Divergence points */}
      {parsedJson && (
        <div style={{ marginTop: 8 }}>
          {parsedJson.consensus_points?.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 8, color: '#00ff88', fontFamily: 'monospace', fontWeight: 700 }}>
                CONSENSUS:
              </span>
              {parsedJson.consensus_points.map((p: string, i: number) => (
                <div key={i} style={{ fontSize: 9, color: '#a0c4e0', fontFamily: 'monospace', paddingLeft: 8, lineHeight: 1.4 }}>
                  {p}
                </div>
              ))}
            </div>
          )}
          {parsedJson.divergence_points?.length > 0 && (
            <div>
              <span style={{ fontSize: 8, color: '#ff3344', fontFamily: 'monospace', fontWeight: 700 }}>
                DIVERGENCE:
              </span>
              {parsedJson.divergence_points.map((p: string, i: number) => (
                <div key={i} style={{ fontSize: 9, color: '#a0c4e0', fontFamily: 'monospace', paddingLeft: 8, lineHeight: 1.4 }}>
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Receipts */}
      {isComplete && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 6,
            borderTop: '1px solid rgba(255,170,0,0.1)',
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <ForgeReceipt hash={receipt} label="synthesis" size="md" />
          {complete?.counterfactual_receipts?.map((h) => (
            <ForgeReceipt key={h} hash={h} label="counterfactual" />
          ))}
        </div>
      )}
    </div>
  );
}
