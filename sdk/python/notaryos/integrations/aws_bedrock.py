"""
NotaryOS AWS Bedrock Agents Integration

Issues receipts for AWS Bedrock agent invocations and model responses.

Usage:
    from notaryos import NotaryClient
    from notaryos.integrations.aws_bedrock import NotaryBedrockHook, receipt_bedrock_response

    notary = NotaryClient(api_key="notary_live_xxx")

    # Option 1: Hook class for ongoing use
    hook = NotaryBedrockHook(notary)
    response = bedrock_client.invoke_agent(...)
    receipts = hook.process_response(response)

    # Option 2: One-shot function
    receipt = receipt_bedrock_response(notary, response)
"""
from __future__ import annotations

import time
from typing import Any, Dict, List, Optional


def _require_boto3():
    try:
        import boto3
        return boto3
    except ImportError:
        raise ImportError(
            "boto3 is required for this integration. "
            "Install it with: pip install boto3"
        )


class NotaryBedrockHook:
    """
    Processes AWS Bedrock agent responses and issues NotaryOS receipts
    for each invocation step.
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

    def process_response(self, response, action_type="bedrock.agent.invoke"):
        """
        Process an invoke_agent response and issue receipts for each
        completion chunk or trace event.

        Handles both streaming EventStream responses and standard dict responses.

        Args:
            response: The response from bedrock-agent-runtime invoke_agent().
            action_type: Receipt action type prefix.

        Returns:
            List of Receipt objects issued.
        """
        receipts = []

        # Handle standard dict response (invoke_model)
        if isinstance(response, dict):
            receipt = self._receipt_dict_response(response, action_type)
            if receipt:
                receipts.append(receipt)
            return receipts

        # Handle EventStream from invoke_agent
        completion_text = ""
        trace_events = []

        if hasattr(response, "get") and callable(response.get):
            completion = response.get("completion", response)
        else:
            completion = response

        # Try to iterate the event stream
        try:
            if hasattr(completion, "__iter__"):
                for event in completion:
                    if isinstance(event, dict):
                        # Chunk event
                        chunk = event.get("chunk", {})
                        if "bytes" in chunk:
                            completion_text += chunk["bytes"].decode("utf-8", errors="replace")
                        # Trace event
                        trace = event.get("trace", {})
                        if trace:
                            trace_events.append(str(trace)[:100])
        except Exception:
            pass

        self._receipt_count += 1
        payload = {
            "completion_preview": completion_text[:300],
            "trace_event_count": len(trace_events),
            "event_index": self._receipt_count,
            **self._metadata,
        }

        try:
            receipt = self._notary.issue(action_type, payload)
            receipts.append(receipt)
        except Exception:
            pass

        return receipts

    def _receipt_dict_response(self, response, action_type):
        """Issue a receipt for a standard dict-style Bedrock response."""
        self._receipt_count += 1

        body_preview = ""
        model_id = response.get("modelId", response.get("model_id", ""))
        input_tokens = None
        output_tokens = None

        # invoke_model response
        if "body" in response:
            try:
                import json
                body_bytes = response["body"]
                if hasattr(body_bytes, "read"):
                    body_bytes = body_bytes.read()
                if isinstance(body_bytes, bytes):
                    body_bytes = body_bytes.decode("utf-8")
                body_data = json.loads(body_bytes) if isinstance(body_bytes, str) else body_bytes
                if isinstance(body_data, dict):
                    # Anthropic format
                    if "content" in body_data:
                        content = body_data["content"]
                        if isinstance(content, list) and content:
                            body_preview = str(content[0].get("text", ""))[:300]
                    # Amazon Titan format
                    elif "results" in body_data:
                        results = body_data["results"]
                        if isinstance(results, list) and results:
                            body_preview = str(results[0].get("outputText", ""))[:300]
                    # Generic
                    elif "completion" in body_data:
                        body_preview = str(body_data["completion"])[:300]
                    # Usage
                    usage = body_data.get("usage", {})
                    input_tokens = usage.get("input_tokens")
                    output_tokens = usage.get("output_tokens")
            except Exception:
                body_preview = "<unparseable>"

        payload = {
            "model_id": str(model_id),
            "body_preview": body_preview,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "event_index": self._receipt_count,
            **self._metadata,
        }

        try:
            return self._notary.issue(action_type, payload)
        except Exception:
            return None

    @property
    def receipt_count(self):
        """Total Bedrock responses receipted."""
        return self._receipt_count


def receipt_bedrock_response(notary, response, action_type="bedrock.agent.invoke", metadata=None):
    """
    One-shot function to issue receipts for an AWS Bedrock response.

    Args:
        notary: A NotaryClient instance.
        response: The Bedrock response (dict or EventStream).
        action_type: Receipt action type.
        metadata: Optional extra metadata dict.

    Returns:
        List of Receipt objects.
    """
    hook = NotaryBedrockHook(notary, metadata=metadata)
    return hook.process_response(response, action_type=action_type)
