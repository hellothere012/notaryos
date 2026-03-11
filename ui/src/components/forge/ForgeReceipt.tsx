'use client';

// ═══════════════════════════════════════════════════════════
// FORGE — Receipt Badge
// Clickable badge linking to /r/{hash} for verification.
// ═══════════════════════════════════════════════════════════

interface ForgeReceiptProps {
  hash: string | null;
  label?: string;
  size?: 'sm' | 'md';
}

export default function ForgeReceipt({ hash, label, size = 'sm' }: ForgeReceiptProps) {
  if (!hash) return null;

  const short = hash.length > 12 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash;
  const fontSize = size === 'sm' ? 8 : 10;

  return (
    <a
      href={`/r/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`Verify receipt: ${hash}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontSize,
        fontFamily: 'monospace',
        color: '#00ff88',
        background: 'rgba(0,255,136,0.08)',
        border: '1px solid rgba(0,255,136,0.2)',
        borderRadius: 3,
        padding: '1px 5px',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0,255,136,0.15)';
        e.currentTarget.style.borderColor = 'rgba(0,255,136,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(0,255,136,0.08)';
        e.currentTarget.style.borderColor = 'rgba(0,255,136,0.2)';
      }}
    >
      <span style={{ opacity: 0.6 }}>{label || 'seal'}:</span>
      <span>{short}</span>
    </a>
  );
}
