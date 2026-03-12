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
      const active = m.filter((model) => model.status !== 'blocked');
      if (active.length > 0) setModels(active);
    });
  }, []);

  const handleSubmit = (prompt: string, subject: string, selectedModels: string[]) => {
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }
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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        color: '#f0e6d6',
        background: '#141210',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(216,160,100,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'rgba(20,18,16,0.98)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a
            href="/"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#8a7e72',
              textDecoration: 'none',
              letterSpacing: 1,
            }}
          >
            NotaryOS
          </a>
          <span style={{ color: '#3d3730' }}>/</span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #e8985a, #d47c6a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
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
              fontWeight: 600,
              padding: '6px 16px',
              borderRadius: 8,
              border: `1px solid ${apiKey ? 'rgba(122,184,145,0.3)' : 'rgba(212,124,106,0.3)'}`,
              background: apiKey ? 'rgba(122,184,145,0.08)' : 'rgba(212,124,106,0.08)',
              color: apiKey ? '#7ab891' : '#d47c6a',
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
                fontWeight: 600,
                padding: '6px 16px',
                borderRadius: 8,
                border: '1px solid rgba(232,152,90,0.25)',
                background: 'rgba(232,152,90,0.08)',
                color: '#e8985a',
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
            padding: '10px 20px',
            borderBottom: '1px solid rgba(216,160,100,0.1)',
            background: 'rgba(30,27,23,0.9)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, color: '#8a7e72', fontWeight: 600 }}>
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
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(216,160,100,0.18)',
              borderRadius: 8,
              padding: '7px 12px',
              fontSize: 13,
              fontFamily: 'monospace',
              color: '#f0e6d6',
              outline: 'none',
            }}
          />
          <button
            onClick={() => setShowKeyInput(false)}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '6px 16px',
              borderRadius: 8,
              border: '1px solid rgba(232,152,90,0.2)',
              background: 'transparent',
              color: '#e8985a',
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
