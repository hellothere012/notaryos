'use client';

// ═══════════════════════════════════════════════════════════
// PANOPTICON V2 — AnalystInput
// Human analysis submission box. Sends user-written analysis
// to POST /v1/panopticon/analyze, which parses it into a
// reasoning tree and seals each node as a NotaryOS receipt.
// ═══════════════════════════════════════════════════════════

import { useState, useRef } from 'react';
import { C } from '../panopticon/constants';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.agenttownsquare.com';

interface AnalystInputProps {
  /** JWT token for authenticated requests */
  token?: string;
}

interface SealResult {
  mode: string;
  node_count: number;
  provenance_hash: string;
  receipts: Array<{
    capability?: string;
    receipt_hash?: string;
    receipt_type?: string;
  }>;
  analysis?: string;
  error?: string;
}

export default function AnalystInput({ token }: AnalystInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SealResult | null>(null);
  const [error, setError] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/v1/panopticon/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ analysis_text: trimmed }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        setText('');
      }
    } catch (e) {
      setError('Failed to connect to analysis endpoint');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          width: '100%',
          padding: '6px 10px',
          background: 'transparent',
          border: 'none',
          borderBottom: `1px solid ${C.panelBorder}`,
          color: C.dimText,
          fontSize: 9,
          fontFamily: 'monospace',
          cursor: 'pointer',
          textAlign: 'left',
          letterSpacing: 0.5,
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,180,255,0.04)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        + SUBMIT HUMAN ANALYSIS
      </button>
    );
  }

  return (
    <div style={{
      borderBottom: `1px solid ${C.panelBorder}`,
      padding: '8px 10px',
      background: 'rgba(0,180,255,0.02)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 6,
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: C.cyan, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          ANALYST INPUT
        </span>
        <button
          onClick={() => { setExpanded(false); setResult(null); setError(''); }}
          style={{
            background: 'transparent', border: 'none', color: C.dimText,
            fontSize: 14, cursor: 'pointer', padding: '0 2px', lineHeight: 1,
          }}
        >
          &times;
        </button>
      </div>

      {/* Input area */}
      <textarea
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your assessment or analysis... Each reasoning branch will be parsed and sealed as a NotaryOS receipt."
        style={{
          width: '100%',
          minHeight: 60,
          maxHeight: 140,
          resize: 'vertical',
          background: 'rgba(0,0,0,0.3)',
          border: `1px solid ${C.panelBorder}`,
          borderRadius: 3,
          color: C.text,
          fontSize: 9,
          fontFamily: 'monospace',
          padding: '6px 8px',
          lineHeight: 1.4,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      {/* Submit row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <span style={{ fontSize: 8, color: C.dimText }}>
          {text.length > 0 ? `${text.length} chars` : '\u2318/Ctrl+Enter to submit'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          style={{
            background: loading ? 'rgba(255,255,255,0.05)' : 'rgba(0,255,136,0.1)',
            border: `1px solid ${loading ? C.dimText : C.green}`,
            color: loading ? C.dimText : C.green,
            fontSize: 9,
            fontWeight: 700,
            fontFamily: 'monospace',
            padding: '3px 10px',
            borderRadius: 3,
            cursor: loading ? 'wait' : 'pointer',
            letterSpacing: 0.5,
            opacity: !text.trim() ? 0.4 : 1,
          }}
        >
          {loading ? 'SEALING...' : 'SEAL ANALYSIS'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginTop: 6, fontSize: 8, color: C.red, lineHeight: 1.3 }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          marginTop: 8, padding: '6px 8px',
          background: 'rgba(0,255,136,0.04)',
          border: `1px solid rgba(0,255,136,0.2)`,
          borderRadius: 3,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.green, marginBottom: 4 }}>
            SEALED — {result.node_count} receipt{result.node_count !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: 8, color: C.dimText, marginBottom: 4 }}>
            Provenance: <span style={{ color: '#d4a82b' }}>{result.provenance_hash}</span>
          </div>
          {result.receipts.slice(0, 5).map((r, i) => (
            <div key={i} style={{ fontSize: 7, color: C.dimText, marginBottom: 1 }}>
              <span style={{ color: r.receipt_type === 'counterfactual' ? C.red : C.cyan }}>
                {r.capability || 'unknown'}
              </span>
              {r.receipt_hash && (
                <span style={{ color: '#6b7d8e' }}> {r.receipt_hash.slice(0, 12)}...</span>
              )}
            </div>
          ))}
          {result.receipts.length > 5 && (
            <div style={{ fontSize: 7, color: C.dimText }}>
              +{result.receipts.length - 5} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
