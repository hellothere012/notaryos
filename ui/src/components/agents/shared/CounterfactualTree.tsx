'use client';

import React from 'react';

interface Props {
  actionNotTaken: string;
  decisionReason: string;
  receiptHash: string;
}

export const CounterfactualTree: React.FC<Props> = ({
  actionNotTaken,
  decisionReason,
  receiptHash,
}) => (
  <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-4">
    <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-3">
      Decision Tree — Counterfactual Receipt
    </div>
    <div className="pl-4 border-l border-gray-700/50 space-y-2">
      {/* Chosen path */}
      <div className="flex items-center gap-2">
        <span className="text-green-400 text-xs">&#10003;</span>
        <span className="text-green-400 text-xs font-medium">
          Action denied — policy enforced
        </span>
        <span className="text-[10px] text-green-500/60 uppercase">Chosen</span>
      </div>
      {/* Rejected path */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs">&#10007;</span>
        <span className="text-gray-500 text-xs line-through">{actionNotTaken}</span>
        <span className="text-[10px] text-red-500/60 uppercase">Rejected</span>
      </div>
    </div>
    <div className="mt-3 text-xs text-gray-400">
      <span className="text-gray-500">Reason: </span>
      {decisionReason}
    </div>
    <div className="mt-2 px-2 py-1 rounded bg-gray-900/50">
      <span className="text-[10px] text-purple-400 font-mono">
        seal:{receiptHash?.slice(0, 8)}...{receiptHash?.slice(-4)}
      </span>
    </div>
  </div>
);
