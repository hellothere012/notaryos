/** Synthetic receipt stream generator for the Live Stream dashboard. */

const AGENT_POOL = [
  { id: 'trading-bot-v3', actions: ['trade.executed', 'trade.declined', 'order.placed', 'position.closed'] },
  { id: 'compliance-monitor-01', actions: ['kyc.verified', 'transfer.blocked', 'audit.completed', 'risk.assessed'] },
  { id: 'email-dispatcher', actions: ['email.sent', 'email.queued', 'template.rendered', 'bounce.handled'] },
  { id: 'data-pipeline-alpha', actions: ['batch.processed', 'etl.completed', 'schema.validated', 'anomaly.detected'] },
  { id: 'customer-support-ai', actions: ['ticket.resolved', 'escalation.created', 'sentiment.analyzed', 'response.generated'] },
  { id: 'content-moderator', actions: ['content.approved', 'content.flagged', 'appeal.reviewed', 'policy.enforced'] },
  { id: 'inventory-tracker', actions: ['stock.updated', 'reorder.triggered', 'shipment.confirmed', 'forecast.generated'] },
  { id: 'security-sentinel', actions: ['threat.detected', 'access.granted', 'token.rotated', 'anomaly.logged'] },
  { id: 'research-assistant', actions: ['query.answered', 'source.cited', 'summary.generated', 'fact.verified'] },
  { id: 'deployment-agent', actions: ['build.completed', 'deploy.succeeded', 'rollback.executed', 'health.checked'] },
];

const REGIONS = [
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'sa-east-1',
  'af-south-1',
];

function randomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface StreamReceipt {
  hash: string;
  agentId: string;
  action: string;
  timestamp: string;
  region: string;
  latencyMs: number;
  valid: boolean;
  isCounterfactual: boolean;
  isReal: boolean;
}

export function generateSyntheticReceipt(): StreamReceipt {
  const agent = randomFrom(AGENT_POOL);
  const action = randomFrom(agent.actions);
  const isCounterfactual = action.includes('declined') || action.includes('blocked') || action.includes('flagged');
  // 99.5% success rate — occasional synthetic failure for realism
  const valid = Math.random() > 0.005;
  const latencyMs = 2 + Math.random() * 12; // 2-14ms

  return {
    hash: `sha256:${randomHex(16)}`,
    agentId: agent.id,
    action,
    timestamp: new Date().toISOString(),
    region: randomFrom(REGIONS),
    latencyMs: Math.round(latencyMs * 10) / 10,
    valid,
    isCounterfactual,
    isReal: false,
  };
}

/** Map region codes to approximate world map positions (% of SVG viewBox). */
export const REGION_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  'us-east-1':       { x: 26, y: 38, label: 'US East' },
  'us-west-2':       { x: 14, y: 40, label: 'US West' },
  'eu-west-1':       { x: 46, y: 32, label: 'EU West' },
  'eu-central-1':    { x: 52, y: 30, label: 'EU Central' },
  'ap-southeast-1':  { x: 76, y: 52, label: 'Singapore' },
  'ap-northeast-1':  { x: 82, y: 36, label: 'Tokyo' },
  'sa-east-1':       { x: 32, y: 68, label: 'S. America' },
  'af-south-1':      { x: 54, y: 62, label: 'Africa' },
};
