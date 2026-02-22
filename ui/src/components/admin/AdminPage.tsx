/**
 * AdminPage - Administrative dashboard for Notary system
 *
 * Features:
 * - Display current signer configuration (HMAC/Ed25519)
 * - Key rotation with confirmation
 * - Signer type switching
 * - Verification statistics overview
 *
 * Access: Admin role only (protected by ProtectedRoute)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { authClient, API_ENDPOINTS } from '../../config/api';
import { SignerConfig, SystemStats } from '../../types';
import { SignerConfigPanel } from './SignerConfig';

// Icons as inline SVG components for zero external dependencies
const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const KeyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

/**
 * StatCard - Displays a single statistic with icon
 */
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'purple' | 'green' | 'red' | 'blue';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const iconBgClasses = {
    purple: 'bg-purple-500/20',
    green: 'bg-green-500/20',
    red: 'bg-red-500/20',
    blue: 'bg-blue-500/20',
  };

  return (
    <div className={`p-6 rounded-xl border ${colorClasses[color]} bg-gray-800/50`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

/**
 * AdminPage Component
 */
export const AdminPage: React.FC = () => {
  // State
  const [signerConfig, setSignerConfig] = useState<SignerConfig | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetch signer configuration from API
   */
  const fetchSignerConfig = useCallback(async () => {
    try {
      const response = await authClient.get(API_ENDPOINTS.signerConfig);
      setSignerConfig(response.data);
    } catch (err: any) {
      console.error('Failed to fetch signer config:', err);
      // Don't set error for config - might just be empty
    }
  }, []);

  /**
   * Fetch system statistics from API
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await authClient.get(API_ENDPOINTS.systemStats);
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      // Don't set error for stats - might just be empty
    }
  }, []);

  /**
   * Load all data
   */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([fetchSignerConfig(), fetchStats()]);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchSignerConfig, fetchStats]);

  /**
   * Refresh data manually
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  /**
   * Handle config update from child component
   */
  const handleConfigUpdate = (newConfig: SignerConfig) => {
    setSignerConfig(newConfig);
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <XCircleIcon className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
          <p className="text-gray-400">
            Manage signer configuration and view system statistics
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`p-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors
                     ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Refresh data"
        >
          <RefreshIcon className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Verifications"
          value={stats?.totalVerifications ?? 0}
          icon={<ChartIcon className="w-6 h-6 text-purple-400" />}
          color="purple"
          subtitle="All time"
        />
        <StatCard
          title="Valid Signatures"
          value={stats?.validCount ?? 0}
          icon={<CheckCircleIcon className="w-6 h-6 text-green-400" />}
          color="green"
          subtitle={stats ? `${((stats.validCount / Math.max(stats.totalVerifications, 1)) * 100).toFixed(1)}% success rate` : undefined}
        />
        <StatCard
          title="Invalid Signatures"
          value={stats?.invalidCount ?? 0}
          icon={<XCircleIcon className="w-6 h-6 text-red-400" />}
          color="red"
          subtitle="Requires investigation"
        />
        <StatCard
          title="Active Users"
          value={stats?.activeUsers ?? 0}
          icon={<UsersIcon className="w-6 h-6 text-blue-400" />}
          color="blue"
          subtitle={`${stats?.apiKeysIssued ?? 0} API keys issued`}
        />
      </div>

      {/* Signer Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Signer Status */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <ShieldIcon className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Current Signer Status</h2>
          </div>

          {signerConfig ? (
            <div className="space-y-4">
              {/* Signer Type */}
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">Signer Type</p>
                  <p className="text-white font-medium mt-1">
                    {signerConfig.signerType.toUpperCase()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium
                  ${signerConfig.signerType === 'ed25519'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {signerConfig.signerType === 'ed25519' ? 'Asymmetric' : 'Symmetric'}
                </span>
              </div>

              {/* Active Key ID */}
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">Active Key ID</p>
                  <code className="text-purple-400 font-mono text-sm mt-1 block">
                    {signerConfig.activeKeyId}
                  </code>
                </div>
                <div className="p-2 rounded-lg bg-gray-800">
                  <KeyIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Key Created At */}
              <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">Key Created</p>
                  <p className="text-white text-sm mt-1">
                    {new Date(signerConfig.keyCreatedAt).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium
                  ${signerConfig.autoRotateEnabled
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {signerConfig.autoRotateEnabled ? 'Auto-rotate ON' : 'Auto-rotate OFF'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <KeyIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No signer configuration found</p>
              <p className="text-sm text-gray-500 mt-1">
                Configure a signer to enable receipt signing
              </p>
            </div>
          )}
        </div>

        {/* Signer Configuration Panel */}
        <SignerConfigPanel
          config={signerConfig}
          onConfigUpdate={handleConfigUpdate}
        />
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/20 h-fit">
            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-yellow-400 font-medium mb-1">Security Notice</h3>
            <p className="text-gray-400 text-sm">
              Key rotation will invalidate all previously signed receipts using the old key.
              Ensure all systems are updated before rotating keys in production.
              Ed25519 signatures are recommended for third-party verification scenarios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
