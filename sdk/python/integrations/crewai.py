"""
NotaryOS CrewAI Integration

Provides task-level and step-level receipt issuance for CrewAI workflows.

Usage:
    from notary_sdk import NotaryClient
    from notary_sdk.integrations.crewai import notary_task_callback, NotaryCrewCallback

    notary = NotaryClient(api_key="notary_live_xxx")

    # Option 1: Decorator for task functions
    @notary_task_callback(notary)
    def my_task_function(task_output):
        return task_output

    # Option 2: Step-level callback
    callback = NotaryCrewCallback(notary)
    crew = Crew(agents=[...], tasks=[...], step_callback=callback.on_step)
"""
from __future__ import annotations

import functools
import time
from typing import Any, Callable, Dict, Optional


def _require_crewai():
    try:
        import crewai
        return crewai
    except ImportError:
        raise ImportError(
            "CrewAI is required for this integration. "
            "Install it with: pip install crewai"
        )


def notary_task_callback(notary, action_type="crewai.task.complete"):
    """
    Decorator that issues a receipt when a CrewAI task callback fires.

    Wraps a function that receives CrewAI's task output and issues
    a receipt containing the task result summary.

    Args:
        notary: A NotaryClient instance.
        action_type: Receipt action type string.

    Returns:
        Decorator function.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(task_output, *args, **kwargs):
            t0 = time.monotonic()
            result = func(task_output, *args, **kwargs)
            duration_ms = round((time.monotonic() - t0) * 1000, 2)

            # Extract info from CrewAI TaskOutput
            description = ""
            raw_output = ""
            agent_name = ""
            if hasattr(task_output, "description"):
                description = str(task_output.description)[:200]
            if hasattr(task_output, "raw"):
                raw_output = str(task_output.raw)[:300]
            elif hasattr(task_output, "output"):
                raw_output = str(task_output.output)[:300]
            if hasattr(task_output, "agent"):
                agent_name = str(task_output.agent)[:100]

            try:
                notary.issue(action_type, {
                    "task_description": description,
                    "agent": agent_name,
                    "output_preview": raw_output,
                    "duration_ms": duration_ms,
                    "status": "success",
                })
            except Exception:
                pass  # Never break the CrewAI pipeline

            return result
        return wrapper
    return decorator


class NotaryCrewCallback:
    """
    Step-level callback for CrewAI that issues receipts on each agent step.

    Pass ``callback.on_step`` as the ``step_callback`` parameter to a Crew.
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

    def on_step(self, step_output):
        """
        Called by CrewAI after each agent step.

        Args:
            step_output: The step output from CrewAI.
        """
        self._step_count += 1

        agent_name = ""
        thought = ""
        tool_name = ""
        tool_input = ""

        if hasattr(step_output, "agent"):
            agent_name = str(step_output.agent)[:100]
        if hasattr(step_output, "thought"):
            thought = str(step_output.thought)[:200]
        if hasattr(step_output, "tool"):
            tool_name = str(step_output.tool)[:100]
        if hasattr(step_output, "tool_input"):
            tool_input = str(step_output.tool_input)[:200]

        payload = {
            "step_number": self._step_count,
            "agent": agent_name,
            "thought_preview": thought,
            "tool": tool_name,
            "tool_input_preview": tool_input,
            **self._metadata,
        }

        try:
            self._notary.issue("crewai.step.complete", payload)
        except Exception:
            pass  # Never break the CrewAI pipeline

    @property
    def step_count(self):
        """Total number of steps receipted."""
        return self._step_count
