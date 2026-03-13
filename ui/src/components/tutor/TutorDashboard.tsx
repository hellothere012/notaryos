'use client';

// ═══════════════════════════════════════════════════════════
// TutorDashboard — Main workspace container
// Composes SemesterSelector, CourseCard, MaterialPanel
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import type { Semester, Course, Material } from '@/hooks/useTutorWorkspace';
import SemesterSelector from './SemesterSelector';
import CourseCard from './CourseCard';
import MaterialPanel from './MaterialPanel';

/* -------------------------------------------------------------------------- */
/*  Style constants                                                            */
/* -------------------------------------------------------------------------- */

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const AMBER = '#e8a838';
const CORAL = '#d47c6a';
const SAGE = '#5ab89a';
const CREAM = '#f0e6d6';
const MUTED = '#8a7e72';
const DIM = '#6b5e52';

/* -------------------------------------------------------------------------- */
/*  Subject config for the "Add Course" form                                   */
/* -------------------------------------------------------------------------- */

const SUBJECTS = [
  { key: 'math', label: 'Math', emoji: '\uD83D\uDCD0', color: '#e8a838' },
  { key: 'science', label: 'Science', emoji: '\uD83D\uDD2C', color: '#5ab89a' },
  { key: 'humanities', label: 'Humanities', emoji: '\uD83D\uDCDA', color: '#d47c8a' },
  { key: 'law', label: 'Law', emoji: '\u2696\uFE0F', color: '#9a8ac8' },
];

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

interface TutorDashboardProps {
  semesters: Semester[];
  activeSemester: Semester | null;
  courses: Course[];
  activeCourse: Course | null;
  materials: Material[];
  courseContext: string;
  isLoading: boolean;
  onCreateSemester: (name: string) => void;
  onCreateCourse: (name: string, subject: string, description?: string) => void;
  onAddMaterial: (title: string, type: string, content: string) => void;
  onDeleteMaterial: (id: number) => void;
  onDeleteCourse: (id: number) => void;
  onDeleteSemester: (id: number) => void;
  onSwitchSemester: (id: number) => void;
  onSelectCourse: (id: number | null) => void;
}

/* -------------------------------------------------------------------------- */
/*  Add Course Form (internal)                                                 */
/* -------------------------------------------------------------------------- */

function AddCourseForm({
  onSubmit,
  onCancel,
  isInline,
}: {
  onSubmit: (name: string, subject: string, description?: string) => void;
  onCancel?: () => void;
  isInline?: boolean;
}) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('math');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed, subject, description.trim() || undefined);
    setName('');
    setSubject('math');
    setDescription('');
    if (onCancel) onCancel();
  };

  return (
    <div
      style={{
        padding: isInline ? '16px' : '24px',
        borderRadius: 14,
        border: `1px solid ${AMBER}22`,
        background: 'rgba(0,0,0,0.2)',
      }}
    >
      {/* Course name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Course name"
        autoFocus
        maxLength={100}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape' && onCancel) onCancel();
        }}
        style={{
          width: '100%',
          fontFamily: FONT,
          fontSize: 14,
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid rgba(160,144,128,0.15)',
          background: 'rgba(0,0,0,0.25)',
          color: CREAM,
          outline: 'none',
          marginBottom: 12,
          boxSizing: 'border-box',
        }}
      />

      {/* Subject selector: 4 emoji buttons */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 600,
            color: DIM,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Subject
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SUBJECTS.map((s) => {
            const isSelected = subject === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSubject(s.key)}
                style={{
                  fontFamily: FONT,
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: `1.5px solid ${isSelected ? s.color + '66' : 'rgba(160,144,128,0.12)'}`,
                  background: isSelected ? `${s.color}14` : 'transparent',
                  color: isSelected ? s.color : MUTED,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 16 }}>{s.emoji}</span>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional description */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        maxLength={500}
        style={{
          width: '100%',
          minHeight: 60,
          maxHeight: 120,
          resize: 'vertical',
          fontFamily: FONT,
          fontSize: 13,
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid rgba(160,144,128,0.12)',
          background: 'rgba(0,0,0,0.2)',
          color: CREAM,
          outline: 'none',
          lineHeight: 1.5,
          marginBottom: 12,
          boxSizing: 'border-box',
        }}
      />

      {/* Action buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {onCancel && (
          <button
            onClick={onCancel}
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
        )}
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          style={{
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 700,
            padding: '9px 22px',
            borderRadius: 10,
            border: 'none',
            background: name.trim()
              ? `linear-gradient(135deg, ${AMBER}, ${CORAL})`
              : 'rgba(160,144,128,0.1)',
            color: name.trim() ? '#fff' : DIM,
            cursor: name.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: name.trim() ? `0 4px 16px rgba(232,168,56,0.2)` : 'none',
          }}
        >
          Add Course
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function TutorDashboard({
  semesters,
  activeSemester,
  courses,
  activeCourse,
  materials,
  courseContext,
  isLoading,
  onCreateSemester,
  onCreateCourse,
  onAddMaterial,
  onDeleteMaterial,
  onDeleteCourse,
  onDeleteSemester,
  onSwitchSemester,
  onSelectCourse,
}: TutorDashboardProps) {
  const [showAddCourse, setShowAddCourse] = useState(false);

  // ── Loading state ──────────────────────────────────────
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 20px',
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 14,
            color: MUTED,
          }}
        >
          Loading workspace...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* ── 1. Semester Selector ──────────────────────── */}
      <SemesterSelector
        semesters={semesters}
        activeSemesterId={activeSemester?.id ?? null}
        onSelect={onSwitchSemester}
        onCreate={onCreateSemester}
      />

      {/* ── Semester-level content (only when a semester is active) ── */}
      {activeSemester && (
        <div style={{ padding: '0 20px 20px' }}>
          {/* ── 2. Empty state CTA ────────────────────── */}
          {courses.length === 0 && !showAddCourse && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 22,
                  fontWeight: 800,
                  marginBottom: 10,
                  background: `linear-gradient(135deg, ${AMBER}, ${CORAL})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Add your first course
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 13,
                  color: MUTED,
                  marginBottom: 20,
                  lineHeight: 1.6,
                }}
              >
                Organize your study materials by course.
                <br />
                The AI tutor will use them as context for better answers.
              </div>
              <AddCourseForm onSubmit={onCreateCourse} />
            </div>
          )}

          {/* ── 3. Course grid ────────────────────────── */}
          {courses.length > 0 && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isActive={activeCourse?.id === course.id}
                    onClick={() => onSelectCourse(activeCourse?.id === course.id ? null : course.id)}
                    onDelete={onDeleteCourse}
                  />
                ))}
              </div>

              {/* ── 4. Add Course button / form ─────────── */}
              {showAddCourse ? (
                <AddCourseForm
                  onSubmit={(name, subject, desc) => {
                    onCreateCourse(name, subject, desc);
                    setShowAddCourse(false);
                  }}
                  onCancel={() => setShowAddCourse(false)}
                  isInline
                />
              ) : (
                <button
                  onClick={() => setShowAddCourse(true)}
                  style={{
                    fontFamily: FONT,
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: `1.5px dashed rgba(160,144,128,0.2)`,
                    background: 'transparent',
                    color: MUTED,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    marginBottom: 16,
                  }}
                >
                  + Add Course
                </button>
              )}
            </>
          )}

          {/* ── 5. Material Panel (when a course is selected) ── */}
          {activeCourse && (
            <div style={{ marginTop: 4 }}>
              <MaterialPanel
                materials={materials}
                onAdd={onAddMaterial}
                onDelete={onDeleteMaterial}
                courseName={activeCourse.name}
              />
            </div>
          )}

          {/* ── 6. Context ready badge ────────────────── */}
          {activeCourse && courseContext && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 12,
                padding: '8px 14px',
                borderRadius: 8,
                background: `${SAGE}10`,
                border: `1px solid ${SAGE}25`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: SAGE,
                  boxShadow: `0 0 8px ${SAGE}66`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: 12,
                  fontWeight: 600,
                  color: SAGE,
                }}
              >
                Context ready
              </span>
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: 11,
                  color: MUTED,
                }}
              >
                {materials.length} material{materials.length !== 1 ? 's' : ''} loaded
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
