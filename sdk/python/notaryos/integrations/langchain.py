"""
NotaryOS LangChain Integration

Automatically issues receipts for LLM completions, tool calls, and chain
executions using LangChain's callback system.

Usage:
    from notaryos import NotaryClient
    from notaryos.integrations.langchain import NotaryCallbackHandler

    notary = NotaryClient(api_key="notary_live_xxx")
    handler = NotaryCallbackHandler(notary)

    # Attach to any chain, LLM, or agent
    chain.invoke(input, config={"callbacks": [handler]})
"""
from __future__ import annotations

import time
from typing import Any, Dict, List, Optional
from uuid import UUID


def _require_langchain():
    try:
        from langchain_core.callbacks import BaseCallbackHandler
        return BaseCallbackHandler
    except ImportError:
        raise ImportError(
            "LangChain is required for this integration. "
            "Install it with: pip install langchain-core"
        )


class NotaryCallbackHandler:
    """
    LangChain callback handler that issues NotaryOS receipts.

    Receipts are issued on:
    - on_llm_end: When an LLM generates a response
    - on_tool_end: When a tool finishes execution
    - on_chain_end: When a chain completes
    """

    def __init__(self, notary, metadata=None):
        """
        Args:
            notary: A NotaryClient instance.
            metadata: Optional dict of extra metadata attached to every receipt.
        """
        BaseCallbackHandler = _require_langchain()
        self._notary = notary
        self._metadata = metadata or {}
        self._start_times = {}

        # Dynamically subclass so isinstance checks work for LangChain
        self.__class__ = type(
            "NotaryCallbackHandler",
            (BaseCallbackHandler,),
            {
                "on_llm_start": self.on_llm_start,
                "on_llm_end": self.on_llm_end,
                "on_tool_start": self.on_tool_start,
                "on_tool_end": self.on_tool_end,
                "on_chain_start": self.on_chain_start,
                "on_chain_end": self.on_chain_end,
                "on_llm_error": self.on_llm_error,
                "on_tool_error": self.on_tool_error,
                "on_chain_error": self.on_chain_error,
            },
        )

    def _issue_safe(self, action_type, payload):
        """Issue a receipt, never raising on failure."""
        try:
            merged = {**payload, **self._metadata}
            return self._notary.issue(action_type, merged)
        except Exception:
            return None

    # -- LLM callbacks --

    def on_llm_start(self, serialized, prompts, *, run_id=None, **kwargs):
        key = str(run_id) if run_id else "llm"
        self._start_times[key] = time.monotonic()

    def on_llm_end(self, response, *, run_id=None, **kwargs):
        key = str(run_id) if run_id else "llm"
        duration_ms = self._elapsed_ms(key)
        generations = []
        if hasattr(response, "generations"):
            for gen_list in response.generations:
                for gen in gen_list:
                    text = getattr(gen, "text", "")
                    generations.append(text[:200])
        self._issue_safe("langchain.llm.end", {
            "run_id": str(run_id) if run_id else None,
            "generation_count": len(generations),
            "first_output_preview": generations[0] if generations else None,
            "duration_ms": duration_ms,
        })

    def on_llm_error(self, error, *, run_id=None, **kwargs):
        self._issue_safe("langchain.llm.error", {
            "run_id": str(run_id) if run_id else None,
            "error": str(error)[:300],
        })

    # -- Tool callbacks --

    def on_tool_start(self, serialized, input_str, *, run_id=None, **kwargs):
        key = str(run_id) if run_id else "tool"
        self._start_times[key] = time.monotonic()

    def on_tool_end(self, output, *, run_id=None, **kwargs):
        key = str(run_id) if run_id else "tool"
        duration_ms = self._elapsed_ms(key)
        self._issue_safe("langchain.tool.end", {
            "run_id": str(run_id) if run_id else None,
            "output_preview": str(output)[:300],
            "duration_ms": duration_ms,
        })

    def on_tool_error(self, error, *, run_id=None, **kwargs):
        self._issue_safe("langchain.tool.error", {
            "run_id": str(run_id) if run_id else None,
            "error": str(error)[:300],
        })

    # -- Chain callbacks --

    def on_chain_start(self, serialized, inputs, *, run_id=None, **kwargs):
        key = str(run_id) if run_id else "chain"
        self._start_times[key] = time.monotonic()

    def on_chain_end(self, outputs, *, run_id=None, **kwargs):
        key = str(run_id) if run_id else "chain"
        duration_ms = self._elapsed_ms(key)
        output_keys = list(outputs.keys()) if isinstance(outputs, dict) else []
        self._issue_safe("langchain.chain.end", {
            "run_id": str(run_id) if run_id else None,
            "output_keys": output_keys[:10],
            "duration_ms": duration_ms,
        })

    def on_chain_error(self, error, *, run_id=None, **kwargs):
        self._issue_safe("langchain.chain.error", {
            "run_id": str(run_id) if run_id else None,
            "error": str(error)[:300],
        })

    # -- Helpers --

    def _elapsed_ms(self, key):
        start = self._start_times.pop(key, None)
        if start is None:
            return None
        return round((time.monotonic() - start) * 1000, 2)
