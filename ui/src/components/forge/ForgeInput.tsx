'use client';

// ═══════════════════════════════════════════════════════════
// FORGE — Input Panel
// Prompt box + model selector + synthesizer preset picker.
// Pure UI — no backend logic, no internal details exposed.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import type { AvailableModel } from './types';

const MODEL_COLORS: Record<string, string> = {
  grok: '#ff6600',
  gemini: '#4488ff',
  sonnet: '#cc66ff',
  kimi: '#00ccaa',
  chatgpt: '#10a37f',
};

const PRESET_LABELS: Record<string, string> = {
  general: 'General',
  osint: 'Intelligence',
  trading: 'Trading',
  real_estate: 'Real Estate',
  legal: 'Legal',
  custom: 'Custom',
};

interface ForgeInputProps {
  models: AvailableModel[];
  presets: string[];
  onSubmit: (prompt: string, models: string[], preset: string, customPrompt?: string) => void;
  disabled?: boolean;
}

export default function ForgeInput({ models, presets, onSubmit, disabled }: ForgeInputProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set(['grok', 'gemini', 'sonnet']));
  const [preset, setPreset] = useState('general');
  const [customPrompt, setCustomPrompt] = useState('');

  const toggleModel = (key: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else if (next.size < 4) {
        next.add(key);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (!prompt.trim() || selectedModels.size === 0 || disabled) return;
    onSubmit(
      prompt.trim(),
      Array.from(selectedModels),
      preset,
      preset === 'custom' ? customPrompt.trim() || undefined : undefined,
    );
  };

  return (
    <div
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
        background: 'rgba(8,16,28,0.95)',
      }}
    >
      {/* Prompt input */}
      <div style={{ marginBottom: 10 }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt... All models will analyze it in parallel."
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
          style={{
            width: '100%',
            minHeight: 60,
            maxHeight: 160,
            resize: 'vertical',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 6,
            padding: '10px 12px',
            fontSize: 12,
            fontFamily: '"SF Mono", "Fira Code", monospace',
            color: '#d0e8ff',
            outline: 'none',
          }}
        />
      </div>

      {/* Model selector + preset + submit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Model checkboxes */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {models.map((m) => {
            const active = selectedModels.has(m.key);
            const color = MODEL_COLORS[m.key] || '#00d4ff';
            return (
              <button
                key={m.key}
                onClick={() => toggleModel(m.key)}
                disabled={disabled}
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: 0.5,
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
                  background: active ? `${color}18` : 'transparent',
                  color: active ? color : '#4a7a9a',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {m.display_name}
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />

        {/* Synthesizer preset */}
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          disabled={disabled}
          style={{
            fontSize: 9,
            fontFamily: 'monospace',
            fontWeight: 700,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,170,0,0.25)',
            borderRadius: 4,
            padding: '4px 8px',
            color: '#ffaa00',
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
          }}
        >
          {presets.map((p) => (
            <option key={p} value={p} style={{ background: '#0a1628', color: '#d0e8ff' }}>
              {PRESET_LABELS[p] || p}
            </option>
          ))}
        </select>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !prompt.trim() || selectedModels.size === 0}
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'monospace',
            letterSpacing: 2,
            padding: '6px 20px',
            borderRadius: 4,
            border: 'none',
            background: disabled ? '#333' : 'linear-gradient(135deg, #00d4ff, #cc66ff)',
            color: disabled ? '#666' : '#000',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          FORGE
        </button>
      </div>

      {/* Keyboard hint */}
      <div style={{ fontSize: 8, color: '#4a7a9a', marginTop: 6, fontFamily: 'monospace' }}>
        {selectedModels.size} model{selectedModels.size !== 1 ? 's' : ''} selected | Ctrl+Enter to submit
      </div>

      {/* Custom prompt (only shown for custom preset) */}
      {preset === 'custom' && (
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Custom synthesizer instructions..."
          disabled={disabled}
          style={{
            width: '100%',
            minHeight: 40,
            maxHeight: 100,
            resize: 'vertical',
            marginTop: 8,
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,170,0,0.15)',
            borderRadius: 4,
            padding: '6px 10px',
            fontSize: 10,
            fontFamily: 'monospace',
            color: '#ffaa00',
            outline: 'none',
          }}
        />
      )}
    </div>
  );
}
