'use client';

// ═══════════════════════════════════════════════════════════
// MaterialPanel — Material list + inline add form
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import type { Material } from '@/hooks/useTutorWorkspace';

/* -------------------------------------------------------------------------- */
/*  Style constants                                                            */
/* -------------------------------------------------------------------------- */

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const AMBER = '#e8a838';
const CORAL = '#d47c6a';
const SAGE = '#5ab89a';
const LAVENDER = '#9a8ac8';
const CREAM = '#f0e6d6';
const MUTED = '#8a7e72';
const DIM = '#6b5e52';

/* -------------------------------------------------------------------------- */
/*  Material type config                                                       */
/* -------------------------------------------------------------------------- */

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  url: { icon: '\uD83D\uDD17', label: 'URL', color: SAGE },          // 🔗
  text: { icon: '\uD83D\uDCDD', label: 'Notes', color: AMBER },      // 📝
  syllabus: { icon: '\uD83D\uDCCB', label: 'Syllabus', color: LAVENDER }, // 📋
};

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

interface MaterialPanelProps {
  materials: Material[];
  onAdd: (title: string, type: string, content: string) => void;
  onDelete: (id: number) => void;
  courseName: string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function MaterialPanel({
  materials,
  onAdd,
  onDelete,
  courseName,
}: MaterialPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [materialType, setMaterialType] = useState<string>('text');
  const [content, setContent] = useState('');
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const handleAdd = () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) return;
    onAdd(trimmedTitle, materialType, trimmedContent);
    setTitle('');
    setContent('');
    setMaterialType('text');
    setShowForm(false);
  };

  const typeConfig = TYPE_CONFIG[materialType] ?? TYPE_CONFIG.text;

  return (
    <div
      style={{
        padding: '20px',
        borderRadius: 14,
        border: '1px solid rgba(160,144,128,0.12)',
        background: 'rgba(160,144,128,0.02)',
      }}
    >
      {/* ── Header ────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 700,
            color: CREAM,
          }}
        >
          {courseName}
          <span style={{ color: MUTED, fontWeight: 500 }}>
            {' '}&mdash; Materials ({materials.length})
          </span>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 700,
              padding: '7px 16px',
              borderRadius: 10,
              border: `1.5px solid ${AMBER}44`,
              background: `${AMBER}10`,
              color: AMBER,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            + Add Material
          </button>
        )}
      </div>

      {/* ── Material list ─────────────────────────────── */}
      {materials.length === 0 && !showForm && (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 13,
            color: DIM,
            textAlign: 'center',
            padding: '24px 0',
          }}
        >
          No materials yet. Add URLs, notes, or a syllabus to give the tutor context.
        </div>
      )}

      {materials.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: showForm ? 16 : 0 }}>
          {materials.map((mat) => {
            const cfg = TYPE_CONFIG[mat.material_type] ?? TYPE_CONFIG.text;
            const isHovered = hoveredId === mat.id;
            const preview =
              mat.content.length > 120
                ? mat.content.substring(0, 120) + '...'
                : mat.content;

            return (
              <div
                key={mat.id}
                onMouseEnter={() => setHoveredId(mat.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(160,144,128,0.08)',
                  background: 'rgba(0,0,0,0.15)',
                  position: 'relative',
                }}
              >
                {/* Type icon */}
                <span
                  style={{
                    fontSize: 20,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {cfg.icon}
                </span>

                {/* Content area */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: 13,
                      fontWeight: 600,
                      color: CREAM,
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {mat.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: 11,
                      color: DIM,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    {preview}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => onDelete(mat.id)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: '1px solid rgba(160,144,128,0.15)',
                    background: isHovered ? 'rgba(212,124,106,0.15)' : 'transparent',
                    color: isHovered ? CORAL : 'transparent',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: FONT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    padding: 0,
                    lineHeight: 1,
                  }}
                  title="Delete material"
                >
                  {'\u00D7'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Material form (inline) ────────────────── */}
      {showForm && (
        <div
          style={{
            padding: '16px',
            borderRadius: 12,
            border: `1px solid ${AMBER}22`,
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Material title"
            maxLength={120}
            style={{
              width: '100%',
              fontFamily: FONT,
              fontSize: 13,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid rgba(160,144,128,0.15)',
              background: 'rgba(0,0,0,0.25)',
              color: CREAM,
              outline: 'none',
              marginBottom: 10,
              boxSizing: 'border-box',
            }}
          />

          {/* Type selector: 3 radio-style buttons */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {(['url', 'text', 'syllabus'] as const).map((t) => {
              const cfg = TYPE_CONFIG[t];
              const isSelected = materialType === t;
              return (
                <button
                  key={t}
                  onClick={() => setMaterialType(t)}
                  style={{
                    fontFamily: FONT,
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    padding: '7px 16px',
                    borderRadius: 8,
                    border: `1.5px solid ${isSelected ? cfg.color + '66' : 'rgba(160,144,128,0.12)'}`,
                    background: isSelected ? `${cfg.color}14` : 'transparent',
                    color: isSelected ? cfg.color : MUTED,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Content input: textarea for text/syllabus, URL input for url */}
          {materialType === 'url' ? (
            <input
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="https://example.com/lecture-notes"
              style={{
                width: '100%',
                fontFamily: FONT,
                fontSize: 13,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(160,144,128,0.15)',
                background: 'rgba(0,0,0,0.25)',
                color: CREAM,
                outline: 'none',
                marginBottom: 12,
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                materialType === 'syllabus'
                  ? 'Paste your course syllabus here...'
                  : 'Paste lecture notes, textbook excerpts, or study material...'
              }
              maxLength={50000}
              style={{
                width: '100%',
                minHeight: 100,
                maxHeight: 240,
                resize: 'vertical',
                fontFamily: FONT,
                fontSize: 13,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(160,144,128,0.15)',
                background: 'rgba(0,0,0,0.25)',
                color: CREAM,
                outline: 'none',
                lineHeight: 1.6,
                marginBottom: 12,
                boxSizing: 'border-box',
              }}
            />
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              onClick={() => {
                setShowForm(false);
                setTitle('');
                setContent('');
                setMaterialType('text');
              }}
              style={{
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid rgba(160,144,128,0.15)',
                background: 'transparent',
                color: MUTED,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!title.trim() || !content.trim()}
              style={{
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 700,
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                background:
                  title.trim() && content.trim()
                    ? `linear-gradient(135deg, ${AMBER}, ${CORAL})`
                    : 'rgba(160,144,128,0.1)',
                color: title.trim() && content.trim() ? '#fff' : DIM,
                cursor: title.trim() && content.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
