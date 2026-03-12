'use client';

// ═══════════════════════════════════════════════════════════
// TUTOR — Input Panel
// Student-friendly subject selector + prompt box.
// Sends to Forge API with tutor-specific presets.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import type { AvailableModel } from '../forge/types';

const SUBJECTS = [
  {
    key: 'math',
    label: 'Mathematics',
    icon: '∑',
    color: '#8b5cf6',
    description: 'Algebra, Calculus, Statistics, Proofs',
    placeholder: 'e.g., How do I solve ∫ x²·sin(x) dx using integration by parts?',
  },
  {
    key: 'science',
    label: 'Science',
    icon: '⚛',
    color: '#06b6d4',
    description: 'Physics, Chemistry, Biology',
    placeholder: 'e.g., Explain how Le Chatelier\'s principle applies to the Haber process',
  },
  {
    key: 'humanities',
    label: 'Humanities',
    icon: '📖',
    color: '#f59e0b',
    description: 'History, Literature, Philosophy',
    placeholder: 'e.g., Analyze the theme of isolation in Frankenstein with textual evidence',
  },
  {
    key: 'law',
    label: 'Law & Justice',
    icon: '⚖',
    color: '#ef4444',
    description: 'Case Briefs, Constitutional, Criminal',
    placeholder: 'e.g., Brief Miranda v. Arizona — what were the top arguments on each side?',
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
        padding: '12px 16px',
        borderBottom: '1px solid rgba(139,92,246,0.15)',
        background: 'rgba(8,16,28,0.95)',
        flexShrink: 0,
      }}
    >
      {/* Subject selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
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
                gap: 6,
                fontSize: 10,
                fontWeight: 700,
                fontFamily: 'monospace',
                padding: '6px 12px',
                borderRadius: 6,
                border: `1px solid ${active ? s.color : 'rgba(255,255,255,0.08)'}`,
                background: active ? `${s.color}15` : 'transparent',
                color: active ? s.color : '#4a7a9a',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 14 }}>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subject description */}
      <div style={{ fontSize: 8, color: activeSubject.color, fontFamily: 'monospace', marginBottom: 8, letterSpacing: 0.5 }}>
        {activeSubject.description}
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
            minHeight: 70,
            maxHeight: 180,
            resize: 'vertical',
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${activeSubject.color}30`,
            borderRadius: 6,
            padding: '10px 12px',
            fontSize: 12,
            fontFamily: '"SF Mono", "Fira Code", monospace',
            color: '#d0e8ff',
            outline: 'none',
          }}
        />
      </div>

      {/* Model selector + submit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Model buttons */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 8, color: '#4a7a9a', fontFamily: 'monospace', marginRight: 4 }}>
            MODELS:
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

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !prompt.trim() || selectedModels.size === 0}
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'monospace',
            letterSpacing: 2,
            padding: '7px 24px',
            borderRadius: 6,
            border: 'none',
            background: disabled ? '#333' : `linear-gradient(135deg, ${activeSubject.color}, #06b6d4)`,
            color: disabled ? '#666' : '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          EXPLAIN
        </button>
      </div>

      {/* Status */}
      <div style={{ fontSize: 8, color: '#4a7a9a', marginTop: 6, fontFamily: 'monospace' }}>
        {selectedModels.size} model{selectedModels.size !== 1 ? 's' : ''} will solve this independently, then synthesis reveals the best step-by-step approach | Ctrl+Enter to submit
      </div>
    </div>
  );
}
