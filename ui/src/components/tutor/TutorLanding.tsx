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
    color: '#e8a838',
    bg: 'rgba(232,168,56,0.06)',
    border: 'rgba(232,168,56,0.18)',
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
    color: '#5ab89a',
    bg: 'rgba(90,184,154,0.06)',
    border: 'rgba(90,184,154,0.18)',
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
    color: '#d47c8a',
    bg: 'rgba(212,124,138,0.06)',
    border: 'rgba(212,124,138,0.18)',
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
    color: '#9a8ac8',
    bg: 'rgba(154,138,200,0.06)',
    border: 'rgba(154,138,200,0.18)',
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
    lines: [
      'The integral of x^2 sin(x) dx is',
      '-x^2 cos(x) + 2x sin(x) + 2cos(x) + C',
      '',
      '...okay but HOW?',
    ],
  },
  tutor: {
    label: 'AI Tutor',
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
        padding: '48px 20px 80px',
        scrollBehavior: 'smooth',
        background: '#141210',
      }}
    >
      {/* ── Hero ─────────────────────────────────── */}
      <div style={{ textAlign: 'center', maxWidth: 640, marginBottom: 56 }}>
        <div
          style={{
            fontSize: 46,
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 18,
            background: 'linear-gradient(135deg, #e8985a, #d47c6a, #c46878)',
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
            color: '#a09080',
            lineHeight: 1.8,
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
            marginTop: 22,
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
                padding: '6px 16px',
                borderRadius: 20,
                background: 'rgba(232,152,90,0.08)',
                color: '#d4946a',
                border: '1px solid rgba(232,152,90,0.15)',
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
          marginBottom: 56,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#8a7e72',
            fontFamily: '-apple-system, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          The difference
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {/* Regular AI */}
          <div
            style={{
              flex: '1 1 280px',
              padding: '22px',
              borderRadius: 14,
              border: '1px solid rgba(160,144,128,0.15)',
              background: 'rgba(160,144,128,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#6b5e52',
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#8a7e72', fontFamily: '-apple-system, sans-serif' }}>
                Regular AI
              </span>
            </div>
            {COMPARISON.regular.lines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: line ? '#a09080' : 'transparent',
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
              padding: '22px',
              borderRadius: 14,
              border: '1px solid rgba(232,152,90,0.25)',
              background: 'rgba(232,152,90,0.04)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -8,
                right: 14,
                fontSize: 9,
                fontWeight: 800,
                fontFamily: '-apple-system, sans-serif',
                padding: '3px 12px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #e8985a, #d47c6a)',
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
                  background: '#e8985a',
                  boxShadow: '0 0 8px rgba(232,152,90,0.4)',
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e8985a', fontFamily: '-apple-system, sans-serif' }}>
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
                    background: line.step === '✓' ? 'rgba(122,184,145,0.12)' : 'rgba(232,152,90,0.1)',
                    border: `1px solid ${line.step === '✓' ? 'rgba(122,184,145,0.3)' : 'rgba(232,152,90,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                    color: line.step === '✓' ? '#7ab891' : '#e8985a',
                    fontFamily: 'monospace',
                  }}
                >
                  {line.step}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: line.step === '✓' ? '#7ab891' : '#dcc4a8',
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
      <div style={{ maxWidth: 680, width: '100%', marginBottom: 56 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#8a7e72',
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
              gradient: 'linear-gradient(135deg, #e8a838, #d4946a)',
            },
            {
              num: '100%',
              label: 'Transparent reasoning',
              desc: 'Every step is shown, not hidden. See the full chain from question to answer',
              gradient: 'linear-gradient(135deg, #5ab89a, #4aa888)',
            },
            {
              num: '0',
              label: 'Black boxes',
              desc: 'Wrong approaches are shown and explained — you learn what NOT to do and why',
              gradient: 'linear-gradient(135deg, #d47c8a, #c46878)',
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '22px',
                borderRadius: 14,
                border: '1px solid rgba(160,144,128,0.1)',
                background: 'rgba(160,144,128,0.03)',
              }}
            >
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  fontFamily: '-apple-system, sans-serif',
                  background: item.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: 6,
                }}
              >
                {item.num}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#f0e6d6',
                  fontFamily: '-apple-system, sans-serif',
                  marginBottom: 6,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#8a7e72',
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
      <div style={{ maxWidth: 680, width: '100%', marginBottom: 48 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#8a7e72',
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
                padding: '18px 22px',
                borderRadius: 14,
                border: `1px solid ${s.border}`,
                background: s.bg,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>{s.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: '-apple-system, sans-serif' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#8a7e72', fontFamily: '-apple-system, sans-serif' }}>
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
                      color: '#a09080',
                      padding: '9px 14px',
                      borderRadius: 8,
                      background: 'rgba(20,18,16,0.6)',
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
      <div style={{ maxWidth: 680, width: '100%', marginBottom: 48 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#8a7e72',
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
                  color: '#4a3f35',
                  fontSize: 16,
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
                  padding: '18px 10px',
                  borderRadius: 14,
                  background: 'rgba(160,144,128,0.03)',
                  border: '1px solid rgba(160,144,128,0.08)',
                }}
              >
                <div style={{ fontSize: 30, marginBottom: 8 }}>{item.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f0e6d6', fontFamily: '-apple-system, sans-serif', marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 10, color: '#8a7e72', fontFamily: '-apple-system, sans-serif', lineHeight: 1.4 }}>
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
            fontSize: 22,
            fontWeight: 800,
            fontFamily: '-apple-system, sans-serif',
            marginBottom: 10,
            background: 'linear-gradient(135deg, #e8985a, #d47c6a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Stop memorizing. Start understanding.
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#8a7e72',
            fontFamily: '-apple-system, sans-serif',
            lineHeight: 1.7,
          }}
        >
          Set your API key above, pick a subject, and ask your first question.
          Every reasoning step is verifiable and sealed.
        </div>
      </div>
    </div>
  );
}
