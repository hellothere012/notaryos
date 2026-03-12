'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  Zap,
  Globe,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { authClient, API_ENDPOINTS } from '../../config/api';
import { ActivityRow, type ActivityItem } from './ActivityRow';

type TypeFilter = 'all' | 'forge' | 'osint' | 'verification';

interface ActivityStats {
  totalReceipts: number;
  forgeCount: number;
  osintCount: number;
  otherCount: number;
  validRate: number;
}

export const ActivityPage: React.FC = () => {
  // Data
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<ActivityStats | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Filters
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch stats ──────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const resp = await authClient.get(API_ENDPOINTS.activityStats);
      setStats(resp.data);
    } catch {
      // Stats are non-critical — fail silently
    }
  }, []);

  // ── Fetch activity items ─────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        page_size: pageSize,
      };

      // Map type filter to action_type_prefix
      if (typeFilter === 'forge') {
        params.action_type_prefix = 'forge';
      } else if (typeFilter === 'osint') {
        params.action_type_prefix = 'panopticon';
      } else if (typeFilter === 'verification') {
        // For "verification", we exclude forge/panopticon on the frontend
        // since the backend doesn't support "NOT prefix" filtering.
        // We still fetch all and filter client-side for this category.
      }

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const resp = await authClient.get(API_ENDPOINTS.history, { params });

      if (resp.data.items) {
        let fetchedItems: ActivityItem[] = resp.data.items;

        // Client-side filter for "verification" (everything that's not forge/panopticon)
        if (typeFilter === 'verification') {
          fetchedItems = fetchedItems.filter(
            (i) =>
              !i.actionType.startsWith('forge') &&
              !i.actionType.startsWith('panopticon'),
          );
        }

        setItems(fetchedItems);
        setTotalPages(resp.data.totalPages || 1);
        setTotalItems(resp.data.total || 0);
      } else {
        setItems([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (err: any) {
      console.error('Failed to fetch activity:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load activity');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, typeFilter, searchQuery, startDate, endDate]);

  // Initial fetch
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, searchQuery, startDate, endDate]);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearch !== searchQuery) return;
  }, [debouncedSearch, searchQuery]);

  const clearFilters = () => {
    setTypeFilter('all');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    typeFilter !== 'all' || searchQuery || startDate || endDate;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto w-full overflow-x-hidden">
      {/* Gradient Hero Header */}
      <div className="relative mb-8 px-6 py-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
            Activity
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            All your receipts across Forge, Panopticon, and verifications
          </p>
        </div>
      </div>

      {/* Stats Banner */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={<Activity className="w-4 h-4" />}
            label="Total Receipts"
            value={stats.totalReceipts.toLocaleString()}
            color="text-purple-400"
            bg="bg-purple-500/10"
          />
          <StatCard
            icon={<Zap className="w-4 h-4" />}
            label="Forge Sessions"
            value={stats.forgeCount.toLocaleString()}
            color="text-orange-400"
            bg="bg-orange-500/10"
          />
          <StatCard
            icon={<Globe className="w-4 h-4" />}
            label="OSINT Assessments"
            value={stats.osintCount.toLocaleString()}
            color="text-cyan-400"
            bg="bg-cyan-500/10"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Verification Rate"
            value={`${stats.validRate}%`}
            color="text-green-400"
            bg="bg-green-500/10"
          />
        </div>
      )}

      {/* Filters Bar */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by receipt hash, agent, or type..."
              className="input-field pl-10 py-2"
            />
          </div>

          {/* Type Filter Tabs */}
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
            {(
              [
                { key: 'all', label: 'All', icon: null },
                { key: 'forge', label: 'Forge', icon: Zap },
                { key: 'osint', label: 'OSINT', icon: Globe },
                { key: 'verification', label: 'Verify', icon: ShieldCheck },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setTypeFilter(tab.key)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                    typeFilter === tab.key
                      ? tab.key === 'forge'
                        ? 'bg-orange-600 text-white'
                        : tab.key === 'osint'
                          ? 'bg-cyan-600 text-white'
                          : tab.key === 'verification'
                            ? 'bg-green-600 text-white'
                            : 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* More Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost flex items-center gap-2 ${showFilters ? 'text-purple-400' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-purple-500" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Extended Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-gray-700/50">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-400">Date Range:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="input-field py-1.5 text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="input-field py-1.5 text-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="card flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading activity...</p>
          </div>
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">Failed to load activity</h3>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchItems}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        </motion.div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {hasActiveFilters ? 'No Results Found' : 'No Activity Yet'}
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Try adjusting your filters or search query.'
              : 'Your activity will appear here once you start using Forge, Panopticon, or the verification API.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* List Header */}
          <div className="flex items-center justify-between px-4">
            <span className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
            </span>
            <button
              onClick={fetchItems}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {/* Items */}
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${bg} border border-gray-700/30`}>
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        {icon}
        <span className="text-xs font-medium text-gray-400">{label}</span>
      </div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
