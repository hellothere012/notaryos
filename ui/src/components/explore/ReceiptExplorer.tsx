'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Copy,
  Clock,
  Hash,
  Bot,
  FileText,
  X,
  Loader2,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { publicClient, API_ENDPOINTS } from '@/lib/api-client';
import { ReceiptDetailDrawer } from './ReceiptDetailDrawer';

/* ========================================================================== */
/*  Constants & Helpers                                                        */
/* ========================================================================== */

const PAGE_SIZE = 20;

/** Common action types with display colours. */
const ACTION_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'forge.run', label: 'forge.run' },
  { value: 'seal', label: 'seal' },
  { value: 'verify', label: 'verify' },
  { value: 'panopticon.assessment', label: 'panopticon.assessment' },
];

/**
 * Returns a Tailwind colour class pair for a given action type string.
 * Used for the badge background and text.
 */
function actionTypeBadgeClasses(actionType: string): string {
  if (actionType.startsWith('forge'))
    return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
  if (actionType === 'seal')
    return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  if (actionType === 'verify')
    return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
  if (actionType.startsWith('panopticon'))
    return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
}

/**
 * Format a timestamp string into a human-readable relative description
 * (e.g. "3 minutes ago", "2 hours ago", "5 days ago").
 */
function relativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  if (isNaN(then)) return timestamp;

  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

/** Truncate a hash string to a given visible length with ellipsis. */
function truncateHash(hash: string, len = 12): string {
  if (!hash || hash.length <= len) return hash || '';
  return hash.slice(0, len) + '...';
}

/* ========================================================================== */
/*  Main Component                                                             */
/* ========================================================================== */

export const ReceiptExplorer: React.FC = () => {
  /* ---- state ---- */
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copyHash, setCopyHash] = useState<string | null>(null);

  /* ---- refs ---- */
  const searchInputRef = useRef<HTMLInputElement>(null);

  /* ---- debounced search ---- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  /* Reset to page 1 whenever filters change */
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, actionTypeFilter]);

  /* ---- fetch receipts ---- */
  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: PAGE_SIZE,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (actionTypeFilter) params.action_type = actionTypeFilter;

      const res = await publicClient.get(API_ENDPOINTS.explore, { params });
      setReceipts(res.data.items || []);
      setTotalPages(res.data.totalPages || res.data.total_pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch receipts:', err);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, actionTypeFilter]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  /* ---- row click -> open detail drawer ---- */
  const handleRowClick = async (receiptHash: string) => {
    try {
      const res = await publicClient.get(API_ENDPOINTS.publicReceiptLookup(receiptHash));
      setSelectedReceipt(res.data);
      setDrawerOpen(true);
    } catch (err) {
      console.error('Failed to fetch receipt details:', err);
    }
  };

  /* ---- copy hash to clipboard ---- */
  const handleCopyHash = (e: React.MouseEvent, hash: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopyHash(hash);
    setTimeout(() => setCopyHash(null), 2000);
  };

  /* ---- export helpers ---- */
  const exportData = (format: 'csv' | 'json') => {
    if (receipts.length === 0) return;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(receipts, null, 2)], {
        type: 'application/json',
      });
      downloadBlob(blob, 'receipts.json');
    } else {
      const headers = [
        'receipt_hash',
        'action_type',
        'agent_id',
        'timestamp',
        'valid',
      ];
      const rows = receipts.map((r) =>
        headers
          .map((h) => {
            const val = r[h] ?? '';
            // Escape double quotes and wrap in quotes for CSV safety
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(','),
      );
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      downloadBlob(blob, 'receipts.csv');
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* ---- clear all filters ---- */
  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setActionTypeFilter('');
    setPage(1);
  };

  const hasActiveFilters =
    search !== '' || statusFilter !== 'all' || actionTypeFilter !== '';

  /* ---- pagination helpers ---- */
  const startItem = receipts.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endItem = Math.min(page * PAGE_SIZE, total);

  /* ==================================================================== */
  /*  Render                                                                */
  /* ==================================================================== */

  return (
    <section className="bg-slate-950 min-h-screen">
      {/* ---------------------------------------------------------------- */}
      {/*  Hero Header                                                      */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-2">
            <Hash className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Receipt Explorer
            </h1>
            <span className="badge-purple text-xs font-mono">
              {total.toLocaleString()} receipts
            </span>
          </div>
          <p className="text-sm text-slate-500 max-w-2xl">
            Browse and verify cryptographic receipts on the NotaryOS chain.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ---------------------------------------------------------------- */}
        {/*  Search & Filter Bar                                              */}
        {/* ---------------------------------------------------------------- */}
        <div className="card">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by hash, agent, or action..."
                className="input-field pl-10 py-2 text-sm"
              />
            </div>

            {/* Status filter toggle buttons */}
            <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
              {(['all', 'valid', 'invalid'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                    statusFilter === s
                      ? s === 'valid'
                        ? 'bg-green-600 text-white'
                        : s === 'invalid'
                          ? 'bg-red-600 text-white'
                          : 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {s === 'valid' && <CheckCircle className="w-3.5 h-3.5" />}
                  {s === 'invalid' && <XCircle className="w-3.5 h-3.5" />}
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Action type dropdown */}
            <div className="relative">
              <select
                value={actionTypeFilter}
                onChange={(e) => setActionTypeFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer"
              >
                {ACTION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Export buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => exportData('csv')}
                disabled={receipts.length === 0}
                className="btn-ghost flex items-center gap-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                title="Export current page as CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                CSV
              </button>
              <button
                onClick={() => exportData('json')}
                disabled={receipts.length === 0}
                className="btn-ghost flex items-center gap-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                title="Export current page as JSON"
              >
                <FileJson className="w-3.5 h-3.5" />
                JSON
              </button>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/*  Results                                                          */}
        {/* ---------------------------------------------------------------- */}
        {loading ? (
          /* Loading skeleton */
          <div className="card flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Loading receipts...</p>
            </div>
          </div>
        ) : receipts.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-20"
          >
            <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {hasActiveFilters ? 'No receipts match your search' : 'No receipts found'}
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query.'
                : 'Receipts will appear here as they are issued on the network.'}
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
          <div className="space-y-3">
            {/* Showing X-Y of Z */}
            <div className="flex items-center justify-between px-1 text-sm text-gray-500">
              <span>
                Showing {startItem}--{endItem} of{' '}
                {total.toLocaleString()} receipts
              </span>
            </div>

            {/* ---- Desktop Table ---- */}
            <div className="hidden md:block bg-gray-900/60 border border-gray-800/60 rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_0.8fr_0.8fr_0.7fr_80px_40px] gap-3 px-4 py-3 border-b border-gray-800/60 bg-gray-800/30 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3" />
                  Receipt Hash
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  Action
                </span>
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3 h-3" />
                  Agent
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Time
                </span>
                <span>Status</span>
                <span />
              </div>

              {/* Table rows */}
              <AnimatePresence initial={false} mode="popLayout">
                {receipts.map((receipt, idx) => {
                  const hash =
                    receipt.receipt_hash ||
                    receipt.receipt_id ||
                    receipt.hash ||
                    '';
                  const isValid =
                    receipt.valid ??
                    receipt.signature_ok ??
                    true;

                  return (
                    <motion.div
                      key={hash + idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: idx * 0.02 }}
                      onClick={() => handleRowClick(hash)}
                      className="grid grid-cols-[1fr_0.8fr_0.8fr_0.7fr_80px_40px] gap-3 px-4 py-3 border-b border-gray-800/40 last:border-b-0 hover:bg-gray-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Hash */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-sm text-gray-300 truncate">
                          {truncateHash(hash)}
                        </span>
                        <button
                          onClick={(e) => handleCopyHash(e, hash)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          title="Copy hash"
                        >
                          {copyHash === hash ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
                          )}
                        </button>
                      </div>

                      {/* Action Type badge */}
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionTypeBadgeClasses(
                            receipt.action_type || '',
                          )}`}
                        >
                          {receipt.action_type || 'unknown'}
                        </span>
                      </div>

                      {/* Agent */}
                      <div className="flex items-center min-w-0">
                        <span className="font-mono text-sm text-gray-400 truncate">
                          {truncateHash(receipt.agent_id || '', 16)}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center">
                        <span
                          className="text-sm text-gray-500"
                          title={receipt.timestamp || ''}
                        >
                          {receipt.timestamp
                            ? relativeTime(receipt.timestamp)
                            : '--'}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center">
                        {isValid ? (
                          <span className="badge-success text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Valid
                          </span>
                        ) : (
                          <span className="badge-error text-xs">
                            <XCircle className="w-3 h-3 mr-1" />
                            Invalid
                          </span>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center justify-end">
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors" />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* ---- Mobile Cards ---- */}
            <div className="md:hidden space-y-3">
              <AnimatePresence initial={false} mode="popLayout">
                {receipts.map((receipt, idx) => {
                  const hash =
                    receipt.receipt_hash ||
                    receipt.receipt_id ||
                    receipt.hash ||
                    '';
                  const isValid =
                    receipt.valid ??
                    receipt.signature_ok ??
                    true;

                  return (
                    <motion.div
                      key={hash + idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: idx * 0.02 }}
                      onClick={() => handleRowClick(hash)}
                      className="card cursor-pointer hover:border-purple-500/30 transition-all"
                    >
                      {/* Top row: hash + status */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm text-gray-300">
                          {truncateHash(hash)}
                        </span>
                        {isValid ? (
                          <span className="badge-success text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Valid
                          </span>
                        ) : (
                          <span className="badge-error text-xs">
                            <XCircle className="w-3 h-3 mr-1" />
                            Invalid
                          </span>
                        )}
                      </div>

                      {/* Bottom row: action type + time */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionTypeBadgeClasses(
                            receipt.action_type || '',
                          )}`}
                        >
                          {receipt.action_type || 'unknown'}
                        </span>
                        <span
                          className="text-xs text-gray-500"
                          title={receipt.timestamp || ''}
                        >
                          {receipt.timestamp
                            ? relativeTime(receipt.timestamp)
                            : '--'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* ---- Pagination ---- */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, totalPages) },
                    (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-purple-600 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/*  Detail Drawer                                                    */}
      {/* ---------------------------------------------------------------- */}
      <ReceiptDetailDrawer
        receipt={selectedReceipt}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedReceipt(null);
        }}
        onNavigate={handleRowClick}
      />
    </section>
  );
};
