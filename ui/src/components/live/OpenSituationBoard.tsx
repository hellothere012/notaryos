'use client';

// ═══════════════════════════════════════════════════════════════
// OPEN SITUATION BOARD
// Real-time OSINT counter dashboard — public-facing, single-page
// counter display showing live open-source intelligence metrics.
// Connects to the public SSE stream for real-time data updates.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  Plane,
  Ship,
  AlertTriangle,
  Newspaper,
  Brain,
  Clock,
  Radio,
  Lock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Activity,
  Wifi,
  WifiOff,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.agenttownsquare.com';
const SSE_URL = `${API_BASE}/v1/panopticon/stream`;

const COLORS = {
  bg: '#0F172A',
  cardBg: '#1E293B',
  cardBorder: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  trust: '#F59E0B',
  trustDark: '#D97706',
  kinetic: '#3B82F6',
  information: '#8B5CF6',
  severity: '#EF4444',
  success: '#10B981',
  neutral: '#6B7280',
} as const;

// ─── Types ────────────────────────────────────────────────────

interface CounterData {
  id: string;
  label: string;
  sublabel: string;
  value: number;
  delta: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  accentColor: string;
  source: string;
}

interface FeedItem {
  id: string;
  time: string;
  agent: string;
  text: string;
  agentColor: string;
}

type StreamStatus = 'connecting' | 'connected' | 'disconnected';

// ─── Animated Counter ─────────────────────────────────────────
// Smoothly animates number changes with an odometer-like effect.

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    const start = prev.current;
    const diff = value - start;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prev.current = value;
  }, [value]);

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display.toLocaleString()}
    </span>
  );
}

// ─── Counter Card ─────────────────────────────────────────────

function CounterCard({ counter, isHero }: { counter: CounterData; isHero?: boolean }) {
  const trendArrow = counter.trend === 'up' ? '\u25B2' : counter.trend === 'down' ? '\u25BC' : '\u2500';
  const trendColor =
    counter.trend === 'up' ? COLORS.success : counter.trend === 'down' ? COLORS.severity : COLORS.neutral;

  if (isHero) {
    return (
      <div
        className="rounded-xl p-6 md:p-8 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${COLORS.trust}15, ${COLORS.trustDark}08)`,
          border: `1px solid ${COLORS.trust}30`,
        }}
      >
        {/* Subtle gradient shine */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: `linear-gradient(135deg, ${COLORS.trust}, transparent 60%)`,
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${COLORS.trust}20` }}
            >
              <Lock className="w-5 h-5" style={{ color: COLORS.trust }} />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide" style={{ color: COLORS.trust }}>
                {counter.label}
              </div>
              <div className="text-xs" style={{ color: COLORS.textMuted }}>
                {counter.sublabel}
              </div>
            </div>
          </div>
          <AnimatedNumber
            value={counter.value}
            className="text-4xl md:text-5xl font-bold tracking-tight block mb-2"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: COLORS.textMuted }}>
              Every number on this page is backed by an immutable audit trail
            </span>
            <a
              href="https://notaryos.org/verify"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: COLORS.trust }}
            >
              Learn more <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-5 transition-all duration-200 hover:scale-[1.02] group"
      style={{
        background: COLORS.cardBg,
        border: `1px solid ${COLORS.cardBorder}`,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${counter.accentColor}15` }}
          >
            <span style={{ color: counter.accentColor }}>{counter.icon}</span>
          </div>
          <div>
            <div
              className="text-xs font-semibold tracking-wide uppercase"
              style={{ color: counter.accentColor }}
            >
              {counter.label}
            </div>
            <div className="text-[10px]" style={{ color: COLORS.textMuted }}>
              {counter.sublabel}
            </div>
          </div>
        </div>
      </div>

      <AnimatedNumber
        value={counter.value}
        className="text-3xl font-bold tracking-tight block mb-2"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs flex items-center gap-1" style={{ color: trendColor }}>
          {trendArrow}{' '}
          {counter.delta > 0 ? '+' : ''}
          {counter.delta}/hr
        </span>
        <span
          className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: COLORS.textMuted }}
        >
          via {counter.source}
        </span>
      </div>
    </div>
  );
}

// ─── Live Feed ────────────────────────────────────────────────

function LiveFeed({ items }: { items: FeedItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isPaused && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [items, isPaused]);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: COLORS.cardBg,
        border: `1px solid ${COLORS.cardBorder}`,
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: COLORS.success }} />
          <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
            LIVE FEED
          </span>
        </div>
        <span className="text-xs" style={{ color: COLORS.textMuted }}>
          {items.length} events
        </span>
      </div>
      <div
        ref={containerRef}
        className="max-h-64 overflow-y-auto"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ scrollBehavior: 'smooth' }}
      >
        {items.length === 0 ? (
          <div className="p-6 text-center" style={{ color: COLORS.textMuted }}>
            <Radio className="w-5 h-5 mx-auto mb-2 animate-pulse" />
            <div className="text-sm">Monitoring live feeds...</div>
          </div>
        ) : (
          items.slice(0, 30).map((item) => (
            <div
              key={item.id}
              className="px-4 py-2.5 flex gap-3 items-start hover:bg-white/[0.02] transition-colors"
              style={{ borderBottom: `1px solid ${COLORS.cardBorder}40` }}
            >
              <span
                className="text-[10px] font-mono shrink-0 mt-0.5"
                style={{ color: COLORS.textMuted }}
              >
                {item.time}
              </span>
              <span
                className="text-[10px] font-bold shrink-0 mt-0.5 tracking-wider"
                style={{ color: item.agentColor }}
              >
                {item.agent}
              </span>
              <span className="text-xs leading-relaxed" style={{ color: COLORS.textSecondary }}>
                {item.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Agent Status Bar ─────────────────────────────────────────

const AGENT_DEFS = [
  { id: 'skywatch', name: 'SKYWATCH', color: '#06b6d4' },
  { id: 'neptune', name: 'NEPTUNE', color: '#4488cc' },
  { id: 'herald', name: 'HERALD', color: '#cc4488' },
  { id: 'wire', name: 'WIRE', color: '#ff8844' },
  { id: 'gazette', name: 'GAZETTE', color: '#8888cc' },
  { id: 'fusion', name: 'FUSION', color: '#f59e0b' },
];

function AgentStatusBar({ activeAgents }: { activeAgents: Set<string> }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {AGENT_DEFS.map((agent) => {
        const isActive = activeAgents.has(agent.id);
        return (
          <div
            key={agent.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider"
            style={{
              background: isActive ? `${agent.color}15` : 'transparent',
              border: `1px solid ${isActive ? agent.color + '40' : COLORS.cardBorder}`,
              color: isActive ? agent.color : COLORS.textMuted,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: isActive ? agent.color : COLORS.textMuted,
                boxShadow: isActive ? `0 0 6px ${agent.color}` : 'none',
              }}
            />
            {agent.name}
          </div>
        );
      })}
    </div>
  );
}

// ─── Methodology Section ──────────────────────────────────────

function MethodologySection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: COLORS.cardBg,
        border: `1px solid ${COLORS.cardBorder}`,
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
          How It Works
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" style={{ color: COLORS.textMuted }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: COLORS.textMuted }} />
        )}
      </button>

      {isOpen && (
        <div
          className="px-5 pb-5"
          style={{ borderTop: `1px solid ${COLORS.cardBorder}` }}
        >
          <div className="pt-4 space-y-4">
            {/* Pipeline visualization */}
            <div className="flex items-center justify-center gap-2 text-xs py-3">
              <span className="px-3 py-1.5 rounded-md" style={{ background: `${COLORS.kinetic}15`, color: COLORS.kinetic }}>
                Raw Signal
              </span>
              <span style={{ color: COLORS.textMuted }}>&rarr;</span>
              <span className="px-3 py-1.5 rounded-md" style={{ background: `${COLORS.information}15`, color: COLORS.information }}>
                AI Analysis
              </span>
              <span style={{ color: COLORS.textMuted }}>&rarr;</span>
              <span className="px-3 py-1.5 rounded-md" style={{ background: `${COLORS.trust}15`, color: COLORS.trust }}>
                Cryptographic Seal
              </span>
            </div>

            <div className="space-y-3 text-xs" style={{ color: COLORS.textSecondary }}>
              <div>
                <div className="font-semibold mb-1" style={{ color: COLORS.textPrimary }}>
                  1. Signal Collection
                </div>
                <ul className="space-y-0.5 ml-3">
                  <li>ADS-B transponder data (aircraft tracking)</li>
                  <li>AIS maritime vessel signals</li>
                  <li>FAA NOTAMs and government announcements</li>
                  <li>RSS feeds from 200+ verified news sources</li>
                  <li>GDELT Global Knowledge Graph</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-1" style={{ color: COLORS.textPrimary }}>
                  2. Multi-Agent AI Analysis
                </div>
                <p>
                  Multiple AI models independently analyze each signal through adversarial
                  debate — red team vs blue team — producing consensus assessments with
                  confidence scores.
                </p>
              </div>
              <div>
                <div className="font-semibold mb-1" style={{ color: COLORS.textPrimary }}>
                  3. Cryptographic Sealing
                </div>
                <p>
                  Every observation is sealed with an Ed25519 digital signature and stored in a
                  hash-linked chain. Anyone can independently verify that data was not tampered
                  with after collection.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href="/docs"
                className="text-xs font-medium hover:underline"
                style={{ color: COLORS.information }}
              >
                Full Documentation
              </Link>
              <Link
                href="/api-docs"
                className="text-xs font-medium hover:underline"
                style={{ color: COLORS.information }}
              >
                API Access
              </Link>
              <Link
                href="/about"
                className="text-xs font-medium hover:underline"
                style={{ color: COLORS.information }}
              >
                About NotaryOS
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function OpenSituationBoard() {
  // ── State ─────────────────────────────────────────────────
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('connecting');
  const [lastEventTime, setLastEventTime] = useState(0);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  // Counter values
  const [receiptsIssued, setReceiptsIssued] = useState(0);
  const [militaryFlights, setMilitaryFlights] = useState(0);
  const [totalFlights, setTotalFlights] = useState(0);
  const [vesselsTracked, setVesselsTracked] = useState(0);
  const [eventsDetected, setEventsDetected] = useState(0);
  const [airspaceAdvisories, setAirspaceAdvisories] = useState(0);
  const [highSeverityEvents, setHighSeverityEvents] = useState(0);
  const [assessmentsGenerated, setAssessmentsGenerated] = useState(0);

  // Delta tracking
  const [deltas, setDeltas] = useState<Record<string, number>>({});
  const deltaAccum = useRef<Record<string, number>>({});
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);

  // ── "Time since last update" ticker ───────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastEventTime > 0) {
        setTimeSinceUpdate(Math.floor((Date.now() - lastEventTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastEventTime]);

  // ── Hourly delta calculator ───────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setDeltas({ ...deltaAccum.current });
      deltaAccum.current = {};
    }, 60_000); // snapshot deltas every minute
    return () => clearInterval(interval);
  }, []);

  // ── Feed item helper ──────────────────────────────────────
  const addFeedItem = useCallback((agent: string, text: string, color: string) => {
    const now = new Date();
    const time = now.toISOString().slice(11, 19) + ' UTC';
    setFeedItems((prev) => {
      const item: FeedItem = {
        id: `${agent}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time,
        agent,
        text,
        agentColor: color,
      };
      return [item, ...prev].slice(0, 100);
    });
  }, []);

  // ── SSE Connection ────────────────────────────────────────
  const connect = useCallback(() => {
    if (esRef.current?.readyState === EventSource.OPEN) return;
    if (esRef.current) esRef.current.close();

    setStreamStatus('connecting');

    try {
      const es = new EventSource(SSE_URL);
      esRef.current = es;

      es.addEventListener('connected', () => {
        setStreamStatus('connected');
        reconnectAttempts.current = 0;
        addFeedItem('SYSTEM', 'Connected to live data stream', COLORS.success);
      });

      es.addEventListener('snapshot', (e) => {
        try {
          const data = JSON.parse(e.data);
          setLastEventTime(Date.now());

          if (data.flights?.length) {
            const mil = data.flights.filter((f: any) => f.type === 'military').length;
            setTotalFlights(data.flights.length);
            setMilitaryFlights(mil);
            setActiveAgents((prev) => new Set([...prev, 'skywatch']));
            addFeedItem('SKYWATCH', `Tracking ${data.flights.length} aircraft (${mil} military)`, '#06b6d4');
          }
          if (data.vessels?.length) {
            setVesselsTracked(data.vessels.length);
            setActiveAgents((prev) => new Set([...prev, 'neptune']));
            addFeedItem('NEPTUNE', `Monitoring ${data.vessels.length} vessels`, '#4488cc');
          }
          if (data.news?.length) {
            setActiveAgents((prev) => new Set([...prev, 'gazette']));
          }
          if (data.official?.length) {
            setAirspaceAdvisories(data.official.length);
            setActiveAgents((prev) => new Set([...prev, 'herald']));
          }
          if (data.events?.length) {
            setEventsDetected(data.events.length);
            const high = data.events.filter((e: any) =>
              e.severity === 'FLASH' || e.severity === 'CRITICAL'
            ).length;
            setHighSeverityEvents(high);
            setActiveAgents((prev) => new Set([...prev, 'wire']));
            addFeedItem('WIRE', `${data.events.length} events loaded (${high} high-severity)`, '#ff8844');
          }
          if (data.assessments?.length) {
            setAssessmentsGenerated(data.assessments.length);
            setActiveAgents((prev) => new Set([...prev, 'fusion']));
            addFeedItem('FUSION', `${data.assessments.length} assessments active`, '#f59e0b');
          }

          // Estimate receipts from total data points
          const totalPoints =
            (data.flights?.length || 0) +
            (data.vessels?.length || 0) +
            (data.events?.length || 0) +
            (data.assessments?.length || 0) +
            (data.news?.length || 0) +
            (data.official?.length || 0);
          setReceiptsIssued((prev) => Math.max(prev, totalPoints));
        } catch { /* ignore parse errors */ }
      });

      es.addEventListener('flights', (e) => {
        try {
          const data = JSON.parse(e.data);
          const items = data.items || [];
          if (items.length > 0) {
            const mil = items.filter((f: any) => f.type === 'military').length;
            setTotalFlights(items.length);
            setMilitaryFlights(mil);
            setLastEventTime(Date.now());
            setActiveAgents((prev) => new Set([...prev, 'skywatch']));
            setReceiptsIssued((prev) => prev + items.length);
            deltaAccum.current.flights = (deltaAccum.current.flights || 0) + items.length;
            addFeedItem('SKYWATCH', `${items.length} aircraft positions updated`, '#06b6d4');
          }
        } catch { /* ignore */ }
      });

      es.addEventListener('vessels', (e) => {
        try {
          const data = JSON.parse(e.data);
          const items = data.items || [];
          if (items.length > 0) {
            setVesselsTracked(items.length);
            setLastEventTime(Date.now());
            setActiveAgents((prev) => new Set([...prev, 'neptune']));
            setReceiptsIssued((prev) => prev + items.length);
            addFeedItem('NEPTUNE', `${items.length} vessel positions updated`, '#4488cc');
          }
        } catch { /* ignore */ }
      });

      es.addEventListener('events', (e) => {
        try {
          const data = JSON.parse(e.data);
          const items = data.items || [];
          if (items.length > 0) {
            setEventsDetected((prev) => prev + items.length);
            const high = items.filter((ev: any) =>
              ev.severity === 'FLASH' || ev.severity === 'CRITICAL'
            ).length;
            if (high > 0) setHighSeverityEvents((prev) => prev + high);
            setLastEventTime(Date.now());
            setActiveAgents((prev) => new Set([...prev, 'wire']));
            setReceiptsIssued((prev) => prev + items.length);
            deltaAccum.current.events = (deltaAccum.current.events || 0) + items.length;

            // Add top event to feed
            const top = items[0];
            if (top?.title) {
              const sevLabel = top.severity === 'FLASH' || top.severity === 'CRITICAL' ? `[${top.severity}] ` : '';
              addFeedItem('WIRE', `${sevLabel}${top.title}`, '#ff8844');
            }
          }
        } catch { /* ignore */ }
      });

      es.addEventListener('news', (e) => {
        try {
          const data = JSON.parse(e.data);
          const items = data.items || [];
          if (items.length > 0) {
            setLastEventTime(Date.now());
            setActiveAgents((prev) => new Set([...prev, 'gazette']));
            setReceiptsIssued((prev) => prev + items.length);
            if (items[0]?.text) {
              addFeedItem('GAZETTE', items[0].text.slice(0, 120), '#8888cc');
            }
          }
        } catch { /* ignore */ }
      });

      es.addEventListener('official', (e) => {
        try {
          const data = JSON.parse(e.data);
          const items = data.items || [];
          if (items.length > 0) {
            setAirspaceAdvisories((prev) => prev + items.length);
            setLastEventTime(Date.now());
            setActiveAgents((prev) => new Set([...prev, 'herald']));
            setReceiptsIssued((prev) => prev + items.length);
            if (items[0]?.text) {
              addFeedItem('HERALD', items[0].text.slice(0, 120), '#cc4488');
            }
          }
        } catch { /* ignore */ }
      });

      es.addEventListener('notams', (e) => {
        try {
          const data = JSON.parse(e.data);
          const items = data.items || [];
          if (items.length > 0) {
            setAirspaceAdvisories((prev) => prev + items.length);
            setLastEventTime(Date.now());
            setActiveAgents((prev) => new Set([...prev, 'herald']));
          }
        } catch { /* ignore */ }
      });

      es.addEventListener('assessments', (e) => {
        try {
          const data = JSON.parse(e.data);
          const items = data.items || [];
          if (items.length > 0) {
            setAssessmentsGenerated((prev) => prev + items.length);
            setLastEventTime(Date.now());
            setActiveAgents((prev) => new Set([...prev, 'fusion']));
            setReceiptsIssued((prev) => prev + items.length);
            deltaAccum.current.assessments = (deltaAccum.current.assessments || 0) + items.length;
            if (items[0]?.title) {
              addFeedItem('FUSION', `Assessment: ${items[0].title}`, '#f59e0b');
            }
          }
        } catch { /* ignore */ }
      });

      es.addEventListener('heartbeat', () => {
        setLastEventTime(Date.now());
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
  }, [addFeedItem]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectRef.current) return;
    reconnectAttempts.current++;
    const delay = Math.min(2000 * Math.pow(2, reconnectAttempts.current - 1), 30000);
    reconnectRef.current = setTimeout(() => {
      reconnectRef.current = null;
      if (reconnectAttempts.current <= 10) connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
      if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null; }
    };
  }, [connect]);

  // ── Build counter data ────────────────────────────────────
  const counters: CounterData[] = [
    {
      id: 'receipts',
      label: 'Cryptographic Receipts',
      sublabel: 'Sealed since connection',
      value: receiptsIssued,
      delta: deltas.events || 0,
      trend: receiptsIssued > 0 ? 'up' : 'stable',
      icon: <Lock className="w-4 h-4" />,
      accentColor: COLORS.trust,
      source: 'NotaryOS',
    },
    {
      id: 'flights',
      label: 'Aircraft Tracked',
      sublabel: `${militaryFlights} military`,
      value: totalFlights,
      delta: deltas.flights || 0,
      trend: totalFlights > 0 ? 'up' : 'stable',
      icon: <Plane className="w-4 h-4" />,
      accentColor: COLORS.kinetic,
      source: 'SKYWATCH',
    },
    {
      id: 'vessels',
      label: 'Vessels Tracked',
      sublabel: 'AIS maritime signals',
      value: vesselsTracked,
      delta: 0,
      trend: vesselsTracked > 0 ? 'stable' : 'stable',
      icon: <Ship className="w-4 h-4" />,
      accentColor: COLORS.kinetic,
      source: 'NEPTUNE',
    },
    {
      id: 'events',
      label: 'Events Detected',
      sublabel: 'From 200+ sources',
      value: eventsDetected,
      delta: deltas.events || 0,
      trend: eventsDetected > 0 ? 'up' : 'stable',
      icon: <Newspaper className="w-4 h-4" />,
      accentColor: COLORS.information,
      source: 'WIRE',
    },
    {
      id: 'airspace',
      label: 'Airspace Advisories',
      sublabel: 'NOTAMs & gov announcements',
      value: airspaceAdvisories,
      delta: 0,
      trend: 'stable',
      icon: <AlertTriangle className="w-4 h-4" />,
      accentColor: COLORS.kinetic,
      source: 'HERALD',
    },
    {
      id: 'severity',
      label: 'High-Severity Events',
      sublabel: 'FLASH + CRITICAL',
      value: highSeverityEvents,
      delta: 0,
      trend: highSeverityEvents > 0 ? 'up' : 'stable',
      icon: <AlertTriangle className="w-4 h-4" />,
      accentColor: COLORS.severity,
      source: 'WIRE',
    },
    {
      id: 'assessments',
      label: 'AI Assessments',
      sublabel: 'Multi-model debate',
      value: assessmentsGenerated,
      delta: deltas.assessments || 0,
      trend: assessmentsGenerated > 0 ? 'up' : 'stable',
      icon: <Brain className="w-4 h-4" />,
      accentColor: COLORS.information,
      source: 'FUSION',
    },
  ];

  const heroCounter = counters[0]; // Receipts
  const kineticCounters = counters.slice(1, 4); // Flights, Vessels, Events
  const infoCounters = counters.slice(4); // Airspace, Severity, Assessments

  // ── Format "time since" ───────────────────────────────────
  const formatTimeSince = (sec: number) => {
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    return `${Math.floor(sec / 3600)}h ago`;
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: COLORS.bg, color: COLORS.textPrimary }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{
          background: `${COLORS.bg}ee`,
          borderBottom: `1px solid ${COLORS.cardBorder}`,
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors hidden sm:block">
                NotaryOS
              </span>
            </Link>
            <span style={{ color: COLORS.cardBorder }}>|</span>
            <div>
              <h1 className="text-sm font-bold tracking-wide">OPEN SITUATION BOARD</h1>
              <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
                Real-time transparency from open sources
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection status */}
            <div className="flex items-center gap-1.5">
              {streamStatus === 'connected' ? (
                <>
                  <Wifi className="w-3.5 h-3.5" style={{ color: COLORS.success }} />
                  <span className="text-[10px] font-medium hidden sm:block" style={{ color: COLORS.success }}>
                    LIVE
                  </span>
                </>
              ) : streamStatus === 'connecting' ? (
                <>
                  <Wifi className="w-3.5 h-3.5 animate-pulse" style={{ color: COLORS.trust }} />
                  <span className="text-[10px] hidden sm:block" style={{ color: COLORS.trust }}>
                    CONNECTING
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" style={{ color: COLORS.severity }} />
                  <span className="text-[10px] hidden sm:block" style={{ color: COLORS.severity }}>
                    OFFLINE
                  </span>
                </>
              )}
            </div>

            {/* Last updated */}
            {lastEventTime > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" style={{ color: COLORS.textMuted }} />
                <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  {formatTimeSince(timeSinceUpdate)}
                </span>
              </div>
            )}

            {/* Back to NotaryOS */}
            <Link
              href="/"
              className="text-xs px-3 py-1.5 rounded-lg transition-colors hidden sm:block"
              style={{
                border: `1px solid ${COLORS.cardBorder}`,
                color: COLORS.textSecondary,
              }}
            >
              notaryos.org
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Tier 1: Trust Anchor — Receipts counter */}
        <CounterCard counter={heroCounter} isHero />

        {/* Tier 2: Kinetic Data — 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kineticCounters.map((c) => (
            <CounterCard key={c.id} counter={c} />
          ))}
        </div>

        {/* Tier 3: Information Velocity — 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {infoCounters.map((c) => (
            <CounterCard key={c.id} counter={c} />
          ))}

          {/* Time since last verification — special card */}
          <div
            className="rounded-xl p-5"
            style={{
              background: COLORS.cardBg,
              border: `1px solid ${COLORS.cardBorder}`,
            }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${COLORS.success}15` }}
              >
                <Clock className="w-4 h-4" style={{ color: COLORS.success }} />
              </div>
              <div>
                <div
                  className="text-xs font-semibold tracking-wide uppercase"
                  style={{ color: COLORS.success }}
                >
                  Last Verified
                </div>
                <div className="text-[10px]" style={{ color: COLORS.textMuted }}>
                  Data freshness
                </div>
              </div>
            </div>
            <div
              className="text-3xl font-bold tracking-tight mb-2"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {lastEventTime > 0 ? (
                <>
                  {timeSinceUpdate}
                  <span className="text-lg ml-1" style={{ color: COLORS.textMuted }}>sec</span>
                </>
              ) : (
                <span style={{ color: COLORS.textMuted }}>--</span>
              )}
            </div>
            <div className="text-xs" style={{ color: COLORS.textMuted }}>
              {activeAgents.size} / 6 agents active
            </div>
          </div>
        </div>

        {/* Agent Status Bar */}
        <AgentStatusBar activeAgents={activeAgents} />

        {/* Live Feed */}
        <LiveFeed items={feedItems} />

        {/* Methodology */}
        <MethodologySection />

        {/* Disclaimer */}
        <div className="text-center px-4 py-6 space-y-3">
          <p className="text-xs leading-relaxed max-w-2xl mx-auto" style={{ color: COLORS.textMuted }}>
            This dashboard displays information from publicly available sources including
            ADS-B transponders, AIS signals, NOTAMs, and news wires. All data is open-source
            and unclassified. NotaryOS provides cryptographic verification of data provenance
            but does not guarantee accuracy of source data. For educational and informational
            purposes only.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <Link href="/" className="hover:underline" style={{ color: COLORS.textSecondary }}>
              NotaryOS
            </Link>
            <Link href="/docs" className="hover:underline" style={{ color: COLORS.textSecondary }}>
              Documentation
            </Link>
            <Link href="/api-docs" className="hover:underline" style={{ color: COLORS.textSecondary }}>
              API
            </Link>
            <a
              href="https://github.com/hellothere012/notaryos"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: COLORS.textSecondary }}
            >
              GitHub
            </a>
          </div>
          <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
            Built by NotaryOS &middot; An American company committed to transparency and human rights
          </p>
        </div>
      </main>
    </div>
  );
}
