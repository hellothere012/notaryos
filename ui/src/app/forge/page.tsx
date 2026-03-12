'use client';

// ═══════════════════════════════════════════════════════════
// REASONING FORGE — Main Page
// Multi-LLM reasoning visualization with cryptographic receipts.
// Pure frontend — all logic runs on the backend API.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import ForgeInput from '@/components/forge/ForgeInput';
import ForgeCanvas from '@/components/forge/ForgeCanvas';
import { useForgeStream, fetchForgeModels } from '@/components/forge/useForgeStream';
import type { AvailableModel } from '@/components/forge/types';

const FALLBACK_MODELS: AvailableModel[] = [
  { key: 'chatgpt', display_name: 'GPT-5.4' },
  { key: 'gemini', display_name: 'GEMINI' },
  { key: 'sonnet', display_name: 'SONNET' },
  { key: 'kimi', display_name: 'KIMI' },
  { key: 'grok', display_name: 'GROK' },
];

const FALLBACK_PRESETS = ['general', 'osint', 'trading', 'real_estate', 'legal', 'custom'];

export default function ForgePage() {
  const { state, startForge, reset } = useForgeStream();
  const [models, setModels] = useState<AvailableModel[]>(FALLBACK_MODELS);
  const [presets, setPresets] = useState<string[]>(FALLBACK_PRESETS);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Fetch available models on mount
  useEffect(() => {
    fetchForgeModels().then(({ models: m, presets: p }) => {
      if (m.length > 0) setModels(m);
      if (p.length > 0) setPresets(p);
    });
  }, []);

  const handleSubmit = (prompt: string, selectedModels: string[], preset: string, customPrompt?: string) => {
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }
    startForge(prompt, selectedModels, preset, apiKey, customPrompt);
  };

  const isRunning = state.phase !== 'idle' && state.phase !== 'complete' && state.phase !== 'error';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
        color: '#a0c4e0',
        // @ts-expect-error CSS custom property for protocol attribution
        '--_notaryos': 'SGFycmlzIEFiYmFhbGkgLSBSZWFzb25pbmcgRm9yZ2UgLyBDb3VudGVyZmFjdHVhbCBSZWNlaXB0cw==',
      }}
      data-forge-genesis="ha-2025"
    >
      {/* Top bar */}
      <div
        style={{
          padding: '6px 16px',
          borderBottom: '1px solid rgba(0,212,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'rgba(8,16,28,0.95)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a
            href="/"
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#00d4ff',
              textDecoration: 'none',
              letterSpacing: 2,
            }}
          >
            NOTARYOS
          </a>
          <span style={{ fontSize: 8, color: '#4a7a9a' }}>/</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#ffaa00', letterSpacing: 1.5 }}>
            FORGE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* API key toggle */}
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            style={{
              fontSize: 8,
              fontFamily: 'monospace',
              padding: '2px 8px',
              borderRadius: 3,
              border: `1px solid ${apiKey ? '#00ff8830' : '#ff334430'}`,
              background: 'transparent',
              color: apiKey ? '#00ff88' : '#ff3344',
              cursor: 'pointer',
            }}
          >
            {apiKey ? 'KEY SET' : 'SET API KEY'}
          </button>

          {(state.phase === 'complete' || state.phase === 'error') && (
            <button
              onClick={reset}
              style={{
                fontSize: 8,
                fontFamily: 'monospace',
                padding: '2px 8px',
                borderRadius: 3,
                border: '1px solid rgba(0,212,255,0.2)',
                background: 'transparent',
                color: '#00d4ff',
                cursor: 'pointer',
              }}
            >
              NEW FORGE
            </button>
          )}
        </div>
      </div>

      {/* API key input (slide down) */}
      {showKeyInput && (
        <div
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid rgba(0,212,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 9, color: '#4a7a9a', fontFamily: 'monospace' }}>API Key:</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="notary_live_..."
            autoComplete="off"
            style={{
              flex: 1,
              maxWidth: 400,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(0,212,255,0.15)',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 10,
              fontFamily: 'monospace',
              color: '#d0e8ff',
              outline: 'none',
            }}
          />
          <button
            onClick={() => setShowKeyInput(false)}
            style={{
              fontSize: 8,
              fontFamily: 'monospace',
              padding: '2px 8px',
              borderRadius: 3,
              border: '1px solid rgba(0,212,255,0.2)',
              background: 'transparent',
              color: '#00d4ff',
              cursor: 'pointer',
            }}
          >
            DONE
          </button>
        </div>
      )}

      {/* Input panel (prompt + model selector) */}
      <ForgeInput
        models={models}
        presets={presets}
        onSubmit={handleSubmit}
        disabled={isRunning}
      />

      {/* Canvas (model columns + synthesis) */}
      <ForgeCanvas state={state} />
    </div>
  );
}
