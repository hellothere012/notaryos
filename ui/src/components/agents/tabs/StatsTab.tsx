'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import type { AgentStats } from '../types';

interface Props {
  stats: AgentStats | null;
  isLoading: boolean;
}

export const StatsTab: React.FC<Props> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">&#128202;</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Stats Available</h3>
        <p className="text-gray-400 text-sm">
          Stats will appear once your agents start performing actions.
        </p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Actions',
      value: stats.totalActions.toLocaleString(),
      color: 'text-white',
      bg: 'bg-gray-800/40',
      border: 'border-gray-700/50',
    },
    {
      label: 'Approved',
      value: stats.approved.toLocaleString(),
      color: 'text-green-400',
      bg: 'bg-green-500/5',
      border: 'border-green-500/20',
    },
    {
      label: 'Denied',
      value: stats.denied.toLocaleString(),
      color: 'text-red-400',
      bg: 'bg-red-500/5',
      border: 'border-red-500/20',
    },
    {
      label: 'Pending',
      value: stats.pending.toLocaleString(),
      color: 'text-orange-400',
      bg: 'bg-orange-500/5',
      border: 'border-orange-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Primary stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg ${card.bg} border ${card.border} p-4`}
          >
            <div className="text-[11px] text-gray-500 uppercase tracking-wider font-mono mb-1">
              {card.label}
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/20 p-4">
          <div className="text-[11px] text-gray-500 uppercase tracking-wider font-mono mb-1">
            Receipts Sealed
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {stats.receiptsSealed.toLocaleString()}
          </div>
        </div>

        <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-4">
          <div className="text-[11px] text-gray-500 uppercase tracking-wider font-mono mb-1">
            Counterfactuals
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {stats.counterfactualCount.toLocaleString()}
          </div>
        </div>

        <div className="rounded-lg bg-gray-800/40 border border-gray-700/50 p-4">
          <div className="text-[11px] text-gray-500 uppercase tracking-wider font-mono mb-1">
            Active Agents
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.agentCount}
          </div>
        </div>
      </div>

      {/* Chain integrity */}
      <div className="rounded-lg bg-gray-800/40 border border-gray-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] text-gray-500 uppercase tracking-wider font-mono">
            Chain Integrity
          </div>
          <span
            className={`text-sm font-bold font-mono ${
              stats.chainIntegrity >= 99
                ? 'text-green-400'
                : stats.chainIntegrity >= 90
                  ? 'text-orange-400'
                  : 'text-red-400'
            }`}
          >
            {stats.chainIntegrity.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              stats.chainIntegrity >= 99
                ? 'bg-green-500'
                : stats.chainIntegrity >= 90
                  ? 'bg-orange-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, stats.chainIntegrity)}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-500 mt-2">
          Percentage of receipts with verified grounding status
        </p>
      </div>
    </div>
  );
};
