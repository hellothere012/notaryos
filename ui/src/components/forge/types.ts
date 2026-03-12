// ═══════════════════════════════════════════════════════════
// REASONING FORGE — Type Definitions
// Shapes for SSE events consumed from the Forge API.
// No backend internals — only the public event contract.
// ═══════════════════════════════════════════════════════════

export interface ForgeStartedEvent {
  forge_id: string;
  models: string[];
  prompt_receipt: string | null;
}

export interface ForgeModelReasoningEvent {
  model: string;
  model_key: string;
  content: string;
  elapsed_ms: number;
  reasoning_tree: ReasoningTreeData | null;
}

export interface ForgeModelCompleteEvent {
  model: string;
  model_key: string;
  receipt: string | null;
  reasoning_receipt: string | null;
  content_length: number;
}

export interface ForgeModelErrorEvent {
  model: string;
  model_key: string;
  error: string;
  elapsed_ms: number;
}

export interface ForgeSynthesisStartEvent {
  synthesizer: string;
  input_count: number;
}

export interface ForgeSynthesisReasoningEvent {
  content: string;
  model_weights: Record<string, number>;
  parsed_json: Record<string, any>;
  node_type: string;
}

export interface ForgeCompleteEvent {
  forge_id: string;
  assessment: string;
  parsed_json: Record<string, any>;
  synthesis_receipt: string | null;
  reasoning_receipt: string | null;
  counterfactual_receipts: string[];
  provenance_chain: string[];
  total_receipts: number;
  model_weights: Record<string, number>;
  elapsed_ms: number;
}

export interface ForgeErrorEvent {
  error: string;
  forge_id: string;
}

// Reasoning tree node (rendered in ModelColumn)
export interface ReasoningNodeData {
  node_id: string;
  node_type: 'root' | 'branch' | 'selected' | 'pruned' | 'conclusion' | 'observation';
  content: string;
  confidence: number;
  children: ReasoningNodeData[];
  parent_id: string | null;
}

export interface ReasoningTreeData {
  root: ReasoningNodeData;
  model: string;
  total_tokens: number;
}

// Model analysis result (accumulated from SSE events)
export interface ModelResult {
  modelKey: string;
  displayName: string;
  content: string | null;
  elapsedMs: number;
  receipt: string | null;
  reasoningReceipt: string | null;
  reasoningTree: ReasoningTreeData | null;
  error: string | null;
  status: 'pending' | 'streaming' | 'complete' | 'error';
}

// Overall forge state
export type ForgePhase = 'idle' | 'started' | 'analyzing' | 'synthesizing' | 'complete' | 'error';

export interface ForgeState {
  phase: ForgePhase;
  forgeId: string | null;
  promptReceipt: string | null;
  models: ModelResult[];
  synthesis: {
    assessment: string | null;
    modelWeights: Record<string, number>;
    parsedJson: Record<string, any> | null;
    receipt: string | null;
  };
  complete: ForgeCompleteEvent | null;
  error: string | null;
}

// Available model for selector
export interface AvailableModel {
  key: string;
  display_name: string;
  status?: 'active' | 'blocked';
  blocked_reason?: string;
  reasoning_enabled?: boolean;
}
