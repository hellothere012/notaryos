'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { CounterfactualTree } from '../shared/CounterfactualTree';
import type { DecisionTreeItem } from '../types';

interface Props {
  items: DecisionTreeItem[];
  total: number;
  totalPages: number;
  page: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export const DecisionsTab: React.FC<Props> = ({
  items,
  total,
  totalPages,
  page,
  isLoading,
  onPageChange,
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);

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
          <span className="text-2xl">&#9878;</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Decision Trees</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          When your agent&apos;s actions are denied, counterfactual receipts will appear
          here as proof of what was NOT done.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-6">
        <span className="text-lg">&#9878;</span>
        <div>
          <div className="text-sm text-white font-medium">
            {total} counterfactual receipt{total !== 1 ? 's' : ''} sealed
          </div>
          <div className="text-[11px] text-gray-400">
            Cryptographic proof of actions NOT taken
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.receiptHash}>
            <div
              onClick={() =>
                setExpanded(expanded === item.receiptHash ? null : item.receiptHash)
              }
              className={`px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                expanded === item.receiptHash
                  ? 'bg-gray-800/80 border-purple-500/30'
                  : 'bg-gray-800/40 border-gray-700/50 hover:border-gray-600/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <div className="min-w-0">
                    <div className="text-sm text-white font-medium truncate">
                      {item.actionNotTaken}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {item.agentId} &middot;{' '}
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleString()
                        : 'Unknown time'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded">
                  {item.commitRevealPhase || 'sealed'}
                </span>
              </div>
            </div>

            {expanded === item.receiptHash && (
              <div className="px-4 py-3 bg-gray-800/60 border border-t-0 border-purple-500/20 rounded-b-lg -mt-px space-y-3">
                <CounterfactualTree
                  actionNotTaken={item.actionNotTaken}
                  decisionReason={item.decisionReason}
                  receiptHash={item.receiptHash}
                />

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Grounding: </span>
                    <span
                      className={
                        item.groundingStatus === 'grounded'
                          ? 'text-green-400'
                          : 'text-orange-400'
                      }
                    >
                      {(item.groundingStatus || 'grounded').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Decision Hash: </span>
                    <span className="text-purple-400 font-mono">
                      {item.decisionHash?.slice(0, 12)}...
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/r/${item.receiptHash}`}
                    className="text-[10px] font-semibold text-purple-400 border border-purple-500/40 bg-purple-500/10 px-3 py-1 rounded hover:bg-purple-500/20 transition-colors"
                  >
                    View Counterfactual Receipt
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

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
