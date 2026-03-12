'use client';

// ═══════════════════════════════════════════════════════════
// REASONING FORGE — SSE Hook
// Connects to the Forge API and manages state from SSE events.
// No backend internals — only consumes the public SSE contract.
// ═══════════════════════════════════════════════════════════

import { useCallback, useRef, useState } from 'react';
import type {
  AvailableModel,
  ForgeCompleteEvent,
  ForgeModelCompleteEvent,
  ForgeModelErrorEvent,
  ForgeModelReasoningEvent,
  ForgePhase,
  ForgeStartedEvent,
  ForgeState,
  ForgeSynthesisReasoningEvent,
  ModelResult,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.agenttownsquare.com';

const INITIAL_STATE: ForgeState = {
  phase: 'idle',
  forgeId: null,
  promptReceipt: null,
  models: [],
  synthesis: {
    assessment: null,
    modelWeights: {},
    parsedJson: null,
    receipt: null,
  },
  complete: null,
  error: null,
};

export function useForgeStream() {
  const [state, setState] = useState<ForgeState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setState(INITIAL_STATE);
  }, []);

  const startForge = useCallback(
    async (
      prompt: string,
      modelKeys: string[],
      synthesizer: string,
      apiKey: string,
      customPrompt?: string,
    ) => {
      // Abort any previous run
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Initialize model slots
      const modelSlots: ModelResult[] = modelKeys.map((key) => ({
        modelKey: key,
        displayName: key.toUpperCase(),
        content: null,
        elapsedMs: 0,
        receipt: null,
        reasoningReceipt: null,
        reasoningTree: null,
        error: null,
        status: 'pending',
      }));

      setState({
        ...INITIAL_STATE,
        phase: 'started',
        models: modelSlots,
      });

      try {
        const resp = await fetch(`${API_BASE}/v1/forge/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({
            prompt,
            models: modelKeys,
            synthesizer,
            custom_synthesizer_prompt: customPrompt || undefined,
            stream: true,
          }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const err = await resp.text();
          setState((s) => ({ ...s, phase: 'error', error: `API error ${resp.status}: ${err}` }));
          return;
        }

        const reader = resp.body?.getReader();
        if (!reader) {
          setState((s) => ({ ...s, phase: 'error', error: 'No response stream' }));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ') && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6));
                handleEvent(currentEvent, data, setState);
              } catch {
                // skip malformed JSON
              }
              currentEvent = '';
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setState((s) => ({ ...s, phase: 'error', error: err.message }));
        }
      }
    },
    [],
  );

  return { state, startForge, reset };
}

// ─── Event Dispatcher ─────────────────────────────────────

function handleEvent(
  eventType: string,
  data: any,
  setState: React.Dispatch<React.SetStateAction<ForgeState>>,
) {
  switch (eventType) {
    case 'forge.started': {
      const ev = data as ForgeStartedEvent;
      setState((s) => ({
        ...s,
        phase: 'analyzing',
        forgeId: ev.forge_id,
        promptReceipt: ev.prompt_receipt,
      }));
      break;
    }

    case 'forge.model.reasoning': {
      const ev = data as ForgeModelReasoningEvent;
      setState((s) => ({
        ...s,
        models: s.models.map((m) =>
          m.modelKey === ev.model_key
            ? {
                ...m,
                content: ev.content,
                elapsedMs: ev.elapsed_ms,
                reasoningTree: ev.reasoning_tree,
                status: 'streaming' as const,
              }
            : m,
        ),
      }));
      break;
    }

    case 'forge.model.complete': {
      const ev = data as ForgeModelCompleteEvent;
      setState((s) => ({
        ...s,
        models: s.models.map((m) =>
          m.modelKey === ev.model_key
            ? {
                ...m,
                receipt: ev.receipt,
                reasoningReceipt: ev.reasoning_receipt,
                status: 'complete' as const,
              }
            : m,
        ),
      }));
      break;
    }

    case 'forge.model.error': {
      const ev = data as ForgeModelErrorEvent;
      setState((s) => ({
        ...s,
        models: s.models.map((m) =>
          m.modelKey === ev.model_key
            ? { ...m, error: ev.error, status: 'error' as const, elapsedMs: ev.elapsed_ms }
            : m,
        ),
      }));
      break;
    }

    case 'forge.synthesis.start': {
      setState((s) => ({ ...s, phase: 'synthesizing' }));
      break;
    }

    case 'forge.synthesis.reasoning': {
      const ev = data as ForgeSynthesisReasoningEvent;
      setState((s) => ({
        ...s,
        synthesis: {
          ...s.synthesis,
          assessment: ev.content,
          modelWeights: ev.model_weights,
          parsedJson: ev.parsed_json,
        },
      }));
      break;
    }

    case 'forge.complete': {
      const ev = data as ForgeCompleteEvent;
      setState((s) => ({
        ...s,
        phase: 'complete',
        complete: ev,
        synthesis: {
          ...s.synthesis,
          receipt: ev.synthesis_receipt,
          assessment: ev.assessment,
          modelWeights: ev.model_weights,
        },
      }));
      break;
    }

    case 'forge.error': {
      setState((s) => ({
        ...s,
        phase: 'error',
        error: (data as any).error || 'Unknown error',
      }));
      break;
    }
  }
}

// ─── Fetch Available Models ───────────────────────────────

export async function fetchForgeModels(): Promise<{
  models: AvailableModel[];
  presets: string[];
}> {
  try {
    const resp = await fetch(`${API_BASE}/v1/forge/models`);
    if (resp.ok) {
      const data = await resp.json();
      return {
        models: data.models || [],
        presets: data.synthesizer_presets || ['general'],
      };
    }
  } catch {
    // fallback
  }
  return {
    models: [
      { key: 'deepseek', display_name: 'DEEPSEEK R1', status: 'active' as const },
      { key: 'gemini', display_name: 'GEMINI 3', status: 'active' as const },
      { key: 'sonnet', display_name: 'SONNET 4.6', status: 'active' as const },
      { key: 'kimi', display_name: 'KIMI K2.5', status: 'active' as const },
      { key: 'chatgpt', display_name: 'GPT-5.4', status: 'blocked' as const, blocked_reason: 'Requires provider data-sharing' },
      { key: 'grok', display_name: 'GROK 4.1', status: 'blocked' as const, blocked_reason: 'Requires provider data-sharing' },
    ],
    presets: ['general', 'osint', 'trading', 'real_estate', 'legal', 'custom'],
  };
}
