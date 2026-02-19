"""
NotaryOS OpenAI Agents SDK Integration

Provides guardrail-style receipting and tool wrapper for the OpenAI Agents SDK.

Usage:
    from notary_sdk import NotaryClient
    from notary_sdk.integrations.openai_agents import NotaryGuardrail, notary_tool_wrapper

    notary = NotaryClient(api_key="notary_live_xxx")

    # Option 1: Guardrail that receipts every agent run
    guardrail = NotaryGuardrail(notary)
    agent = Agent(name="my_agent", guardrails=[guardrail])

    # Option 2: Wrap individual tool functions
    wrapped_search = notary_tool_wrapper(notary, search_function)
"""
from __future__ import annotations

import functools
import time
from typing import Any, Callable, Dict, Optional


def _require_openai_agents():
    try:
        import agents
        return agents
    except ImportError:
        raise ImportError(
            "OpenAI Agents SDK is required for this integration. "
            "Install it with: pip install openai-agents"
        )


class NotaryGuardrail:
    """
    Guardrail that issues a NotaryOS receipt for each agent execution.

    Implements the guardrail interface expected by the OpenAI Agents SDK.
    The guardrail always passes (returns None) -- it is used purely for
    audit receipting, not for blocking.
    """

    def __init__(self, notary, metadata=None):
        """
        Args:
            notary: A NotaryClient instance.
            metadata: Optional dict of extra metadata for every receipt.
        """
        self._notary = notary
        self._metadata = metadata or {}

    async def run(self, agent_output, context=None):
        """
        Called by the OpenAI Agents SDK after each agent turn.

        Issues a receipt and returns None (pass-through, non-blocking).

        Args:
            agent_output: The agent's output object.
            context: Optional run context.

        Returns:
            None (guardrail always passes).
        """
        output_text = ""
        agent_name = ""
        tool_calls = []

        if hasattr(agent_output, "content"):
            output_text = str(agent_output.content)[:300]
        elif hasattr(agent_output, "text"):
            output_text = str(agent_output.text)[:300]

        if context and hasattr(context, "agent"):
            agent_name = getattr(context.agent, "name", "")

        if hasattr(agent_output, "tool_calls"):
            for tc in agent_output.tool_calls:
                name = getattr(tc, "name", getattr(tc, "function", ""))
                tool_calls.append(str(name)[:100])

        payload = {
            "agent": agent_name,
            "output_preview": output_text,
            "tool_calls": tool_calls[:10],
            **self._metadata,
        }

        try:
            self._notary.issue("openai_agents.guardrail.run", payload)
        except Exception:
            pass  # Never block the agent pipeline

        return None


def notary_tool_wrapper(notary, tool_fn, action_type=None):
    """
    Wrap an OpenAI Agents SDK tool function to issue receipts.

    The wrapper issues a receipt after each tool invocation capturing
    the tool name, arguments, result preview, and duration.

    Args:
        notary: A NotaryClient instance.
        tool_fn: The tool function to wrap.
        action_type: Custom action type (defaults to "openai_agents.tool.<fn_name>").

    Returns:
        Wrapped function with the same signature.
    """
    fn_name = getattr(tool_fn, "__name__", "unknown_tool")
    receipt_action = action_type or f"openai_agents.tool.{fn_name}"

    @functools.wraps(tool_fn)
    async def async_wrapper(*args, **kwargs):
        t0 = time.monotonic()
        status = "success"
        error_msg = None
        result = None
        try:
            result = await tool_fn(*args, **kwargs)
            return result
        except Exception as exc:
            status = "error"
            error_msg = str(exc)[:300]
            raise
        finally:
            duration_ms = round((time.monotonic() - t0) * 1000, 2)
            try:
                notary.issue(receipt_action, {
                    "tool": fn_name,
                    "status": status,
                    "error": error_msg,
                    "result_preview": str(result)[:300] if result else None,
                    "duration_ms": duration_ms,
                })
            except Exception:
                pass

    @functools.wraps(tool_fn)
    def sync_wrapper(*args, **kwargs):
        t0 = time.monotonic()
        status = "success"
        error_msg = None
        result = None
        try:
            result = tool_fn(*args, **kwargs)
            return result
        except Exception as exc:
            status = "error"
            error_msg = str(exc)[:300]
            raise
        finally:
            duration_ms = round((time.monotonic() - t0) * 1000, 2)
            try:
                notary.issue(receipt_action, {
                    "tool": fn_name,
                    "status": status,
                    "error": error_msg,
                    "result_preview": str(result)[:300] if result else None,
                    "duration_ms": duration_ms,
                })
            except Exception:
                pass

    import asyncio
    if asyncio.iscoroutinefunction(tool_fn):
        return async_wrapper
    return sync_wrapper
