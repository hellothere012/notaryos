export type RiskLevel = 'low' | 'medium' | 'high';
export type PermissionLevel = 'never' | 'ask' | 'allow';
export type PermissionCategory = 'communication' | 'filesystem' | 'web_api' | 'financial';
export type ActionStatus = 'pending' | 'approved' | 'denied';
export type TabKey = 'activity' | 'permissions' | 'approvals' | 'decisions' | 'stats';

export interface AgentInfo {
  agentId: string;
  agentName: string;
  tier: string;
  status: string;
  createdAt: string | null;
  lastActive: string | null;
}

export interface AgentActivityItem {
  id: number;
  agentId: string;
  actionType: string;
  riskLevel: RiskLevel;
  receiptHash: string;
  groundingStatus: string;
  timestamp: string | null;
}

export interface PermissionItem {
  name: string;
  level: PermissionLevel;
}

export interface PermissionCategoryGroup {
  category: PermissionCategory;
  items: PermissionItem[];
}

export interface PendingAction {
  id: number;
  agentId: string;
  actionType: string;
  category: PermissionCategory;
  riskLevel: RiskLevel;
  description: string;
  details: Record<string, any>;
  createdAt: string | null;
}

export interface DecisionTreeItem {
  receiptHash: string;
  agentId: string;
  actionNotTaken: string;
  capabilityProof: Record<string, any>;
  decisionReason: string;
  decisionHash: string;
  groundingStatus: string;
  commitRevealPhase: string;
  timestamp: string | null;
}

export interface AgentStats {
  totalActions: number;
  approved: number;
  denied: number;
  pending: number;
  receiptsSealed: number;
  chainIntegrity: number;
  counterfactualCount: number;
  agentCount: number;
}
