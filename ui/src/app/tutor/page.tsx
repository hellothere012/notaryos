'use client';

// ═══════════════════════════════════════════════════════════
// AI TUTOR — Multi-Model Step-by-Step Learning
// Uses the Reasoning Forge backend with tutor-specific presets.
// Students see HOW models solve problems, not just answers.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import ForgeCanvas from '@/components/forge/ForgeCanvas';
import { useForgeStream, fetchForgeModels } from '@/components/forge/useForgeStream';
import type { AvailableModel } from '@/components/forge/types';
import TutorInput from '@/components/tutor/TutorInput';
import TutorLanding from '@/components/tutor/TutorLanding';

const FALLBACK_MODELS: AvailableModel[] = [
  { key: 'deepseek', display_name: 'DEEPSEEK R1' },
  { key: 'gemini', display_name: 'GEMINI 3' },
  { key: 'sonnet', display_name: 'SONNET 4.6' },
];

export default function TutorPage() {
  const { state, startForge, reset } = useForgeStream();
  const [models, setModels] = useState<AvailableModel[]>(FALLBACK_MODELS);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    fetchForgeModels().then(({ models: m }) => {
      // Only show active models for tutor — simpler UI
      const active = m.filter((model) => model.status !== 'blocked');
      if (active.length > 0) setModels(active);
    });
  }, []);

  const handleSubmit = (prompt: string, subject: string, selectedModels: string[]) => {
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }
    // Map subject to tutor preset
    const presetMap: Record<string, string> = {
      math: 'tutor_math',
      science: 'tutor_science',
      humanities: 'tutor_humanities',
      law: 'tutor_law',
    };
    const preset = presetMap[subject] || 'tutor_math';
    startForge(prompt, selectedModels, preset, apiKey);
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
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid rgba(139,92,246,0.2)',
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
          <span style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', letterSpacing: 1.5 }}>
            AI TUTOR
          </span>
          <span style={{ fontSize: 8, color: '#6d28d9', fontWeight: 600, letterSpacing: 1 }}>
            STEP-BY-STEP
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            style={{
              fontSize: 8,
              fontFamily: 'monospace',
              padding: '3px 10px',
              borderRadius: 4,
              border: `1px solid ${apiKey ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              background: 'transparent',
              color: apiKey ? '#22c55e' : '#ef4444',
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
                padding: '3px 10px',
                borderRadius: 4,
                border: '1px solid rgba(139,92,246,0.3)',
                background: 'transparent',
                color: '#8b5cf6',
                cursor: 'pointer',
              }}
            >
              NEW QUESTION
            </button>
          )}

          <a
            href="/forge"
            style={{
              fontSize: 8,
              fontFamily: 'monospace',
              padding: '3px 10px',
              borderRadius: 4,
              border: '1px solid rgba(0,212,255,0.2)',
              background: 'transparent',
              color: '#00d4ff',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            FORGE MODE
          </a>
        </div>
      </div>

      {/* API key input */}
      {showKeyInput && (
        <div
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid rgba(139,92,246,0.1)',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 9, color: '#6d28d9', fontFamily: 'monospace' }}>API Key:</span>
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
              border: '1px solid rgba(139,92,246,0.2)',
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
              padding: '3px 10px',
              borderRadius: 4,
              border: '1px solid rgba(139,92,246,0.2)',
              background: 'transparent',
              color: '#8b5cf6',
              cursor: 'pointer',
            }}
          >
            DONE
          </button>
        </div>
      )}

      {/* Tutor input — subject selector + prompt */}
      <TutorInput
        models={models}
        onSubmit={handleSubmit}
        disabled={isRunning}
      />

      {/* Show landing when idle, ForgeCanvas when running */}
      {state.phase === 'idle' ? <TutorLanding /> : <ForgeCanvas state={state} />}
    </div>
  );
}
