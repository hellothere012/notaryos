'use client';

import { useState, useEffect, useCallback } from 'react';
import { authClient, API_ENDPOINTS } from '../../lib/api-client';
import type {
  AgentInfo,
  AgentActivityItem,
  PermissionCategoryGroup,
  PendingAction,
  DecisionTreeItem,
  AgentStats,
  TabKey,
  PermissionLevel,
} from './types';

export function useAgentDashboard() {
  // Agent list
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('activity');
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);

  // Per-tab state
  const [activity, setActivity] = useState<{
    items: AgentActivityItem[];
    total: number;
    totalPages: number;
    page: number;
  }>({ items: [], total: 0, totalPages: 0, page: 1 });
  const [activityLoading, setActivityLoading] = useState(false);

  const [permissions, setPermissions] = useState<PermissionCategoryGroup[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const [approvals, setApprovals] = useState<{
    items: PendingAction[];
    total: number;
    totalPages: number;
    page: number;
  }>({ items: [], total: 0, totalPages: 0, page: 1 });
  const [approvalsLoading, setApprovalsLoading] = useState(false);

  const [decisions, setDecisions] = useState<{
    items: DecisionTreeItem[];
    total: number;
    totalPages: number;
    page: number;
  }>({ items: [], total: 0, totalPages: 0, page: 1 });
  const [decisionsLoading, setDecisionsLoading] = useState(false);

  const [stats, setStats] = useState<AgentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    setIsLoadingAgents(true);
    try {
      const resp = await authClient.get(API_ENDPOINTS.agentDashboardAgents);
      const list: AgentInfo[] = resp.data.agents || [];
      setAgents(list);
      if (list.length > 0 && !selectedAgent) {
        setSelectedAgent(list[0].agentId);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load agents');
    } finally {
      setIsLoadingAgents(false);
    }
  }, [selectedAgent]);

  // Fetch activity
  const fetchActivity = useCallback(async (page = 1) => {
    if (!selectedAgent) return;
    setActivityLoading(true);
    try {
      const resp = await authClient.get(API_ENDPOINTS.agentDashboardActivity, {
        params: { agent_id: selectedAgent, page, page_size: 20 },
      });
      setActivity({
        items: resp.data.items || [],
        total: resp.data.total || 0,
        totalPages: resp.data.totalPages || 0,
        page,
      });
    } catch {
      // Non-critical
    } finally {
      setActivityLoading(false);
    }
  }, [selectedAgent]);

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    if (!selectedAgent) return;
    setPermissionsLoading(true);
    try {
      const resp = await authClient.get(API_ENDPOINTS.agentDashboardPermissions, {
        params: { agent_id: selectedAgent },
      });
      setPermissions(resp.data.permissions || []);
    } catch {
      // Non-critical
    } finally {
      setPermissionsLoading(false);
    }
  }, [selectedAgent]);

  // Fetch approvals
  const fetchApprovals = useCallback(async (page = 1) => {
    setApprovalsLoading(true);
    try {
      const resp = await authClient.get(API_ENDPOINTS.agentDashboardApprovals, {
        params: { agent_id: selectedAgent || undefined, page, page_size: 20 },
      });
      setApprovals({
        items: resp.data.items || [],
        total: resp.data.total || 0,
        totalPages: resp.data.totalPages || 0,
        page,
      });
    } catch {
      // Non-critical
    } finally {
      setApprovalsLoading(false);
    }
  }, [selectedAgent]);

  // Fetch decisions
  const fetchDecisions = useCallback(async (page = 1) => {
    if (!selectedAgent) return;
    setDecisionsLoading(true);
    try {
      const resp = await authClient.get(API_ENDPOINTS.agentDashboardDecisions, {
        params: { agent_id: selectedAgent, page, page_size: 20 },
      });
      setDecisions({
        items: resp.data.items || [],
        total: resp.data.total || 0,
        totalPages: resp.data.totalPages || 0,
        page,
      });
    } catch {
      // Non-critical
    } finally {
      setDecisionsLoading(false);
    }
  }, [selectedAgent]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const resp = await authClient.get(API_ENDPOINTS.agentDashboardStats);
      setStats(resp.data);
    } catch {
      // Non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Approve/deny action
  const decideAction = useCallback(async (actionId: number, decision: 'approved' | 'denied') => {
    try {
      await authClient.post(API_ENDPOINTS.agentDashboardDecide(actionId), { decision });
      // Refresh approvals and stats
      await fetchApprovals(approvals.page);
      await fetchStats();
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to process decision');
    }
  }, [fetchApprovals, fetchStats, approvals.page]);

  // Update permission
  const updatePermission = useCallback(async (
    category: string,
    permissionName: string,
    permissionLevel: PermissionLevel,
  ) => {
    if (!selectedAgent) return;
    try {
      await authClient.put(API_ENDPOINTS.agentDashboardPermissions, {
        agent_id: selectedAgent,
        category,
        permission_name: permissionName,
        permission_level: permissionLevel,
      });
      // Update local state
      setPermissions(prev =>
        prev.map(cat =>
          cat.category === category
            ? {
                ...cat,
                items: cat.items.map(item =>
                  item.name === permissionName ? { ...item, level: permissionLevel } : item,
                ),
              }
            : cat,
        ),
      );
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to update permission');
    }
  }, [selectedAgent]);

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, []);

  // Fetch tab data when agent or tab changes
  useEffect(() => {
    if (activeTab === 'activity') fetchActivity();
    else if (activeTab === 'permissions') fetchPermissions();
    else if (activeTab === 'approvals') fetchApprovals();
    else if (activeTab === 'decisions') fetchDecisions();
    else if (activeTab === 'stats') fetchStats();
  }, [activeTab, selectedAgent]);

  const refresh = useCallback(() => {
    if (activeTab === 'activity') fetchActivity(activity.page);
    else if (activeTab === 'permissions') fetchPermissions();
    else if (activeTab === 'approvals') fetchApprovals(approvals.page);
    else if (activeTab === 'decisions') fetchDecisions(decisions.page);
    else if (activeTab === 'stats') fetchStats();
  }, [activeTab, activity.page, approvals.page, decisions.page]);

  return {
    agents,
    selectedAgent,
    setSelectedAgent,
    activeTab,
    setActiveTab,
    isLoadingAgents,
    error,
    // Tab data
    activity,
    activityLoading,
    fetchActivity,
    permissions,
    permissionsLoading,
    approvals,
    approvalsLoading,
    fetchApprovals,
    decisions,
    decisionsLoading,
    fetchDecisions,
    stats,
    statsLoading,
    // Actions
    decideAction,
    updatePermission,
    refresh,
  };
}
