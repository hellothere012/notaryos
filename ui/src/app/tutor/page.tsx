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
          padding: '10px 16px',
          borderBottom: '1px solid rgba(139,92,246,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'rgba(8,16,28,0.98)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a
            href="/"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
              textDecoration: 'none',
              letterSpacing: 1,
              fontFamily: '-apple-system, sans-serif',
            }}
          >
            NotaryOS
          </a>
          <span style={{ color: '#334155' }}>/</span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: '-apple-system, sans-serif',
            }}
          >
            AI Tutor
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            style={{
              fontSize: 11,
              fontFamily: '-apple-system, sans-serif',
              fontWeight: 600,
              padding: '5px 14px',
              borderRadius: 8,
              border: `1px solid ${apiKey ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
              background: apiKey ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
              color: apiKey ? '#22c55e' : '#f87171',
              cursor: 'pointer',
            }}
          >
            {apiKey ? 'Key Set' : 'Set API Key'}
          </button>

          {(state.phase === 'complete' || state.phase === 'error') && (
            <button
              onClick={reset}
              style={{
                fontSize: 11,
                fontFamily: '-apple-system, sans-serif',
                fontWeight: 600,
                padding: '5px 14px',
                borderRadius: 8,
                border: '1px solid rgba(139,92,246,0.25)',
                background: 'rgba(139,92,246,0.06)',
                color: '#a78bfa',
                cursor: 'pointer',
              }}
            >
              New Question
            </button>
          )}
        </div>
      </div>

      {/* API key input */}
      {showKeyInput && (
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid rgba(139,92,246,0.1)',
            background: 'rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, color: '#64748b', fontFamily: '-apple-system, sans-serif', fontWeight: 600 }}>
            API Key
          </span>
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
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 13,
              fontFamily: 'monospace',
              color: '#e2e8f0',
              outline: 'none',
            }}
          />
          <button
            onClick={() => setShowKeyInput(false)}
            style={{
              fontSize: 11,
              fontFamily: '-apple-system, sans-serif',
              fontWeight: 600,
              padding: '5px 14px',
              borderRadius: 8,
              border: '1px solid rgba(139,92,246,0.2)',
              background: 'transparent',
              color: '#a78bfa',
              cursor: 'pointer',
            }}
          >
            Done
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
