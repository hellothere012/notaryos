/**
 * Static demo data for the Agent Dashboard.
 *
 * Shown to unauthenticated visitors so they can preview the dashboard
 * without signing up. This file is completely isolated from the real
 * data-fetching hook (useAgentDashboard.ts).
 */

import type {
  AgentInfo,
  AgentActivityItem,
  PermissionCategoryGroup,
  PendingAction,
  DecisionTreeItem,
  AgentStats,
} from './types';

export const DEMO_AGENTS: AgentInfo[] = [
  {
    agentId: 'demo-agent-alpha',
    agentName: 'ResearchBot Alpha',
    tier: 'pro',
    status: 'active',
    createdAt: '2026-02-15T09:00:00Z',
    lastActive: '2026-03-13T10:45:00Z',
  },
  {
    agentId: 'demo-agent-beta',
    agentName: 'TradeAssistant Beta',
    tier: 'enterprise',
    status: 'active',
    createdAt: '2026-01-20T14:30:00Z',
    lastActive: '2026-03-13T11:02:00Z',
  },
];

export const DEMO_ACTIVITY: AgentActivityItem[] = [
  {
    id: 1,
    agentId: 'demo-agent-alpha',
    actionType: 'web.browse',
    riskLevel: 'medium',
    receiptHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    groundingStatus: 'grounded',
    timestamp: '2026-03-13T10:45:12Z',
  },
  {
    id: 2,
    agentId: 'demo-agent-alpha',
    actionType: 'api.call',
    riskLevel: 'medium',
    receiptHash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    groundingStatus: 'grounded',
    timestamp: '2026-03-13T10:42:08Z',
  },
  {
    id: 3,
    agentId: 'demo-agent-alpha',
    actionType: 'file.read',
    riskLevel: 'low',
    receiptHash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    groundingStatus: 'grounded',
    timestamp: '2026-03-13T10:38:55Z',
  },
  {
    id: 4,
    agentId: 'demo-agent-beta',
    actionType: 'email.send',
    riskLevel: 'medium',
    receiptHash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    groundingStatus: 'grounded',
    timestamp: '2026-03-13T10:35:22Z',
  },
  {
    id: 5,
    agentId: 'demo-agent-beta',
    actionType: 'shell.exec',
    riskLevel: 'high',
    receiptHash: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
    groundingStatus: 'grounded',
    timestamp: '2026-03-13T10:30:17Z',
  },
  {
    id: 6,
    agentId: 'demo-agent-alpha',
    actionType: 'file.create',
    riskLevel: 'low',
    receiptHash: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
    groundingStatus: 'grounded',
    timestamp: '2026-03-13T10:25:44Z',
  },
  {
    id: 7,
    agentId: 'demo-agent-beta',
    actionType: 'purchase.attempt',
    riskLevel: 'high',
    receiptHash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    groundingStatus: 'grounded',
    timestamp: '2026-03-13T10:20:09Z',
  },
];

export const DEMO_PERMISSIONS: PermissionCategoryGroup[] = [
  {
    category: 'communication',
    items: [
      { name: 'Send emails', level: 'ask' },
      { name: 'Post messages', level: 'allow' },
      { name: 'Send notifications', level: 'allow' },
    ],
  },
  {
    category: 'filesystem',
    items: [
      { name: 'Read files', level: 'allow' },
      { name: 'Write files', level: 'ask' },
      { name: 'Delete files', level: 'never' },
    ],
  },
  {
    category: 'web_api',
    items: [
      { name: 'Browse web', level: 'allow' },
      { name: 'Call external APIs', level: 'ask' },
      { name: 'Execute shell commands', level: 'never' },
    ],
  },
  {
    category: 'financial',
    items: [
      { name: 'View balances', level: 'allow' },
      { name: 'Make purchases', level: 'ask' },
      { name: 'Transfer funds', level: 'never' },
    ],
  },
];

export const DEMO_APPROVALS: PendingAction[] = [
  {
    id: 101,
    agentId: 'demo-agent-beta',
    actionType: 'purchase.attempt',
    category: 'financial',
    riskLevel: 'high',
    description: 'Purchase 500 units of AAPL stock at market price',
    details: { amount: '$98,750.00', ticker: 'AAPL', quantity: 500 },
    createdAt: '2026-03-13T11:00:00Z',
  },
  {
    id: 102,
    agentId: 'demo-agent-alpha',
    actionType: 'email.send',
    category: 'communication',
    riskLevel: 'medium',
    description: 'Send weekly research summary to team distribution list',
    details: { recipients: 'team@company.com', subject: 'Weekly Research Digest' },
    createdAt: '2026-03-13T10:55:00Z',
  },
  {
    id: 103,
    agentId: 'demo-agent-beta',
    actionType: 'shell.exec',
    category: 'web_api',
    riskLevel: 'high',
    description: 'Execute database backup script on production server',
    details: { command: 'pg_dump', target: 'production' },
    createdAt: '2026-03-13T10:50:00Z',
  },
];

export const DEMO_DECISIONS: DecisionTreeItem[] = [
  {
    receiptHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    agentId: 'demo-agent-beta',
    actionNotTaken: 'transfer.funds — $25,000 wire to external account',
    capabilityProof: {},
    decisionReason: 'Permission level set to NEVER for fund transfers',
    decisionHash: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    groundingStatus: 'grounded',
    commitRevealPhase: 'sealed',
    timestamp: '2026-03-13T09:15:00Z',
  },
  {
    receiptHash: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    agentId: 'demo-agent-alpha',
    actionNotTaken: 'file.delete — Remove /data/archive/2025-q4.csv',
    capabilityProof: {},
    decisionReason: 'File deletion is blocked by filesystem policy',
    decisionHash: '8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d',
    groundingStatus: 'grounded',
    commitRevealPhase: 'sealed',
    timestamp: '2026-03-13T08:42:00Z',
  },
  {
    receiptHash: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    agentId: 'demo-agent-beta',
    actionNotTaken: 'shell.exec — Run apt-get update on production host',
    capabilityProof: {},
    decisionReason: 'Shell execution denied — requires human approval',
    decisionHash: '7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c',
    groundingStatus: 'grounded',
    commitRevealPhase: 'sealed',
    timestamp: '2026-03-13T07:30:00Z',
  },
];

export const DEMO_STATS: AgentStats = {
  totalActions: 847,
  approved: 791,
  denied: 42,
  pending: 14,
  receiptsSealed: 847,
  chainIntegrity: 100.0,
  counterfactualCount: 42,
  agentCount: 2,
};
