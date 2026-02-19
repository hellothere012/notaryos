"""
NotaryOS HuggingFace SmolAgents Integration

Issues receipts for SmolAgents tool calls and agent steps.

Usage:
    from notary_sdk import NotaryClient
    from notary_sdk.integrations.smolagents import NotarySmolCallback

    notary = NotaryClient(api_key="notary_live_xxx")
    callback = NotarySmolCallback(notary)

    # Attach to a SmolAgents agent
    agent = CodeAgent(tools=[...], callbacks=[callback])
    agent.run("task description")
"""
from __future__ import annotations

import time
from typing import Any, Dict, List, Optional


def _require_smolagents():
    try:
        import smolagents
        return smolagents
    except ImportError:
        raise ImportError(
            "SmolAgents is required for this integration. "
            "Install it with: pip install smolagents"
        )


class NotarySmolCallback:
    """
    Callback handler for HuggingFace SmolAgents that issues
    NotaryOS receipts for agent steps and tool executions.
    """

    def __init__(self, notary, metadata=None):
        """
        Args:
            notary: A NotaryClient instance.
            metadata: Optional dict of extra metadata for every receipt.
        """
        self._notary = notary
        self._metadata = metadata or {}
        self._step_count = 0
        self._start_times = {}

    def _issue_safe(self, action_type, payload):
        """Issue a receipt, never raising on failure."""
        try:
            merged = {**payload, **self._metadata}
            return self._notary.issue(action_type, merged)
        except Exception:
            return None

    def on_step_start(self, step_number=None, **kwargs):
        """Called when an agent step begins."""
        key = f"step_{step_number}" if step_number else "step"
        self._start_times[key] = time.monotonic()

    def on_step_end(self, step_output=None, step_number=None, **kwargs):
        """
        Called when an agent step completes. Issues a receipt.

        Args:
            step_output: The output from the completed step.
            step_number: The step index.
        """
        self._step_count += 1
        key = f"step_{step_number}" if step_number else "step"
        duration_ms = self._elapsed_ms(key)

        thought = ""
        action = ""
        observation = ""

        if step_output is not None:
            if hasattr(step_output, "thought"):
                thought = str(step_output.thought)[:200]
            if hasattr(step_output, "tool_call"):
                tool_call = step_output.tool_call
                if hasattr(tool_call, "name"):
                    action = str(tool_call.name)
                elif isinstance(tool_call, str):
                    action = tool_call[:100]
            elif hasattr(step_output, "action"):
                action = str(step_output.action)[:200]
            if hasattr(step_output, "observation"):
                observation = str(step_output.observation)[:300]

        self._issue_safe("smolagents.step.complete", {
            "step_number": step_number or self._step_count,
            "thought_preview": thought,
            "action": action,
            "observation_preview": observation,
            "duration_ms": duration_ms,
        })

    def on_tool_start(self, tool_name="", tool_input=None, **kwargs):
        """Called when a tool execution begins."""
        self._start_times[f"tool_{tool_name}"] = time.monotonic()

    def on_tool_end(self, tool_name="", tool_output=None, **kwargs):
        """
        Called when a tool execution completes. Issues a receipt.

        Args:
            tool_name: Name of the tool.
            tool_output: The tool's return value.
        """
        duration_ms = self._elapsed_ms(f"tool_{tool_name}")

        self._issue_safe("smolagents.tool.complete", {
            "tool": str(tool_name)[:100],
            "output_preview": str(tool_output)[:300] if tool_output else None,
            "duration_ms": duration_ms,
        })

    def on_run_end(self, final_output=None, **kwargs):
        """
        Called when the agent run finishes. Issues a summary receipt.

        Args:
            final_output: The final output of the agent run.
        """
        self._issue_safe("smolagents.run.complete", {
            "final_output_preview": str(final_output)[:300] if final_output else None,
            "total_steps": self._step_count,
        })

    def _elapsed_ms(self, key):
        start = self._start_times.pop(key, None)
        if start is None:
            return None
        return round((time.monotonic() - start) * 1000, 2)

    @property
    def step_count(self):
        """Total number of steps receipted."""
        return self._step_count
