'use client';

// ═══════════════════════════════════════════════════════════
// TUTOR — Input Panel
// Student-friendly subject selector + prompt box.
// Warm, inviting design for high school/college students.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import type { AvailableModel } from '../forge/types';

const SUBJECTS = [
  {
    key: 'math',
    label: 'Math',
    emoji: '📐',
    color: '#a78bfa',
    activeGlow: 'rgba(167,139,250,0.25)',
    placeholder: 'e.g., Walk me through integration by parts for ∫ x^2 e^x dx',
  },
  {
    key: 'science',
    label: 'Science',
    emoji: '🔬',
    color: '#22d3ee',
    activeGlow: 'rgba(34,211,238,0.25)',
    placeholder: 'e.g., How do buffers maintain pH? Show me step by step',
  },
  {
    key: 'humanities',
    label: 'Humanities',
    emoji: '📚',
    color: '#fbbf24',
    activeGlow: 'rgba(251,191,36,0.25)',
    placeholder: 'e.g., Help me build a thesis about the green light in The Great Gatsby',
  },
  {
    key: 'law',
    label: 'Law',
    emoji: '⚖️',
    color: '#f87171',
    activeGlow: 'rgba(248,113,113,0.25)',
    placeholder: 'e.g., Break down Miranda v. Arizona — arguments on both sides',
  },
];

const MODEL_COLORS: Record<string, string> = {
  deepseek: '#00aaff',
  gemini: '#4488ff',
  sonnet: '#cc66ff',
  kimi: '#00ccaa',
};

interface TutorInputProps {
  models: AvailableModel[];
  onSubmit: (prompt: string, subject: string, models: string[]) => void;
  disabled?: boolean;
}

export default function TutorInput({ models, onSubmit, disabled }: TutorInputProps) {
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState('math');
  const [selectedModels, setSelectedModels] = useState<Set<string>>(
    new Set(['deepseek', 'gemini', 'sonnet']),
  );

  const activeSubject = SUBJECTS.find((s) => s.key === subject) || SUBJECTS[0];
  const activeModels = models.filter((m) => m.status !== 'blocked');

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
    onSubmit(prompt.trim(), subject, Array.from(selectedModels));
  };

  return (
    <div
      style={{
        padding: '14px 16px',
        borderBottom: `2px solid ${activeSubject.color}20`,
        background: 'rgba(8,16,28,0.95)',
        flexShrink: 0,
      }}
    >
      {/* Subject selector — big, tappable buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {SUBJECTS.map((s) => {
          const active = subject === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setSubject(s.key)}
              disabled={disabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                padding: '8px 16px',
                borderRadius: 10,
                border: `1.5px solid ${active ? s.color : 'rgba(255,255,255,0.06)'}`,
                background: active ? `${s.color}12` : 'rgba(255,255,255,0.02)',
                color: active ? s.color : '#64748b',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: active ? `0 0 16px ${s.activeGlow}` : 'none',
              }}
            >
              <span style={{ fontSize: 18 }}>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Prompt input */}
      <div style={{ marginBottom: 10 }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={activeSubject.placeholder}
          disabled={disabled}
          maxLength={10000}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
          style={{
            width: '100%',
            minHeight: 72,
            maxHeight: 180,
            resize: 'vertical',
            background: 'rgba(0,0,0,0.3)',
            border: `1.5px solid ${activeSubject.color}25`,
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 14,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            color: '#e2e8f0',
            outline: 'none',
            lineHeight: 1.6,
          }}
        />
      </div>

      {/* Model selector + submit row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Model pills */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span
            style={{
              fontSize: 10,
              color: '#475569',
              fontFamily: '-apple-system, sans-serif',
              fontWeight: 600,
              marginRight: 4,
            }}
          >
            AI Models:
          </span>
          {activeModels.map((m) => {
            const active = selectedModels.has(m.key);
            const color = MODEL_COLORS[m.key] || '#00d4ff';
            return (
              <button
                key={m.key}
                onClick={() => toggleModel(m.key)}
                disabled={disabled}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: 0.5,
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: `1px solid ${active ? color : 'rgba(255,255,255,0.08)'}`,
                  background: active ? `${color}15` : 'transparent',
                  color: active ? color : '#475569',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {m.display_name}
              </button>
            );
          })}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !prompt.trim() || selectedModels.size === 0}
          style={{
            marginLeft: 'auto',
            fontSize: 14,
            fontWeight: 800,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            letterSpacing: 1,
            padding: '9px 28px',
            borderRadius: 10,
            border: 'none',
            background: disabled
              ? '#1e293b'
              : `linear-gradient(135deg, ${activeSubject.color}, #06b6d4)`,
            color: disabled ? '#475569' : '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: disabled ? 'none' : `0 4px 16px ${activeSubject.activeGlow}`,
          }}
        >
          Explain This
        </button>
      </div>

      {/* Helper text */}
      <div
        style={{
          fontSize: 11,
          color: '#475569',
          marginTop: 8,
          fontFamily: '-apple-system, sans-serif',
        }}
      >
        {selectedModels.size} model{selectedModels.size !== 1 ? 's' : ''} will solve this
        independently, then show you the clearest step-by-step path
        <span style={{ color: '#334155', marginLeft: 6 }}>
          Ctrl+Enter to submit
        </span>
      </div>
    </div>
  );
}
