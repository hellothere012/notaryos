'use client';

// ═══════════════════════════════════════════════════════════
// TUTOR — Input Panel (Collapsible)
// Student-friendly subject selector + prompt box.
// Collapses to a slim bar on mobile to save screen space.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import type { AvailableModel } from '../forge/types';

const SUBJECTS = [
  {
    key: 'math',
    label: 'Math',
    emoji: '📐',
    color: '#e8a838',
    activeGlow: 'rgba(232,168,56,0.2)',
    placeholder: 'e.g., Walk me through integration by parts for ∫ x^2 e^x dx',
  },
  {
    key: 'science',
    label: 'Science',
    emoji: '🔬',
    color: '#5ab89a',
    activeGlow: 'rgba(90,184,154,0.2)',
    placeholder: 'e.g., How do buffers maintain pH? Show me step by step',
  },
  {
    key: 'humanities',
    label: 'Humanities',
    emoji: '📚',
    color: '#d47c8a',
    activeGlow: 'rgba(212,124,138,0.2)',
    placeholder: 'e.g., Help me build a thesis about the green light in The Great Gatsby',
  },
  {
    key: 'law',
    label: 'Law',
    emoji: '⚖️',
    color: '#9a8ac8',
    activeGlow: 'rgba(154,138,200,0.2)',
    placeholder: 'e.g., Break down Miranda v. Arizona — arguments on both sides',
  },
];

const MODEL_COLORS: Record<string, string> = {
  deepseek: '#c49a5c',
  gemini: '#8aaa78',
  sonnet: '#b88a9a',
  kimi: '#6aaa9a',
};

interface TutorInputProps {
  models: AvailableModel[];
  onSubmit: (prompt: string, subject: string, models: string[]) => void;
  disabled?: boolean;
}

export default function TutorInput({ models, onSubmit, disabled }: TutorInputProps) {
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState('math');
  const [expanded, setExpanded] = useState(true);
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
    setExpanded(false);
  };

  // ── Collapsed bar ──────────────────────────────
  if (!expanded) {
    return (
      <div
        style={{
          padding: '10px 20px',
          borderBottom: `1px solid ${activeSubject.color}18`,
          background: 'rgba(20,18,16,0.95)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(true)}
      >
        <span style={{ fontSize: 18 }}>{activeSubject.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {prompt.trim() ? (
            <div
              style={{
                fontSize: 13,
                color: '#a09080',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {prompt.trim()}
            </div>
          ) : (
            <div
              style={{
                fontSize: 13,
                color: '#6b5e52',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            >
              Tap to ask a question...
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: '#6b5e52',
              fontFamily: '-apple-system, sans-serif',
              fontWeight: 600,
            }}
          >
            {selectedModels.size} model{selectedModels.size !== 1 ? 's' : ''}
          </span>
          <span
            style={{
              fontSize: 16,
              color: activeSubject.color,
              transition: 'transform 0.2s',
              display: 'inline-block',
            }}
          >
            &#9660;
          </span>
        </div>
      </div>
    );
  }

  // ── Expanded panel ─────────────────────────────
  return (
    <div
      style={{
        padding: '14px 20px',
        borderBottom: `2px solid ${activeSubject.color}18`,
        background: 'rgba(20,18,16,0.95)',
        flexShrink: 0,
      }}
    >
      {/* Collapse toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        {/* Subject selector — big, tappable buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
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
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: `1.5px solid ${active ? s.color : 'rgba(160,144,128,0.12)'}`,
                  background: active ? `${s.color}14` : 'rgba(160,144,128,0.04)',
                  color: active ? s.color : '#8a7e72',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? `0 0 20px ${s.activeGlow}` : 'none',
                }}
              >
                <span style={{ fontSize: 18 }}>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Minimize button */}
        <button
          onClick={() => setExpanded(false)}
          style={{
            fontSize: 11,
            fontWeight: 600,
            fontFamily: '-apple-system, sans-serif',
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(160,144,128,0.12)',
            background: 'transparent',
            color: '#6b5e52',
            cursor: 'pointer',
            flexShrink: 0,
            marginLeft: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>&#9650;</span>
          <span>Minimize</span>
        </button>
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
            background: 'rgba(0,0,0,0.2)',
            border: `1.5px solid ${activeSubject.color}22`,
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 14,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            color: '#f0e6d6',
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
              color: '#6b5e52',
              fontWeight: 600,
              marginRight: 4,
            }}
          >
            AI Models:
          </span>
          {activeModels.map((m) => {
            const active = selectedModels.has(m.key);
            const color = MODEL_COLORS[m.key] || '#c49a5c';
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
                  border: `1px solid ${active ? color : 'rgba(160,144,128,0.12)'}`,
                  background: active ? `${color}18` : 'transparent',
                  color: active ? color : '#6b5e52',
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
            letterSpacing: 0.5,
            padding: '9px 28px',
            borderRadius: 10,
            border: 'none',
            background: disabled
              ? '#2a2520'
              : `linear-gradient(135deg, ${activeSubject.color}, #d47c6a)`,
            color: disabled ? '#6b5e52' : '#fff',
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
          color: '#6b5e52',
          marginTop: 8,
        }}
      >
        {selectedModels.size} model{selectedModels.size !== 1 ? 's' : ''} will solve this
        independently, then show you the clearest step-by-step path
        <span style={{ color: '#4a3f35', marginLeft: 6 }}>
          Ctrl+Enter to submit
        </span>
      </div>
    </div>
  );
}
