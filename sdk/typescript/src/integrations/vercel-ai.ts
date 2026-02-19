/**
 * NotaryOS integration for the Vercel AI SDK.
 *
 * Middleware-compatible helpers and receipt functions for `generateText` and
 * `streamText`. The `ai` package is type-only so this loads without it installed.
 *
 * @packageDocumentation
 */

import type { NotaryClient, Receipt } from '../index';

/** Minimal shape of a Vercel AI `generateText` result. */
interface GenerateTextResult {
  text: string;
  finishReason?: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  response?: { modelId?: string; id?: string };
}

/** Minimal shape of a Vercel AI `streamText` result (fields may be promises). */
interface StreamTextResult {
  text: Promise<string> | string;
  finishReason?: Promise<string | undefined> | string;
  usage?: Promise<Record<string, unknown>> | Record<string, unknown>;
  response?: Promise<Record<string, unknown>> | Record<string, unknown>;
}

function buildPayload(
  text: string,
  modelId: string | undefined,
  finishReason: string | undefined,
  usage: Record<string, unknown> | undefined,
  responseId: string | undefined,
): Record<string, unknown> {
  return {
    framework: 'vercel-ai',
    model: modelId ?? 'unknown',
    finish_reason: finishReason ?? 'unknown',
    prompt_tokens: usage?.promptTokens ?? 0,
    completion_tokens: usage?.completionTokens ?? 0,
    output_preview: text.length > 200 ? text.slice(0, 200) + '...' : text,
    response_id: responseId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Return a middleware-compatible object that issues a receipt on `generateText`.
 * Attach where the Vercel AI SDK accepts middleware hooks.
 */
export function notaryMiddleware(client: NotaryClient): {
  wrapGenerate: (opts: { doGenerate: () => Promise<GenerateTextResult> }) => Promise<GenerateTextResult>;
} {
  return {
    async wrapGenerate({ doGenerate }) {
      const result = await doGenerate();
      const payload = buildPayload(
        result.text, result.response?.modelId,
        result.finishReason, result.usage as Record<string, unknown> | undefined,
        result.response?.id,
      );
      client.issue('ai.generate', payload).catch(() => {});
      return result;
    },
  };
}

/** Issue a receipt for a completed `generateText` result. */
export async function receiptGenerateText(
  client: NotaryClient, result: GenerateTextResult,
): Promise<Receipt> {
  const payload = buildPayload(
    result.text, result.response?.modelId,
    result.finishReason, result.usage as Record<string, unknown> | undefined,
    result.response?.id,
  );
  return client.issue('ai.generate', payload);
}

/** Issue a receipt for a completed `streamText` result (awaits promise fields). */
export async function receiptStreamText(
  client: NotaryClient, result: StreamTextResult,
): Promise<Receipt> {
  const [text, finishReason, usage, response] = await Promise.all([
    Promise.resolve(result.text), Promise.resolve(result.finishReason),
    Promise.resolve(result.usage), Promise.resolve(result.response),
  ]);
  const payload = buildPayload(
    text as string,
    (response as Record<string, unknown>)?.modelId as string | undefined,
    finishReason as string | undefined,
    usage as Record<string, unknown> | undefined,
    (response as Record<string, unknown>)?.id as string | undefined,
  );
  return client.issue('ai.stream', payload);
}
