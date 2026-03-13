'use client';

// ═══════════════════════════════════════════════════════════
// SemesterSelector — Horizontal pill row + create button
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import type { Semester } from '@/hooks/useTutorWorkspace';

/* -------------------------------------------------------------------------- */
/*  Style constants                                                            */
/* -------------------------------------------------------------------------- */

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const AMBER = '#e8a838';
const CREAM = '#f0e6d6';
const MUTED = '#8a7e72';
const DIM = '#6b5e52';
const DARK_BG = '#141210';

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

interface SemesterSelectorProps {
  semesters: Semester[];
  activeSemesterId: number | null;
  onSelect: (id: number) => void;
  onCreate: (name: string) => void;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function SemesterSelector({
  semesters,
  activeSemesterId,
  onSelect,
  onCreate,
}: SemesterSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setNewName('');
    setIsCreating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      setNewName('');
      setIsCreating(false);
    }
  };

  // ── Empty state: first-time CTA ───────────────────────
  if (semesters.length === 0 && !isCreating) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '16px 20px',
        }}
      >
        <button
          onClick={() => setIsCreating(true)}
          style={{
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 700,
            padding: '12px 28px',
            borderRadius: 12,
            border: `1.5px solid ${AMBER}`,
            background: `${AMBER}14`,
            color: AMBER,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: `0 0 20px rgba(232,168,56,0.15)`,
          }}
        >
          Create your first semester
        </button>
      </div>
    );
  }

  // ── Pill row ───────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 20px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {semesters.map((sem) => {
        const isActive = sem.id === activeSemesterId;
        return (
          <button
            key={sem.id}
            onClick={() => onSelect(sem.id)}
            style={{
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              padding: '8px 18px',
              borderRadius: 20,
              border: `1.5px solid ${isActive ? AMBER : 'rgba(160,144,128,0.15)'}`,
              background: isActive ? `${AMBER}14` : 'rgba(160,144,128,0.04)',
              color: isActive ? AMBER : MUTED,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isActive ? `0 0 16px rgba(232,168,56,0.2)` : 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {sem.name}
            {sem.course_count > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  color: isActive ? CREAM : DIM,
                  opacity: 0.7,
                }}
              >
                ({sem.course_count})
              </span>
            )}
          </button>
        );
      })}

      {/* ── Inline create form or "+" button ───────────── */}
      {isCreating ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newName.trim()) {
                setIsCreating(false);
              }
            }}
            placeholder="Semester name"
            maxLength={60}
            style={{
              fontFamily: FONT,
              fontSize: 13,
              padding: '7px 14px',
              borderRadius: 20,
              border: `1.5px solid ${AMBER}44`,
              background: 'rgba(0,0,0,0.3)',
              color: CREAM,
              outline: 'none',
              width: 140,
            }}
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            style={{
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 700,
              padding: '7px 14px',
              borderRadius: 20,
              border: 'none',
              background: newName.trim()
                ? `linear-gradient(135deg, ${AMBER}, #d47c6a)`
                : 'rgba(160,144,128,0.1)',
              color: newName.trim() ? '#fff' : DIM,
              cursor: newName.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          style={{
            fontFamily: FONT,
            fontSize: 18,
            fontWeight: 400,
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: `1.5px dashed rgba(160,144,128,0.25)`,
            background: 'transparent',
            color: MUTED,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          title="Add semester"
        >
          +
        </button>
      )}
    </div>
  );
}
