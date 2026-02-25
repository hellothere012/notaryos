"""
NotaryOS Google ADK (Agent Development Kit) Integration

Issues receipts for Google ADK agent events using the callback system.

Usage:
    from notaryos import NotaryClient
    from notaryos.integrations.google_adk import NotaryADKCallback

    notary = NotaryClient(api_key="notary_live_xxx")
    callback = NotaryADKCallback(notary)

    # Attach to an ADK agent runner
    runner = Runner(agent=my_agent, callbacks=[callback])
"""
from __future__ import annotations

import time
from typing import Any, Dict, List, Optional


def _require_google_adk():
    try:
        import google.adk
        return google.adk
    except ImportError:
        raise ImportError(
            "Google ADK is required for this integration. "
            "Install it with: pip install google-adk"
        )


class NotaryADKCallback:
    """
    Callback handler for the Google Agent Development Kit.

    Issues receipts when:
    - An agent turn completes (on_turn_complete)
    - A tool is invoked (on_tool_call)
    - An agent run finishes (on_run_complete)
    """

    def __init__(self, notary, metadata=None):
        """
        Args:
            notary: A NotaryClient instance.
            metadata: Optional dict of extra metadata for every receipt.
        """
        self._notary = notary
        self._metadata = metadata or {}
        self._event_count = 0

    def _issue_safe(self, action_type, payload):
        """Issue a receipt, never raising on failure."""
        try:
            merged = {**payload, **self._metadata}
            return self._notary.issue(action_type, merged)
        except Exception:
            return None

    def on_turn_complete(self, turn_output, **kwargs):
        """
        Called when an agent turn completes.

        Args:
            turn_output: The turn output from the ADK agent.
        """
        self._event_count += 1

        agent_name = ""
        response_preview = ""
        tool_calls = []

        if hasattr(turn_output, "agent_name"):
            agent_name = str(turn_output.agent_name)[:100]
        if hasattr(turn_output, "response"):
            response_preview = str(turn_output.response)[:300]
        if hasattr(turn_output, "tool_calls"):
            for tc in turn_output.tool_calls:
                name = getattr(tc, "name", str(tc))
                tool_calls.append(str(name)[:100])

        self._issue_safe("google_adk.turn.complete", {
            "agent": agent_name,
            "response_preview": response_preview,
            "tool_calls": tool_calls[:10],
            "event_index": self._event_count,
        })

    def on_tool_call(self, tool_name, tool_input=None, tool_output=None, **kwargs):
        """
        Called when a tool is invoked.

        Args:
            tool_name: Name of the tool called.
            tool_input: Input passed to the tool.
            tool_output: Output returned from the tool.
        """
        self._event_count += 1
        self._issue_safe("google_adk.tool.call", {
            "tool": str(tool_name)[:100],
            "input_preview": str(tool_input)[:300] if tool_input else None,
            "output_preview": str(tool_output)[:300] if tool_output else None,
            "event_index": self._event_count,
        })

    def on_run_complete(self, run_output=None, **kwargs):
        """
        Called when the agent run finishes.

        Args:
            run_output: The final run output.
        """
        self._event_count += 1

        final_output = ""
        status = "success"

        if run_output is not None:
            if hasattr(run_output, "final_output"):
                final_output = str(run_output.final_output)[:300]
            elif hasattr(run_output, "output"):
                final_output = str(run_output.output)[:300]
            else:
                final_output = str(run_output)[:300]

            if hasattr(run_output, "error") and run_output.error:
                status = "error"

        self._issue_safe("google_adk.run.complete", {
            "final_output_preview": final_output,
            "status": status,
            "total_events": self._event_count,
        })

    @property
    def event_count(self):
        """Total number of events receipted."""
        return self._event_count
