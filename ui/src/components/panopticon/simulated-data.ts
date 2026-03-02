// ================================================================
// PANOPTICON — Simulated OSINT Data (Phase 0 Mock Layer)
// ================================================================
// All hardcoded data for the simulation layer. Positions animate
// based on a time parameter `t` (milliseconds since epoch or
// arbitrary counter) so tracks move smoothly on the globe.
// ================================================================

import { FlightTrack, VesselTrack, NewsItem, Assessment } from './types';
import { TAU, LOCATIONS } from './constants';

// ----------------------------------------------------------------
// Flight Tracks — 8 aircraft orbiting / transiting the theater
// ----------------------------------------------------------------
export function createFlights(t: number): FlightTrack[] {
  // phase cycles every 60 seconds (60 000 ms) for smooth animation
  const phase = (t % 60000) / 60000;
  const angle = phase * TAU;

  return [
    // ---- TANKER ORBITS (racetrack patterns) --------------------
    {
      id: 'REACH442',
      callsign: 'REACH442',
      type: 'tanker',
      aircraft: 'KC-135R Stratotanker',
      lat: 25.5 + Math.sin(angle) * 0.3,
      lon: 57.0 + Math.cos(angle) * 0.5,
      alt: 28000,
      heading: 270 + Math.sin(angle) * 15,
      speed: 420,
      source: 'simulated',
      trustScore: 85,
    },
    {
      id: 'REACH718',
      callsign: 'REACH718',
      type: 'tanker',
      aircraft: 'KC-10A Extender',
      lat: 24.8 + Math.sin(angle + Math.PI) * 0.25,
      lon: 55.0 + Math.cos(angle + Math.PI) * 0.4,
      alt: 26000,
      heading: 90 + Math.sin(angle) * 10,
      speed: 440,
      source: 'simulated',
      trustScore: 85,
    },

    // ---- STRIKE PACKAGES (NE ingress headings) -----------------
    {
      id: 'DOOM31',
      callsign: 'DOOM31',
      type: 'strike',
      aircraft: 'F-15E Strike Eagle',
      lat: 27.0 + phase * 1.2,
      lon: 56.0 + phase * 0.8,
      alt: 35000,
      heading: 345,
      speed: 520,
      source: 'simulated',
      trustScore: 80,
    },
    {
      id: 'FURY12',
      callsign: 'FURY12',
      type: 'strike',
      aircraft: 'F/A-18E Super Hornet',
      lat: 26.0 + phase * 1.0,
      lon: 58.0 + phase * 0.6,
      alt: 38000,
      heading: 330,
      speed: 510,
      source: 'simulated',
      trustScore: 80,
    },

    // ---- ISR PLATFORMS (wide racetracks / HALE orbits) ----------
    {
      id: 'SNTRY60',
      callsign: 'SNTRY60',
      type: 'isr',
      aircraft: 'E-3G AWACS',
      lat: 24.5 + Math.sin(angle * 0.5) * 0.4,
      lon: 54.0 + Math.cos(angle * 0.5) * 0.8,
      alt: 32000,
      heading: 180 + Math.cos(angle * 0.5) * 20,
      speed: 360,
      source: 'simulated',
      trustScore: 90,
    },
    {
      id: 'FORTE12',
      callsign: 'FORTE12',
      type: 'isr',
      aircraft: 'RQ-4B Global Hawk',
      lat: 28.0 + Math.sin(angle * 0.3) * 1.5,
      lon: 55.0 + Math.cos(angle * 0.3) * 2.0,
      alt: 55000,
      heading: 90 + Math.cos(angle * 0.3) * 30,
      speed: 340,
      source: 'simulated',
      trustScore: 90,
    },

    // ---- BOMBER (long-range transit) ----------------------------
    {
      id: 'EPIC01',
      callsign: 'EPIC01',
      type: 'bomber',
      aircraft: 'B-2A Spirit',
      lat: 22.0 + phase * 2.5,
      lon: 62.0 - phase * 3.0,
      alt: 40000,
      heading: 315,
      speed: 475,
      source: 'simulated',
      trustScore: 75,
    },

    // ---- ADVERSARY (south-bound from Iranian airspace) ----------
    {
      id: 'IRGC_F4',
      callsign: 'IRGC_F4',
      type: 'adversary',
      aircraft: 'F-4E Phantom II',
      lat: 36.5 - phase * 2.0,
      lon: 50.0 + Math.sin(angle) * 0.3,
      alt: 15000,
      heading: 180 + Math.sin(angle) * 5,
      speed: 380,
      source: 'simulated',
      trustScore: 45,
    },
  ];
}

// ----------------------------------------------------------------
// Vessel Tracks — 6 ships drifting slowly through the theater
// ----------------------------------------------------------------
export function createVessels(t: number): VesselTrack[] {
  // drift cycles every 120 seconds for slow maritime movement
  const drift = (t % 120000) / 120000;
  const driftAngle = drift * TAU;

  return [
    // ---- CARRIER STRIKE GROUP ----------------------------------
    {
      id: 'CVN72',
      name: 'USS Abraham Lincoln',
      type: 'carrier',
      lat: 23.5 + Math.sin(driftAngle * 0.5) * 0.15,
      lon: 60.0 + Math.cos(driftAngle * 0.5) * 0.2,
      classification: 'Nimitz-class CVN',
      flag: 'US',
      speed: 18,
      heading: 270 + Math.sin(driftAngle) * 10,
      source: 'simulated',
      trustScore: 88,
    },
    {
      id: 'CG62',
      name: 'USS Chancellorsville',
      type: 'escort',
      lat: 23.65 + Math.sin(driftAngle * 0.5) * 0.15,
      lon: 59.85 + Math.cos(driftAngle * 0.5) * 0.2,
      classification: 'Ticonderoga-class CG',
      flag: 'US',
      speed: 18,
      heading: 270 + Math.sin(driftAngle) * 10,
      source: 'simulated',
      trustScore: 86,
    },
    {
      id: 'DDG89',
      name: 'USS Mustin',
      type: 'escort',
      lat: 23.3 + Math.sin(driftAngle * 0.5) * 0.15,
      lon: 60.2 + Math.cos(driftAngle * 0.5) * 0.2,
      classification: 'Arleigh Burke-class DDG',
      flag: 'US',
      speed: 18,
      heading: 270 + Math.sin(driftAngle) * 10,
      source: 'simulated',
      trustScore: 86,
    },

    // ---- COMMERCIAL SHIPPING -----------------------------------
    {
      id: 'TANKER1',
      name: 'MT Pacific Voyager',
      type: 'commercial',
      lat: 26.4 + drift * 0.1,
      lon: 56.5 - drift * 0.15,
      classification: 'Suezmax Tanker',
      flag: 'LR',
      speed: 12,
      heading: 220,
      source: 'simulated',
      trustScore: 70,
    },
    {
      id: 'TANKER2',
      name: 'MT Nordic Spirit',
      type: 'commercial',
      lat: 25.8 - drift * 0.08,
      lon: 56.8 + drift * 0.05,
      classification: 'VLCC',
      flag: 'PA',
      speed: 10,
      heading: 135,
      source: 'simulated',
      trustScore: 68,
    },

    // ---- ADVERSARY FAST ATTACK ---------------------------------
    {
      id: 'IRGC_FAC',
      name: 'IRGC Fast Attack',
      type: 'adversary',
      lat: 27.0 + Math.sin(driftAngle * 2) * 0.1,
      lon: 56.1 + Math.cos(driftAngle * 2) * 0.15,
      classification: 'Boghammar-class',
      flag: 'IR',
      speed: 35,
      heading: 200 + Math.sin(driftAngle * 3) * 30,
      source: 'simulated',
      trustScore: 40,
    },
  ];
}

// ----------------------------------------------------------------
// News Feed — 12 items reflecting Feb 28 - Mar 2 2026 Iran theater
// ----------------------------------------------------------------
export const NEWS_FEED: NewsItem[] = [
  {
    time: '14:52 UTC',
    source: 'Reuters',
    trust: 85,
    type: 'BREAKING',
    text: 'Israeli Air Force confirms large-scale strikes across 24 Iranian provinces',
  },
  {
    time: '14:38 UTC',
    source: 'CENTCOM',
    trust: 90,
    type: 'OFFICIAL',
    text: 'US Central Command confirms strike operations against Iranian military targets',
  },
  {
    time: '14:21 UTC',
    source: 'NPR',
    trust: 80,
    type: 'FLASH',
    text: '3 US service members killed \u2014 first American casualties in Iran theater',
  },
  {
    time: '13:55 UTC',
    source: 'Planet Labs',
    trust: 95,
    type: 'GEOINT',
    text: 'Satellite imagery confirms extensive damage at Natanz nuclear facility',
  },
  {
    time: '13:42 UTC',
    source: 'Al Jazeera',
    trust: 70,
    type: 'BREAKING',
    text: 'Iranian missiles strike Beit Shemesh, Haifa; Israeli Iron Dome overwhelmed',
  },
  {
    time: '13:28 UTC',
    source: 'Telegram',
    trust: 45,
    type: 'OSINT',
    text: 'Unverified: Farsi channels report IRGC mobilizing reserve forces near Bushehr',
  },
  {
    time: '13:15 UTC',
    source: 'Dubai Gov',
    trust: 85,
    type: 'OFFICIAL',
    text: 'Iranian drone debris damages Burj Al Arab facade; DXB airport suspends ops',
  },
  {
    time: '12:58 UTC',
    source: 'Rystad',
    trust: 80,
    type: 'ANALYSIS',
    text: 'Strait of Hormuz tanker transit drops to zero \u2014 effective naval blockade',
  },
  {
    time: '12:40 UTC',
    source: 'IDF Spox',
    trust: 75,
    type: 'OFFICIAL',
    text: 'IDF estimates Iran retains ~2,500 ballistic missiles after first wave',
  },
  {
    time: '12:22 UTC',
    source: 'X/OSINT',
    trust: 40,
    type: 'OSINT',
    text: 'Multiple accounts report secondary explosions at Isfahan uranium conversion',
  },
  {
    time: '12:05 UTC',
    source: 'IRNA',
    trust: 30,
    type: 'OFFICIAL',
    text: "Iranian state media: 'Armed forces in full readiness, response imminent'",
  },
  {
    time: '11:48 UTC',
    source: 'UBS Research',
    trust: 75,
    type: 'ANALYSIS',
    text: 'Analysis: Brent could exceed $120/bbl if Hormuz closure persists beyond 48hrs',
  },
];

// ----------------------------------------------------------------
// Fused Assessments — 3 multi-source intelligence assessments
// ----------------------------------------------------------------
export const ASSESSMENTS: Assessment[] = [
  {
    id: 'AST-001',
    time: '14:55 UTC',
    level: 'CRITICAL',
    title: 'Strait of Hormuz \u2014 Effective Naval Blockade',
    summary:
      'AIS data shows zero commercial transits through Hormuz in past 6 hours. ' +
      'IRGC fast-attack craft and mine-laying vessels detected in the strait. ' +
      'Combined with satellite confirmation of anti-ship missile batteries at Bandar Abbas, ' +
      'the strait is assessed as operationally closed to commercial shipping.',
    confidence: 0.92,
    sources: ['NEPTUNE (AIS)', 'SKYWATCH (ADS-B)', 'GAZETTE (Rystad)'],
    aiConsensus: '3/3 models agree: HIGH threat to global oil supply',
    dagHash: '0xAB12C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F4E8',
  },
  {
    id: 'AST-002',
    time: '14:40 UTC',
    level: 'HIGH',
    title: 'Iranian Retaliatory Capacity Assessment',
    summary:
      'Post-strike satellite imagery shows ~40% of known missile storage facilities damaged. ' +
      'However, hardened underground facilities at Fordow and Khorramabad appear intact. ' +
      'IDF estimates 2,500+ ballistic missiles remaining. ' +
      'OSINT channels report TEL movements in western Iran suggesting imminent second salvo.',
    confidence: 0.78,
    sources: ['SENTINEL (Sat)', 'HERALD (IDF)', 'VOXPOP (Telegram)'],
    aiConsensus: '2/3 models: SUSTAINED retaliatory capability',
    dagHash: '0x7F3E2A1B9C8D6E5F4A3B2C1D0E9F8A7B6C5D4E3',
  },
  {
    id: 'AST-003',
    time: '14:20 UTC',
    level: 'HIGH',
    title: 'Gulf State Civilian Infrastructure Under Attack',
    summary:
      'Confirmed drone debris impact on Burj Al Arab, Dubai. ' +
      'DXB airport operations suspended. ' +
      'Multiple social media reports of intercept attempts over Abu Dhabi and Doha. ' +
      'Gulf states requesting THAAD and Patriot reinforcements from CENTCOM.',
    confidence: 0.88,
    sources: ['GAZETTE (Multi)', 'VOXPOP (Social)', 'HERALD (Gov)'],
    aiConsensus: '3/3 models: DELIBERATE escalation against Gulf partners',
    dagHash: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
  },
];
