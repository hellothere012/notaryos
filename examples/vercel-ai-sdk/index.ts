/**
 * NotaryOS + Vercel AI SDK: Receipt every tool call at the edge.
 *
 * Uses manual issue() since the TypeScript SDK does not have wrap().
 * This is the idiomatic pattern for TypeScript/Edge environments.
 */

// Note: In production, import from 'notaryos' npm package
// For this example, we inline a minimal client for portability

const API_KEY = process.env.NOTARY_API_KEY || 'notary_test_demo';
const BASE_URL = process.env.NOTARY_API_URL || 'https://api.agenttownsquare.com';

interface Receipt {
  receipt_id: string;
  signature: string;
  receipt_hash: string;
}

async function issueReceipt(actionType: string, payload: Record<string, unknown>): Promise<Receipt> {
  const resp = await fetch(`${BASE_URL}/v1/notary/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({ action_type: actionType, payload }),
  });
  if (!resp.ok) throw new Error(`NotaryOS error: ${resp.status}`);
  const data = await resp.json();
  return data.receipt;
}

async function verifyReceipt(receipt: Receipt): Promise<{ valid: boolean }> {
  const resp = await fetch(`${BASE_URL}/v1/notary/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receipt }),
  });
  if (!resp.ok) throw new Error(`NotaryOS error: ${resp.status}`);
  return resp.json();
}

// Simulated Vercel AI SDK tool callback
async function onToolCall(toolName: string, args: Record<string, unknown>) {
  const receipt = await issueReceipt(`tool.${toolName}`, args);
  console.log(`Receipt for ${toolName}: ${receipt.receipt_id}`);
  return receipt;
}

async function main() {
  // Simulate AI agent calling tools
  const r1 = await onToolCall('search', { query: 'latest AI research' });
  const r2 = await onToolCall('summarize', { text: 'Long article...' });

  // Verify both receipts
  const v1 = await verifyReceipt(r1);
  const v2 = await verifyReceipt(r2);

  console.log(`\nSearch receipt valid: ${v1.valid}`);
  console.log(`Summarize receipt valid: ${v2.valid}`);
  console.log('Every edge function call is now proven.');
}

main().catch(console.error);

export { issueReceipt, verifyReceipt, onToolCall };
