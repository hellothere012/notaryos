import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 80px',
          background: 'linear-gradient(135deg, #060a12 0%, #0f172a 40%, #1e1b4b 70%, #060a12 100%)',
          fontFamily: 'monospace',
          color: '#e2e8f0',
        }}
      >
        {/* Shield icon */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            boxShadow: '0 0 60px rgba(168, 85, 247, 0.3)',
          }}
        >
          <span style={{ fontSize: 52, color: '#ffffff' }}>&#x1F6E1;</span>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 800,
              letterSpacing: '-1px',
              background: 'linear-gradient(to right, #a855f7, #06b6d4)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            NotaryOS
          </span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: '#94a3b8',
              letterSpacing: '3px',
              textTransform: 'uppercase' as const,
            }}
          >
            AI Decision Plane
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 22,
            color: '#64748b',
            textAlign: 'center',
            marginTop: 28,
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          Multi-model reasoning with cryptographic provenance.
          Run prompts through GPT-5, Gemini, Sonnet, and Kimi in parallel.
        </p>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: 40,
            fontSize: 16,
            color: '#475569',
            letterSpacing: '1px',
          }}
        >
          <span>ED25519 RECEIPTS</span>
          <span style={{ color: '#334155' }}>|</span>
          <span>MULTI-MODEL FORGE</span>
          <span style={{ color: '#334155' }}>|</span>
          <span>ZERO-TRUST SECURITY</span>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            display: 'flex',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 14, color: '#334155' }}>
            notaryos.org
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
