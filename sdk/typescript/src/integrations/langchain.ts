/**
 * NotaryOS integration for LangChain.js.
 *
 * Callback handler that issues cryptographic receipts when LLM calls,
 * tool invocations, or chain runs complete. Fire-and-forget so it never
 * blocks chain execution. No hard dependency on `@langchain/core`.
 *
 * @packageDocumentation
 */

import type { NotaryClient } from '../index';

/** Minimal BaseCallbackHandler shape to avoid hard `@langchain/core` dep. */
interface BaseCallbackHandlerShape {
  name: string;
  handleLLMEnd?(output: Record<string, unknown>, runId: string): Promise<void>;
  handleToolEnd?(output: string, runId: string): Promise<void>;
  handleChainEnd?(outputs: Record<string, unknown>, runId: string): Promise<void>;
}

function preview(value: unknown, max = 200): string {
  const s = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return s.length > max ? s.slice(0, max) + '...' : s;
}

/**
 * LangChain callback handler that issues NotaryOS receipts on completion events.
 * Attach via the `callbacks` option on any LangChain runnable.
 *
 * @example
 * ```typescript
 * const handler = new NotaryCallbackHandler(notary);
 * const model = new ChatOpenAI({ callbacks: [handler] });
 * ```
 */
export class NotaryCallbackHandler implements BaseCallbackHandlerShape {
  readonly name = 'NotaryCallbackHandler';
  private client: NotaryClient;
  private lastHash: string | undefined;

  constructor(client: NotaryClient) {
    this.client = client;
  }

  async handleLLMEnd(output: Record<string, unknown>, runId: string): Promise<void> {
    const generations = output.generations as unknown[][] | undefined;
    const first = generations?.[0]?.[0] as Record<string, unknown> | undefined;
    this.fireReceipt('langchain.llm', {
      framework: 'langchain', event: 'llm_end', run_id: runId,
      output_preview: preview(first?.text ?? first?.message ?? ''),
      generation_count: generations?.length ?? 0,
      timestamp: new Date().toISOString(),
    });
  }

  async handleToolEnd(output: string, runId: string): Promise<void> {
    this.fireReceipt('langchain.tool', {
      framework: 'langchain', event: 'tool_end', run_id: runId,
      output_preview: preview(output),
      timestamp: new Date().toISOString(),
    });
  }

  async handleChainEnd(outputs: Record<string, unknown>, runId: string): Promise<void> {
    this.fireReceipt('langchain.chain', {
      framework: 'langchain', event: 'chain_end', run_id: runId,
      output_keys: Object.keys(outputs),
      output_preview: preview(outputs),
      timestamp: new Date().toISOString(),
    });
  }

  private fireReceipt(actionType: string, payload: Record<string, unknown>): void {
    this.client
      .issue(actionType, payload, { previousReceiptHash: this.lastHash })
      .then((r) => { if (r.receipt_hash) this.lastHash = r.receipt_hash; })
      .catch(() => {});
  }
}
