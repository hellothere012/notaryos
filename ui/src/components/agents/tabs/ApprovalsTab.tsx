'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { RiskBadge } from '../shared/RiskBadge';
import type { PendingAction } from '../types';

interface Props {
  items: PendingAction[];
  total: number;
  isLoading: boolean;
  onDecide: (actionId: number, decision: 'approved' | 'denied') => Promise<void>;
}

export const ApprovalsTab: React.FC<Props> = ({ items, total, isLoading, onDecide }) => {
  const [actionTaken, setActionTaken] = useState<Record<number, 'approved' | 'denied'>>({});
  const [processing, setProcessing] = useState<number | null>(null);

  const handleDecide = async (id: number, decision: 'approved' | 'denied') => {
    setProcessing(id);
    try {
      await onDecide(id, decision);
      setActionTaken(prev => ({ ...prev, [id]: decision }));
    } catch {
      // Error handled by parent
    } finally {
      setProcessing(null);
    }
  };

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
        <div className="text-4xl mb-3">&#9989;</div>
        <h3 className="text-lg font-semibold text-green-400 mb-1">All Caught Up</h3>
        <p className="text-sm text-gray-400">No pending approvals right now</p>
      </div>
    );
  }

  return (
    <div>
      {/* Pending count */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-500/10 border border-orange-500/20 mb-6">
        <span className="text-lg">&#9201;</span>
        <span className="text-sm text-orange-400 font-semibold">
          {total} action{total !== 1 ? 's' : ''} awaiting your decision
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const taken = actionTaken[item.id];
          return (
            <div
              key={item.id}
              className={`p-4 rounded-lg border transition-all ${
                taken
                  ? taken === 'approved'
                    ? 'border-green-500/40 opacity-60'
                    : 'border-red-500/40 opacity-60'
                  : 'bg-gray-800/40 border-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-white font-medium">{item.actionType}</span>
                    <RiskBadge risk={item.riskLevel} />
                  </div>
                  <div className="text-xs text-gray-400 mb-1">
                    {item.agentId} &middot;{' '}
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                  </div>
                  {item.description && (
                    <div className="text-xs text-gray-300 bg-gray-900/50 rounded px-3 py-2 mt-2">
                      {item.description}
                    </div>
                  )}
                  {item.details?.amount && (
                    <div className="text-lg font-bold text-white mt-2">
                      {item.details.amount}
                    </div>
                  )}
                </div>
              </div>

              {taken ? (
                <div
                  className={`mt-3 text-center py-2 rounded text-xs font-bold font-mono ${
                    taken === 'approved'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {taken === 'approved' ? '\u2713 APPROVED — Receipt sealed' : '\u2717 DENIED — Counterfactual sealed'}
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleDecide(item.id, 'approved')}
                    disabled={processing === item.id}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-semibold text-green-400 border border-green-500/50 bg-green-500/10 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50 font-mono"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecide(item.id, 'denied')}
                    disabled={processing === item.id}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-semibold text-red-400 border border-red-500/50 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 font-mono"
                  >
                    <XCircle className="w-4 h-4" />
                    Deny
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
