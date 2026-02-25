/* ========================================================================== */
/*  TypeScript types for the /v1/notary/demo and /v1/notary/verify endpoints  */
/* ========================================================================== */

/** A single NotaryOS receipt as returned by the demo endpoint. */
export interface DemoReceipt {
  receipt_id: string;
  timestamp: string;
  agent_id: string;
  action_type: string;
  payload_hash: string;
  previous_receipt_hash: string | null;
  chain_sequence: number;
  signature: string;
  signature_type: string;
  key_id: string;
  kid: string;
  alg: string;
  schema_version: string;
}

/** A receipt entry with explanation, hash, and payload preview. */
export interface DemoReceiptEntry {
  explanation: string;
  receipt: DemoReceipt;
  receipt_hash: string;
  payload_preview: Record<string, unknown>;
}

/** Hash chain metadata linking the two receipts. */
export interface DemoHashChain {
  explanation: string;
  receipt_1_hash: string;
  receipt_2_previous: string;
  chain_intact: boolean;
}

/** Full response from GET /v1/notary/demo. */
export interface DemoResponse {
  title: string;
  description: string;
  receipts: {
    standard_action: DemoReceiptEntry;
    counterfactual: DemoReceiptEntry;
  };
  hash_chain: DemoHashChain;
  verify_commands: {
    verify_standard: string;
    verify_counterfactual: string;
    lookup_by_hash: string;
  };
  next_steps: Record<string, string>;
}

/** Response from POST /v1/notary/verify. */
export interface VerifyResult {
  valid: boolean;
  signature_ok: boolean;
  structure_ok: boolean;
  chain_ok: boolean | null;
  reason: string;
  details?: Record<string, unknown>;
  from_cache?: boolean;
}
