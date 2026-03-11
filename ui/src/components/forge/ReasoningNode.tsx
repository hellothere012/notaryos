'use client';

// ═══════════════════════════════════════════════════════════
// FORGE — Reasoning Node
// Renders a single node in the reasoning tree with visual
// state (branch/selected/pruned/conclusion/observation).
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import type { ReasoningNodeData } from './types';

const NODE_STYLES: Record<string, { border: string; label: string; icon: string; opacity: number }> = {
  root:        { border: '#4a7a9a', label: 'ROOT',        icon: '',  opacity: 1 },
  branch:      { border: '#00d4ff', label: 'BRANCH',      icon: '',  opacity: 1 },
  selected:    { border: '#00ff88', label: 'SELECTED',    icon: '',  opacity: 1 },
  pruned:      { border: '#ff3344', label: 'PRUNED',      icon: '',  opacity: 0.5 },
  conclusion:  { border: '#ffaa00', label: 'CONCLUSION',  icon: '',  opacity: 1 },
  observation: { border: '#4a7a9a', label: 'OBSERVATION', icon: '',  opacity: 0.85 },
};

interface ReasoningNodeProps {
  node: ReasoningNodeData;
  depth?: number;
}

export default function ReasoningNodeComponent({ node, depth = 0 }: ReasoningNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const style = NODE_STYLES[node.node_type] || NODE_STYLES.observation;

  const preview = node.content.length > 120 ? node.content.slice(0, 120) + '...' : node.content;

  return (
    <div style={{ marginLeft: depth > 0 ? 12 : 0, marginTop: 4 }}>
      {/* Connecting line */}
      {depth > 0 && (
        <div
          style={{
            width: 1,
            height: 8,
            background: `${style.border}40`,
            marginLeft: 8,
          }}
        />
      )}

      {/* Node card */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          border: `1px solid ${style.border}40`,
          borderLeft: `3px solid ${style.border}`,
          borderRadius: 4,
          padding: '4px 8px',
          cursor: 'pointer',
          opacity: style.opacity,
          background: expanded ? `${style.border}08` : 'transparent',
          transition: 'all 0.15s',
          textDecoration: node.node_type === 'pruned' ? 'line-through' : 'none',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 7,
              fontWeight: 700,
              color: style.border,
              letterSpacing: 0.8,
              fontFamily: 'monospace',
            }}
          >
            {style.icon} {style.label}
          </span>
          {node.confidence > 0 && (
            <span style={{ fontSize: 7, color: '#4a7a9a', fontFamily: 'monospace' }}>
              {(node.confidence * 100).toFixed(0)}%
            </span>
          )}
          {node.children.length > 0 && (
            <span style={{ fontSize: 7, color: '#4a7a9a', marginLeft: 'auto' }}>
              {expanded ? '\u25BC' : '\u25B6'} {node.children.length}
            </span>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            fontSize: 9,
            color: node.node_type === 'pruned' ? '#4a7a9a' : '#a0c4e0',
            fontFamily: 'monospace',
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {expanded ? node.content : preview}
        </div>
      </div>

      {/* Children */}
      {expanded &&
        node.children.map((child) => (
          <ReasoningNodeComponent key={child.node_id} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}
