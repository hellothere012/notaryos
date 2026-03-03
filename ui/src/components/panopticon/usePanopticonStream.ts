'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON — Real-Time OSINT Data Hook
// ═══════════════════════════════════════════════════════════
// Connects to the backend SSE stream (/v1/panopticon/stream)
// for live OSINT data from HERALD, GAZETTE, SKYWATCH, and
// NEPTUNE agents. Returns empty arrays when no data is available.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import type { FlightTrack, VesselTrack, NewsItem, Assessment } from './types';

// API base — uses the public API endpoint
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.agenttownsquare.com';
const SSE_URL = `${API_BASE}/v1/panopticon/stream`;

// ─── Connection State ────────────────────────────────────

export type StreamStatus = 'connecting' | 'connected' | 'disconnected';

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

  const handleAssessmentsEvent = useCallback((data: any) => {
    const items: Assessment[] = (data.items || []).map((a: any) => ({
      id: a.id || `assess-${Date.now()}`,
      time: a.time || new Date().toISOString().slice(11, 16) + ' UTC',
      level: a.level || 'LOW',
      title: a.title || 'Assessment',
      summary: a.summary || '',
      sources: a.sources || [],
      confidence: a.confidence ?? 50,
      aiConsensus: a.aiConsensus || a.ai_consensus || '',
      dagHash: a.dagHash || a.dag_hash || '',
    }));

    if (items.length > 0) {
      setLiveAssessments(items);
      setAgentStatuses(prev => ({
        ...prev,
        fusion: { name: 'FUSION', status: 'ACTIVE', lastUpdate: Date.now(), itemCount: items.length },
      }));
    }
  }, []);

  const handleSnapshotEvent = useCallback((data: any) => {
    // Initial state snapshot from server
    if (data.flights?.length) handleFlightsEvent({ items: data.flights });
    if (data.news?.length) handleNewsEvent({ items: data.news });
    if (data.official?.length) handleOfficialEvent({ items: data.official });
    if (data.vessels?.length) handleVesselsEvent({ items: data.vessels });
    if (data.assessments?.length) handleAssessmentsEvent({ items: data.assessments });
  }, [handleFlightsEvent, handleNewsEvent, handleOfficialEvent, handleVesselsEvent, handleAssessmentsEvent]);

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

      es.addEventListener('assessments', (e) => {
        try {
          const data = JSON.parse(e.data);
          handleAssessmentsEvent(data);
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
      setStreamStatus('disconnected');
    }
  }, [handleSnapshotEvent, handleFlightsEvent, handleNewsEvent, handleOfficialEvent, handleVesselsEvent, handleAssessmentsEvent]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) return;

    reconnectAttempts.current++;
    // Exponential backoff: 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(2000 * Math.pow(2, reconnectAttempts.current - 1), 30000);

    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;

      // After 10 failed attempts, stop retrying
      if (reconnectAttempts.current > 10) {
        setStreamStatus('disconnected');
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
  // Live data only — empty arrays when no data is available

  const isLive = streamStatus === 'connected';

  const activeAgents = Object.values(agentStatuses).filter(a => a.status === 'ACTIVE').length;

  return {
    flights: liveFlights,
    vessels: liveVessels,
    news: liveNews,
    assessments: liveAssessments,
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
