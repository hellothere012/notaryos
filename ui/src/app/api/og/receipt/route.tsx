import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.agenttownsquare.com';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const hash = searchParams.get('hash') || '';
  const statusParam = searchParams.get('status') || 'unknown';

  // Try to fetch real receipt data for richer card
  let agentId = 'Unknown Agent';
  let actionType = 'Agent Action';
  let isVerified = statusParam === 'verified';
  let signedAt = '';

  if (hash && hash !== 'test') {
    try {
      const res = await fetch(
        `${API_BASE}/v1/notary/r/${encodeURIComponent(hash)}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.found && data.meta) {
          agentId = data.meta.agent_id || agentId;
          actionType = data.meta.action_type || actionType;
          isVerified = data.verification?.valid === true;
          signedAt = data.verification?.signed_at || '';
        }
      }
    } catch {
      // Fall back to query params
    }
  }

  const status = isVerified ? 'VERIFIED' : 'INVALID';
  const statusColor = isVerified ? '#00ff88' : '#ff3344';
  const statusGlyph = isVerified ? '\u2713' : '\u2717';
  const truncatedHash = hash.length > 16 ? `${hash.slice(0, 8)}...${hash.slice(-8)}` : hash || 'N/A';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          background: '#060a12',
          fontFamily: 'monospace',
          color: '#c8d6e5',
        }}
      >
        {/* Top row: status + branding */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: 64, color: statusColor, lineHeight: 1 }}>
              {statusGlyph}
            </span>
            <span style={{ fontSize: 40, fontWeight: 700, color: statusColor, letterSpacing: '2px' }}>
              {status}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#d4a82b', letterSpacing: '1px' }}>
              NotaryOS
            </span>
            <span style={{ fontSize: 14, color: '#4a7a9a', marginTop: '4px' }}>
              Cryptographic Receipts
            </span>
          </div>
        </div>

        {/* Middle: receipt details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: 18, color: '#4a7a9a', width: '100px' }}>Agent</span>
            <span style={{ fontSize: 18, color: '#e8eef4', fontWeight: 600 }}>{agentId}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: 18, color: '#4a7a9a', width: '100px' }}>Action</span>
            <span style={{ fontSize: 18, color: '#e8eef4', fontWeight: 600 }}>{actionType}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: 18, color: '#4a7a9a', width: '100px' }}>Hash</span>
            <span style={{ fontSize: 18, color: '#d4a82b', fontWeight: 600 }}>{truncatedHash}</span>
          </div>
          {signedAt && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: 18, color: '#4a7a9a', width: '100px' }}>Signed</span>
              <span style={{ fontSize: 18, color: '#e8eef4' }}>{signedAt}</span>
            </div>
          )}
        </div>

        {/* Bottom: divider + footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ width: '100%', height: '2px', background: 'linear-gradient(to right, #4a7a9a33, #d4a82b66, #4a7a9a33)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#4a7a9a', letterSpacing: '1.5px' }}>
              ED25519 CRYPTOGRAPHIC RECEIPT
            </span>
            <span style={{ fontSize: 14, color: '#4a7a9a' }}>
              notaryos.org
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
