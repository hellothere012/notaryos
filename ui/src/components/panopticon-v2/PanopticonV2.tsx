'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON V2 — Main Orchestrator
// Connects SSE stream → globe + fused timeline + agent bar.
// Implements desktop 3-column layout + mobile bottom nav.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { C } from '../panopticon/constants';
import type { Assessment, LayerVisibility, FlightTrack, VesselTrack } from '../panopticon/types';
import { usePanopticonStream } from '../panopticon/usePanopticonStream';
import ThreatBanner from '../panopticon/ThreatBanner';
import GlobeCanvasV2 from './GlobeCanvasV2';
import FusedTimeline from './FusedTimeline';
import AgentBarV2 from './AgentBarV2';
import EntityTooltipV2 from './EntityTooltipV2';
import CorrelationTree from './CorrelationTree';
import MobileNav from './MobileNav';

// ─── Threat Level Derivation ────────────────────────────────

function deriveThreatLevel(assessments: Assessment[]): 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'LOW' {
  if (assessments.some((a) => a.level === 'CRITICAL')) return 'CRITICAL';
  if (assessments.some((a) => a.level === 'HIGH')) return 'HIGH';
  if (assessments.some((a) => a.level === 'ELEVATED')) return 'ELEVATED';
  return 'LOW';
}

// ─── CSS Keyframes ──────────────────────────────────────────

const keyframes = `
@keyframes intel-news-slide-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes panopticon-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
`;

// ─── Main Component ─────────────────────────────────────────

export default function PanopticonV2() {
  // ── SSE Data ────────────────────────────────────────────
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const {
    flights,
    vessels,
    assessments,
    events,
    news,
    agentStatuses,
    streamStatus,
    isLive,
    stats,
  } = usePanopticonStream(tick);

  // ── Layer Visibility ────────────────────────────────────
  const [layers, setLayers] = useState<LayerVisibility>({
    flights: true,
    vessels: true,
    social: true,
    satellite: true,
    news: true,
    official: true,
    missiles: true,
  });

  // ── Globe Rotation (drag-to-rotate) ─────────────────────
  const [rotation, setRotation] = useState({ lat: 25, lon: 52 }); // Middle East default
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, lat: 25, lon: 52 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, lat: rotation.lat, lon: rotation.lon });
  }, [rotation]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotation({
      lat: Math.max(-80, Math.min(80, dragStart.lat - dy * 0.3)),
      lon: dragStart.lon + dx * 0.3,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch support for mobile drag
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY, lat: rotation.lat, lon: rotation.lon });
  }, [rotation]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.x;
    const dy = touch.clientY - dragStart.y;
    // 5px threshold to distinguish tap from pan
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    setRotation({
      lat: Math.max(-80, Math.min(80, dragStart.lat - dy * 0.3)),
      lon: dragStart.lon + dx * 0.3,
    });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ── Entity Tooltip ──────────────────────────────────────
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'flight' | 'vessel';
    data: FlightTrack | VesselTrack;
    screenX: number;
    screenY: number;
  } | null>(null);

  const handleEntitySelect = useCallback((
    type: 'flight' | 'vessel',
    data: FlightTrack | VesselTrack,
    screenX: number,
    screenY: number,
  ) => {
    setSelectedEntity({ type, data, screenX, screenY });
  }, []);

  // ── Correlation Tree Modal ──────────────────────────────
  const [correlationAssessment, setCorrelationAssessment] = useState<Assessment | null>(null);

  // ── Mobile View ─────────────────────────────────────────
  const [mobileView, setMobileView] = useState<'globe' | 'feed' | 'agents'>('globe');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Derived Data ────────────────────────────────────────
  const threatLevel = deriveThreatLevel(assessments);

  // ── Render ──────────────────────────────────────────────

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>
      <style>{keyframes}</style>

      {/* Threat Banner — sticky top */}
      <ThreatBanner
        level={threatLevel}
        isLive={isLive}
        streamStatus={streamStatus}
        activeAgents={stats.activeAgents}
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ── Desktop: Agent Bar (left) ─────────────────── */}
        {!isMobile && (
          <AgentBarV2
            layers={layers}
            setLayers={setLayers}
            agentStatuses={agentStatuses}
          />
        )}

        {/* ── Globe (center) ────────────────────────────── */}
        {(!isMobile || mobileView === 'globe') && (
          <div
            style={{ flex: 1, position: 'relative', cursor: isDragging ? 'grabbing' : 'crosshair' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <GlobeCanvasV2
              rotation={rotation}
              flights={flights}
              vessels={vessels}
              layers={layers}
              tick={tick}
              onEntitySelect={handleEntitySelect}
            />
          </div>
        )}

        {/* ── Mobile: Feed View ─────────────────────────── */}
        {isMobile && mobileView === 'feed' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <FusedTimeline
              flights={flights}
              vessels={vessels}
              news={news}
              assessments={assessments}
              events={events}
              onViewCorrelation={setCorrelationAssessment}
            />
          </div>
        )}

        {/* ── Mobile: Agents View ───────────────────────── */}
        {isMobile && mobileView === 'agents' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <AgentBarV2
              layers={layers}
              setLayers={setLayers}
              agentStatuses={agentStatuses}
            />
          </div>
        )}

        {/* ── Desktop: Fused Timeline (right) ───────────── */}
        {!isMobile && (
          <FusedTimeline
            flights={flights}
            vessels={vessels}
            news={news}
            assessments={assessments}
            events={events}
            onViewCorrelation={setCorrelationAssessment}
          />
        )}
      </div>

      {/* ── Entity Tooltip Overlay ──────────────────────── */}
      {selectedEntity && (
        <EntityTooltipV2
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
        />
      )}

      {/* ── Correlation Tree Modal ──────────────────────── */}
      {correlationAssessment && (
        <CorrelationTree
          assessment={correlationAssessment}
          onClose={() => setCorrelationAssessment(null)}
        />
      )}

      {/* ── Mobile Bottom Nav ───────────────────────────── */}
      {isMobile && (
        <MobileNav
          activeView={mobileView}
          onViewChange={setMobileView}
        />
      )}

      {/* ── NotaryOS attribution — bottom left ──────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? 56 : 8,
          left: isMobile ? 8 : 208,
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(74,122,154,0.4)', textTransform: 'uppercase' }}>
          Powered by <span style={{ color: 'rgba(212,168,43,0.4)' }}>NotaryOS</span> Ed25519 Receipts
        </div>
      </div>
    </div>
  );
}
