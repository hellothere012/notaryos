'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { C } from './constants';
import { createFlights, createVessels, ASSESSMENTS } from './simulated-data';
import type { Assessment, LayerVisibility } from './types';
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

  // Assessment selection + DAG viewer
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showDag, setShowDag] = useState<Assessment | null>(null);

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  // Generate animated data
  const flights = useMemo(() => createFlights(tick * 100), [tick]);
  const vessels = useMemo(() => createVessels(tick * 100), [tick]);

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

  const handleAssessmentSelect = useCallback((a: Assessment) => {
    setSelectedAssessment(a);
    setShowDag(a);
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
      {/* Top banner */}
      <ThreatBanner level="CRITICAL" />

      {/* Main content: agent bar + globe + intel panel */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left: Agent status panel */}
        <div className="hidden md:flex">
          <AgentBar layers={layers} setLayers={setLayers} />
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
              { label: 'AGENTS ACTIVE', value: '6/6', color: C.green },
              { label: 'MESSAGES/SEC', value: '636', color: C.cyan },
              { label: 'TRUST VERIFIED', value: '100%', color: C.green },
              { label: 'OIL (BRENT)', value: '$118.42 \u25B28%', color: C.red },
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
        </div>

        {/* Right: Intelligence panel */}
        <div className="hidden lg:flex">
          <IntelPanel
            selectedAssessment={selectedAssessment}
            setSelectedAssessment={handleAssessmentSelect}
          />
        </div>
      </div>

      {/* Bottom: Time slider */}
      <TimeSlider timeOffset={timeOffset} setTimeOffset={setTimeOffset} />

      {/* DAG Viewer overlay */}
      {showDag && <DagViewer assessment={showDag} onClose={() => setShowDag(null)} />}
    </div>
  );
}
