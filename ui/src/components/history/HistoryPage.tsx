import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Search,
  Filter,
  Download,
  Loader2,
  AlertCircle,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileJson,
  FileSpreadsheet,
  ShieldCheck,
  ShieldX,
  X,
} from 'lucide-react';
import { authClient, API_ENDPOINTS } from '../../config/api';
import { VerificationHistoryItem, HistoryFilters, PaginatedResponse } from '../../types';
import { HistoryRow } from './HistoryRow';

type StatusFilter = 'all' | 'valid' | 'invalid';

export const HistoryPage: React.FC = () => {
  // Data state
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        page_size: pageSize,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await authClient.get(API_ENDPOINTS.history, { params });

      // Handle both paginated and array responses
      if (response.data.items) {
        const paginatedData: PaginatedResponse<VerificationHistoryItem> = response.data;
        setHistory(paginatedData.items);
        setTotalPages(paginatedData.totalPages);
        setTotalItems(paginatedData.total);
      } else if (Array.isArray(response.data)) {
        setHistory(response.data);
        setTotalPages(1);
        setTotalItems(response.data.length);
      } else {
        setHistory([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (err: any) {
      console.error('Failed to fetch history:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery, startDate, endDate]);

  // Initial fetch
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, startDate, endDate]);

  // Handle search with debounce
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearch !== searchQuery) return;
    // Trigger fetch when debounced search changes
  }, [debouncedSearch]);

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || searchQuery || startDate || endDate;

  // Export data
  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);

    try {
      const params: Record<string, string> = { format };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await authClient.get(`${API_ENDPOINTS.history}/export`, {
        params,
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `verification-history.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export failed:', err);
      setError('Failed to export history');
    } finally {
      setIsExporting(false);
    }
  };

  // Count by status
  const validCount = history.filter((h) => h.isValid).length;
  const invalidCount = history.filter((h) => !h.isValid).length;

  return (
    <div className="max-w-5xl mx-auto w-full overflow-x-hidden">
      {/* Gradient Hero Header */}
      <div className="relative mb-8 px-6 py-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
              Verification History
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              View and search your past verification attempts
            </p>
          </div>

          {/* Export Dropdown */}
          <div className="relative group flex-shrink-0">
            <button
              disabled={isExporting || history.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/80 border border-gray-700/50 text-gray-300 hover:text-white hover:border-violet-500/50 text-sm font-medium transition-all disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
            </button>
          <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2 rounded-t-lg"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2 rounded-b-lg"
            >
              <FileJson className="w-4 h-4" />
              Export as JSON
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Filters Bar */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by receipt hash..."
              className="input-field pl-10 py-2"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('valid')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                statusFilter === 'valid'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Valid
            </button>
            <button
              onClick={() => setStatusFilter('invalid')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                statusFilter === 'invalid'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ShieldX className="w-3.5 h-3.5" />
              Invalid
            </button>
          </div>

          {/* More Filters Toggle */}
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

          {/* Clear Filters */}
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
                      placeholder="Start date"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="input-field py-1.5 text-sm"
                      placeholder="End date"
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
        /* Loading State */
        <div className="card flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading verification history...</p>
          </div>
        </div>
      ) : error ? (
        /* Error State */
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
              <h3 className="text-white font-medium">Failed to load history</h3>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchHistory}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        </motion.div>
      ) : history.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {hasActiveFilters ? 'No Results Found' : 'No Verification History'}
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Try adjusting your filters or search query to find what you are looking for.'
              : 'Your verification history will appear here once you start verifying receipts.'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-secondary inline-flex items-center gap-2">
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </motion.div>
      ) : (
        /* History List */
        <div className="space-y-4">
          {/* List Header */}
          <div className="flex items-center justify-between px-4">
            <span className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
            </span>
            <button
              onClick={fetchHistory}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {/* History Items */}
          <AnimatePresence mode="popLayout">
            {history.map((item) => (
              <HistoryRow key={item.id} item={item} />
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
