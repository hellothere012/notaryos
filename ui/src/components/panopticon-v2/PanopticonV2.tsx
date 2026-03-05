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
import ReceiptExplosion from './ReceiptExplosion';
import MobileNav from './MobileNav';
import { useTimeBuffer } from './useTimeBuffer';
import TimeScrubber from './TimeScrubber';

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

  // ── Correlation / Receipt Explosion ─────────────────────
  const [correlationAssessment, setCorrelationAssessment] = useState<Assessment | null>(null);

  // ── Time Buffer + Scrubber ─────────────────────────────
  const [scrubberTime, setScrubberTime] = useState<number | null>(null);
  const { getSnapshotAt, getTimeRange, getSnapshotCount } = useTimeBuffer({
    flights, vessels, news, assessments, events,
  });

  // ── Mobile View ─────────────────────────────────────────
  const [mobileView, setMobileView] = useState<'globe' | 'feed' | 'agents'>('globe');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Display Data (live or scrubbed snapshot) ────────────
  const snapshot = scrubberTime !== null ? getSnapshotAt(scrubberTime) : null;
  const displayFlights = snapshot?.flights ?? flights;
  const displayVessels = snapshot?.vessels ?? vessels;
  const displayNews = snapshot?.news ?? news;
  const displayAssessments = snapshot?.assessments ?? assessments;
  const displayEvents = snapshot?.events ?? events;

  // ── Derived Data ────────────────────────────────────────
  const threatLevel = deriveThreatLevel(displayAssessments);
  const hasData = flights.length > 0 || news.length > 0 || assessments.length > 0 || events.length > 0;
  const isDisconnected = streamStatus === 'disconnected' && !hasData;

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
              flights={displayFlights}
              vessels={displayVessels}
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
              flights={displayFlights}
              vessels={displayVessels}
              news={displayNews}
              assessments={displayAssessments}
              events={displayEvents}
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
            flights={displayFlights}
            vessels={displayVessels}
            news={displayNews}
            assessments={displayAssessments}
            events={displayEvents}
            onViewCorrelation={setCorrelationAssessment}
          />
        )}
      </div>

      {/* ── Disconnected Overlay ─────────────────────────── */}
      {isDisconnected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(6,10,18,0.92)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div style={{ textAlign: 'center', fontFamily: '"SF Mono", "Fira Code", monospace' }}>
            <div style={{ fontSize: 32, color: C.red, marginBottom: 12 }}>{'\u26A0'}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.brightText, marginBottom: 8 }}>
              API UNAVAILABLE
            </div>
            <div style={{ fontSize: 11, color: C.dimText, maxWidth: 320, lineHeight: 1.5, marginBottom: 16 }}>
              Unable to connect to the OSINT data stream. The backend may be temporarily offline.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'rgba(0,180,255,0.15)',
                border: `1px solid ${C.cyan}`,
                color: C.cyan,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'monospace',
                padding: '8px 20px',
                borderRadius: 4,
                cursor: 'pointer',
                letterSpacing: 1,
              }}
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* ── Entity Tooltip Overlay ──────────────────────── */}
      {selectedEntity && (
        <EntityTooltipV2
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
        />
      )}

      {/* ── Receipt Explosion Arcs ──────────────────────── */}
      {correlationAssessment && (
        <ReceiptExplosion
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

      {/* ── Time Scrubber (desktop only, below globe) ───── */}
      {!isMobile && (
        <TimeScrubber
          scrubberTime={scrubberTime}
          onScrubberChange={setScrubberTime}
          timeRange={getTimeRange()}
          snapshotCount={getSnapshotCount()}
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
