/**
 * NotaryOS integration for OpenAI APIs and agent tool patterns.
 *
 * Tool wrapper that issues receipts around tool calls, plus a helper for
 * receipting chat completions. No hard dependency on the `openai` package.
 *
 * @packageDocumentation
 */

import type { NotaryClient, Receipt } from '../index';

/** Minimal chat completion shape matching the OpenAI API response. */
interface ChatCompletion {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: { role?: string; content?: string | null; tool_calls?: unknown[] };
    finish_reason?: string;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

function preview(value: unknown, max = 200): string {
  const s = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return s.length > max ? s.slice(0, max) + '...' : s;
}

/**
 * Wrap a tool function so every invocation automatically issues a receipt.
 * Captures tool name, args/result previews, duration, and error status.
 *
 * @param client - NotaryClient instance
 * @param toolFn - Async tool function to wrap
 * @param toolName - Action type for the receipt (default: "openai.tool")
 */
export function notaryToolWrapper<TArgs, TResult>(
  client: NotaryClient,
  toolFn: (args: TArgs) => Promise<TResult>,
  toolName = 'openai.tool',
): (args: TArgs) => Promise<TResult> {
  let lastHash: string | undefined;

  return async (args: TArgs): Promise<TResult> => {
    const start = performance.now();
    let status = 'success';
    let errorType: string | undefined;
    let result: TResult;

    try {
      result = await toolFn(args);
      return result;
    } catch (err) {
      status = 'error';
      errorType = (err as Error).name || 'Error';
      throw err;
    } finally {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      const payload: Record<string, unknown> = {
        framework: 'openai-agents', tool: toolName, status, error_type: errorType,
        duration_ms: durationMs, args_preview: preview(args),
        result_preview: status === 'success' ? preview(result!) : undefined,
        timestamp: new Date().toISOString(),
      };
      client
        .issue(toolName, payload, { previousReceiptHash: lastHash })
        .then((r) => { if (r.receipt_hash) lastHash = r.receipt_hash; })
        .catch(() => {});
    }
  };
}

/**
 * Issue a receipt for a chat completion response.
 *
 * @param client - NotaryClient instance
 * @param completion - OpenAI chat completion object (or compatible shape)
 */
export async function receiptCompletion(
  client: NotaryClient, completion: ChatCompletion,
): Promise<Receipt> {
  const choice = completion.choices?.[0];
  return client.issue('openai.completion', {
    framework: 'openai-agents',
    event: 'chat.completion',
    completion_id: completion.id ?? 'unknown',
    model: completion.model ?? 'unknown',
    finish_reason: choice?.finish_reason ?? 'unknown',
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
    total_tokens: completion.usage?.total_tokens ?? 0,
    has_tool_calls: (choice?.message?.tool_calls?.length ?? 0) > 0,
    output_preview: preview(choice?.message?.content ?? ''),
    timestamp: new Date().toISOString(),
  });
}
