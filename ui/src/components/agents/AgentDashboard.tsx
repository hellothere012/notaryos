'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  RefreshCcw,
  Loader2,
  AlertCircle,
  Activity,
  Shield,
  Clock,
  GitBranch,
  BarChart3,
} from 'lucide-react';
import { useAgentDashboard } from './useAgentDashboard';
import { AgentSelector } from './AgentSelector';
import { ActivityTab } from './tabs/ActivityTab';
import { PermissionsTab } from './tabs/PermissionsTab';
import { ApprovalsTab } from './tabs/ApprovalsTab';
import { DecisionsTab } from './tabs/DecisionsTab';
import { StatsTab } from './tabs/StatsTab';
import type { TabKey } from './types';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'activity', label: 'Activity', icon: <Activity className="w-4 h-4" /> },
  { key: 'permissions', label: 'Permissions', icon: <Shield className="w-4 h-4" /> },
  { key: 'approvals', label: 'Approvals', icon: <Clock className="w-4 h-4" /> },
  { key: 'decisions', label: 'Decisions', icon: <GitBranch className="w-4 h-4" /> },
  { key: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
];

export const AgentDashboard: React.FC = () => {
  const {
    agents,
    selectedAgent,
    setSelectedAgent,
    activeTab,
    setActiveTab,
    isLoadingAgents,
    error,
    activity,
    activityLoading,
    fetchActivity,
    permissions,
    permissionsLoading,
    approvals,
    approvalsLoading,
    decisions,
    decisionsLoading,
    fetchDecisions,
    stats,
    statsLoading,
    decideAction,
    updatePermission,
    refresh,
  } = useAgentDashboard();

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-cyan-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border border-purple-500/40 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Agent Control
                </h1>
              </div>
              <p className="text-sm text-gray-400 max-w-lg">
                Monitor, control, and audit your AI agents. Every action sealed as a
                verifiable receipt.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {agents.length > 0 && (
                <AgentSelector
                  agents={agents}
                  selected={selectedAgent}
                  onSelect={setSelectedAgent}
                />
              )}
              <button
                onClick={refresh}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {/* Loading agents */}
        {isLoadingAgents ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-6">
              <Bot className="w-10 h-10 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Agents Registered</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              Register an AI agent via the SDK to start monitoring its actions
              with cryptographic receipts.
            </p>
            <a
              href="/api-keys"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm font-semibold hover:from-purple-500 hover:to-cyan-500 transition-all"
            >
              Get API Key
            </a>
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-800 mb-6 -mx-1 px-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.key === 'approvals' && approvals.total > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-orange-500/20 text-orange-400 rounded-full">
                      {approvals.total}
                    </span>
                  )}
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="agent-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'activity' && (
              <ActivityTab
                items={activity.items}
                total={activity.total}
                totalPages={activity.totalPages}
                page={activity.page}
                isLoading={activityLoading}
                onPageChange={(p) => fetchActivity(p)}
              />
            )}
            {activeTab === 'permissions' && (
              <PermissionsTab
                permissions={permissions}
                isLoading={permissionsLoading}
                onUpdate={updatePermission}
              />
            )}
            {activeTab === 'approvals' && (
              <ApprovalsTab
                items={approvals.items}
                total={approvals.total}
                isLoading={approvalsLoading}
                onDecide={decideAction}
              />
            )}
            {activeTab === 'decisions' && (
              <DecisionsTab
                items={decisions.items}
                total={decisions.total}
                totalPages={decisions.totalPages}
                page={decisions.page}
                isLoading={decisionsLoading}
                onPageChange={(p) => fetchDecisions(p)}
              />
            )}
            {activeTab === 'stats' && (
              <StatsTab stats={stats} isLoading={statsLoading} />
            )}
          </>
        )}
      </div>
    </div>
  );
};
