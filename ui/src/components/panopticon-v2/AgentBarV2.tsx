'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON V2 — AgentBarV2
// Left-side agent status panel (200px) with enhanced
// "Argument Gravity" credibility visualization: trust-based
// left border thickness, opacity weighting, and horizontal
// fill bars for at-a-glance trust assessment.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import type { LayerVisibility, AgentStatus } from '../panopticon/types';
import { C } from '../panopticon/constants';

// ─── Live Agent Status (from SSE stream) ─────────────────

interface LiveAgentStatus {
  name: string;
  status: 'ACTIVE' | 'OFFLINE' | 'ERROR';
  lastUpdate: number;
  itemCount: number;
}

// ─── Props ───────────────────────────────────────────────

interface AgentBarV2Props {
  layers: LayerVisibility;
  setLayers: (fn: (l: LayerVisibility) => LayerVisibility) => void;
  agentStatuses?: Record<string, LiveAgentStatus>;
}

// ─── Agent Definitions ───────────────────────────────────
// Each agent maps to a specific intelligence collection domain
// and controls visibility of its corresponding map layer.

const AGENTS: AgentStatus[] = [
  {
    id: 'skywatch',
    name: 'SKYWATCH',
    desc: 'ADS-B Flight Tracking',
    status: 'ACTIVE',
    alerts: 12,
    color: C.cyan,
    layer: 'flights',
    trustScore: 94,
    natoReliability: 'A-2',
  },
  {
    id: 'neptune',
    name: 'NEPTUNE',
    desc: 'AIS Maritime Tracking',
    status: 'ACTIVE',
    alerts: 4,
    color: '#4488cc',
    layer: 'vessels',
    trustScore: 91,
    natoReliability: 'B-2',
  },
  {
    id: 'voxpop',
    name: 'VOXPOP',
    desc: 'Social / Telegram / X',
    status: 'MONITORING',
    alerts: 8,
    color: '#cc8844',
    layer: 'social',
    trustScore: 72,
    natoReliability: 'C-3',
  },
  {
    id: 'sentinel',
    name: 'SENTINEL',
    desc: 'Satellite Imagery',
    status: 'PROCESSING',
    alerts: 2,
    color: '#44cc88',
    layer: 'satellite',
    trustScore: 96,
    natoReliability: 'A-1',
  },
  {
    id: 'wire',
    name: 'WIRE',
    desc: 'Live Event Feed',
    status: 'ACTIVE',
    alerts: 0,
    color: '#ff8844',
    layer: 'news',
    trustScore: 85,
    natoReliability: 'B-2',
  },
  {
    id: 'gazette',
    name: 'GAZETTE',
    desc: 'News Wire Services',
    status: 'ACTIVE',
    alerts: 6,
    color: '#8888cc',
    layer: 'news',
    trustScore: 88,
    natoReliability: 'B-2',
  },
  {
    id: 'herald',
    name: 'HERALD',
    desc: 'NOTAMs / Gov / Mil',
    status: 'ACTIVE',
    alerts: 3,
    color: '#cc4488',
    layer: 'official',
    trustScore: 97,
    natoReliability: 'A-1',
  },
];

// ─── Live Agent Metadata Helpers ─────────────────────────
// Derives display values from the real-time stream statuses.

function formatTimeSince(ts: number): string {
  if (!ts) return '--';
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

// ─── Panel Style ─────────────────────────────────────────
// Narrower than V1 (200px vs 220px) to give more room
// for the timeline and globe canvas.

const panelStyle: React.CSSProperties = {
  width: 200,
  minWidth: 200,
  background: C.panel,
  borderRight: `1px solid ${C.panelBorder}`,
  fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  height: '100%',
};

// ─── Status Dot Color ────────────────────────────────────
// Returns the color for an agent's status indicator dot.
// ACTIVE = green, MONITORING = amber, PROCESSING = cyan (pulsing).

function statusDotColor(status: AgentStatus['status']): string {
  switch (status) {
    case 'ACTIVE':
      return C.green;
    case 'MONITORING':
      return C.amber;
    case 'PROCESSING':
      return C.cyan;
    case 'OFFLINE':
      return '#555';
    case 'ERROR':
      return C.red;
    default:
      return C.dimText;
  }
}

// ─── CSS Keyframes ───────────────────────────────────────
// Pulse animation for PROCESSING status dot.

const pulseKeyframes = `
@keyframes panopticon-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
`;

// ─── Credibility Helpers ─────────────────────────────────
// "Argument Gravity" — visual weight derived from trust score.
// Higher trust = thicker border, fuller opacity.

function credibilityBorderWidth(trustScore: number): number {
  if (trustScore >= 90) return 3;
  if (trustScore >= 75) return 2;
  return 1;
}

function credibilityOpacity(trustScore: number): number {
  if (trustScore >= 90) return 1.0;
  if (trustScore >= 75) return 0.9;
  return 0.65;
}

function trustFillColor(trustScore: number): string {
  if (trustScore >= 90) return C.green;
  if (trustScore >= 75) return C.amber;
  return C.red;
}

// ─── Agent Row Component ─────────────────────────────────
// Renders a single agent with credibility visualization:
//   - Colored left border (thickness = trust tier)
//   - Opacity weighting (high trust = solid, low = faded)
//   - Horizontal trust fill bar replacing plain text score
//   - Checkbox, status dot, name, alert badge, NATO code
//   - Expandable detail: last update, item count, status, feed

function AgentRow({
  agent,
  isLayerActive,
  isExpanded,
  onToggleLayer,
  onToggleExpand,
  liveStatus,
}: {
  agent: AgentStatus;
  isLayerActive: boolean;
  isExpanded: boolean;
  onToggleLayer: () => void;
  onToggleExpand: () => void;
  liveStatus?: LiveAgentStatus;
}) {
  // Use live status when available, otherwise fall back to config
  const effectiveStatus = liveStatus?.status ?? agent.status;
  const dotColor = statusDotColor(effectiveStatus);
  const isPulsing = effectiveStatus === 'ACTIVE' && !!liveStatus;

  // Credibility-driven visual weight
  const borderWidth = credibilityBorderWidth(agent.trustScore);
  const rowOpacity = credibilityOpacity(agent.trustScore);
  const fillColor = trustFillColor(agent.trustScore);

  return (
    <div
      style={{
        borderBottom: `1px solid ${C.panelBorder}`,
        borderLeft: `${borderWidth}px solid ${agent.color}`,
        opacity: isLayerActive ? rowOpacity : rowOpacity * 0.4,
        transition: 'background 0.15s, opacity 0.2s',
        background: 'transparent',
      }}
    >
      {/* ── Clickable Row Body ─────────────────────────── */}
      <div
        onClick={onToggleExpand}
        style={{
          padding: '7px 10px',
          cursor: 'pointer',
          transition: 'background 0.15s',
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,180,255,0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {/* Top row: Checkbox + Status dot + Agent name + Alert badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          {/* Layer visibility checkbox — click does NOT toggle expand */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              onToggleLayer();
            }}
            style={{
              width: 11,
              height: 11,
              border: `1px solid ${isLayerActive ? agent.color : C.dimText}`,
              borderRadius: 2,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isLayerActive ? `${agent.color}22` : 'transparent',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            {isLayerActive && (
              <span
                style={{
                  width: 5,
                  height: 5,
                  background: agent.color,
                  borderRadius: 1,
                  display: 'block',
                }}
              />
            )}
          </span>

          {/* Status dot */}
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: dotColor,
              display: 'inline-block',
              boxShadow: `0 0 6px ${dotColor}`,
              flexShrink: 0,
              animation: isPulsing ? 'panopticon-pulse 1.5s ease-in-out infinite' : 'none',
            }}
          />

          {/* Agent name */}
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: agent.color,
              fontFamily: 'monospace',
              letterSpacing: 0.5,
            }}
          >
            {agent.name}
          </span>

          {/* Expand/collapse chevron indicator */}
          <span
            style={{
              fontSize: 8,
              color: C.dimText,
              marginLeft: 2,
              transition: 'transform 0.2s',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              display: 'inline-block',
            }}
          >
            {'\u25B6'}
          </span>

          {/* Alert count badge */}
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#000',
              background: agent.alerts > 5 ? C.red : C.amber,
              padding: '1px 4px',
              borderRadius: 2,
              marginLeft: 'auto',
              minWidth: 16,
              textAlign: 'center',
            }}
          >
            {agent.alerts}
          </span>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 10,
            color: C.dimText,
            marginLeft: 23,
            marginBottom: 2,
          }}
        >
          {agent.desc}
        </div>

        {/* Trust score fill bar + NATO reliability code */}
        <div
          style={{
            marginLeft: 23,
            marginTop: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {/* Horizontal fill bar — width proportional to trust % */}
          <div
            style={{
              width: 60,
              height: 4,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${agent.trustScore}%`,
                height: '100%',
                background: fillColor,
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Numeric trust percentage */}
          <span
            style={{
              fontSize: 9,
              color: fillColor,
              fontFamily: 'monospace',
            }}
          >
            {agent.trustScore}%
          </span>

          {/* NATO reliability code */}
          <span
            style={{
              fontSize: 9,
              color: C.dimText,
              fontFamily: 'monospace',
              marginLeft: 'auto',
            }}
          >
            <span style={{ color: C.text }}>{agent.natoReliability}</span>
          </span>
        </div>
      </div>

      {/* ── Expandable Detail Section ─────────────────── */}
      {/* Uses max-height transition for smooth open/close.  */}
      {/* Content is always in DOM to allow CSS transition.  */}
      <div
        style={{
          maxHeight: isExpanded ? 100 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.25s ease-in-out',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div
          style={{
            borderTop: `1px solid ${C.panelBorder}`,
            padding: '6px 10px 8px 10px',
            marginLeft: 0,
          }}
        >
          {/* 2-column stat grid — live data from SSE stream */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '3px 8px',
              fontSize: 9,
              fontFamily: 'monospace',
              color: C.dimText,
            }}
          >
            {/* Last Update (live timestamp) */}
            <div>
              <span style={{ color: C.dimText }}>UPD: </span>
              <span style={{ color: C.text }}>
                {liveStatus ? formatTimeSince(liveStatus.lastUpdate) : '--'}
              </span>
            </div>

            {/* Items collected in last batch */}
            <div>
              <span style={{ color: C.dimText }}>ITEMS: </span>
              <span style={{ color: C.text }}>
                {liveStatus ? liveStatus.itemCount : '--'}
              </span>
            </div>

            {/* Connection status */}
            <div>
              <span style={{ color: C.dimText }}>STAT: </span>
              <span style={{ color: dotColor }}>{effectiveStatus}</span>
            </div>

            {/* Stream indicator */}
            <div>
              <span style={{ color: C.dimText }}>FEED: </span>
              <span style={{ color: liveStatus ? C.green : C.dimText }}>
                {liveStatus ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export default function AgentBarV2({ layers, setLayers, agentStatuses = {} }: AgentBarV2Props) {
  // Set of agent IDs whose detail rows are currently expanded
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Toggle a specific layer by its key name in LayerVisibility
  const toggleLayer = (layerKey: string) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey as keyof LayerVisibility],
    }));
  };

  // Toggle expand/collapse for a specific agent row
  const toggleExpand = (agentId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  return (
    <div style={panelStyle}>
      {/* Inject pulse animation keyframes */}
      <style>{pulseKeyframes}</style>

      {/* Section Header */}
      <div
        style={{
          padding: '8px 10px',
          fontSize: 10,
          fontWeight: 700,
          color: C.cyan,
          borderBottom: `1px solid ${C.panelBorder}`,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}
      >
        OSINT AGENTS
      </div>

      {/* Agent Rows */}
      {AGENTS.map((agent) => (
        <AgentRow
          key={agent.id}
          agent={agent}
          isLayerActive={layers[agent.layer as keyof LayerVisibility] ?? true}
          isExpanded={expanded.has(agent.id)}
          onToggleLayer={() => toggleLayer(agent.layer)}
          onToggleExpand={() => toggleExpand(agent.id)}
          liveStatus={agentStatuses[agent.id]}
        />
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Missile Trajectories Toggle */}
      <div
        style={{
          padding: '8px 10px',
          borderTop: `1px solid ${C.panelBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }}
        onClick={() => toggleLayer('missiles')}
      >
        {/* Custom checkbox */}
        <span
          style={{
            width: 12,
            height: 12,
            border: `1px solid ${layers.missiles ? C.red : C.dimText}`,
            borderRadius: 2,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: layers.missiles ? 'rgba(255,51,68,0.15)' : 'transparent',
            flexShrink: 0,
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          {layers.missiles && (
            <span
              style={{
                width: 6,
                height: 6,
                background: C.red,
                borderRadius: 1,
                display: 'block',
              }}
            />
          )}
        </span>

        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: layers.missiles ? C.red : C.dimText,
            letterSpacing: 0.5,
            fontFamily: 'monospace',
            transition: 'color 0.15s',
          }}
        >
          MISSILE TRAJECTORIES
        </span>
      </div>

      {/* Footer status */}
      <div
        style={{
          padding: '6px 10px',
          fontSize: 9,
          color: C.dimText,
          borderTop: `1px solid ${C.panelBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{Object.values(agentStatuses).filter((a) => a.status === 'ACTIVE').length}/{AGENTS.length} ACTIVE</span>
        <span>{AGENTS.reduce((sum, a) => sum + a.alerts, 0)} ALERTS</span>
      </div>
    </div>
  );
}
