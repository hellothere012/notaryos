'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  Activity,
  Gauge,
  Zap,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';
import { authClient } from '@/lib/api-client';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const USAGE_CURRENT = '/v1/usage/current';
const USAGE_HISTORY = '/v1/usage/history';
const USAGE_SUMMARY = '/v1/usage/summary';

const TIME_RANGE_OPTIONS = [7, 30, 90] as const;

/* -------------------------------------------------------------------------- */
/*  Animation variants                                                        */
/* -------------------------------------------------------------------------- */

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface CurrentUsage {
  api_calls: number;
  receipts_issued: number;
  verifications: number;
  rate_limit_remaining?: number;
  rate_limit_total?: number;
}

interface HistoryDataPoint {
  date: string;
  receipts: number;
  api_calls: number;
  verifications: number;
}

interface UsageSummary {
  tier: string;
  included_allowances: {
    receipts: number;
    verifications: number;
    api_calls: number;
  };
  current_period_start?: string;
  current_period_end?: string;
  total_receipts?: number;
  total_api_calls?: number;
  total_verifications?: number;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Format an ISO date string into a compact M/D label for chart axes.
 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * Custom Recharts tooltip styled for the dark theme.
 */
function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  UsageBar sub-component                                                    */
/* -------------------------------------------------------------------------- */

const UsageBar: React.FC<{ label: string; used: number; limit: number }> = ({
  label,
  used,
  limit,
}) => {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color =
    pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-purple-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  StatCard sub-component                                                    */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{label}</span>
        <Icon className="w-5 h-5 text-purple-400" />
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Skeleton loader                                                           */
/* -------------------------------------------------------------------------- */

function SkeletonCards() {
  return (
    <div className="space-y-8">
      {/* Stat card skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 animate-pulse"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-20 bg-gray-700 rounded" />
              <div className="h-5 w-5 bg-gray-700 rounded" />
            </div>
            <div className="h-9 w-24 bg-gray-700 rounded mb-1" />
            <div className="h-3 w-32 bg-gray-700/50 rounded" />
          </div>
        ))}
      </div>
      {/* Chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 animate-pulse"
          >
            <div className="h-4 w-32 bg-gray-700 rounded mb-4" />
            <div className="h-[280px] bg-gray-700/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export const UsageDashboard: React.FC = () => {
  /* ---- State ---- */
  const [currentUsage, setCurrentUsage] = useState<CurrentUsage | null>(null);
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30);

  /* ---- Data fetching ---- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [currentRes, historyRes, summaryRes] = await Promise.all([
        authClient.get(USAGE_CURRENT),
        authClient.get(USAGE_HISTORY, {
          params: { days: timeRange, granularity: 'daily' },
        }),
        authClient.get(USAGE_SUMMARY),
      ]);

      setCurrentUsage(currentRes.data);
      setHistoryData(
        historyRes.data?.data_points ||
          historyRes.data?.history ||
          [],
      );
      setSummary(summaryRes.data);
    } catch (err: any) {
      console.error('Failed to fetch usage data:', err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          'Unable to load usage data. Make sure you are signed in.',
      );
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- Derived values ---- */
  const apiCalls = currentUsage?.api_calls ?? 0;
  const receiptsIssued =
    currentUsage?.receipts_issued ?? summary?.total_receipts ?? 0;
  const verifications =
    currentUsage?.verifications ?? summary?.total_verifications ?? 0;

  const rateLimitTotal = currentUsage?.rate_limit_total ?? 1000;
  const rateLimitRemaining = currentUsage?.rate_limit_remaining ?? rateLimitTotal;
  const rateLimitUsedPct =
    rateLimitTotal > 0
      ? Math.round(((rateLimitTotal - rateLimitRemaining) / rateLimitTotal) * 100)
      : 0;

  /* ---- Render ---- */
  return (
    <div className="max-w-6xl mx-auto w-full overflow-x-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-purple-400" />
              Usage Analytics
            </h1>
            <p className="text-gray-400 mt-1">
              Monitor your API usage and receipt activity
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Time range selector */}
            {TIME_RANGE_OPTIONS.map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === days
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {days}d
              </button>
            ))}

            {/* Refresh */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCcw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Error state ────────────────────────────────────────── */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gray-800/50 border border-gray-700/50 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">
                Failed to load usage data
              </h3>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        </motion.div>
      )}

      {/* ── Loading skeleton ───────────────────────────────────── */}
      {loading && <SkeletonCards />}

      {/* ── Dashboard content ──────────────────────────────────── */}
      {!loading && !error && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* ── Section 1: Stat Cards ──────────────────────────── */}
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <StatCard
              label="API Calls"
              value={apiCalls.toLocaleString()}
              subtitle="Current billing period"
              icon={Activity}
            />
            <StatCard
              label="Receipts Issued"
              value={receiptsIssued.toLocaleString()}
              subtitle="Sealed this period"
              icon={Zap}
            />
            <StatCard
              label="Verifications"
              value={verifications.toLocaleString()}
              subtitle="Receipt lookups"
              icon={TrendingUp}
            />
            <StatCard
              label="Rate Limit"
              value={`${rateLimitUsedPct}%`}
              subtitle={`${rateLimitRemaining.toLocaleString()} remaining`}
              icon={Gauge}
            />
          </motion.div>

          {/* ── Section 2: Charts ──────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receipts Issued - Bar Chart */}
            <motion.div
              variants={fadeInUp}
              className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6"
            >
              <h3 className="text-sm font-medium text-gray-400 mb-4">
                Receipts Issued
              </h3>
              {historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickFormatter={formatDate}
                    />
                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar
                      dataKey="receipts"
                      name="Receipts"
                      fill="#8B5CF6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center">
                  <p className="text-gray-500 text-sm">
                    No receipt data for this period
                  </p>
                </div>
              )}
            </motion.div>

            {/* API Calls - Line Chart */}
            <motion.div
              variants={fadeInUp}
              className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6"
            >
              <h3 className="text-sm font-medium text-gray-400 mb-4">
                API Calls
              </h3>
              {historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickFormatter={formatDate}
                    />
                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="api_calls"
                      name="API Calls"
                      stroke="#06B6D4"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, stroke: '#06B6D4', fill: '#1F2937' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center">
                  <p className="text-gray-500 text-sm">
                    No API call data for this period
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Section 3: Plan Usage / Tier Info ──────────────── */}
          <motion.div
            variants={fadeInUp}
            className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-gray-400">Plan Usage</h3>
              {summary?.current_period_end && (
                <span className="text-xs text-gray-500">
                  Resets{' '}
                  {new Date(summary.current_period_end).toLocaleDateString(
                    'en-US',
                    { month: 'short', day: 'numeric', year: 'numeric' },
                  )}
                </span>
              )}
            </div>

            {/* Tier badge */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-lg font-semibold text-white">
                {summary?.tier || 'Free'} Plan
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  summary?.tier === 'enterprise'
                    ? 'bg-purple-500/20 text-purple-400'
                    : summary?.tier === 'pro'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-gray-700 text-gray-400'
                }`}
              >
                {summary?.tier === 'enterprise'
                  ? 'Enterprise'
                  : summary?.tier === 'pro'
                    ? 'Pro'
                    : 'Free Tier'}
              </span>
            </div>

            {/* Usage progress bars */}
            <div className="space-y-4">
              <UsageBar
                label="Receipts"
                used={receiptsIssued}
                limit={summary?.included_allowances?.receipts ?? 100}
              />
              <UsageBar
                label="Verifications"
                used={verifications}
                limit={summary?.included_allowances?.verifications ?? 500}
              />
              <UsageBar
                label="API Calls"
                used={apiCalls}
                limit={summary?.included_allowances?.api_calls ?? 1000}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
