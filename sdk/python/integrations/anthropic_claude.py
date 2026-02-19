"""
NotaryOS Anthropic Claude Integration

Issues receipts for Anthropic Claude tool_use blocks in API responses.

Usage:
    from notary_sdk import NotaryClient
    from notary_sdk.integrations.anthropic_claude import NotaryToolUseHook, receipt_tool_use

    notary = NotaryClient(api_key="notary_live_xxx")

    # Option 1: Hook class for ongoing use
    hook = NotaryToolUseHook(notary)
    response = client.messages.create(model="claude-sonnet-4-20250514", ...)
    receipts = hook.process_response(response)

    # Option 2: One-shot function
    receipts = receipt_tool_use(notary, response)
"""
from __future__ import annotations

import time
from typing import Any, Dict, List, Optional


def _require_anthropic():
    try:
        import anthropic
        return anthropic
    except ImportError:
        raise ImportError(
            "The Anthropic SDK is required for this integration. "
            "Install it with: pip install anthropic"
        )


class NotaryToolUseHook:
    """
    Processes Anthropic Claude API responses and issues receipts
    for each tool_use content block.
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

    def process_response(self, response, action_type="anthropic.tool_use"):
        """
        Scan an Anthropic Messages API response for tool_use blocks
        and issue a receipt for each one.

        Args:
            response: The response object from client.messages.create().
            action_type: Receipt action type prefix.

        Returns:
            List of Receipt objects (one per tool_use block). Failed
            issuances are omitted silently.
        """
        tool_blocks = _extract_tool_use_blocks(response)
        receipts = []

        for block in tool_blocks:
            self._receipt_count += 1
            payload = {
                "tool_name": block.get("name", ""),
                "tool_id": block.get("id", ""),
                "input_preview": _truncate_dict(block.get("input", {}), 300),
                "model": _get_model(response),
                "stop_reason": _get_stop_reason(response),
                "block_index": self._receipt_count,
                **self._metadata,
            }
            try:
                receipt = self._notary.issue(action_type, payload)
                receipts.append(receipt)
            except Exception:
                pass

        return receipts

    @property
    def receipt_count(self):
        """Total tool_use blocks receipted."""
        return self._receipt_count


def receipt_tool_use(notary, response, action_type="anthropic.tool_use", metadata=None):
    """
    One-shot function to issue receipts for all tool_use blocks in a response.

    Args:
        notary: A NotaryClient instance.
        response: The Anthropic Messages API response.
        action_type: Receipt action type prefix.
        metadata: Optional extra metadata dict.

    Returns:
        List of Receipt objects.
    """
    hook = NotaryToolUseHook(notary, metadata=metadata)
    return hook.process_response(response, action_type=action_type)


# -- Internal helpers --

def _extract_tool_use_blocks(response):
    """Extract tool_use content blocks from an Anthropic response."""
    blocks = []
    content = None

    if hasattr(response, "content"):
        content = response.content
    elif isinstance(response, dict):
        content = response.get("content", [])

    if content is None:
        return blocks

    for block in content:
        block_type = None
        if hasattr(block, "type"):
            block_type = block.type
        elif isinstance(block, dict):
            block_type = block.get("type")

        if block_type == "tool_use":
            if hasattr(block, "name"):
                blocks.append({
                    "name": block.name,
                    "id": getattr(block, "id", ""),
                    "input": getattr(block, "input", {}),
                })
            elif isinstance(block, dict):
                blocks.append({
                    "name": block.get("name", ""),
                    "id": block.get("id", ""),
                    "input": block.get("input", {}),
                })

    return blocks


def _get_model(response):
    """Safely extract model name from response."""
    if hasattr(response, "model"):
        return str(response.model)
    if isinstance(response, dict):
        return response.get("model", "")
    return ""


def _get_stop_reason(response):
    """Safely extract stop_reason from response."""
    if hasattr(response, "stop_reason"):
        return str(response.stop_reason)
    if isinstance(response, dict):
        return response.get("stop_reason", "")
    return ""


def _truncate_dict(d, max_chars):
    """Convert dict to string preview, truncated to max_chars."""
    if not d:
        return ""
    preview = str(d)
    if len(preview) > max_chars:
        return preview[:max_chars] + "..."
    return preview
