import type { DemoResponse } from '@/types/demo';

/**
 * Static snapshot of the /v1/notary/demo response.
 * Used when the API is unreachable so the landing page still renders
 * a realistic FOIA demo section with real-looking (but static) data.
 *
 * These values were captured from a live API call and are NOT signed
 * with current keys — they exist purely for visual layout purposes.
 */
export const DEMO_FALLBACK: DemoResponse = {
  title: 'NotaryOS Demo — Standard + Counterfactual Receipts',
  description:
    'Two live-signed receipts linked by a SHA-256 hash chain. Receipt 1 is a standard action. Receipt 2 is a counterfactual — cryptographic proof that the agent COULD have acted but chose not to.',
  receipts: {
    standard_action: {
      explanation:
        'A standard receipt. The trading bot placed a buy order for 10 ETH at $3,200. This receipt is tamper-proof, timestamped, and signed with Ed25519.',
      receipt: {
        receipt_id: 'receipt_demo_a1b2c3d4e5f6',
        timestamp: '2026-02-25T12:00:00.000000+00:00',
        agent_id: 'trading-bot-demo',
        action_type: 'order.placed',
        payload_hash:
          'ef67421c7105c87d07291e66f4f8414ba4f01fd42570cfd9a08f02a0ce84b015',
        previous_receipt_hash: null,
        chain_sequence: 1,
        signature:
          'KA3vX1yW6ZR-6QP7OZviODUrDHbrGcObrbxI7iZoAA3qNXxyWfCTq9HQoIVyvcDFNE-SOe-Xls9Wwvyxlpp5Cw',
        signature_type: 'ed25519',
        key_id: 'ed25519-key-v1',
        kid: 'ed25519-key-v1',
        alg: 'EdDSA',
        schema_version: '1.1',
      },
      receipt_hash:
        'e666f6a054cc04d284701014df2ba8c504dc54418b5fe089e4e2772a996f0087',
      payload_preview: {
        symbol: 'ETH',
        side: 'buy',
        quantity: 10,
        price: 3200.0,
        exchange: 'coinbase',
      },
    },
    counterfactual: {
      explanation:
        'A counterfactual receipt — proof of an action NOT taken. The bot evaluated selling 50 BTC ($150,000) but declined because the risk score (0.87) exceeded the threshold (0.75). This is cryptographic evidence of restraint.',
      receipt: {
        receipt_id: 'receipt_demo_f6e5d4c3b2a1',
        timestamp: '2026-02-25T12:00:00.500000+00:00',
        agent_id: 'trading-bot-demo',
        action_type: 'trade.declined',
        payload_hash:
          '529e912cc94c11cec8680899d64fd1039c132b1c9aed7942b670bd8c1316902d',
        previous_receipt_hash:
          'e666f6a054cc04d284701014df2ba8c504dc54418b5fe089e4e2772a996f0087',
        chain_sequence: 2,
        signature:
          'hu7BkP67S91F7nUcR85Q2PaglqXUv8AUyi066pt6YOFFYyeXWrS2VTlw-_M1u7MBPuf0nVUREPzzthozJxWiAA',
        signature_type: 'ed25519',
        key_id: 'ed25519-key-v1',
        kid: 'ed25519-key-v1',
        alg: 'EdDSA',
        schema_version: '1.1',
      },
      receipt_hash:
        '4836a7f7b4be9f0222c97ae3452b2b64663ec020634e0f061aba1180262be1f2',
      payload_preview: {
        counterfactual: true,
        reason: 'risk_threshold_exceeded',
        would_have: {
          action: 'sell',
          symbol: 'BTC',
          quantity: 50,
          value_usd: 150000,
        },
        risk_score: 0.87,
        threshold: 0.75,
      },
    },
  },
  hash_chain: {
    explanation:
      'Receipt 2 includes the hash of Receipt 1 in its previous_receipt_hash field, creating a tamper-evident chain.',
    receipt_1_hash:
      'e666f6a054cc04d284701014df2ba8c504dc54418b5fe089e4e2772a996f0087',
    receipt_2_previous:
      'e666f6a054cc04d284701014df2ba8c504dc54418b5fe089e4e2772a996f0087',
    chain_intact: true,
  },
  verify_commands: {
    verify_standard:
      "curl -s -X POST https://api.agenttownsquare.com/v1/notary/verify -H 'Content-Type: application/json' -d '{\"receipt\": {\"receipt_id\": \"receipt_demo_a1b2c3d4e5f6\"}}'",
    verify_counterfactual:
      "curl -s -X POST https://api.agenttownsquare.com/v1/notary/verify -H 'Content-Type: application/json' -d '{\"receipt\": {\"receipt_id\": \"receipt_demo_f6e5d4c3b2a1\"}}'",
    lookup_by_hash:
      'curl -s https://api.agenttownsquare.com/v1/notary/r/4836a7f7b4be9f0222c97ae3452b2b64663ec020634e0f061aba1180262be1f2',
  },
  next_steps: {
    get_api_key: 'Sign up at https://notaryos.org',
    python_sdk: 'pip install notaryos',
    docs: 'https://notaryos.org/api-docs',
  },
};
