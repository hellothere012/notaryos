'use client';

// ═══════════════════════════════════════════════════════════
// FORGE — Input Panel
// Prompt box + model selector + synthesizer preset picker.
// Pure UI — no backend logic, no internal details exposed.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import type { AvailableModel } from './types';

const MODEL_COLORS: Record<string, string> = {
  deepseek: '#00aaff',
  gemini: '#4488ff',
  sonnet: '#cc66ff',
  kimi: '#00ccaa',
  chatgpt: '#10a37f',
  grok: '#ff6600',
};

const PRESET_LABELS: Record<string, string> = {
  general: 'General',
  osint: 'Intelligence',
  trading: 'Trading',
  real_estate: 'Real Estate',
  legal: 'Legal',
  tutor_math: 'Tutor: Math',
  tutor_science: 'Tutor: Science',
  tutor_humanities: 'Tutor: Humanities',
  tutor_law: 'Tutor: Law',
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
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set(['deepseek', 'gemini', 'sonnet']));
  const [preset, setPreset] = useState('general');
  const [customPrompt, setCustomPrompt] = useState('');
  const [hoveredBlocked, setHoveredBlocked] = useState<string | null>(null);

  const activeModels = models.filter((m) => m.status !== 'blocked');
  const blockedModels = models.filter((m) => m.status === 'blocked');

  const toggleModel = (key: string) => {
    // Don't allow selecting blocked models
    const model = models.find((m) => m.key === key);
    if (model?.status === 'blocked') return;

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
        padding: '12px 12px',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
        background: 'rgba(8,16,28,0.95)',
        flexShrink: 0,
      }}
    >
      {/* Prompt input */}
      <div style={{ marginBottom: 10 }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt... All models will analyze it in parallel."
          disabled={disabled}
          maxLength={10000}
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
        {/* Active model buttons */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {activeModels.map((m) => {
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

          {/* Blocked model buttons — visually disabled with red X */}
          {blockedModels.map((m) => {
            const isHovered = hoveredBlocked === m.key;
            return (
              <div
                key={m.key}
                style={{ position: 'relative', display: 'inline-block' }}
                onMouseEnter={() => setHoveredBlocked(m.key)}
                onMouseLeave={() => setHoveredBlocked(null)}
              >
                <button
                  disabled
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    letterSpacing: 0.5,
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.06)',
                    color: '#6b3a3a',
                    cursor: 'not-allowed',
                    textDecoration: 'line-through',
                    textDecorationColor: 'rgba(239,68,68,0.6)',
                    opacity: 0.6,
                    position: 'relative',
                  }}
                >
                  {m.display_name}
                  <span
                    style={{
                      position: 'absolute',
                      top: -3,
                      right: -3,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 7,
                      fontWeight: 900,
                      color: '#fff',
                      lineHeight: 1,
                    }}
                  >
                    X
                  </span>
                </button>

                {/* Tooltip on hover */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginTop: 6,
                      padding: '6px 10px',
                      background: 'rgba(20,10,10,0.95)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 4,
                      fontSize: 9,
                      fontFamily: 'monospace',
                      color: '#ef4444',
                      whiteSpace: 'nowrap',
                      zIndex: 50,
                      pointerEvents: 'none',
                    }}
                  >
                    {m.blocked_reason || 'Blocked — requires data-sharing policy'}
                  </div>
                )}
              </div>
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

      {/* Status line */}
      <div style={{ fontSize: 8, color: '#4a7a9a', marginTop: 6, fontFamily: 'monospace', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span>{selectedModels.size} model{selectedModels.size !== 1 ? 's' : ''} selected | Ctrl+Enter to submit</span>
        {blockedModels.length > 0 && (
          <span style={{ color: '#6b3a3a' }}>
            | {blockedModels.map((m) => m.display_name).join(', ')}: requires provider data-sharing
          </span>
        )}
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
