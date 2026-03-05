'use client';

import { C } from '../panopticon/constants';
import type { FlightTrack, VesselTrack } from '../panopticon/types';
import ReceiptSeal from './ReceiptSeal';

interface EntityTooltipV2Props {
  entity: {
    type: 'flight' | 'vessel';
    data: FlightTrack | VesselTrack;
    screenX: number;
    screenY: number;
  };
  onClose: () => void;
}

export default function EntityTooltipV2({ entity, onClose }: EntityTooltipV2Props) {
  const d = entity.data;
  const isFlight = entity.type === 'flight';
  const flight = isFlight ? (d as FlightTrack) : null;
  const vessel = !isFlight ? (d as VesselTrack) : null;

  // Position tooltip near click, clamped to viewport
  const left = Math.min(entity.screenX + 12, typeof window !== 'undefined' ? window.innerWidth - 260 : 800);
  const top = Math.min(entity.screenY - 20, typeof window !== 'undefined' ? window.innerHeight - 220 : 600);

  // Check for receipt hash (future-proofed - entities may gain receiptHash from backend)
  const receiptHash = (d as any).receiptHash || (d as any).dagHash;

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
      <div style={{ fontSize: 8, color: C.dimText, marginTop: 6, borderTop: `1px solid ${C.panelBorder}`, paddingTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{d.lat.toFixed(4)}°N {d.lon.toFixed(4)}°E</span>
        {/* Receipt seal - appears when entity has a receipt hash */}
        {receiptHash && <ReceiptSeal hash={receiptHash} size={16} />}
      </div>
    </div>
  );
}
