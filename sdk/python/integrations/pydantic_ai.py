"""
NotaryOS PydanticAI Integration

Provides result validation receipting and tool function decorators for PydanticAI.

Usage:
    from notary_sdk import NotaryClient
    from notary_sdk.integrations.pydantic_ai import NotaryResultValidator, notary_tool

    notary = NotaryClient(api_key="notary_live_xxx")

    # Option 1: Validate and receipt agent results
    validator = NotaryResultValidator(notary)
    result = agent.run_sync("query")
    validator.receipt_result(result)

    # Option 2: Decorate PydanticAI tool functions
    @notary_tool(notary)
    async def my_tool(ctx, query: str) -> str:
        return "result"
"""
from __future__ import annotations

import functools
import time
from typing import Any, Callable, Dict, Optional


def _require_pydantic_ai():
    try:
        import pydantic_ai
        return pydantic_ai
    except ImportError:
        raise ImportError(
            "PydanticAI is required for this integration. "
            "Install it with: pip install pydantic-ai"
        )


class NotaryResultValidator:
    """
    Issues receipts for PydanticAI agent results.

    Call ``receipt_result`` after each agent run to generate a
    cryptographic receipt of the structured output.
    """

    def __init__(self, notary, metadata=None):
        """
        Args:
            notary: A NotaryClient instance.
            metadata: Optional dict of extra metadata for every receipt.
        """
        self._notary = notary
        self._metadata = metadata or {}
        self._receipt_count = 0

    def receipt_result(self, result, action_type="pydantic_ai.result"):
        """
        Issue a receipt for a PydanticAI agent result.

        Args:
            result: The RunResult from PydanticAI agent.run() or agent.run_sync().
            action_type: Receipt action type string.

        Returns:
            The Receipt object, or None if issuance failed.
        """
        self._receipt_count += 1

        data_preview = ""
        model_name = ""
        usage_tokens = None

        # Extract result data
        if hasattr(result, "data"):
            data_preview = str(result.data)[:300]
        elif hasattr(result, "output"):
            data_preview = str(result.output)[:300]

        # Extract model info
        if hasattr(result, "model_name"):
            model_name = str(result.model_name)
        elif hasattr(result, "_model_name"):
            model_name = str(result._model_name)

        # Extract token usage
        if hasattr(result, "usage"):
            usage = result.usage
            if hasattr(usage, "total_tokens"):
                usage_tokens = usage.total_tokens
            elif isinstance(usage, dict):
                usage_tokens = usage.get("total_tokens")

        payload = {
            "data_preview": data_preview,
            "model": model_name,
            "usage_tokens": usage_tokens,
            "result_index": self._receipt_count,
            **self._metadata,
        }

        try:
            return self._notary.issue(action_type, payload)
        except Exception:
            return None

    @property
    def receipt_count(self):
        """Total number of results receipted."""
        return self._receipt_count


def notary_tool(notary, action_type=None):
    """
    Decorator that issues receipts for PydanticAI tool function calls.

    Works with both sync and async tool functions. The receipt captures
    tool name, duration, and a preview of the return value.

    Args:
        notary: A NotaryClient instance.
        action_type: Custom action type (defaults to "pydantic_ai.tool.<fn_name>").

    Returns:
        Decorator function.
    """
    def decorator(func):
        fn_name = getattr(func, "__name__", "unknown_tool")
        receipt_action = action_type or f"pydantic_ai.tool.{fn_name}"

        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            t0 = time.monotonic()
            status = "success"
            error_msg = None
            result = None
            try:
                result = await func(*args, **kwargs)
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

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            t0 = time.monotonic()
            status = "success"
            error_msg = None
            result = None
            try:
                result = func(*args, **kwargs)
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
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    return decorator
