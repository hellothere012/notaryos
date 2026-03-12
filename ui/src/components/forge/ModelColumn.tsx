'use client';

// ═══════════════════════════════════════════════════════════
// FORGE — Model Column
// Displays a single model's analysis result with reasoning
// tree and receipt badges. Pure rendering — no backend logic.
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import type { ModelResult } from './types';
import ForgeReceipt from './ForgeReceipt';
import ReasoningNodeComponent from './ReasoningNode';

const MODEL_COLORS: Record<string, string> = {
  deepseek: '#00aaff',
  gemini: '#4488ff',
  sonnet: '#cc66ff',
  kimi: '#00ccaa',
  chatgpt: '#10a37f',
  grok: '#ff6600',
};

interface ModelColumnProps {
  result: ModelResult;
  weight?: number;
}

export default function ModelColumn({ result, weight }: ModelColumnProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const color = MODEL_COLORS[result.modelKey] || '#00d4ff';
  const isComplete = result.status === 'complete';
  const isError = result.status === 'error';
  const isPending = result.status === 'pending';

  // Auto-scroll content area as streaming text arrives
  useEffect(() => {
    if (contentRef.current && result.content) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [result.content]);

  return (
    <div
      className="forge-model-col"
      style={{
        flex: '1 1 280px',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 6,
        border: `1px solid ${color}25`,
        background: 'rgba(8,16,28,0.8)',
        overflow: 'hidden',
        maxHeight: 500,
      }}
    >
      {/* Model header */}
      <div
        style={{
          padding: '8px 10px',
          borderBottom: `1px solid ${color}25`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Status dot */}
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isPending ? '#4a7a9a' : isError ? '#ff3344' : isComplete ? '#00ff88' : color,
              boxShadow: isPending ? 'none' : `0 0 6px ${isError ? '#ff3344' : isComplete ? '#00ff88' : color}`,
              animation: !isPending && !isComplete && !isError ? 'pulse 1.5s infinite' : 'none',
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color,
              fontFamily: 'monospace',
              letterSpacing: 1,
            }}
          >
            {result.displayName}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {weight !== undefined && (
            <span
              style={{
                fontSize: 8,
                fontFamily: 'monospace',
                color: weight >= 0.6 ? '#00ff88' : weight >= 0.3 ? '#ffaa00' : '#ff3344',
                background: 'rgba(255,255,255,0.05)',
                padding: '1px 4px',
                borderRadius: 2,
              }}
            >
              {(weight * 100).toFixed(0)}%
            </span>
          )}
          {result.elapsedMs > 0 && (
            <span style={{ fontSize: 8, color: '#4a7a9a', fontFamily: 'monospace' }}>
              {(result.elapsedMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {/* Content area */}
      <div
        ref={contentRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 10px',
          fontSize: 9,
          fontFamily: 'monospace',
          color: '#a0c4e0',
          lineHeight: 1.5,
          scrollBehavior: 'smooth',
        }}
      >
        {isPending && (
          <div style={{ color: '#4a7a9a', textAlign: 'center', padding: 20 }}>
            Waiting for response...
          </div>
        )}

        {isError && (
          <div style={{ color: '#ff3344', textAlign: 'center', padding: 20 }}>
            Error: {result.error}
          </div>
        )}

        {result.reasoningTree?.root ? (
          <ReasoningNodeComponent node={result.reasoningTree.root} />
        ) : result.content ? (
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {result.content}
          </div>
        ) : null}
      </div>

      {/* Receipt footer */}
      {(result.receipt || result.reasoningReceipt) && (
        <div
          style={{
            padding: '4px 10px',
            borderTop: `1px solid ${color}15`,
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <ForgeReceipt hash={result.receipt} label="analysis" />
          <ForgeReceipt hash={result.reasoningReceipt} label="reasoning" />
        </div>
      )}
    </div>
  );
}
