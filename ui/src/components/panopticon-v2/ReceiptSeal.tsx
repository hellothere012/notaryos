'use client';

import { useState } from 'react';

interface ReceiptSealProps {
  hash: string;
  size?: number;
}

export default function ReceiptSeal({ hash, size = 18 }: ReceiptSealProps) {
  const [hovered, setHovered] = useState(false);
  const truncated = hash.length > 12 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash;

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={() => window.open(`https://notaryos.org/r/${hash}`, '_blank')}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex items-center justify-center rounded-full transition-all duration-200"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #d4a82b 0%, #b8941f 100%)',
          boxShadow: hovered ? '0 0 12px rgba(212, 168, 43, 0.6)' : '0 0 4px rgba(212, 168, 43, 0.3)',
        }}
        title={`NotaryOS Receipt: ${hash}`}
      >
        {/* Checkmark SVG */}
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 12 12"
          fill="none"
          stroke="#1a1a0a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 6.5L5 9.5L10 3" />
        </svg>
      </button>

      {/* Hash tooltip on hover */}
      {hovered && (
        <div
          className="absolute left-full ml-2 px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap z-50"
          style={{
            background: 'rgba(8, 16, 28, 0.95)',
            border: '1px solid rgba(212, 168, 43, 0.4)',
            color: '#d4a82b',
          }}
        >
          {truncated}
        </div>
      )}
    </div>
  );
}
