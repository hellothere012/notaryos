// ═══════════════════════════════════════════════════════════
// PANOPTICON — TypeScript Type Definitions
// ═══════════════════════════════════════════════════════════

export interface GeoCoord {
  lat: number;
  lon: number;
}

export interface FlightTrack {
  id: string;
  callsign: string;
  type: 'tanker' | 'strike' | 'bomber' | 'isr' | 'adversary' | 'transport' | 'civilian';
  lat: number;
  lon: number;
  alt: number;
  heading: number;
  speed: number;
  aircraft: string;
  source: 'adsb_exchange' | 'opensky' | 'simulated';
  trustScore: number;
}

export interface VesselTrack {
  id: string;
  name: string;
  type: 'carrier' | 'escort' | 'commercial' | 'adversary' | 'tanker';
  lat: number;
  lon: number;
  classification: string;
  flag?: string;
  speed?: number;
  heading?: number;
  source: 'ais' | 'marine_traffic' | 'simulated';
  trustScore: number;
}

export interface NewsItem {
  time: string;
  source: string;
  trust: number;
  text: string;
  type?: 'FLASH' | 'OFFICIAL' | 'BREAKING' | 'GEOINT' | 'OSINT' | 'ANALYSIS';
  url?: string;
}

export interface AssessmentSource {
  name: string;
  type: string;
  receiptHash?: string;
}

export interface Assessment {
  id: string;
  time: string;
  level: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'LOW';
  title: string;
  summary: string;
  sources: string[];
  confidence: number;
  aiConsensus: string;
  dagHash: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  desc: string;
  status: 'ACTIVE' | 'MONITORING' | 'PROCESSING' | 'OFFLINE' | 'ERROR';
  alerts: number;
  color: string;
  layer: string;
  trustScore: number;
  natoReliability: string;
}

export interface MissileRoute {
  from: GeoCoord & { name: string };
  to: GeoCoord & { name: string };
  color: string;
}

export interface LayerVisibility {
  flights: boolean;
  vessels: boolean;
  social: boolean;
  satellite: boolean;
  news: boolean;
  official: boolean;
  missiles: boolean;
}

export type ProjectedPoint = { x: number; y: number } | null;
