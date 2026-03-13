'use client';

// ═══════════════════════════════════════════════════════════
// CourseCard — Individual course card with subject styling
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import type { Course } from '@/hooks/useTutorWorkspace';

/* -------------------------------------------------------------------------- */
/*  Style constants                                                            */
/* -------------------------------------------------------------------------- */

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const CREAM = '#f0e6d6';
const MUTED = '#8a7e72';
const DIM = '#6b5e52';

/* -------------------------------------------------------------------------- */
/*  Subject mappings                                                           */
/* -------------------------------------------------------------------------- */

const SUBJECT_EMOJI: Record<string, string> = {
  math: '\uD83D\uDCD0',       // 📐
  science: '\uD83D\uDD2C',    // 🔬
  humanities: '\uD83D\uDCDA', // 📚
  law: '\u2696\uFE0F',        // ⚖️
};

const SUBJECT_COLOR: Record<string, string> = {
  math: '#e8a838',
  science: '#5ab89a',
  humanities: '#d47c8a',
  law: '#9a8ac8',
};

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

interface CourseCardProps {
  course: Course;
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: number) => void;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function CourseCard({ course, isActive, onClick, onDelete }: CourseCardProps) {
  const [hovered, setHovered] = useState(false);

  const color = SUBJECT_COLOR[course.subject] ?? '#e8a838';
  const emoji = SUBJECT_EMOJI[course.subject] ?? '\uD83D\uDCDA';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '18px 20px',
        borderRadius: 14,
        border: `1px solid ${isActive ? `${color}44` : 'rgba(160,144,128,0.12)'}`,
        borderLeft: `3px solid ${isActive ? color : 'rgba(160,144,128,0.12)'}`,
        background: isActive ? `${color}08` : 'rgba(160,144,128,0.03)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isActive ? `0 0 20px ${color}18` : 'none',
      }}
    >
      {/* ── Delete button (visible on hover) ──────────── */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(course.id);
        }}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: '1px solid rgba(160,144,128,0.15)',
          background: hovered ? 'rgba(212,124,106,0.15)' : 'transparent',
          color: hovered ? '#d47c6a' : 'transparent',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: FONT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
          padding: 0,
          lineHeight: 1,
        }}
        title="Delete course"
      >
        {'\u00D7'}
      </button>

      {/* ── Subject emoji + name ──────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 26 }}>{emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 15,
              fontWeight: 700,
              color: isActive ? CREAM : MUTED,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
            }}
          >
            {course.name}
          </div>
          {course.description && (
            <div
              style={{
                fontFamily: FONT,
                fontSize: 11,
                color: DIM,
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {course.description}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row: material count + subject tag ──── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Material count badge */}
        <span
          style={{
            fontFamily: FONT,
            fontSize: 10,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 10,
            background: 'rgba(160,144,128,0.08)',
            color: MUTED,
            border: '1px solid rgba(160,144,128,0.1)',
          }}
        >
          {course.material_count} material{course.material_count !== 1 ? 's' : ''}
        </span>

        {/* Subject tag */}
        <span
          style={{
            fontFamily: FONT,
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 10,
            background: `${color}12`,
            color: color,
            border: `1px solid ${color}25`,
            textTransform: 'capitalize',
          }}
        >
          {course.subject}
        </span>
      </div>
    </div>
  );
}
