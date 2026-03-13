'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { RiskBadge } from '../shared/RiskBadge';
import type { AgentActivityItem } from '../types';

interface Props {
  items: AgentActivityItem[];
  total: number;
  totalPages: number;
  page: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export const ActivityTab: React.FC<Props> = ({
  items,
  total,
  totalPages,
  page,
  isLoading,
  onPageChange,
}) => {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">&#128196;</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Activity Yet</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Agent activity will appear here once your agent starts performing actions
          and receipts are sealed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 px-2 mb-3">
        {total} total actions
      </div>

      {items.map((item) => (
        <div key={item.id}>
          <div
            onClick={() => setExpanded(expanded === item.id ? null : item.id)}
            className={`px-4 py-3 rounded-lg border cursor-pointer transition-all ${
              expanded === item.id
                ? 'bg-gray-800/80 border-cyan-500/30'
                : 'bg-gray-800/40 border-gray-700/50 hover:border-gray-600/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.groundingStatus === 'grounded' ? 'bg-green-400' : 'bg-orange-400'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-sm text-white font-medium truncate">
                    {item.actionType}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {item.agentId} &middot;{' '}
                    {item.timestamp
                      ? new Date(item.timestamp).toLocaleString()
                      : 'Unknown time'}
                  </div>
                </div>
              </div>
              <RiskBadge risk={item.riskLevel} />
            </div>
          </div>

          {expanded === item.id && (
            <div className="px-4 py-3 bg-gray-800/60 border border-t-0 border-cyan-500/20 rounded-b-lg -mt-px">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Receipt: </span>
                  <span className="text-cyan-400 font-mono">
                    {item.receiptHash?.slice(0, 16)}...
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Status: </span>
                  <span className={item.groundingStatus === 'grounded' ? 'text-green-400' : 'text-orange-400'}>
                    {(item.groundingStatus || 'grounded').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={`/r/${item.receiptHash}`}
                  className="text-[10px] font-semibold text-cyan-400 border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 rounded hover:bg-cyan-500/20 transition-colors"
                >
                  View Receipt
                </a>
              </div>
            </div>
          )}
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
