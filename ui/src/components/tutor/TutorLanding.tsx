'use client';

// ═══════════════════════════════════════════════════════════
// AI TUTOR — Landing / Idle State
// Shows feature highlights and example prompts when no
// analysis is running. Pure UI — no backend logic.
// ═══════════════════════════════════════════════════════════

const FEATURES = [
  {
    icon: '🔍',
    title: 'Multi-Model Verification',
    description: 'Multiple AI models solve your problem independently. See where they agree and where they use different methods.',
  },
  {
    icon: '🌳',
    title: 'Step-by-Step Reasoning Trees',
    description: 'Every reasoning step is visualized as a branching tree. Follow the logic from first principles to final answer.',
  },
  {
    icon: '❌',
    title: 'Learn From Mistakes',
    description: 'Wrong approaches are preserved as counterfactuals. See WHY a method fails — the most powerful way to learn.',
  },
  {
    icon: '🔒',
    title: 'Verifiable Receipts',
    description: 'Every reasoning step is cryptographically sealed. Prove you engaged with the material, not just copied an answer.',
  },
];

const EXAMPLE_PROMPTS = [
  {
    subject: 'Mathematics',
    color: '#8b5cf6',
    prompts: [
      'How do I solve ∫ x²·sin(x) dx using integration by parts?',
      'Prove that √2 is irrational using proof by contradiction',
      'Find the eigenvalues of the matrix [[3, 1], [0, 2]]',
    ],
  },
  {
    subject: 'Science',
    color: '#06b6d4',
    prompts: [
      'Explain how Le Chatelier\'s principle applies to the Haber process',
      'Derive the Lorentz factor from Einstein\'s postulates',
      'How does CRISPR-Cas9 gene editing work step by step?',
    ],
  },
  {
    subject: 'Humanities',
    color: '#f59e0b',
    prompts: [
      'Analyze the theme of isolation in Mary Shelley\'s Frankenstein',
      'What caused the fall of the Roman Republic? Compare structural vs individual factors',
      'Evaluate Kant\'s categorical imperative — does it hold under edge cases?',
    ],
  },
  {
    subject: 'Law & Justice',
    color: '#ef4444',
    prompts: [
      'Brief Miranda v. Arizona — what were the top arguments on each side?',
      'Analyze the constitutional basis for judicial review (Marbury v. Madison)',
      'Compare strict liability vs negligence in product liability cases',
    ],
  },
];

export default function TutorLanding() {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 20px 60px',
        scrollBehavior: 'smooth',
      }}
    >
      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 600, marginBottom: 40 }}>
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: 3,
            marginBottom: 8,
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: '"SF Mono", "Fira Code", monospace',
          }}
        >
          AI TUTOR
        </div>
        <div
          style={{
            fontSize: 14,
            color: '#8b9cc4',
            lineHeight: 1.7,
            fontFamily: '"SF Mono", "Fira Code", monospace',
          }}
        >
          Don't just get the answer — <span style={{ color: '#8b5cf6', fontWeight: 700 }}>see how to get there</span>.
          <br />
          Multiple AI models solve your problem independently,
          <br />
          then synthesis reveals the clearest step-by-step path.
        </div>
      </div>

      {/* Features grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
          maxWidth: 700,
          width: '100%',
          marginBottom: 36,
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            style={{
              padding: '14px 16px',
              borderRadius: 8,
              border: '1px solid rgba(139,92,246,0.12)',
              background: 'rgba(139,92,246,0.04)',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#c4b5fd',
                fontFamily: 'monospace',
                marginBottom: 4,
                letterSpacing: 0.5,
              }}
            >
              {f.title}
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#6b7fa0',
                fontFamily: 'monospace',
                lineHeight: 1.5,
              }}
            >
              {f.description}
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div
        style={{
          maxWidth: 700,
          width: '100%',
          marginBottom: 36,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#6d28d9',
            fontFamily: 'monospace',
            letterSpacing: 2,
            marginBottom: 12,
          }}
        >
          HOW IT WORKS
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { step: '1', label: 'Ask a question', desc: 'Enter your problem in any subject' },
            { step: '2', label: 'Models solve independently', desc: '2-4 AI models reason in parallel' },
            { step: '3', label: 'See the reasoning', desc: 'Each step visualized as a tree' },
            { step: '4', label: 'Synthesis reveals the best path', desc: 'Consensus + alternative methods' },
          ].map((s) => (
            <div
              key={s.step}
              style={{
                flex: '1 1 150px',
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid rgba(139,92,246,0.1)',
                background: 'rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#fff',
                  marginBottom: 6,
                  fontFamily: 'monospace',
                }}
              >
                {s.step}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#c4b5fd', fontFamily: 'monospace', marginBottom: 2 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 9, color: '#6b7fa0', fontFamily: 'monospace', lineHeight: 1.4 }}>
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example prompts by subject */}
      <div style={{ maxWidth: 700, width: '100%' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#6d28d9',
            fontFamily: 'monospace',
            letterSpacing: 2,
            marginBottom: 12,
          }}
        >
          TRY THESE EXAMPLES
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {EXAMPLE_PROMPTS.map((section) => (
            <div key={section.subject}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: section.color,
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                {section.subject.toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {section.prompts.map((p) => (
                  <div
                    key={p}
                    style={{
                      fontSize: 10,
                      fontFamily: 'monospace',
                      color: '#8b9cc4',
                      padding: '6px 10px',
                      borderRadius: 4,
                      border: `1px solid ${section.color}15`,
                      background: `${section.color}06`,
                      lineHeight: 1.4,
                    }}
                  >
                    &quot;{p}&quot;
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div
        style={{
          marginTop: 32,
          fontSize: 8,
          color: '#4a5a7a',
          fontFamily: 'monospace',
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        Set your API key above, select a subject, enter your question, and hit EXPLAIN.
        <br />
        Every reasoning step is sealed as a verifiable NotaryOS receipt.
      </div>
    </div>
  );
}
