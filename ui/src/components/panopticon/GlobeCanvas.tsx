'use client';

// ================================================================
// PANOPTICON -- GlobeCanvas.tsx
// Orthographic globe projection renderer on HTML5 Canvas.
// Draws country polygons, graticule grid, flight/vessel tracks,
// missile trajectories, location labels, and atmosphere glow.
// ================================================================

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { FlightTrack, VesselTrack, LayerVisibility, ProjectedPoint } from './types';
import { DEG, TAU, C, GEO, GLOBE_LABELS, LOCATIONS } from './constants';

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------
interface GlobeCanvasProps {
  rotation: { lat: number; lon: number };
  flights: FlightTrack[];
  vessels: VesselTrack[];
  layers: LayerVisibility;
  tick: number;
}

// ----------------------------------------------------------------
// Orthographic projection
// Projects a lat/lon coordinate onto a 2D plane given a center
// point (cLat, cLon) and globe radius R. Returns null when the
// point is on the back-side of the globe (cosC < 0).
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
  if (cosC < 0) return null; // behind the globe

  return {
    x: R * cosPhi * Math.sin(lambda - lambda0),
    y: -R * (cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosLambdaDelta),
  };
}

// ----------------------------------------------------------------
// Flight icon color by type
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

// ----------------------------------------------------------------
// Vessel icon color by type
// ----------------------------------------------------------------
function vesselColor(type: VesselTrack['type']): string {
  switch (type) {
    case 'carrier': return C.cyan;
    case 'escort': return '#66aadd';
    case 'adversary': return C.red;
    case 'commercial': return C.amber;
    default: return C.cyan;
  }
}

// ----------------------------------------------------------------
// Convert any CSS color (hex or named) to rgba with a given alpha.
// Uses an offscreen canvas to let the browser parse the color.
// Falls back to transparent on invalid input.
// ----------------------------------------------------------------
function colorToRgba(color: string, alpha: number): string {
  // Fast path for common hex formats
  const hexMatch = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hexMatch) {
    return `rgba(${parseInt(hexMatch[1], 16)},${parseInt(hexMatch[2], 16)},${parseInt(hexMatch[3], 16)},${alpha})`;
  }
  // Short hex (#abc -> #aabbcc)
  const shortHex = color.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (shortHex) {
    return `rgba(${parseInt(shortHex[1] + shortHex[1], 16)},${parseInt(shortHex[2] + shortHex[2], 16)},${parseInt(shortHex[3] + shortHex[3], 16)},${alpha})`;
  }
  // Already rgb/rgba -- inject alpha
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
const GlobeCanvas: React.FC<GlobeCanvasProps> = ({
  rotation,
  flights,
  vessels,
  layers,
  tick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 600 });

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
  // Each pair is [lon, lat]. Returns true if at least one point
  // was visible (front-side of globe).
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

    // Set canvas resolution to 2x DPI for crisp rendering
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Derived values
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.42; // globe radius
    const cLat = rotation.lat;
    const cLon = rotation.lon;

    // ==========================================================
    // 1. Clear + background
    // ==========================================================
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // ==========================================================
    // 2. Atmosphere glow (outer ring around globe)
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

    // Globe edge ring
    ctx.strokeStyle = C.globeEdge;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.stroke();

    // ==========================================================
    // 4. Graticule grid lines
    // Latitude lines every 20 degrees, longitude every 30 degrees
    // ==========================================================
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 0.5;

    // Latitude lines
    for (let lat = -80; lat <= 80; lat += 20) {
      ctx.beginPath();
      let started = false;
      for (let lon = -180; lon <= 180; lon += 2) {
        const p = project(lat, lon, cLat, cLon, R);
        if (!p) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(cx + p.x, cy + p.y);
          started = true;
        } else {
          ctx.lineTo(cx + p.x, cy + p.y);
        }
      }
      ctx.stroke();
    }

    // Longitude lines
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -90; lat <= 90; lat += 2) {
        const p = project(lat, lon, cLat, cLon, R);
        if (!p) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(cx + p.x, cy + p.y);
          started = true;
        } else {
          ctx.lineTo(cx + p.x, cy + p.y);
        }
      }
      ctx.stroke();
    }

    // ==========================================================
    // 5. Country polygons
    // ==========================================================
    // Clip drawing to the globe disc so polygons don't spill out
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.clip();

    for (const [name, coords] of Object.entries(GEO)) {
      // Special handling for water bodies
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

      // Iran: special fill + stroke
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

      // All other countries
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
    // 6. Strait of Hormuz highlight — pulsing indicator
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
    // 7. Location labels
    // ==========================================================
    ctx.font = '8px monospace';
    ctx.textBaseline = 'middle';

    for (const loc of GLOBE_LABELS) {
      const p = project(loc.lat, loc.lon, cLat, cLon, R);
      if (!p) continue;
      const lx = cx + p.x;
      const ly = cy + p.y;

      // Small dot at location
      ctx.fillStyle = C.dimText;
      ctx.beginPath();
      ctx.arc(lx, ly, 1.5, 0, TAU);
      ctx.fill();

      // Label text, offset to the right
      ctx.fillStyle = C.dimText;
      ctx.textAlign = 'left';
      ctx.fillText(loc.name, lx + 5, ly);
    }

    // ==========================================================
    // 8. Flight icons (when layer enabled)
    // Heading-rotated triangles with radial glow + callsign label
    // ==========================================================
    if (layers.flights) {
      for (const flight of flights) {
        const p = project(flight.lat, flight.lon, cLat, cLon, R);
        if (!p) continue;

        const fx = cx + p.x;
        const fy = cy + p.y;
        const color = flightColor(flight.type);
        const headingRad = (flight.heading - 90) * DEG; // rotate so 0=north points up
        const iconSize = 5;

        // Radial glow behind the icon
        const flightGlow = ctx.createRadialGradient(fx, fy, 0, fx, fy, iconSize * 3);
        flightGlow.addColorStop(0, colorToRgba(color, 0.3));
        flightGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = flightGlow;
        ctx.beginPath();
        ctx.arc(fx, fy, iconSize * 3, 0, TAU);
        ctx.fill();

        // Triangle icon rotated to heading
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(headingRad);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -iconSize);                          // nose
        ctx.lineTo(-iconSize * 0.6, iconSize * 0.6);       // left wing
        ctx.lineTo(iconSize * 0.6, iconSize * 0.6);        // right wing
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Callsign label
        ctx.font = '8px monospace';
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(flight.callsign, fx + 8, fy - 2);
      }
    }

    // ==========================================================
    // 9. Vessel icons (when layer enabled)
    // Diamond shape with radial glow
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

        // Radial glow -- carriers get a larger, more prominent glow
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
        ctx.moveTo(vx, vy - iconSize);         // top
        ctx.lineTo(vx + iconSize * 0.7, vy);   // right
        ctx.lineTo(vx, vy + iconSize);          // bottom
        ctx.lineTo(vx - iconSize * 0.7, vy);   // left
        ctx.closePath();
        ctx.fill();

        // Vessel name label
        ctx.font = '8px monospace';
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(vessel.name, vx + 8, vy - 2);
      }
    }

    // ==========================================================
    // 10. Missile trajectory arcs (when layer enabled)
    // Animated dashed arcs between key locations with moving head
    // ==========================================================
    if (layers.missiles) {
      for (const route of MISSILE_ROUTES) {
        const pFrom = project(route.from.lat, route.from.lon, cLat, cLon, R);
        const pTo = project(route.to.lat, route.to.lon, cLat, cLon, R);

        // Only draw if both endpoints are on the visible hemisphere
        if (!pFrom || !pTo) continue;

        const x1 = cx + pFrom.x;
        const y1 = cy + pFrom.y;
        const x2 = cx + pTo.x;
        const y2 = cy + pTo.y;

        // Compute arc control point -- elevated midpoint for parabolic look
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dist = Math.hypot(x2 - x1, y2 - y1);
        // Perpendicular direction pointing "upward" from the line
        const nx = -(y2 - y1) / dist;
        const ny = (x2 - x1) / dist;
        const arcHeight = dist * 0.35;
        const cpx = mx + nx * arcHeight;
        const cpy = my + ny * arcHeight;

        // Dashed arc line
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

        // Animated head -- travels along the arc based on tick
        const t = ((tick * 0.015) % 1); // 0..1 looping parameter
        // Quadratic bezier interpolation: B(t) = (1-t)^2*P0 + 2(1-t)t*CP + t^2*P1
        const oneMinusT = 1 - t;
        const headX = oneMinusT * oneMinusT * x1 + 2 * oneMinusT * t * cpx + t * t * x2;
        const headY = oneMinusT * oneMinusT * y1 + 2 * oneMinusT * t * cpy + t * t * y2;

        // Glowing head dot
        const headGlow = ctx.createRadialGradient(headX, headY, 0, headX, headY, 8);
        headGlow.addColorStop(0, route.color);
        headGlow.addColorStop(0.4, colorToRgba(route.color, 0.4));
        headGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(headX, headY, 8, 0, TAU);
        ctx.fill();

        // Solid head dot
        ctx.fillStyle = route.color;
        ctx.beginPath();
        ctx.arc(headX, headY, 2.5, 0, TAU);
        ctx.fill();
      }
    }
  }, [rotation, flights, vessels, layers, size, tick, drawPolygon]);

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

export default GlobeCanvas;
