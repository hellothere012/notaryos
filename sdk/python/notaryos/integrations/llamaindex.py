"""
NotaryOS LlamaIndex Integration

Issues receipts for LlamaIndex query, retrieval, and LLM events
using the LlamaIndex callback system.

Usage:
    from notaryos import NotaryClient
    from notaryos.integrations.llamaindex import NotaryCallbackHandler

    notary = NotaryClient(api_key="notary_live_xxx")
    handler = NotaryCallbackHandler(notary)

    # Attach globally
    from llama_index.core import Settings
    Settings.callback_manager.add_handler(handler)

    # Or per-query
    query_engine.query("question", callbacks=[handler])
"""
from __future__ import annotations

import time
from typing import Any, Dict, List, Optional


def _require_llamaindex():
    try:
        from llama_index.core.callbacks import CBEventType, CallbackManager
        from llama_index.core.callbacks.base_handler import BaseCallbackHandler
        return BaseCallbackHandler, CBEventType
    except ImportError:
        raise ImportError(
            "LlamaIndex is required for this integration. "
            "Install it with: pip install llama-index-core"
        )


class NotaryCallbackHandler:
    """
    LlamaIndex callback handler that issues NotaryOS receipts
    for query, retrieval, LLM, and embedding events.
    """

    def __init__(self, notary, metadata=None, event_starts_to_ignore=None, event_ends_to_ignore=None):
        """
        Args:
            notary: A NotaryClient instance.
            metadata: Optional dict of extra metadata for every receipt.
            event_starts_to_ignore: Event types to skip on start.
            event_ends_to_ignore: Event types to skip on end.
        """
        BaseCallbackHandler, CBEventType = _require_llamaindex()

        self._notary = notary
        self._metadata = metadata or {}
        self._start_times = {}
        self._event_count = 0

        # Satisfy LlamaIndex base handler interface
        self.event_starts_to_ignore = event_starts_to_ignore or []
        self.event_ends_to_ignore = event_ends_to_ignore or []

        # Dynamically subclass for isinstance checks
        self.__class__ = type(
            "NotaryCallbackHandler",
            (BaseCallbackHandler,),
            {
                "on_event_start": self.on_event_start,
                "on_event_end": self.on_event_end,
                "start_trace": self.start_trace,
                "end_trace": self.end_trace,
                "event_starts_to_ignore": self.event_starts_to_ignore,
                "event_ends_to_ignore": self.event_ends_to_ignore,
            },
        )

    def _issue_safe(self, action_type, payload):
        """Issue a receipt, never raising on failure."""
        try:
            merged = {**payload, **self._metadata}
            return self._notary.issue(action_type, merged)
        except Exception:
            return None

    def on_event_start(self, event_type, payload=None, event_id="", parent_id="", **kwargs):
        """Record start time for an event."""
        self._start_times[event_id] = time.monotonic()

    def on_event_end(self, event_type, payload=None, event_id="", **kwargs):
        """Issue a receipt when an event completes."""
        self._event_count += 1
        duration_ms = self._elapsed_ms(event_id)

        event_name = str(event_type)
        if hasattr(event_type, "value"):
            event_name = str(event_type.value)

        receipt_payload = {
            "event_type": event_name,
            "event_id": event_id[:64] if event_id else None,
            "duration_ms": duration_ms,
            "event_index": self._event_count,
        }

        # Extract event-specific data from the payload dict
        if isinstance(payload, dict):
            # LLM completion
            if "response" in payload:
                receipt_payload["response_preview"] = str(payload["response"])[:300]
            # Retrieval results
            if "nodes" in payload:
                receipt_payload["node_count"] = len(payload["nodes"])
            # Embedding
            if "chunks" in payload:
                receipt_payload["chunk_count"] = len(payload["chunks"])

        action_type = f"llamaindex.event.{event_name.lower()}"
        self._issue_safe(action_type, receipt_payload)

    def start_trace(self, trace_id=None):
        """Called when a trace starts."""
        if trace_id:
            self._start_times[f"trace_{trace_id}"] = time.monotonic()

    def end_trace(self, trace_id=None, trace_map=None):
        """Called when a trace ends. Issues a summary receipt."""
        duration_ms = self._elapsed_ms(f"trace_{trace_id}") if trace_id else None
        event_count = 0
        if isinstance(trace_map, dict):
            event_count = sum(len(v) for v in trace_map.values())

        self._issue_safe("llamaindex.trace.complete", {
            "trace_id": str(trace_id)[:64] if trace_id else None,
            "event_count": event_count,
            "duration_ms": duration_ms,
        })

    def _elapsed_ms(self, key):
        start = self._start_times.pop(key, None)
        if start is None:
            return None
        return round((time.monotonic() - start) * 1000, 2)

    @property
    def event_count(self):
        """Total number of events receipted."""
        return self._event_count
