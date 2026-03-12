'use client';

// ═══════════════════════════════════════════════════════════
// FORGE — Canvas
// Main visualization: prompt at top, model columns in the
// middle, synthesis panel at bottom. Pure UI rendering.
// ═══════════════════════════════════════════════════════════

import type { ForgeState } from './types';
import ModelColumn from './ModelColumn';
import SynthesisPanel from './SynthesisPanel';
import ForgeReceipt from './ForgeReceipt';

interface ForgeCanvasProps {
  state: ForgeState;
}

export default function ForgeCanvas({ state }: ForgeCanvasProps) {
  if (state.phase === 'idle') {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4a7a9a',
          fontFamily: '"SF Mono", "Fira Code", monospace',
          gap: 12,
          padding: 40,
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 700, color: '#00d4ff', letterSpacing: 4 }}>
          REASONING FORGE
        </div>
        <div style={{ fontSize: 12, color: '#4a7a9a', textAlign: 'center', maxWidth: 500, lineHeight: 1.6 }}>
          Compare how multiple AI models reason about the same prompt.
          Every thought is sealed as a cryptographic receipt.
          Pruned branches become verifiable counterfactuals.
        </div>
        <div style={{ fontSize: 10, color: '#2a5a7a', marginTop: 8 }}>
          Select 2-4 models, enter a prompt, and hit FORGE
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', scrollBehavior: 'smooth' }}>
      {/* Prompt receipt bar */}
      {state.promptReceipt && (
        <div
          style={{
            padding: '4px 16px',
            borderBottom: '1px solid rgba(0,212,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 8, color: '#4a7a9a', fontFamily: 'monospace' }}>
            FORGE {state.forgeId}
          </span>
          <ForgeReceipt hash={state.promptReceipt} label="prompt" />
          <span style={{ fontSize: 8, color: '#4a7a9a', fontFamily: 'monospace', marginLeft: 'auto' }}>
            {state.phase === 'analyzing'
              ? `${state.models.filter((m) => m.status === 'complete').length}/${state.models.length} models complete`
              : state.phase === 'synthesizing'
                ? 'Converging...'
                : state.phase === 'complete'
                  ? 'Complete'
                  : state.phase === 'error'
                    ? 'Error'
                    : 'Starting...'}
          </span>
        </div>
      )}

      {/* Convergence lines: from prompt down to model columns */}
      <div
        style={{
          height: 16,
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 1,
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(0,212,255,0.3), rgba(0,212,255,0.1))',
          }}
        />
      </div>

      {/* Model columns — horizontal scroll on mobile */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 8,
          padding: '0 12px',
          overflowX: 'auto',
          minHeight: 300,
        }}
      >
        {state.models.map((model) => (
          <ModelColumn
            key={model.modelKey}
            result={model}
            weight={state.synthesis.modelWeights[model.modelKey]}
          />
        ))}
      </div>

      {/* Convergence lines: from columns down to synthesis */}
      {(state.phase === 'synthesizing' || state.phase === 'complete') && (
        <div
          style={{
            height: 20,
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {state.models
              .filter((m) => m.status === 'complete')
              .map((m, i) => (
                <div
                  key={m.modelKey}
                  style={{
                    width: 1,
                    height: 16,
                    background: `linear-gradient(to bottom, ${
                      i === 0 ? '#ff6600' : i === 1 ? '#4488ff' : i === 2 ? '#cc66ff' : '#00ccaa'
                    }40, #ffaa0040)`,
                  }}
                />
              ))}
          </div>
        </div>
      )}

      {/* Synthesis panel */}
      <SynthesisPanel
        assessment={state.synthesis.assessment}
        modelWeights={state.synthesis.modelWeights}
        parsedJson={state.synthesis.parsedJson}
        receipt={state.synthesis.receipt}
        complete={state.complete}
        phase={state.phase}
      />

      {/* Error display */}
      {state.error && (
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(255,51,68,0.1)',
            borderTop: '1px solid rgba(255,51,68,0.3)',
            fontSize: 10,
            fontFamily: 'monospace',
            color: '#ff3344',
            flexShrink: 0,
          }}
        >
          {state.error}
        </div>
      )}

      {/* CSS animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
