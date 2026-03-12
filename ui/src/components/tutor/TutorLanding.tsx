'use client';

// ═══════════════════════════════════════════════════════════
// AI TUTOR — Landing / Idle State
// Warm, inviting design targeting high school & college
// students. Shows the VALUE of reasoning steps over answers.
// ═══════════════════════════════════════════════════════════

const SUBJECTS = [
  {
    key: 'math',
    label: 'Math',
    emoji: '📐',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
    tagline: 'Calculus, Algebra, Stats, Proofs',
    examples: [
      'Walk me through integration by parts for ∫ x^2 e^x dx',
      'Why does the derivative of sin(x) = cos(x)? Show me the limit proof',
      'How do I find the area between two curves?',
    ],
  },
  {
    key: 'science',
    label: 'Science',
    emoji: '🔬',
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.08)',
    border: 'rgba(34,211,238,0.2)',
    tagline: 'Physics, Chemistry, Biology',
    examples: [
      'Explain how buffers work in chemistry with a step-by-step example',
      'Derive F = ma from Newton\'s second law and show each step',
      'How does mRNA translation work? Walk me through each stage',
    ],
  },
  {
    key: 'humanities',
    label: 'Humanities',
    emoji: '📚',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.2)',
    tagline: 'History, Literature, Philosophy',
    examples: [
      'Help me build a thesis for my essay on The Great Gatsby\'s green light',
      'What were the real causes of WWI? Not just the assassination',
      'Break down Plato\'s Allegory of the Cave — what\'s the argument?',
    ],
  },
  {
    key: 'law',
    label: 'Law',
    emoji: '⚖️',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.2)',
    tagline: 'Case Briefs, Constitutional, Criminal Justice',
    examples: [
      'Break down Miranda v. Arizona — arguments on both sides',
      'Explain the difference between strict liability and negligence with examples',
      'What\'s the legal reasoning behind Brown v. Board of Education?',
    ],
  },
];

const COMPARISON = {
  regular: {
    label: 'Regular AI',
    color: '#4a5568',
    lines: [
      'The integral of x^2 sin(x) dx is',
      '-x^2 cos(x) + 2x sin(x) + 2cos(x) + C',
      '',
      '...okay but HOW? 🤔',
    ],
  },
  tutor: {
    label: 'AI Tutor',
    color: '#8b5cf6',
    lines: [
      { step: '1', text: 'Recognize this needs Integration by Parts (IBP)' },
      { step: '2', text: 'Choose u = x^2 (polynomial) and dv = sin(x)dx' },
      { step: '3', text: 'Compute du = 2x dx, v = -cos(x)' },
      { step: '4', text: 'Apply IBP formula: uv - ∫v du' },
      { step: '5', text: 'Apply IBP again for the remaining ∫2x cos(x)dx' },
      { step: '✓', text: 'Final: -x^2 cos(x) + 2x sin(x) + 2cos(x) + C' },
    ],
  },
};

export default function TutorLanding() {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px 80px',
        scrollBehavior: 'smooth',
      }}
    >
      {/* ── Hero ─────────────────────────────────── */}
      <div style={{ textAlign: 'center', maxWidth: 640, marginBottom: 48 }}>
        <div
          style={{
            fontSize: 44,
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 16,
            background: 'linear-gradient(135deg, #a78bfa, #22d3ee, #fbbf24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            letterSpacing: -1,
          }}
        >
          Finally understand
          <br />
          the <em>how</em>, not just the <em>what</em>.
        </div>
        <div
          style={{
            fontSize: 16,
            color: '#94a3b8',
            lineHeight: 1.7,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            maxWidth: 480,
            margin: '0 auto',
          }}
        >
          Multiple AI models solve your problem independently.
          You see every reasoning step, every branching path,
          and why wrong approaches fail.
        </div>
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {['Homework help', 'Exam prep', 'Concept review', 'Essay planning'].map((t) => (
            <span
              key={t}
              style={{
                fontSize: 11,
                fontFamily: '-apple-system, sans-serif',
                fontWeight: 600,
                padding: '5px 14px',
                borderRadius: 20,
                background: 'rgba(139,92,246,0.1)',
                color: '#a78bfa',
                border: '1px solid rgba(139,92,246,0.15)',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── Before / After comparison ─────────────── */}
      <div
        style={{
          maxWidth: 680,
          width: '100%',
          marginBottom: 48,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#64748b',
            fontFamily: '-apple-system, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          The difference
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {/* Regular AI */}
          <div
            style={{
              flex: '1 1 280px',
              padding: '20px',
              borderRadius: 12,
              border: '1px solid rgba(74,85,104,0.3)',
              background: 'rgba(74,85,104,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#64748b',
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', fontFamily: '-apple-system, sans-serif' }}>
                Regular AI
              </span>
            </div>
            {COMPARISON.regular.lines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: line ? '#94a3b8' : 'transparent',
                  lineHeight: 1.8,
                  minHeight: line ? 'auto' : 12,
                }}
              >
                {line || '\u00A0'}
              </div>
            ))}
          </div>

          {/* AI Tutor */}
          <div
            style={{
              flex: '1 1 280px',
              padding: '20px',
              borderRadius: 12,
              border: '1px solid rgba(139,92,246,0.3)',
              background: 'rgba(139,92,246,0.06)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -8,
                right: 12,
                fontSize: 9,
                fontWeight: 800,
                fontFamily: '-apple-system, sans-serif',
                padding: '3px 10px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                color: '#fff',
                letterSpacing: 1,
              }}
            >
              YOU GET THIS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#8b5cf6',
                  boxShadow: '0 0 8px rgba(139,92,246,0.5)',
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', fontFamily: '-apple-system, sans-serif' }}>
                AI Tutor
              </span>
            </div>
            {COMPARISON.tutor.lines.map((line, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    minWidth: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: line.step === '✓' ? 'rgba(34,197,94,0.15)' : 'rgba(139,92,246,0.12)',
                    border: `1px solid ${line.step === '✓' ? 'rgba(34,197,94,0.3)' : 'rgba(139,92,246,0.25)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                    color: line.step === '✓' ? '#22c55e' : '#a78bfa',
                    fontFamily: 'monospace',
                  }}
                >
                  {line.step}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: line.step === '✓' ? '#22c55e' : '#c4b5fd',
                    lineHeight: 1.6,
                    paddingTop: 2,
                  }}
                >
                  {line.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Why it works ─────────────────────────── */}
      <div style={{ maxWidth: 680, width: '100%', marginBottom: 48 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#64748b',
            fontFamily: '-apple-system, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          Why students learn faster with this
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            {
              num: '3x',
              label: 'More perspectives',
              desc: 'Multiple models solve the same problem differently — you see which approach clicks for you',
              gradient: 'linear-gradient(135deg, #a78bfa, #818cf8)',
            },
            {
              num: '100%',
              label: 'Transparent reasoning',
              desc: 'Every step is shown, not hidden. See the full chain from question to answer',
              gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
            },
            {
              num: '0',
              label: 'Black boxes',
              desc: 'Wrong approaches are shown and explained — you learn what NOT to do and why',
              gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '20px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily: '-apple-system, sans-serif',
                  background: item.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: 4,
                }}
              >
                {item.num}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#e2e8f0',
                  fontFamily: '-apple-system, sans-serif',
                  marginBottom: 6,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  fontFamily: '-apple-system, sans-serif',
                  lineHeight: 1.6,
                }}
              >
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Subject cards with examples ────────────── */}
      <div style={{ maxWidth: 680, width: '100%', marginBottom: 40 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#64748b',
            fontFamily: '-apple-system, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          Try asking something like...
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {SUBJECTS.map((s) => (
            <div
              key={s.key}
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                border: `1px solid ${s.border}`,
                background: s.bg,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{s.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: '-apple-system, sans-serif' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', fontFamily: '-apple-system, sans-serif' }}>
                    {s.tagline}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {s.examples.map((ex) => (
                  <div
                    key={ex}
                    style={{
                      fontSize: 12,
                      fontFamily: '-apple-system, sans-serif',
                      color: '#94a3b8',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.2)',
                      lineHeight: 1.5,
                      cursor: 'default',
                    }}
                  >
                    &ldquo;{ex}&rdquo;
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works — simple steps ────────────── */}
      <div style={{ maxWidth: 680, width: '100%', marginBottom: 40 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#64748b',
            fontFamily: '-apple-system, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          How it works
        </div>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { emoji: '✍️', label: 'Type your question', sub: 'Any subject, any level' },
            { emoji: '→', label: '', sub: '' },
            { emoji: '🤖', label: '3 AI models solve it', sub: 'Independently & in parallel' },
            { emoji: '→', label: '', sub: '' },
            { emoji: '🌳', label: 'See every step', sub: 'Branching reasoning trees' },
            { emoji: '→', label: '', sub: '' },
            { emoji: '💡', label: 'Understand deeply', sub: 'Consensus + alternative methods' },
          ].map((item, i) => (
            item.label === '' ? (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 4px',
                  color: '#334155',
                  fontSize: 16,
                  fontFamily: 'monospace',
                }}
              >
                {item.emoji}
              </div>
            ) : (
              <div
                key={i}
                style={{
                  flex: '1 1 120px',
                  maxWidth: 160,
                  textAlign: 'center',
                  padding: '16px 10px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', fontFamily: '-apple-system, sans-serif', marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 10, color: '#64748b', fontFamily: '-apple-system, sans-serif', lineHeight: 1.4 }}>
                  {item.sub}
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* ── Bottom CTA ─────────────────────────── */}
      <div
        style={{
          textAlign: 'center',
          padding: '24px',
          maxWidth: 500,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#e2e8f0',
            fontFamily: '-apple-system, sans-serif',
            marginBottom: 8,
          }}
        >
          Stop memorizing. Start understanding.
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#64748b',
            fontFamily: '-apple-system, sans-serif',
            lineHeight: 1.6,
          }}
        >
          Set your API key above, pick a subject, and ask your first question.
          Every reasoning step is verifiable and sealed.
        </div>
      </div>
    </div>
  );
}
