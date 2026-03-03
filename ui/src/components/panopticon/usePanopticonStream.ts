'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON — Real-Time OSINT Data Hook
// ═══════════════════════════════════════════════════════════
// Connects to the backend SSE stream (/v1/panopticon/stream)
// for live OSINT data from HERALD, GAZETTE, and SKYWATCH agents.
//
// Falls back to simulated data if the stream is unavailable,
// so the dashboard always renders regardless of backend status.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import type { FlightTrack, VesselTrack, NewsItem, Assessment } from './types';
import { createFlights, createVessels, ASSESSMENTS, NEWS_FEED } from './simulated-data';

// API base — uses the public API endpoint
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.agenttownsquare.com';
const SSE_URL = `${API_BASE}/v1/panopticon/stream`;

// ─── Connection State ────────────────────────────────────

export type StreamStatus = 'connecting' | 'connected' | 'disconnected' | 'fallback';

interface AgentStatus {
  name: string;
  status: 'ACTIVE' | 'OFFLINE' | 'ERROR';
  lastUpdate: number;
  itemCount: number;
}

// ─── Hook Return Type ────────────────────────────────────

interface PanopticonStreamData {
  flights: FlightTrack[];
  vessels: VesselTrack[];
  news: NewsItem[];
  assessments: Assessment[];
  agentStatuses: Record<string, AgentStatus>;
  streamStatus: StreamStatus;
  isLive: boolean;
  stats: {
    messagesReceived: number;
    lastEventTime: number;
    activeAgents: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────

/** Map backend vessel types to frontend VesselTrack types */
function mapVesselType(
  raw: string
): 'carrier' | 'escort' | 'commercial' | 'adversary' | 'tanker' {
  switch (raw) {
    case 'naval':     return 'escort';
    case 'tanker':    return 'tanker';
    case 'cargo':     return 'commercial';
    case 'fishing':   return 'commercial';
    case 'adversary': return 'adversary';
    default:          return 'commercial';
  }
}

// ─── Main Hook ───────────────────────────────────────────

export function usePanopticonStream(tick: number): PanopticonStreamData {
  // Live data state
  const [liveFlights, setLiveFlights] = useState<FlightTrack[]>([]);
  const [liveVessels, setLiveVessels] = useState<VesselTrack[]>([]);
  const [liveNews, setLiveNews] = useState<NewsItem[]>([]);
  const [liveAssessments, setLiveAssessments] = useState<Assessment[]>([]);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('connecting');
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});

  // Stats tracking
  const messagesReceived = useRef(0);
  const lastEventTime = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);

  // ─── SSE Event Handlers ──────────────────────────────

  const handleFlightsEvent = useCallback((data: any) => {
    const items: FlightTrack[] = (data.items || []).map((f: any) => ({
      id: f.id || f.callsign || 'UNK',
      callsign: f.callsign || f.id || 'UNK',
      type: f.type || 'civilian',
      lat: f.lat,
      lon: f.lon,
      alt: f.alt || 0,
      heading: f.heading || 0,
      speed: f.speed || 0,
      aircraft: f.aircraft || 'Unknown',
      source: f.source || 'opensky',
      trustScore: f.trustScore || f.trust_score || 70,
    }));

    if (items.length > 0) {
      setLiveFlights(items);
      setAgentStatuses(prev => ({
        ...prev,
        skywatch: { name: 'SKYWATCH', status: 'ACTIVE', lastUpdate: Date.now(), itemCount: items.length },
      }));
    }
  }, []);

  const handleNewsEvent = useCallback((data: any) => {
    const items: NewsItem[] = (data.items || []).map((n: any) => ({
      time: n.time || new Date().toISOString().slice(11, 16) + ' UTC',
      source: n.source || 'Unknown',
      trust: n.trust || n.trust_score || 50,
      type: n.type || 'BREAKING',
      text: n.text || n.title || '',
      url: n.url,
    }));

    if (items.length > 0) {
      // Merge with existing, keeping most recent at top, deduped
      setLiveNews(prev => {
        const existing = new Set(prev.map(n => n.text));
        const newItems = items.filter(n => !existing.has(n.text));
        return [...newItems, ...prev].slice(0, 30); // Keep 30 most recent
      });
      setAgentStatuses(prev => ({
        ...prev,
        gazette: { name: 'GAZETTE', status: 'ACTIVE', lastUpdate: Date.now(), itemCount: items.length },
      }));
    }
  }, []);

  const handleOfficialEvent = useCallback((data: any) => {
    const items: NewsItem[] = (data.items || []).map((n: any) => ({
      time: n.time || new Date().toISOString().slice(11, 16) + ' UTC',
      source: n.source || 'FAA NOTAM',
      trust: n.trust || 92,
      type: n.type || 'OFFICIAL',
      text: n.text || '',
    }));

    if (items.length > 0) {
      // Merge official items into the news feed
      setLiveNews(prev => {
        const existing = new Set(prev.map(n => n.text));
        const newItems = items.filter(n => !existing.has(n.text));
        return [...newItems, ...prev].slice(0, 30);
      });
      setAgentStatuses(prev => ({
        ...prev,
        herald: { name: 'HERALD', status: 'ACTIVE', lastUpdate: Date.now(), itemCount: items.length },
      }));
    }
  }, []);

  const handleVesselsEvent = useCallback((data: any) => {
    const items: VesselTrack[] = (data.items || []).map((v: any) => ({
      id: v.id || v.name || 'UNK',
      name: v.name || 'Unknown Vessel',
      type: mapVesselType(v.type),
      lat: v.lat,
      lon: v.lon,
      classification: v.classification || '',
      flag: v.flag,
      speed: v.speed,
      heading: v.heading,
      source: v.source === 'aisstream' ? 'ais' : (v.source || 'simulated'),
      trustScore: v.trustScore || v.trust_score || 70,
    }));

    if (items.length > 0) {
      setLiveVessels(items);
      setAgentStatuses(prev => ({
        ...prev,
        neptune: { name: 'NEPTUNE', status: 'ACTIVE', lastUpdate: Date.now(), itemCount: items.length },
      }));
    }
  }, []);

  const handleSnapshotEvent = useCallback((data: any) => {
    // Initial state snapshot from server
    if (data.flights?.length) handleFlightsEvent({ items: data.flights });
    if (data.news?.length) handleNewsEvent({ items: data.news });
    if (data.official?.length) handleOfficialEvent({ items: data.official });
    if (data.vessels?.length) handleVesselsEvent({ items: data.vessels });
  }, [handleFlightsEvent, handleNewsEvent, handleOfficialEvent, handleVesselsEvent]);

  // ─── SSE Connection Manager ──────────────────────────

  const connect = useCallback(() => {
    // Don't reconnect if already connected
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStreamStatus('connecting');

    try {
      const es = new EventSource(SSE_URL);
      eventSourceRef.current = es;

      es.addEventListener('connected', () => {
        setStreamStatus('connected');
        reconnectAttempts.current = 0;
      });

      es.addEventListener('snapshot', (e) => {
        try {
          const data = JSON.parse(e.data);
          handleSnapshotEvent(data);
          messagesReceived.current++;
          lastEventTime.current = Date.now();
        } catch (err) { /* ignore parse errors */ }
      });

      es.addEventListener('flights', (e) => {
        try {
          const data = JSON.parse(e.data);
          handleFlightsEvent(data);
          messagesReceived.current++;
          lastEventTime.current = Date.now();
        } catch (err) { /* ignore */ }
      });

      es.addEventListener('news', (e) => {
        try {
          const data = JSON.parse(e.data);
          handleNewsEvent(data);
          messagesReceived.current++;
          lastEventTime.current = Date.now();
        } catch (err) { /* ignore */ }
      });

      es.addEventListener('official', (e) => {
        try {
          const data = JSON.parse(e.data);
          handleOfficialEvent(data);
          messagesReceived.current++;
          lastEventTime.current = Date.now();
        } catch (err) { /* ignore */ }
      });

      es.addEventListener('notams', (e) => {
        try {
          const data = JSON.parse(e.data);
          handleOfficialEvent(data);
          messagesReceived.current++;
          lastEventTime.current = Date.now();
        } catch (err) { /* ignore */ }
      });

      es.addEventListener('vessels', (e) => {
        try {
          const data = JSON.parse(e.data);
          handleVesselsEvent(data);
          messagesReceived.current++;
          lastEventTime.current = Date.now();
        } catch (err) { /* ignore */ }
      });

      es.addEventListener('heartbeat', () => {
        lastEventTime.current = Date.now();
      });

      es.addEventListener('error', (e) => {
        // SSE auto-reconnects, but track state
        if (es.readyState === EventSource.CLOSED) {
          setStreamStatus('disconnected');
          scheduleReconnect();
        }
      });

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          setStreamStatus('disconnected');
          scheduleReconnect();
        }
      };

    } catch {
      setStreamStatus('fallback');
    }
  }, [handleSnapshotEvent, handleFlightsEvent, handleNewsEvent, handleOfficialEvent, handleVesselsEvent]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) return;

    reconnectAttempts.current++;
    // Exponential backoff: 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(2000 * Math.pow(2, reconnectAttempts.current - 1), 30000);

    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;

      // After 5 failed attempts, fall back to simulated data
      if (reconnectAttempts.current > 5) {
        setStreamStatus('fallback');
        return;
      }

      connect();
    }, delay);
  }, [connect]);

  // ─── Lifecycle ───────────────────────────────────────

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };
  }, [connect]);

  // ─── Compute Output ──────────────────────────────────
  // Use live data when available, fall back to simulated

  const isLive = streamStatus === 'connected' && liveFlights.length > 0;

  // For flights: use live data if available, otherwise animate simulated
  const flights = isLive ? liveFlights : createFlights(tick * 100);

  // For vessels: use live NEPTUNE data if available, otherwise simulated
  const vessels = liveVessels.length > 0 ? liveVessels : createVessels(tick * 100);

  // For news: merge live + static, preferring live
  const news = liveNews.length > 0 ? liveNews : NEWS_FEED;

  // Assessments: use live if available, otherwise static
  const assessments = liveAssessments.length > 0 ? liveAssessments : ASSESSMENTS;

  const activeAgents = Object.values(agentStatuses).filter(a => a.status === 'ACTIVE').length;

  return {
    flights,
    vessels,
    news,
    assessments,
    agentStatuses,
    streamStatus,
    isLive,
    stats: {
      messagesReceived: messagesReceived.current,
      lastEventTime: lastEventTime.current,
      activeAgents,
    },
  };
}
