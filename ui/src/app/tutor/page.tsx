'use client';

// ═══════════════════════════════════════════════════════════
// AI TUTOR — Multi-Model Step-by-Step Learning
// Uses the Reasoning Forge backend with tutor-specific presets.
// 3 modes: authenticated workspace, onboarding, anonymous.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import ForgeCanvas from '@/components/forge/ForgeCanvas';
import { useForgeStream, fetchForgeModels } from '@/components/forge/useForgeStream';
import type { AvailableModel } from '@/components/forge/types';
import { useAuth } from '@/lib/auth-context';
import { useTutorWorkspace } from '@/hooks/useTutorWorkspace';
import TutorInput from '@/components/tutor/TutorInput';
import TutorLanding from '@/components/tutor/TutorLanding';
import TutorDashboard from '@/components/tutor/TutorDashboard';
import AnonymousBanner from '@/components/tutor/AnonymousBanner';

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const AMBER = '#e8a838';
const CORAL = '#d47c6a';
const SAGE = '#5ab89a';
const CREAM = '#f0e6d6';
const MUTED = '#8a7e72';

const FALLBACK_MODELS: AvailableModel[] = [
  { key: 'deepseek', display_name: 'DEEPSEEK R1' },
  { key: 'gemini', display_name: 'GEMINI 3' },
  { key: 'sonnet', display_name: 'SONNET 4.6' },
];

export default function TutorPage() {
  const { state, startForge, reset } = useForgeStream();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const workspace = useTutorWorkspace(isAuthenticated);
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
    // Map subject → synthesizer preset (course subject takes priority)
    const presetMap: Record<string, string> = {
      math: 'tutor_math',
      science: 'tutor_science',
      humanities: 'tutor_humanities',
      law: 'tutor_law',
    };
    const courseSubject = workspace.activeCourse?.subject;
    const preset = presetMap[courseSubject || subject] || 'tutor_math';

    // Inject course context when available (authenticated + course selected)
    const context = workspace.activeCourse && workspace.courseContext
      ? workspace.courseContext
      : undefined;

    startForge(prompt, selectedModels, preset, apiKey, undefined, context);
  };

  const isRunning = state.phase !== 'idle' && state.phase !== 'complete' && state.phase !== 'error';

  // Determine page mode
  const hasWorkspace = isAuthenticated && workspace.semesters.length > 0;
  const isNewUser = isAuthenticated && !workspace.isLoading && workspace.semesters.length === 0;
  const isAnonymous = !isAuthenticated && !authLoading;

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        color: CREAM,
        background: '#141210',
      }}
    >
      {/* ── Top bar ─────────────────────────────────────── */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(216,160,100,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'rgba(20,18,16,0.98)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a
            href="/"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: MUTED,
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
              background: `linear-gradient(135deg, ${AMBER}, ${CORAL})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AI Tutor
          </span>
          {workspace.activeCourse && (
            <>
              <span style={{ color: '#3d3730' }}>/</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: workspace.activeCourse.color || AMBER,
                  opacity: 0.85,
                }}
              >
                {workspace.activeCourse.name}
              </span>
            </>
          )}
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
              color: apiKey ? '#7ab891' : CORAL,
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
                border: `1px solid rgba(232,152,90,0.25)`,
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

      {/* ── API key input ───────────────────────────────── */}
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
          <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>
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
              color: CREAM,
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
              border: `1px solid rgba(232,152,90,0.2)`,
              background: 'transparent',
              color: '#e8985a',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      )}

      {/* ── Anonymous banner ────────────────────────────── */}
      {isAnonymous && <AnonymousBanner />}

      {/* ── Workspace Dashboard (authenticated users) ──── */}
      {isAuthenticated && (
        <TutorDashboard
          semesters={workspace.semesters}
          activeSemester={workspace.activeSemester}
          courses={workspace.courses}
          activeCourse={workspace.activeCourse}
          materials={workspace.materials}
          courseContext={workspace.courseContext}
          isLoading={workspace.isLoading}
          onCreateSemester={workspace.createSemester}
          onCreateCourse={workspace.createCourse}
          onAddMaterial={workspace.addMaterial}
          onDeleteMaterial={workspace.deleteMaterial}
          onDeleteCourse={workspace.deleteCourse}
          onDeleteSemester={workspace.deleteSemester}
          onSwitchSemester={workspace.switchSemester}
          onSelectCourse={workspace.selectCourse}
        />
      )}

      {/* ── Tutor input (always visible) ────────────────── */}
      <TutorInput
        models={models}
        onSubmit={handleSubmit}
        disabled={isRunning}
      />

      {/* ── Content area ────────────────────────────────── */}
      {state.phase === 'idle' ? (
        // Landing only for anonymous or new users without results
        (!isAuthenticated || isNewUser) && <TutorLanding />
      ) : (
        <ForgeCanvas state={state} />
      )}

      {/* ── Onboarding CTA for new authenticated users ── */}
      {isNewUser && state.phase === 'idle' && workspace.semesters.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 20px 48px',
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: MUTED,
              marginBottom: 8,
            }}
          >
            Create your first semester to organize your courses
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#5a5048',
              lineHeight: 1.6,
            }}
          >
            Use the &quot;+&quot; button in the semester bar above to get started.
            <br />
            Add courses, link materials, and get AI tutoring with full context.
          </div>
        </div>
      )}
    </div>
  );
}
