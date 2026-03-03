'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON — AgentBar
// Left-side agent status panel showing 6 OSINT collection
// agents with live status indicators, alert badges, trust
// scores, NATO reliability codes, and layer toggle controls.
// ═══════════════════════════════════════════════════════════

import type { LayerVisibility, AgentStatus } from './types';
import { C } from './constants';

// ─── Props ───────────────────────────────────────────────

interface AgentBarProps {
  layers: LayerVisibility;
  setLayers: (fn: (l: LayerVisibility) => LayerVisibility) => void;
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

// ─── Panel Style ─────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  width: 220,
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

// ─── CSS Keyframes for Pulse ─────────────────────────────
// Injected once for the PROCESSING status pulsing dot animation.

const pulseKeyframes = `
@keyframes panopticon-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
`;

// ─── Agent Row Component ─────────────────────────────────
// Renders a single agent with status dot, name, alert badge,
// description, trust score, and NATO code. Clicking toggles
// the agent's corresponding map layer visibility.

function AgentRow({
  agent,
  isLayerActive,
  onToggle,
}: {
  agent: AgentStatus;
  isLayerActive: boolean;
  onToggle: () => void;
}) {
  const dotColor = statusDotColor(agent.status);
  const isPulsing = agent.status === 'PROCESSING';

  return (
    <div
      onClick={onToggle}
      style={{
        padding: '7px 10px',
        borderBottom: `1px solid ${C.panelBorder}`,
        cursor: 'pointer',
        opacity: isLayerActive ? 1 : 0.4,
        transition: 'opacity 0.2s, background 0.15s',
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0,180,255,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Top row: Status dot + Agent name + Alert badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
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
          marginLeft: 12,
          marginBottom: 2,
        }}
      >
        {agent.desc}
      </div>

      {/* Trust score + NATO reliability code */}
      <div
        style={{
          fontSize: 9,
          color: C.dimText,
          marginLeft: 12,
          display: 'flex',
          gap: 8,
        }}
      >
        <span>
          TRUST:{' '}
          <span
            style={{
              color: agent.trustScore >= 90 ? C.green : agent.trustScore >= 75 ? C.amber : C.red,
            }}
          >
            {agent.trustScore}%
          </span>
        </span>
        <span>
          NATO: <span style={{ color: C.text }}>{agent.natoReliability}</span>
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export default function AgentBar({ layers, setLayers }: AgentBarProps) {
  // Toggle a specific layer by its key name in LayerVisibility
  const toggleLayer = (layerKey: string) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey as keyof LayerVisibility],
    }));
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
          onToggle={() => toggleLayer(agent.layer)}
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
        <span>{AGENTS.filter((a) => a.status === 'ACTIVE').length}/{AGENTS.length} ACTIVE</span>
        <span>{AGENTS.reduce((sum, a) => sum + a.alerts, 0)} ALERTS</span>
      </div>
    </div>
  );
}
