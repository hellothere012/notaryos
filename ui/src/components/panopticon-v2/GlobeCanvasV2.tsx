'use client';

// ================================================================
// PANOPTICON V2 -- GlobeCanvasV2.tsx
// Orthographic globe projection renderer on HTML5 Canvas.
// Draws country polygons, graticule grid, flight/vessel tracks,
// missile trajectories, location labels, and atmosphere glow.
//
// V2 Enhancement: Gold pulse rings on receipt-verified entities.
// ================================================================

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { FlightTrack, VesselTrack, LayerVisibility, ProjectedPoint } from '../panopticon/types';
import { DEG, TAU, C, GEO, GLOBE_LABELS, LOCATIONS } from '../panopticon/constants';

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------
interface GlobeCanvasProps {
  rotation: { lat: number; lon: number };
  flights: FlightTrack[];
  vessels: VesselTrack[];
  layers: LayerVisibility;
  tick: number;
  onEntitySelect?: (type: 'flight' | 'vessel', data: FlightTrack | VesselTrack, screenX: number, screenY: number) => void;
}

// ----------------------------------------------------------------
// Label type for deconfliction
// ----------------------------------------------------------------
interface GlobeLabel {
  x: number;       // screen x (label anchor)
  y: number;       // screen y (label anchor)
  text: string;
  color: string;
  priority: number; // higher = placed first, won't be displaced
}

// ----------------------------------------------------------------
// Orthographic projection
// ----------------------------------------------------------------
function project(
  lat: number,
  lon: number,
  cLat: number,
  cLon: number,
  R: number,
): ProjectedPoint {
  const phi = lat * DEG;
  const lambda = lon * DEG;
  const phi0 = cLat * DEG;
  const lambda0 = cLon * DEG;

  const sinPhi0 = Math.sin(phi0);
  const cosPhi0 = Math.cos(phi0);
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const cosLambdaDelta = Math.cos(lambda - lambda0);

  const cosC = sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosLambdaDelta;
  if (cosC < 0) return null;

  return {
    x: R * cosPhi * Math.sin(lambda - lambda0),
    y: -R * (cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosLambdaDelta),
  };
}

// ----------------------------------------------------------------
// Label deconfliction
// Greedy approach: place highest-priority labels first.
// Lower-priority labels get nudged downward if overlapping.
// ----------------------------------------------------------------
const LABEL_FONT_SIZE = 9;
const CHAR_WIDTH = 5.4; // approx for 9px monospace
const LABEL_PAD_X = 4;
const LABEL_PAD_Y = 2;

function deconflictLabels(labels: GlobeLabel[]): GlobeLabel[] {
  // Sort by priority descending — important labels get placed first
  const sorted = [...labels].sort((a, b) => b.priority - a.priority);

  // Track placed label bounding boxes {x, y, w, h} (x,y = top-left of box)
  const placed: { cx: number; cy: number; hw: number; hh: number }[] = [];

  for (const label of sorted) {
    const hw = (label.text.length * CHAR_WIDTH + LABEL_PAD_X * 2) / 2;
    const hh = (LABEL_FONT_SIZE + LABEL_PAD_Y * 2) / 2;
    const labelCx = label.x + hw; // center of label box
    let labelCy = label.y;

    // Try to find a non-overlapping position (nudge downward)
    for (let attempt = 0; attempt < 12; attempt++) {
      let overlapping = false;
      for (const p of placed) {
        if (Math.abs(labelCx - p.cx) < hw + p.hw + 2 &&
            Math.abs(labelCy - p.cy) < hh + p.hh + 1) {
          overlapping = true;
          labelCy = p.cy + p.hh + hh + 2;
          break;
        }
      }
      if (!overlapping) break;
    }

    label.y = labelCy;
    placed.push({ cx: labelCx, cy: labelCy, hw, hh });
  }

  return sorted;
}

// ----------------------------------------------------------------
// Draw all collected labels with dark backdrops
// ----------------------------------------------------------------
function drawLabels(ctx: CanvasRenderingContext2D, labels: GlobeLabel[]) {
  const resolved = deconflictLabels(labels);

  ctx.font = `${LABEL_FONT_SIZE}px monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  for (const label of resolved) {
    const tw = label.text.length * CHAR_WIDTH;
    const bx = label.x - LABEL_PAD_X;
    const by = label.y - LABEL_FONT_SIZE / 2 - LABEL_PAD_Y;
    const bw = tw + LABEL_PAD_X * 2;
    const bh = LABEL_FONT_SIZE + LABEL_PAD_Y * 2;

    // Dark backdrop for readability
    ctx.fillStyle = 'rgba(6,10,18,0.75)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 2);
    ctx.fill();

    // Label text
    ctx.fillStyle = label.color;
    ctx.fillText(label.text, label.x, label.y);
  }
}

// ----------------------------------------------------------------
// Icon color helpers
// ----------------------------------------------------------------
function flightColor(type: FlightTrack['type']): string {
  switch (type) {
    case 'adversary': return C.red;
    case 'strike': return C.amber;
    case 'bomber': return '#ff6600';
    case 'tanker': return '#8888ff';
    case 'isr': return C.green;
    default: return C.cyan;
  }
}

function vesselColor(type: VesselTrack['type']): string {
  switch (type) {
    case 'carrier': return C.cyan;
    case 'escort': return '#66aadd';
    case 'adversary': return C.red;
    case 'commercial': return C.amber;
    default: return C.cyan;
  }
}

function colorToRgba(color: string, alpha: number): string {
  const hexMatch = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hexMatch) {
    return `rgba(${parseInt(hexMatch[1], 16)},${parseInt(hexMatch[2], 16)},${parseInt(hexMatch[3], 16)},${alpha})`;
  }
  const shortHex = color.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (shortHex) {
    return `rgba(${parseInt(shortHex[1] + shortHex[1], 16)},${parseInt(shortHex[2] + shortHex[2], 16)},${parseInt(shortHex[3] + shortHex[3], 16)},${alpha})`;
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
  }
  return `rgba(200,200,200,${alpha})`;
}

// ----------------------------------------------------------------
// Missile trajectory routes
// ----------------------------------------------------------------
const MISSILE_ROUTES = [
  { from: LOCATIONS.tehran, to: LOCATIONS.jerusalem, color: C.red },
  { from: LOCATIONS.bushehr, to: LOCATIONS.dubai, color: C.amber },
  { from: LOCATIONS.bandarAbbas, to: LOCATIONS.doha, color: '#ff6600' },
];

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 6.0;
const ZOOM_STEP = 0.25;
const ZOOM_WHEEL_STEP = 0.1;

export default function GlobeCanvasV2({
  rotation,
  flights,
  vessels,
  layers,
  tick,
  onEntitySelect,
}: GlobeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 600 });
  const [zoom, setZoom] = useState(1.0);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
  }, []);

  const zoomReset = useCallback(() => {
    setZoom(1.0);
  }, []);

  // Store projected entity screen positions for click hit-testing
  const entityPositionsRef = useRef<Array<{
    type: 'flight' | 'vessel';
    data: FlightTrack | VesselTrack;
    sx: number; // screen x
    sy: number; // screen y
  }>>([]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => {
      const delta = e.deltaY > 0 ? -ZOOM_WHEEL_STEP : ZOOM_WHEEL_STEP;
      return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +(z + delta).toFixed(2)));
    });
  }, []);

  // Keyboard zoom shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn(); }
      if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut(); }
      if (e.key === '0') { e.preventDefault(); zoomReset(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [zoomIn, zoomOut, zoomReset]);

  // ----------------------------------------------------------
  // ResizeObserver: keep canvas sized to its container
  // ----------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setSize({ w: Math.floor(width), h: Math.floor(height) });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ----------------------------------------------------------
  // Drawing helper: draw a polygon from GEO coordinate pairs
  // ----------------------------------------------------------
  const drawPolygon = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      coords: number[][],
      cx: number,
      cy: number,
      R: number,
      cLat: number,
      cLon: number,
    ): boolean => {
      let started = false;
      let anyVisible = false;

      ctx.beginPath();
      for (const coord of coords) {
        const lon = coord[0];
        const lat = coord[1];
        const p = project(lat, lon, cLat, cLon, R);
        if (!p) continue;
        anyVisible = true;
        if (!started) {
          ctx.moveTo(cx + p.x, cy + p.y);
          started = true;
        } else {
          ctx.lineTo(cx + p.x, cy + p.y);
        }
      }
      if (anyVisible) ctx.closePath();
      return anyVisible;
    },
    [],
  );

  // ----------------------------------------------------------
  // Main draw effect
  // ----------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = size;
    const dpr = window.devicePixelRatio || 2;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.42 * zoom;
    const cLat = rotation.lat;
    const cLon = rotation.lon;

    // Collect all labels for batch drawing with deconfliction
    const allLabels: GlobeLabel[] = [];

    // Reset entity position tracking for hit-testing
    const entityPositions: typeof entityPositionsRef.current = [];

    // ==========================================================
    // 1. Clear + background
    // ==========================================================
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // ==========================================================
    // 2. Atmosphere glow
    // ==========================================================
    const atmosGrad = ctx.createRadialGradient(cx, cy, R * 0.97, cx, cy, R * 1.15);
    atmosGrad.addColorStop(0, 'rgba(0,160,255,0.08)');
    atmosGrad.addColorStop(0.4, 'rgba(0,120,220,0.05)');
    atmosGrad.addColorStop(1, 'rgba(0,60,120,0)');
    ctx.fillStyle = atmosGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.15, 0, TAU);
    ctx.fill();

    // ==========================================================
    // 3. Globe disc with gradient
    // ==========================================================
    const globeGrad = ctx.createRadialGradient(
      cx - R * 0.2, cy - R * 0.2, R * 0.05,
      cx, cy, R,
    );
    globeGrad.addColorStop(0, '#14253a');
    globeGrad.addColorStop(0.6, C.globe);
    globeGrad.addColorStop(1, '#050d18');
    ctx.fillStyle = globeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = C.globeEdge;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.stroke();

    // ==========================================================
    // 4. Graticule grid lines
    // ==========================================================
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 0.5;

    for (let lat = -80; lat <= 80; lat += 20) {
      ctx.beginPath();
      let started = false;
      for (let lon = -180; lon <= 180; lon += 2) {
        const p = project(lat, lon, cLat, cLon, R);
        if (!p) { started = false; continue; }
        if (!started) { ctx.moveTo(cx + p.x, cy + p.y); started = true; }
        else { ctx.lineTo(cx + p.x, cy + p.y); }
      }
      ctx.stroke();
    }

    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -90; lat <= 90; lat += 2) {
        const p = project(lat, lon, cLat, cLon, R);
        if (!p) { started = false; continue; }
        if (!started) { ctx.moveTo(cx + p.x, cy + p.y); started = true; }
        else { ctx.lineTo(cx + p.x, cy + p.y); }
      }
      ctx.stroke();
    }

    // ==========================================================
    // 5. Country polygons (clipped to globe)
    // ==========================================================
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.clip();

    for (const [name, coords] of Object.entries(GEO)) {
      if (name === 'persianGulf' || name === 'caspianSea') {
        const visible = drawPolygon(ctx, coords, cx, cy, R, cLat, cLon);
        if (visible) {
          ctx.fillStyle = 'rgba(5,15,35,0.7)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(30,100,180,0.3)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
        continue;
      }

      if (name === 'iran') {
        const visible = drawPolygon(ctx, coords, cx, cy, R, cLat, cLon);
        if (visible) {
          ctx.fillStyle = C.iran;
          ctx.fill();
          ctx.strokeStyle = C.iranStroke;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        continue;
      }

      const visible = drawPolygon(ctx, coords, cx, cy, R, cLat, cLon);
      if (visible) {
        ctx.fillStyle = C.land;
        ctx.fill();
        ctx.strokeStyle = C.landStroke;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    // ==========================================================
    // 6. Strait of Hormuz highlight
    // ==========================================================
    const hormuzP = project(LOCATIONS.hormuz.lat, LOCATIONS.hormuz.lon, cLat, cLon, R);
    if (hormuzP) {
      const hx = cx + hormuzP.x;
      const hy = cy + hormuzP.y;
      const pulseRadius = 8 + Math.sin(tick * 0.08) * 3;

      const hormuzGlow = ctx.createRadialGradient(hx, hy, 0, hx, hy, pulseRadius * 2.5);
      hormuzGlow.addColorStop(0, 'rgba(255,60,60,0.25)');
      hormuzGlow.addColorStop(0.5, 'rgba(255,60,60,0.08)');
      hormuzGlow.addColorStop(1, 'rgba(255,60,60,0)');
      ctx.fillStyle = hormuzGlow;
      ctx.beginPath();
      ctx.arc(hx, hy, pulseRadius * 2.5, 0, TAU);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,80,80,0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(hx, hy, pulseRadius, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore(); // end globe clip

    // ==========================================================
    // 7. Location labels -> collect into allLabels
    // ==========================================================
    for (const loc of GLOBE_LABELS) {
      const p = project(loc.lat, loc.lon, cLat, cLon, R);
      if (!p) continue;
      const lx = cx + p.x;
      const ly = cy + p.y;

      // Small dot at location
      ctx.fillStyle = C.dimText;
      ctx.beginPath();
      ctx.arc(lx, ly, 2, 0, TAU);
      ctx.fill();

      allLabels.push({
        x: lx + 6,
        y: ly,
        text: loc.name,
        color: C.text,
        priority: 1, // lowest — displaced by flights/vessels
      });
    }

    // ==========================================================
    // 8. Flight icons + labels
    // ==========================================================
    if (layers.flights) {
      for (const flight of flights) {
        const p = project(flight.lat, flight.lon, cLat, cLon, R);
        if (!p) continue;

        const fx = cx + p.x;
        const fy = cy + p.y;
        const color = flightColor(flight.type);
        const headingRad = (flight.heading - 90) * DEG;
        const iconSize = 5;

        // Radial glow
        const flightGlow = ctx.createRadialGradient(fx, fy, 0, fx, fy, iconSize * 3);
        flightGlow.addColorStop(0, colorToRgba(color, 0.3));
        flightGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = flightGlow;
        ctx.beginPath();
        ctx.arc(fx, fy, iconSize * 3, 0, TAU);
        ctx.fill();

        // Triangle icon
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(headingRad);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -iconSize);
        ctx.lineTo(-iconSize * 0.6, iconSize * 0.6);
        ctx.lineTo(iconSize * 0.6, iconSize * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Gold pulse ring for receipt-verified entities
        const flightReceiptHash = (flight as any).receiptHash || (flight as any).dagHash;
        if (flightReceiptHash) {
          const pulseAlpha = Math.sin(tick * 0.06) * 0.3 + 0.4;
          ctx.strokeStyle = `rgba(212, 168, 43, ${pulseAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(fx, fy, iconSize * 2.5, 0, TAU);
          ctx.stroke();
        }

        // Collect label — only at zoom >= 1.5 (density culling)
        // Adversary flights always labeled (critical intel)
        if (zoom >= 1.5 || flight.type === 'adversary') {
          allLabels.push({
            x: fx + 9,
            y: fy - 2,
            text: flight.callsign,
            color,
            priority: flight.type === 'adversary' ? 5 : 3,
          });
        }

        // Track position for click hit-testing
        entityPositions.push({ type: 'flight', data: flight, sx: fx, sy: fy });
      }
    }

    // ==========================================================
    // 9. Vessel icons + labels
    // ==========================================================
    if (layers.vessels) {
      for (const vessel of vessels) {
        const p = project(vessel.lat, vessel.lon, cLat, cLon, R);
        if (!p) continue;

        const vx = cx + p.x;
        const vy = cy + p.y;
        const color = vesselColor(vessel.type);
        const iconSize = 4;
        const isCarrier = vessel.type === 'carrier';

        // Radial glow
        const glowRadius = isCarrier ? iconSize * 5 : iconSize * 3;
        const glowAlpha = isCarrier ? 0.35 : 0.2;
        const vesselGlow = ctx.createRadialGradient(vx, vy, 0, vx, vy, glowRadius);
        vesselGlow.addColorStop(0, `rgba(0,212,255,${glowAlpha})`);
        vesselGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = vesselGlow;
        ctx.beginPath();
        ctx.arc(vx, vy, glowRadius, 0, TAU);
        ctx.fill();

        // Diamond shape
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(vx, vy - iconSize);
        ctx.lineTo(vx + iconSize * 0.7, vy);
        ctx.lineTo(vx, vy + iconSize);
        ctx.lineTo(vx - iconSize * 0.7, vy);
        ctx.closePath();
        ctx.fill();

        // Gold pulse ring for receipt-verified entities
        const vesselReceiptHash = (vessel as any).receiptHash || (vessel as any).dagHash;
        if (vesselReceiptHash) {
          const pulseAlpha = Math.sin(tick * 0.06) * 0.3 + 0.4;
          ctx.strokeStyle = `rgba(212, 168, 43, ${pulseAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(vx, vy, iconSize * 2.5, 0, TAU);
          ctx.stroke();
        }

        // Collect label — only at zoom >= 1.5 (density culling)
        // Carriers always labeled (high-value targets)
        if (zoom >= 1.5 || isCarrier || vessel.type === 'adversary') {
          allLabels.push({
            x: vx + 9,
            y: vy - 2,
            text: vessel.name,
            color,
            priority: isCarrier ? 4 : 2,
          });
        }

        // Track position for click hit-testing
        entityPositions.push({ type: 'vessel', data: vessel, sx: vx, sy: vy });
      }
    }

    // ==========================================================
    // 10. Missile trajectory arcs
    // ==========================================================
    if (layers.missiles) {
      for (const route of MISSILE_ROUTES) {
        const pFrom = project(route.from.lat, route.from.lon, cLat, cLon, R);
        const pTo = project(route.to.lat, route.to.lon, cLat, cLon, R);
        if (!pFrom || !pTo) continue;

        const x1 = cx + pFrom.x;
        const y1 = cy + pFrom.y;
        const x2 = cx + pTo.x;
        const y2 = cy + pTo.y;

        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dist = Math.hypot(x2 - x1, y2 - y1);
        const nx = -(y2 - y1) / dist;
        const ny = (x2 - x1) / dist;
        const arcHeight = dist * 0.35;
        const cpx = mx + nx * arcHeight;
        const cpy = my + ny * arcHeight;

        ctx.strokeStyle = route.color;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cpx, cpy, x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        const t = ((tick * 0.015) % 1);
        const oneMinusT = 1 - t;
        const headX = oneMinusT * oneMinusT * x1 + 2 * oneMinusT * t * cpx + t * t * x2;
        const headY = oneMinusT * oneMinusT * y1 + 2 * oneMinusT * t * cpy + t * t * y2;

        const headGlow = ctx.createRadialGradient(headX, headY, 0, headX, headY, 8);
        headGlow.addColorStop(0, route.color);
        headGlow.addColorStop(0.4, colorToRgba(route.color, 0.4));
        headGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(headX, headY, 8, 0, TAU);
        ctx.fill();

        ctx.fillStyle = route.color;
        ctx.beginPath();
        ctx.arc(headX, headY, 2.5, 0, TAU);
        ctx.fill();
      }
    }

    // ==========================================================
    // 11. Draw ALL labels with deconfliction + dark backdrops
    // ==========================================================
    drawLabels(ctx, allLabels);

    // Save entity positions for click hit-testing
    entityPositionsRef.current = entityPositions;

  }, [rotation, flights, vessels, layers, size, tick, zoom, drawPolygon]);

  // ----------------------------------------------------------
  // Entity hit-testing via mousedown/mouseup tracking
  // We track mousedown position and compare with mouseup to
  // distinguish clicks from drags (parent handles rotation).
  // ----------------------------------------------------------
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const handleEntityMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleEntityMouseUp = useCallback((e: React.MouseEvent) => {
    if (!onEntitySelect || !mouseDownPos.current) return;

    // Only treat as click if mouse moved less than 5px (not a drag)
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    mouseDownPos.current = null;
    if (dx > 5 || dy > 5) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const HIT_RADIUS = 20; // pixels

    // Find closest entity within hit radius
    let closest: (typeof entityPositionsRef.current)[0] | null = null;
    let closestDist = HIT_RADIUS;

    for (const entity of entityPositionsRef.current) {
      const dist = Math.hypot(entity.sx - clickX, entity.sy - clickY);
      if (dist < closestDist) {
        closestDist = dist;
        closest = entity;
      }
    }

    if (closest) {
      onEntitySelect(closest.type, closest.data, e.clientX, e.clientY);
    }
  }, [onEntitySelect]);

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  const zoomBtnStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(8,16,28,0.85)',
    border: '1px solid rgba(0,180,255,0.25)',
    borderRadius: 4,
    color: C.cyan,
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 700,
    cursor: 'pointer',
    userSelect: 'none',
    lineHeight: 1,
    transition: 'border-color 0.15s, background 0.15s',
  };

  const hoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.6)';
    e.currentTarget.style.background = 'rgba(0,180,255,0.12)';
  };
  const hoverOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = 'rgba(0,180,255,0.25)';
    e.currentTarget.style.background = 'rgba(8,16,28,0.85)';
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleEntityMouseDown}
      onMouseUp={handleEntityMouseUp}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', cursor: 'crosshair' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* Zoom controls */}
      <div
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          zIndex: 10,
        }}
      >
        <button onClick={zoomIn} style={zoomBtnStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut} title="Zoom in (+)">
          +
        </button>
        <button
          onClick={zoomReset}
          style={{
            ...zoomBtnStyle,
            fontSize: 9,
            height: 22,
            width: 40,
            alignSelf: 'center',
            color: zoom === 1.0 ? C.dimText : C.cyan,
          }}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
          title="Reset zoom (0)"
        >
          {zoom.toFixed(1)}x
        </button>
        <button onClick={zoomOut} style={zoomBtnStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut} title="Zoom out (-)">
          −
        </button>
      </div>

      {/* Keyboard hint */}
      <div
        style={{
          position: 'absolute',
          right: 10,
          bottom: 8,
          fontSize: 8,
          color: 'rgba(74,122,154,0.5)',
          fontFamily: 'monospace',
          pointerEvents: 'none',
        }}
      >
        +/− zoom &middot; drag rotate
      </div>
    </div>
  );
}
