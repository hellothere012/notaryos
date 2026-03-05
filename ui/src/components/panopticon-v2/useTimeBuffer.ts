'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON V2 — Time Buffer Hook
// Ring buffer that snapshots SSE data every 30s for scrubbing.
// Max 240 snapshots = 2 hours of replay.
// ═══════════════════════════════════════════════════════════

import { useRef, useCallback, useEffect } from 'react';
import type { FlightTrack, VesselTrack, NewsItem, Assessment, LiveEvent } from '../panopticon/types';

export interface TimeSnapshot {
  timestamp: number; // epoch ms
  flights: FlightTrack[];
  vessels: VesselTrack[];
  news: NewsItem[];
  assessments: Assessment[];
  events: LiveEvent[];
}

const MAX_SNAPSHOTS = 240; // 240 × 30s = 2 hours
const SNAPSHOT_INTERVAL = 30_000; // 30 seconds

export function useTimeBuffer(data: {
  flights: FlightTrack[];
  vessels: VesselTrack[];
  news: NewsItem[];
  assessments: Assessment[];
  events: LiveEvent[];
}) {
  const buffer = useRef<TimeSnapshot[]>([]);
  const lastSnapshotTime = useRef(0);

  // Capture snapshot at interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Only snapshot if we have some data
      if (data.flights.length === 0 && data.news.length === 0 && data.events.length === 0) return;

      const snapshot: TimeSnapshot = {
        timestamp: now,
        flights: [...data.flights],
        vessels: [...data.vessels],
        news: [...data.news],
        assessments: [...data.assessments],
        events: [...data.events],
      };

      buffer.current.push(snapshot);

      // Ring buffer: drop oldest when full
      if (buffer.current.length > MAX_SNAPSHOTS) {
        buffer.current = buffer.current.slice(-MAX_SNAPSHOTS);
      }

      lastSnapshotTime.current = now;
    }, SNAPSHOT_INTERVAL);

    return () => clearInterval(interval);
  }, [data.flights, data.vessels, data.news, data.assessments, data.events]);

  // Also capture an immediate snapshot on first data arrival
  useEffect(() => {
    if (buffer.current.length === 0 && (data.flights.length > 0 || data.news.length > 0)) {
      buffer.current.push({
        timestamp: Date.now(),
        flights: [...data.flights],
        vessels: [...data.vessels],
        news: [...data.news],
        assessments: [...data.assessments],
        events: [...data.events],
      });
    }
  }, [data.flights.length, data.news.length, data.vessels, data.assessments, data.events]);

  // Lookup: find nearest snapshot to a given timestamp
  const getSnapshotAt = useCallback((targetTime: number): TimeSnapshot | null => {
    const buf = buffer.current;
    if (buf.length === 0) return null;

    // Binary search for nearest
    let lo = 0;
    let hi = buf.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (buf[mid].timestamp < targetTime) lo = mid + 1;
      else hi = mid;
    }

    // Check neighbors for closest
    if (lo > 0) {
      const prev = buf[lo - 1];
      const curr = buf[lo];
      if (Math.abs(prev.timestamp - targetTime) < Math.abs(curr.timestamp - targetTime)) {
        return prev;
      }
    }
    return buf[lo];
  }, []);

  // Time range of buffer
  const getTimeRange = useCallback((): { start: number; end: number } | null => {
    const buf = buffer.current;
    if (buf.length === 0) return null;
    return { start: buf[0].timestamp, end: buf[buf.length - 1].timestamp };
  }, []);

  const getSnapshotCount = useCallback(() => buffer.current.length, []);

  return { getSnapshotAt, getTimeRange, getSnapshotCount };
}
