'use client';

import { useState, useEffect, useCallback } from 'react';
import { C } from './constants';
import type { Assessment, LayerVisibility, FlightTrack, VesselTrack } from './types';
import { usePanopticonStream } from './usePanopticonStream';
import ThreatBanner from './ThreatBanner';
import GlobeCanvas from './GlobeCanvas';
import IntelPanel from './IntelPanel';
import AgentBar from './AgentBar';
import TimeSlider from './TimeSlider';
import DagViewer from './DagViewer';

// ═══════════════════════════════════════════════════════════
// PANOPTICON — 4D OSINT Intelligence Dashboard
// Built on ATS Protocol + NotaryOS
// ═══════════════════════════════════════════════════════════

// ─── Entity Tooltip ───────────────────────────────────────
// Floating card shown when clicking a flight/vessel on the globe

function EntityTooltip({
  entity,
  onClose,
}: {
  entity: {
    type: 'flight' | 'vessel';
    data: FlightTrack | VesselTrack;
    screenX: number;
    screenY: number;
  };
  onClose: () => void;
}) {
  const d = entity.data;
  const isFlight = entity.type === 'flight';
  const flight = isFlight ? (d as FlightTrack) : null;
  const vessel = !isFlight ? (d as VesselTrack) : null;

  // Position tooltip near click, clamped to viewport
  const left = Math.min(entity.screenX + 12, window.innerWidth - 260);
  const top = Math.min(entity.screenY - 20, window.innerHeight - 200);

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        width: 240,
        background: 'rgba(8,16,28,0.95)',
        border: `1px solid ${C.panelBorder}`,
        borderRadius: 6,
        padding: '10px 12px',
        fontFamily: 'monospace',
        zIndex: 1000,
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.cyan }}>
          {isFlight ? flight!.callsign : vessel!.name}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: C.dimText,
            fontSize: 14,
            cursor: 'pointer',
            padding: '0 2px',
            lineHeight: 1,
          }}
        >
          &times;
        </button>
      </div>

      {/* Type badge */}
      <div style={{ marginBottom: 6 }}>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: '#000',
            background: d.type === 'adversary' ? C.red : d.type === 'commercial' ? C.amber : C.cyan,
            padding: '1px 5px',
            borderRadius: 2,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {d.type}
        </span>
        {vessel?.flag && (
          <span style={{ fontSize: 9, color: C.dimText, marginLeft: 6 }}>
            FLAG: {vessel.flag}
          </span>
        )}
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px', fontSize: 9 }}>
        {flight && (
          <>
            <span style={{ color: C.dimText }}>AIRCRAFT</span>
            <span style={{ color: C.text }}>{flight.aircraft}</span>
            <span style={{ color: C.dimText }}>ALT</span>
            <span style={{ color: C.text }}>{(flight.alt / 1000).toFixed(0)}K ft</span>
            <span style={{ color: C.dimText }}>SPEED</span>
            <span style={{ color: C.text }}>{flight.speed} kts</span>
            <span style={{ color: C.dimText }}>HDG</span>
            <span style={{ color: C.text }}>{Math.round(flight.heading)}°</span>
          </>
        )}
        {vessel && (
          <>
            <span style={{ color: C.dimText }}>CLASS</span>
            <span style={{ color: C.text }}>{vessel.classification || '—'}</span>
            <span style={{ color: C.dimText }}>SPEED</span>
            <span style={{ color: C.text }}>{vessel.speed ?? '—'} kts</span>
            <span style={{ color: C.dimText }}>HDG</span>
            <span style={{ color: C.text }}>{vessel.heading != null ? `${Math.round(vessel.heading)}°` : '—'}</span>
          </>
        )}
        <span style={{ color: C.dimText }}>SOURCE</span>
        <span style={{ color: C.text }}>{d.source}</span>
        <span style={{ color: C.dimText }}>TRUST</span>
        <span style={{ color: d.trustScore >= 80 ? C.green : d.trustScore >= 60 ? C.amber : C.red }}>
          {d.trustScore}%
        </span>
      </div>

      {/* Coordinates */}
      <div style={{ fontSize: 8, color: C.dimText, marginTop: 6, borderTop: `1px solid ${C.panelBorder}`, paddingTop: 4 }}>
        {d.lat.toFixed(4)}°N {d.lon.toFixed(4)}°E
      </div>
    </div>
  );
}

// ─── Mobile Nav Bar ───────────────────────────────────────
// Bottom tab bar visible on mobile/tablet for accessing panels

function MobileNavBar({
  activePanel,
  onSelect,
}: {
  activePanel: 'agents' | 'globe' | 'intel' | null;
  onSelect: (panel: 'agents' | 'globe' | 'intel') => void;
}) {
  const tabs = [
    { id: 'agents' as const, label: 'AGENTS', icon: '◉' },
    { id: 'globe' as const, label: 'GLOBE', icon: '◎' },
    { id: 'intel' as const, label: 'INTEL', icon: '▣' },
  ];

  return (
    <div
      className="flex md:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(8,16,28,0.95)',
        borderTop: `1px solid ${C.panelBorder}`,
        display: 'flex',
        zIndex: 900,
        backdropFilter: 'blur(8px)',
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          style={{
            flex: 1,
            padding: '10px 0 8px',
            background: 'transparent',
            border: 'none',
            borderTop: activePanel === tab.id ? `2px solid ${C.cyan}` : '2px solid transparent',
            color: activePanel === tab.id ? C.cyan : C.dimText,
            fontFamily: 'monospace',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <span style={{ fontSize: 16 }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Mobile Drawer ────────────────────────────────────────
// Slide-up panel for agents or intel on mobile

function MobileDrawer({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex md:hidden"
      style={{
        position: 'fixed',
        bottom: 48, // above nav bar
        left: 0,
        right: 0,
        top: isOpen ? '30%' : '100%',
        background: 'rgba(8,16,28,0.97)',
        borderTop: `1px solid ${C.panelBorder}`,
        zIndex: 800,
        transition: 'top 0.3s ease-in-out',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Drag handle + close */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '6px 0',
          borderBottom: `1px solid ${C.panelBorder}`,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: C.dimText,
            border: 'none',
            cursor: 'pointer',
            opacity: 0.5,
          }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Dashboard Component
// ═══════════════════════════════════════════════════════════

export default function PanopticonDashboard() {
  // Globe rotation state (drag to rotate)
  const [rotation, setRotation] = useState({ lat: 28, lon: 52 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    lat: number;
    lon: number;
  } | null>(null);

  // Layer visibility toggles
  const [layers, setLayers] = useState<LayerVisibility>({
    flights: true,
    vessels: true,
    social: true,
    satellite: true,
    news: true,
    official: true,
    missiles: true,
  });

  // Timeline state
  const [timeOffset, setTimeOffset] = useState(95);

  // Animation tick (100ms interval)
  const [tick, setTick] = useState(0);

  // Assessment selection + DAG viewer (now separated)
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showDag, setShowDag] = useState<Assessment | null>(null);

  // Selected entity from globe click
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'flight' | 'vessel';
    data: FlightTrack | VesselTrack;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Mobile panel state
  const [mobilePanel, setMobilePanel] = useState<'agents' | 'globe' | 'intel' | null>(null);

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  // Real-time OSINT data stream — live data only, no simulated fallback
  const { flights, vessels, news, assessments, agentStatuses, streamStatus, isLive, stats } = usePanopticonStream(tick);

  // Mouse handlers for globe rotation
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY, lat: rotation.lat, lon: rotation.lon });
    },
    [rotation]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !dragStart) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setRotation({
        lat: Math.max(-80, Math.min(80, dragStart.lat + dy * 0.3)),
        lon: dragStart.lon - dx * 0.3,
      });
    },
    [dragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    setDragStart(null);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      setDragging(true);
      setDragStart({ x: t.clientX, y: t.clientY, lat: rotation.lat, lon: rotation.lon });
    },
    [rotation]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging || !dragStart) return;
      const t = e.touches[0];
      const dx = t.clientX - dragStart.x;
      const dy = t.clientY - dragStart.y;
      setRotation({
        lat: Math.max(-80, Math.min(80, dragStart.lat + dy * 0.3)),
        lon: dragStart.lon - dx * 0.3,
      });
    },
    [dragging, dragStart]
  );

  // Toggle assessment selection (expand/collapse detail inline)
  const handleAssessmentSelect = useCallback((a: Assessment) => {
    setSelectedAssessment(prev => prev?.id === a.id ? null : a);
  }, []);

  // Open DAG viewer (separate action from selection)
  const handleViewDag = useCallback((a: Assessment) => {
    setShowDag(a);
  }, []);

  // Entity select from globe click
  const handleEntitySelect = useCallback((
    type: 'flight' | 'vessel',
    data: FlightTrack | VesselTrack,
    screenX: number,
    screenY: number,
  ) => {
    setSelectedEntity({ type, data, screenX, screenY });
  }, []);

  // Mobile nav handler
  const handleMobileNav = useCallback((panel: 'agents' | 'globe' | 'intel') => {
    if (panel === 'globe') {
      setMobilePanel(null); // close drawer
    } else {
      setMobilePanel(prev => prev === panel ? null : panel);
    }
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: C.bg,
        color: C.text,
        fontFamily: 'monospace',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Top banner with stream status */}
      <ThreatBanner level="CRITICAL" isLive={isLive} streamStatus={streamStatus} activeAgents={stats.activeAgents} />

      {/* Main content: agent bar + globe + intel panel */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left: Agent status panel (desktop) */}
        <div className="hidden md:flex">
          <AgentBar layers={layers} setLayers={setLayers} agentStatuses={agentStatuses} />
        </div>

        {/* Center: Globe */}
        <div
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <GlobeCanvas
            rotation={rotation}
            flights={flights}
            vessels={vessels}
            layers={layers}
            tick={tick}
            onEntitySelect={handleEntitySelect}
          />

          {/* Globe overlay stats */}
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              left: 16,
              display: 'flex',
              gap: 16,
              pointerEvents: 'none',
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'AGENTS ACTIVE', value: `${stats.activeAgents}/6`, color: stats.activeAgents >= 3 ? C.green : stats.activeAgents > 0 ? C.amber : C.dimText },
              { label: 'STREAM', value: isLive ? 'CONNECTED' : streamStatus.toUpperCase(), color: isLive ? C.green : C.amber },
              { label: 'MESSAGES', value: `${stats.messagesReceived}`, color: C.cyan },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 7, color: C.dimText, letterSpacing: 1 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Entity tooltip (shown when clicking flight/vessel on globe) */}
          {selectedEntity && (
            <EntityTooltip
              entity={selectedEntity}
              onClose={() => setSelectedEntity(null)}
            />
          )}
        </div>

        {/* Right: Intelligence panel (desktop) */}
        <div className="hidden lg:flex">
          <IntelPanel
            news={news}
            assessments={assessments}
            flights={flights}
            vessels={vessels}
            selectedAssessment={selectedAssessment}
            setSelectedAssessment={handleAssessmentSelect}
            onViewDag={handleViewDag}
          />
        </div>
      </div>

      {/* Bottom: Time slider */}
      <TimeSlider timeOffset={timeOffset} setTimeOffset={setTimeOffset} />

      {/* DAG Viewer overlay */}
      {showDag && <DagViewer assessment={showDag} onClose={() => setShowDag(null)} />}

      {/* Mobile: Bottom nav bar */}
      <MobileNavBar activePanel={mobilePanel} onSelect={handleMobileNav} />

      {/* Mobile: Slide-up drawers */}
      <MobileDrawer isOpen={mobilePanel === 'agents'} onClose={() => setMobilePanel(null)}>
        <AgentBar layers={layers} setLayers={setLayers} agentStatuses={agentStatuses} />
      </MobileDrawer>
      <MobileDrawer isOpen={mobilePanel === 'intel'} onClose={() => setMobilePanel(null)}>
        <IntelPanel
          news={news}
          assessments={assessments}
          flights={flights}
          vessels={vessels}
          selectedAssessment={selectedAssessment}
          setSelectedAssessment={handleAssessmentSelect}
          onViewDag={handleViewDag}
        />
      </MobileDrawer>
    </div>
  );
}
