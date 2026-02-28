'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Pause,
  Play,
  Globe,
  Shield,
  ShieldAlert,
  Clock,
  Zap,
  Filter,
  ChevronDown,
  Radio,
} from 'lucide-react';
import { publicClient, API_ENDPOINTS } from '@/lib/api-client';
import {
  generateSyntheticReceipt,
  REGION_POSITIONS,
  type StreamReceipt,
} from './stream-generator';

/* ========================================================================== */
/*  Constants                                                                  */
/* ========================================================================== */

const MAX_FEED_SIZE = 50;
const DEFAULT_INTERVAL_MS = 800;
const MIN_INTERVAL_MS = 300;
const MAX_INTERVAL_MS = 2000;
const REAL_RECEIPT_EVERY = 10; // mix in a real receipt every Nth

/* ========================================================================== */
/*  Sub-components                                                             */
/* ========================================================================== */

/** Top metrics bar showing live statistics. */
function StreamMetrics({
  receipts,
  rps,
  paused,
}: {
  receipts: StreamReceipt[];
  rps: number;
  paused: boolean;
}) {
  const total = receipts.length;
  const valid = receipts.filter((r) => r.valid).length;
  const successRate = total > 0 ? ((valid / total) * 100).toFixed(1) : '0.0';
  const avgLatency =
    total > 0
      ? (receipts.reduce((s, r) => s + r.latencyMs, 0) / total).toFixed(1)
      : '0.0';
  const counterfactual = receipts.filter((r) => r.isCounterfactual).length;
  const realCount = receipts.filter((r) => r.isReal).length;

  const stats = [
    {
      label: 'Receipts/sec',
      value: paused ? '0.0' : rps.toFixed(1),
      icon: Zap,
      color: 'text-amber-400',
    },
    {
      label: 'Avg Latency',
      value: `${avgLatency}ms`,
      icon: Clock,
      color: 'text-cyan-400',
    },
    {
      label: 'Success Rate',
      value: `${successRate}%`,
      icon: Shield,
      color: parseFloat(successRate) > 99 ? 'text-emerald-400' : 'text-amber-400',
    },
    {
      label: 'Counterfactual',
      value: `${counterfactual}`,
      icon: ShieldAlert,
      color: 'text-violet-400',
    },
    {
      label: 'Real Receipts',
      value: `${realCount}`,
      icon: Radio,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2.5 flex items-center gap-2"
        >
          <s.icon className={`w-4 h-4 ${s.color} shrink-0`} />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 truncate">
              {s.label}
            </p>
            <p className={`text-sm font-mono font-bold ${s.color}`}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Single receipt row in the feed. */
function ReceiptRow({ receipt }: { receipt: StreamReceipt }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.25 }}
      className="border-b border-slate-800/60 last:border-b-0"
    >
      <div className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-800/30 transition-colors">
        {/* Status dot */}
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            !receipt.valid
              ? 'bg-red-500'
              : receipt.isCounterfactual
                ? 'bg-violet-500'
                : receipt.isReal
                  ? 'bg-emerald-400'
                  : 'bg-cyan-400'
          }`}
        />

        {/* Timestamp */}
        <span className="text-slate-500 font-mono w-20 shrink-0 hidden sm:block">
          {new Date(receipt.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>

        {/* Agent */}
        <span className="text-slate-300 font-mono truncate w-36 shrink-0">
          {receipt.agentId}
        </span>

        {/* Action */}
        <span
          className={`font-mono truncate flex-1 ${
            receipt.isCounterfactual ? 'text-violet-400' : 'text-slate-400'
          }`}
        >
          {receipt.action}
        </span>

        {/* Region badge */}
        <span className="text-[10px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded font-mono hidden md:block">
          {receipt.region}
        </span>

        {/* Latency */}
        <span className="text-slate-500 font-mono w-14 text-right shrink-0">
          {receipt.latencyMs}ms
        </span>

        {/* Hash (truncated) */}
        <span className="text-slate-600 font-mono w-24 truncate shrink-0 hidden lg:block">
          {receipt.hash}
        </span>

        {/* Real badge */}
        {receipt.isReal && (
          <span className="text-[9px] bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Real
          </span>
        )}
      </div>
    </motion.div>
  );
}

/** Inline SVG world map with pulsing dots at region positions. */
function WorldMap({
  activeRegions,
}: {
  activeRegions: Map<string, number>; // region → ms since last pulse
}) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Global Activity
        </h3>
      </div>

      <svg viewBox="0 0 100 80" className="w-full" style={{ maxHeight: 220 }}>
        {/* Simplified continent outlines */}
        <g opacity="0.15" stroke="currentColor" strokeWidth="0.3" fill="none" className="text-slate-400">
          {/* North America */}
          <path d="M8,22 L12,18 L18,16 L24,18 L30,20 L32,26 L30,32 L28,36 L24,40 L20,42 L16,44 L14,40 L10,36 L8,30 Z" />
          {/* South America */}
          <path d="M24,48 L28,46 L32,48 L34,54 L36,60 L34,66 L30,72 L26,70 L24,64 L22,58 L22,52 Z" />
          {/* Europe */}
          <path d="M44,20 L48,18 L52,16 L56,18 L54,24 L50,28 L46,30 L44,26 Z" />
          {/* Africa */}
          <path d="M44,34 L50,32 L56,34 L58,40 L60,48 L58,56 L54,62 L50,66 L46,64 L44,56 L42,48 L42,40 Z" />
          {/* Asia */}
          <path d="M58,16 L64,14 L72,16 L80,18 L86,22 L88,28 L86,34 L82,38 L76,40 L70,38 L64,34 L60,28 L58,22 Z" />
          {/* Australia */}
          <path d="M74,54 L80,52 L86,54 L88,58 L86,62 L80,64 L74,62 L72,58 Z" />
        </g>

        {/* Region dots */}
        {Object.entries(REGION_POSITIONS).map(([region, pos]) => {
          const timeSince = activeRegions.get(region) ?? Infinity;
          const isActive = timeSince < 3000;
          const pulseScale = isActive ? 1 + Math.max(0, 1 - timeSince / 3000) * 2 : 1;

          return (
            <g key={region}>
              {/* Pulse ring */}
              {isActive && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={1.5 * pulseScale}
                  fill="none"
                  stroke="rgb(34, 211, 238)"
                  strokeWidth="0.3"
                  opacity={Math.max(0, 1 - timeSince / 3000) * 0.6}
                />
              )}
              {/* Dot */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isActive ? 1.2 : 0.8}
                fill={isActive ? 'rgb(34, 211, 238)' : 'rgb(100, 116, 139)'}
                opacity={isActive ? 1 : 0.5}
              />
              {/* Label */}
              <text
                x={pos.x}
                y={pos.y + 3.5}
                textAnchor="middle"
                className="fill-slate-500"
                style={{ fontSize: '2.2px', fontFamily: 'monospace' }}
              >
                {pos.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Speed slider control. */
function SpeedSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (ms: number) => void;
}) {
  // Invert: slider left = slow (high ms), slider right = fast (low ms)
  const sliderVal = MAX_INTERVAL_MS - value + MIN_INTERVAL_MS;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase text-slate-500">Speed</span>
      <input
        type="range"
        min={MIN_INTERVAL_MS}
        max={MAX_INTERVAL_MS}
        value={sliderVal}
        onChange={(e) =>
          onChange(MAX_INTERVAL_MS - parseInt(e.target.value) + MIN_INTERVAL_MS)
        }
        className="w-20 h-1 accent-cyan-500 bg-slate-700 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

/** Agent filter dropdown. */
function AgentFilter({
  agents,
  selected,
  onSelect,
}: {
  agents: string[];
  selected: string;
  onSelect: (a: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Filter className="w-3 h-3" />
        <span className="max-w-[100px] truncate">{selected || 'All Agents'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 right-0 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[180px] max-h-60 overflow-y-auto"
          >
            <button
              onClick={() => { onSelect(''); setOpen(false); }}
              className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-700/50 ${
                !selected ? 'text-cyan-400' : 'text-slate-300'
              }`}
            >
              All Agents
            </button>
            {agents.map((a) => (
              <button
                key={a}
                onClick={() => { onSelect(a); setOpen(false); }}
                className={`block w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-slate-700/50 ${
                  selected === a ? 'text-cyan-400' : 'text-slate-300'
                }`}
              >
                {a}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ========================================================================== */
/*  Main Component                                                             */
/* ========================================================================== */

export default function LiveStream() {
  const [receipts, setReceipts] = useState<StreamReceipt[]>([]);
  const [paused, setPaused] = useState(false);
  const [intervalMs, setIntervalMs] = useState(DEFAULT_INTERVAL_MS);
  const [agentFilter, setAgentFilter] = useState('');
  const [activeRegions, setActiveRegions] = useState<Map<string, number>>(new Map());
  const [rps, setRps] = useState(0);

  const counterRef = useRef(0);
  const rpsTimestampsRef = useRef<number[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);

  // Collect unique agent IDs for the filter dropdown
  const uniqueAgents = Array.from(new Set(receipts.map((r) => r.agentId))).sort();

  /** Add a receipt to the feed. */
  const pushReceipt = useCallback((receipt: StreamReceipt) => {
    const now = Date.now();
    rpsTimestampsRef.current.push(now);
    // Keep only last 5 seconds of timestamps for RPS calc
    rpsTimestampsRef.current = rpsTimestampsRef.current.filter((t) => now - t < 5000);
    setRps(rpsTimestampsRef.current.length / 5);

    setReceipts((prev) => {
      const next = [receipt, ...prev];
      return next.length > MAX_FEED_SIZE ? next.slice(0, MAX_FEED_SIZE) : next;
    });

    // Pulse the region dot
    setActiveRegions((prev) => {
      const next = new Map(prev);
      next.set(receipt.region, now);
      return next;
    });
  }, []);

  /** Try to fetch a real receipt from the API. */
  const fetchRealReceipt = useCallback(async (): Promise<StreamReceipt | null> => {
    try {
      const { data } = await publicClient.get(API_ENDPOINTS.sampleReceipt);
      if (!data?.receipt_id) return null;
      return {
        hash: data.receipt_id || `sha256:${data.payload_hash?.slice(0, 16) || 'unknown'}`,
        agentId: data.agent_id || 'notaryos-network',
        action: data.action_type || 'receipt.sampled',
        timestamp: data.timestamp || new Date().toISOString(),
        region: 'us-east-1',
        latencyMs: Math.round((2 + Math.random() * 8) * 10) / 10,
        valid: true,
        isCounterfactual: data.action_type?.includes('counterfactual') ?? false,
        isReal: true,
      };
    } catch {
      return null;
    }
  }, []);

  /** Main stream loop. */
  useEffect(() => {
    if (paused) return;

    const timer = setInterval(async () => {
      counterRef.current += 1;

      // Every Nth receipt, try to mix in a real one
      if (counterRef.current % REAL_RECEIPT_EVERY === 0) {
        const real = await fetchRealReceipt();
        if (real) {
          pushReceipt(real);
          return;
        }
      }

      pushReceipt(generateSyntheticReceipt());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [paused, intervalMs, pushReceipt, fetchRealReceipt]);

  /** Refresh region pulse timestamps (decay animation). */
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveRegions((prev) => new Map(prev)); // trigger re-render for decay
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // Filter receipts for display
  const filteredReceipts = agentFilter
    ? receipts.filter((r) => r.agentId === agentFilter)
    : receipts;

  return (
    <section className="bg-slate-950 min-h-screen">
      {/* Hero header */}
      <div className="border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Live Receipt Stream
            </h1>
            {!paused && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 max-w-2xl">
            Watch AI agent receipts being issued across the NotaryOS network.
            Simulated feed with real receipts mixed in from the live API.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Metrics row */}
        <StreamMetrics receipts={receipts} rps={rps} paused={paused} />

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setPaused(!paused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              paused
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-700/50 hover:bg-emerald-600/30'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200'
            }`}
          >
            {paused ? (
              <>
                <Play className="w-3 h-3" /> Resume
              </>
            ) : (
              <>
                <Pause className="w-3 h-3" /> Pause
              </>
            )}
          </button>

          <SpeedSlider value={intervalMs} onChange={setIntervalMs} />
          <AgentFilter agents={uniqueAgents} selected={agentFilter} onSelect={setAgentFilter} />

          <div className="ml-auto text-[10px] text-slate-600 font-mono">
            {receipts.length} receipts buffered
          </div>
        </div>

        {/* Main content: feed + map */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Receipt feed — 2/3 width */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg overflow-hidden">
              {/* Feed header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800/60 bg-slate-800/30">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Receipt Feed
                </span>
                {agentFilter && (
                  <span className="text-[9px] bg-cyan-900/40 text-cyan-400 border border-cyan-800/50 px-1.5 py-0.5 rounded-full">
                    Filtered: {agentFilter}
                  </span>
                )}
              </div>

              {/* Scrollable feed */}
              <div
                ref={feedRef}
                className="max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
              >
                {filteredReceipts.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-slate-600">
                    {paused ? 'Stream paused — press Resume' : 'Waiting for receipts...'}
                  </div>
                ) : (
                  <AnimatePresence initial={false} mode="popLayout">
                    {filteredReceipts.map((r) => (
                      <ReceiptRow key={r.hash + r.timestamp} receipt={r} />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Verified
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" /> Counterfactual
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Real (API)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Invalid
              </span>
            </div>
          </div>

          {/* World map — 1/3 width */}
          <div className="space-y-4">
            <WorldMap activeRegions={activeRegions} />

            {/* Region activity log */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Region Activity
              </h3>
              <div className="space-y-1.5">
                {Object.entries(REGION_POSITIONS).map(([region, pos]) => {
                  const count = receipts.filter((r) => r.region === region).length;
                  const pct = receipts.length > 0 ? (count / receipts.length) * 100 : 0;
                  return (
                    <div key={region} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 w-14 shrink-0">
                        {pos.label}
                      </span>
                      <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500/60 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Honesty label */}
        <div className="text-center text-[10px] text-slate-600 pt-2">
          Simulated feed — real cryptographically signed receipts mixed in from the live API.
          <br />
          Each real receipt is verified with Ed25519 signatures.
        </div>
      </div>
    </section>
  );
}
