"""
NotaryOS Python SDK - Cryptographic Receipts for AI Agent Actions

Usage:
    from notaryos import NotaryClient
    notary = NotaryClient()  # works instantly, no signup needed
    receipt = notary.seal("my_action", {"key": "value"})

For production, sign up at https://notaryos.org and pass your own key:
    notary = NotaryClient(api_key="notary_live_xxx")

Zero external dependencies — uses only Python standard library.
"""

__version__ = "2.2.0"
__all__ = [
    "NotaryClient",
    "NotaryError",
    "AuthenticationError",
    "RateLimitError",
    "ValidationError",
    "Receipt",
    "VerificationResult",
    "ServiceStatus",
    "verify_receipt",
]

import hashlib
import json
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


# =============================================================================
# Exceptions
# =============================================================================


class NotaryError(Exception):
    """Base exception for Notary SDK errors."""

    def __init__(self, message: str, code: str = "", status: int = 0, details: Optional[Dict] = None):
        super().__init__(message)
        self.code = code
        self.status = status
        self.details = details or {}


class AuthenticationError(NotaryError):
    """Invalid or missing API key."""
    pass


class RateLimitError(NotaryError):
    """Rate limit exceeded."""

    def __init__(self, message: str, retry_after: Optional[int] = None, **kwargs):
        super().__init__(message, **kwargs)
        self.retry_after = retry_after


class ValidationError(NotaryError):
    """Request validation failed."""
    pass


# =============================================================================
# Data Classes
# =============================================================================


@dataclass
class Receipt:
    """A signed Notary receipt."""

    receipt_id: str
    timestamp: str
    agent_id: str
    action_type: str
    payload_hash: str
    signature: str
    signature_type: str
    key_id: str
    kid: Optional[str] = None
    alg: Optional[str] = None
    schema_version: str = "1.0"
    chain_sequence: Optional[int] = None
    previous_receipt_hash: Optional[str] = None
    receipt_hash: Optional[str] = None
    verify_url: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Receipt":
        """Create a Receipt from a dictionary."""
        return cls(
            receipt_id=data.get("receipt_id", ""),
            timestamp=data.get("timestamp", ""),
            agent_id=data.get("agent_id", ""),
            action_type=data.get("action_type", ""),
            payload_hash=data.get("payload_hash", ""),
            signature=data.get("signature", ""),
            signature_type=data.get("signature_type", ""),
            key_id=data.get("key_id", ""),
            kid=data.get("kid"),
            alg=data.get("alg"),
            schema_version=data.get("schema_version", "1.0"),
            chain_sequence=data.get("chain_sequence"),
            previous_receipt_hash=data.get("previous_receipt_hash"),
            raw=data,
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for verification."""
        return self.raw or {
            "receipt_id": self.receipt_id,
            "timestamp": self.timestamp,
            "agent_id": self.agent_id,
            "action_type": self.action_type,
            "payload_hash": self.payload_hash,
            "signature": self.signature,
            "signature_type": self.signature_type,
            "key_id": self.key_id,
            "kid": self.kid,
            "alg": self.alg,
            "schema_version": self.schema_version,
        }


@dataclass
class VerificationResult:
    """Result of receipt verification."""

    valid: bool
    signature_ok: bool
    structure_ok: bool
    chain_ok: Optional[bool]
    reason: str
    details: Dict[str, Any]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "VerificationResult":
        return cls(
            valid=data.get("valid", False),
            signature_ok=data.get("signature_ok", False),
            structure_ok=data.get("structure_ok", False),
            chain_ok=data.get("chain_ok"),
            reason=data.get("reason", ""),
            details=data.get("details", {}),
        )


@dataclass
class ServiceStatus:
    """Notary service status."""

    status: str
    signature_type: str
    key_id: str
    has_public_key: bool
    capabilities: List[str]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ServiceStatus":
        return cls(
            status=data.get("status", "unknown"),
            signature_type=data.get("signature_type", ""),
            key_id=data.get("key_id", ""),
            has_public_key=data.get("has_public_key", False),
            capabilities=[c for c in data.get("capabilities", []) if c],
        )


# =============================================================================
# Client
# =============================================================================


class NotaryClient:
    """
    NotaryOS API client.

    Usage:
        notary = NotaryClient()  # uses free demo key (10 req/min)
        receipt = notary.seal("my_action", {"key": "value"})
        result = notary.verify(receipt)

    For production, sign up at https://notaryos.org and use your own key:
        notary = NotaryClient(api_key="notary_live_xxx")
    """

    DEFAULT_BASE_URL = "https://api.agenttownsquare.com"
    DEFAULT_TIMEOUT = 30
    DEMO_API_KEY = "notary_test_public_demo_b0821da365e0e8ce"

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: int = DEFAULT_TIMEOUT,
        max_retries: int = 2,
    ):
        """
        Initialize the Notary client.

        Args:
            api_key: Your Notary API key. If omitted, uses the free demo key
                     (10 req/min limit). Get a production key at https://notaryos.org
            base_url: API base URL (default: https://api.agenttownsquare.com)
            timeout: Request timeout in seconds
            max_retries: Max retry attempts on transient failures
        """
        if not api_key:
            api_key = self.DEMO_API_KEY

        if not (api_key.startswith("notary_live_") or api_key.startswith("notary_test_")):
            raise AuthenticationError(
                "Invalid API key format. Keys must start with notary_live_ or notary_test_.\n"
                "\n"
                "  Quick start (no signup):\n"
                "    notary = NotaryClient()  # uses free demo key\n"
                "\n"
                "  Production (unlimited):\n"
                "    Sign up at https://notaryos.org to get your own key.\n",
                code="ERR_INVALID_API_KEY",
            )

        self._api_key = api_key
        self._base_url = (base_url or self.DEFAULT_BASE_URL).rstrip("/")
        self._timeout = timeout
        self._max_retries = max_retries
        self._using_demo_key = (api_key == self.DEMO_API_KEY)

    def _request(self, method: str, path: str, body: Optional[Dict] = None) -> Dict[str, Any]:
        """Make an HTTP request to the Notary API."""
        url = f"{self._base_url}/v1/notary{path}"
        headers = {
            "X-API-Key": self._api_key,
            "Content-Type": "application/json",
            "User-Agent": f"notary-python-sdk/{__version__}",
        }

        data = json.dumps(body).encode("utf-8") if body else None

        last_error = None
        for attempt in range(self._max_retries + 1):
            try:
                req = Request(url, data=data, headers=headers, method=method)
                with urlopen(req, timeout=self._timeout) as resp:
                    response_body = resp.read().decode("utf-8")
                    return json.loads(response_body) if response_body else {}

            except HTTPError as e:
                response_body = e.read().decode("utf-8") if e.fp else ""
                try:
                    error_data = json.loads(response_body)
                except (json.JSONDecodeError, ValueError):
                    error_data = {"error": {"message": response_body, "code": "ERR_UNKNOWN"}}

                error_info = error_data.get("error", error_data)
                error_msg = error_info.get("message", str(e))
                error_code = error_info.get("code", "")

                if e.code == 401:
                    raise AuthenticationError(error_msg, code=error_code, status=401)
                elif e.code == 429:
                    retry_after = int(e.headers.get("Retry-After", 60)) if e.headers else 60
                    if attempt < self._max_retries:
                        time.sleep(min(retry_after, 5))
                        continue
                    raise RateLimitError(error_msg, retry_after=retry_after, code=error_code, status=429)
                elif e.code == 422:
                    raise ValidationError(error_msg, code=error_code, status=422, details=error_info.get("details", {}))
                elif e.code >= 500 and attempt < self._max_retries:
                    time.sleep(2 ** attempt)
                    last_error = e
                    continue
                else:
                    raise NotaryError(error_msg, code=error_code, status=e.code, details=error_info.get("details", {}))

            except URLError as e:
                if attempt < self._max_retries:
                    time.sleep(2 ** attempt)
                    last_error = e
                    continue
                raise NotaryError(f"Connection failed: {e.reason}", code="ERR_CONNECTION")

        if last_error:
            raise NotaryError(f"Max retries exceeded: {last_error}", code="ERR_MAX_RETRIES")
        raise NotaryError("Request failed", code="ERR_UNKNOWN")

    # =========================================================================
    # Public API
    # =========================================================================

    def issue(
        self,
        action_type: str,
        payload: Dict[str, Any],
        previous_receipt_hash: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Receipt:
        """
        Issue a signed receipt for an action.

        Args:
            action_type: Type of action (e.g., "data_processing", "api_call")
            payload: Action payload to be receipted
            previous_receipt_hash: Hash of previous receipt for chaining
            metadata: Additional metadata

        Returns:
            A signed Receipt object

        Example:
            receipt = notary.issue("my_action", {"key": "value"})
        """
        body: Dict[str, Any] = {
            "action_type": action_type,
            "payload": payload,
        }
        if previous_receipt_hash:
            body["previous_receipt_hash"] = previous_receipt_hash
        if metadata:
            body["metadata"] = metadata

        response = self._request("POST", "/issue", body)

        receipt_data = response.get("receipt", {})
        receipt = Receipt.from_dict(receipt_data)
        receipt.receipt_hash = response.get("receipt_hash")
        receipt.verify_url = response.get("verify_url")
        receipt.chain_sequence = response.get("chain_position")

        return receipt

    # Alias: seal() → issue() for the 3-line integration pattern
    seal = issue

    def verify(self, receipt: "Receipt | Dict[str, Any]") -> VerificationResult:
        """
        Verify a receipt's signature and integrity.

        Args:
            receipt: A Receipt object or raw receipt dict

        Returns:
            VerificationResult with valid/invalid status

        Example:
            result = notary.verify(receipt)
            assert result.valid
        """
        if isinstance(receipt, Receipt):
            receipt_dict = receipt.to_dict()
        else:
            receipt_dict = receipt

        response = self._request("POST", "/verify", {"receipt": receipt_dict})
        return VerificationResult.from_dict(response)

    def verify_by_id(self, receipt_id: str) -> VerificationResult:
        """
        Verify a receipt by its ID (server-side lookup).

        Args:
            receipt_id: The receipt ID or hash to look up

        Returns:
            VerificationResult
        """
        response = self._request("POST", "/verify", {"receipt_id": receipt_id})
        return VerificationResult.from_dict(response)

    def status(self) -> ServiceStatus:
        """
        Get Notary service status.

        Returns:
            ServiceStatus with health info

        Example:
            status = notary.status()
            print(status.status)  # "active"
        """
        response = self._request("GET", "/status")
        return ServiceStatus.from_dict(response)

    def public_key(self) -> Dict[str, str]:
        """
        Get the public key for offline verification.

        Returns:
            Dict with key_id, signature_type, public_key_pem

        Example:
            key_info = notary.public_key()
            pem = key_info["public_key_pem"]
        """
        return self._request("GET", "/public-key")

    def lookup(self, receipt_hash: str) -> Dict[str, Any]:
        """
        Look up a receipt by hash (public, no API key required).

        This uses the public verification page endpoint.

        Args:
            receipt_hash: Full or partial receipt hash (min 16 chars)

        Returns:
            Dict with found, receipt, verification, meta

        Example:
            result = notary.lookup("abc123def456...")
            if result["verification"]["valid"]:
                print("Receipt is valid!")
        """
        url = f"{self._base_url}/v1/notary/r/{receipt_hash}"
        headers = {
            "Content-Type": "application/json",
            "User-Agent": f"notary-python-sdk/{__version__}",
        }

        try:
            req = Request(url, headers=headers, method="GET")
            with urlopen(req, timeout=self._timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except HTTPError as e:
            body = e.read().decode("utf-8") if e.fp else ""
            try:
                error_data = json.loads(body)
            except (json.JSONDecodeError, ValueError):
                error_data = {}
            if e.code == 404:
                return {"found": False, "receipt": None, "verification": None, "meta": None}
            raise NotaryError(
                error_data.get("detail", str(e)),
                code=error_data.get("code", "ERR_LOOKUP"),
                status=e.code,
            )
        except URLError as e:
            raise NotaryError(f"Connection failed: {e.reason}", code="ERR_CONNECTION")

    def me(self) -> Dict[str, Any]:
        """
        Get information about the authenticated agent.

        Returns:
            Dict with agent_id, agent_name, tier, scopes, rate_limit
        """
        return self._request("GET", "/agents/me")

    # =========================================================================
    # Counterfactual Commit-Reveal (Phase 1 Hardening)
    # =========================================================================

    def commit_counterfactual(
        self,
        action_not_taken: str,
        capability_proof: Dict[str, Any],
        opportunity_context: Dict[str, Any],
        decision_reason: str,
        declination_reason: str = "unknown",
        provenance_refs: Optional[List[str]] = None,
        validity_window_minutes: int = 60,
        min_reveal_delay_seconds: int = 300,
        max_reveal_window_seconds: int = 86400,
    ) -> Dict[str, Any]:
        """
        Commit a counterfactual receipt (Phase 1 of commit-reveal).

        The decision_reason is hashed but NOT stored. You must call
        reveal_counterfactual() with the original plaintext within the
        reveal window.

        Args:
            action_not_taken: The action the agent chose not to take.
            capability_proof: Evidence the agent had permission.
            opportunity_context: Conditions that triggered evaluation.
            decision_reason: Plaintext reasoning (hashed, not stored).
            declination_reason: Category (policy, risk, etc.).
            provenance_refs: Related upstream receipt IDs.
            validity_window_minutes: How long the proof is meaningful.
            min_reveal_delay_seconds: Min wait before reveal (default 5m).
            max_reveal_window_seconds: Max time to reveal (default 24h).

        Returns:
            Dict with receipt, receipt_hash, commit_reveal state, verify_url.

        Example:
            result = notary.commit_counterfactual(
                action_not_taken="financial.execute_trade",
                capability_proof={"permissions": ["trade.execute"]},
                opportunity_context={"ticker": "ACME", "price": 142.50},
                decision_reason="Risk score exceeds threshold",
            )
            # Later (after min_reveal_delay_seconds):
            reveal = notary.reveal_counterfactual(
                result["receipt_hash"], "Risk score exceeds threshold"
            )
        """
        body: Dict[str, Any] = {
            "action_not_taken": action_not_taken,
            "capability_proof": capability_proof,
            "opportunity_context": opportunity_context,
            "decision_reason": decision_reason,
            "declination_reason": declination_reason,
            "validity_window_minutes": validity_window_minutes,
            "min_reveal_delay_seconds": min_reveal_delay_seconds,
            "max_reveal_window_seconds": max_reveal_window_seconds,
        }
        if provenance_refs:
            body["provenance_refs"] = provenance_refs

        return self._request("POST", "/counterfactual/commit", body)

    def reveal_counterfactual(
        self,
        receipt_hash: str,
        decision_reason_plaintext: str,
    ) -> Dict[str, Any]:
        """
        Reveal a committed counterfactual receipt (Phase 2 of commit-reveal).

        Submits the original plaintext. Server verifies SHA-256(plaintext)
        matches the committed hash and the time window is valid.

        Args:
            receipt_hash: The hash of the committed receipt.
            decision_reason_plaintext: The original reasoning text.

        Returns:
            Dict with success, new_phase, reveal_timestamp, etc.

        Example:
            reveal = notary.reveal_counterfactual(
                "abc123...", "Risk score exceeds threshold"
            )
            assert reveal["success"]
        """
        return self._request("POST", "/counterfactual/reveal", {
            "receipt_hash": receipt_hash,
            "decision_reason_plaintext": decision_reason_plaintext,
        })

    # =========================================================================
    # Reasoning Interception
    # =========================================================================

    def seal_reasoning(
        self,
        response: "Dict[str, Any] | Any",
        model: str = "auto",
    ) -> Dict[str, Any]:
        """
        Seal AI reasoning tokens as NotaryOS receipts.

        Extracts reasoning blocks from an OpenRouter-compatible API response,
        sends them to the server for parsing, tree construction, and sealing.
        All heavy lifting (parsing, multi-receipt sealing, provenance DAG)
        happens server-side.

        Args:
            response: OpenRouter API response (dict or response object).
                      Must contain choices[0].message with reasoning data.
            model: Model identifier. "auto" detects from response.model.

        Returns:
            Dict with tree, receipts, root_receipt, provenance_hash, node_count.

        Raises:
            ValidationError: If no reasoning blocks found in response.
            NotaryError: If sealing fails.

        Example:
            response = openai_client.chat.completions.create(
                model="deepseek/deepseek-r1",
                messages=[{"role": "user", "content": "Analyze BTC"}],
                extra_body={"reasoning": {"enabled": True}},
            )
            sealed = notary.seal_reasoning(response)
            print(f"Sealed {sealed['node_count']} reasoning nodes")
            print(f"Provenance root: {sealed['provenance_hash']}")
        """
        # Normalize response to dict
        if hasattr(response, "model_dump"):
            response_dict = response.model_dump()
        elif hasattr(response, "to_dict"):
            response_dict = response.to_dict()
        elif isinstance(response, dict):
            response_dict = response
        else:
            # Try converting dataclass-like objects
            response_dict = dict(response) if hasattr(response, "__iter__") else {"raw": str(response)}

        # Extract reasoning blocks client-side (lightweight)
        blocks = self._extract_reasoning_blocks(response_dict)
        if not blocks:
            raise ValidationError(
                "No reasoning blocks found in response. "
                "Ensure the model was called with reasoning enabled.",
                code="ERR_NO_REASONING",
            )

        # Auto-detect model
        if model == "auto":
            model = response_dict.get("model", "unknown")

        # Send to server for parsing + sealing
        return self._request("POST", "/reasoning/seal", {
            "reasoning_blocks": blocks,
            "model": model,
        })

    @staticmethod
    def _extract_reasoning_blocks(response: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract reasoning blocks from an OpenRouter response dict.

        Handles three formats:
        - message.reasoning_details (array of {type, data})
        - message.reasoning (KIMI K2.5 format)
        - message.reasoning_content (legacy)

        Returns list of dicts with content, block_type, token_count.
        """
        blocks: List[Dict[str, Any]] = []

        choices = response.get("choices", [])
        if not choices:
            return blocks

        message = choices[0].get("message", {})

        # Token count
        usage = response.get("usage", {})
        token_count = usage.get("reasoningTokens", 0)
        if not token_count:
            details = usage.get("completion_tokens_details", {})
            token_count = details.get("reasoning_tokens", 0)

        # Priority 1: reasoning_details array
        reasoning_details = message.get("reasoning_details")
        if reasoning_details and isinstance(reasoning_details, list):
            for detail in reasoning_details:
                if isinstance(detail, dict):
                    content = detail.get("data", detail.get("content", ""))
                    block_type = detail.get("type", "text")
                elif isinstance(detail, str):
                    content = detail
                    block_type = "text"
                else:
                    continue
                if content:
                    blocks.append({
                        "content": str(content),
                        "block_type": block_type,
                        "token_count": token_count,
                    })

        # Priority 2: message.reasoning (KIMI K2.5)
        if not blocks:
            reasoning = message.get("reasoning", "")
            if reasoning and isinstance(reasoning, str) and reasoning.strip():
                blocks.append({
                    "content": reasoning,
                    "block_type": "text",
                    "token_count": token_count,
                })

        # Priority 3: reasoning_content (legacy)
        if not blocks:
            reasoning_content = message.get("reasoning_content", "")
            if reasoning_content and isinstance(reasoning_content, str):
                blocks.append({
                    "content": reasoning_content,
                    "block_type": "text",
                    "token_count": token_count,
                })

        return blocks

    def commit_status(self, receipt_hash: str) -> Dict[str, Any]:
        """
        Check the commit-reveal lifecycle status of a receipt.

        Public endpoint (no API key required for the underlying call,
        but this method uses the authenticated client for consistency).

        Args:
            receipt_hash: The receipt hash to check.

        Returns:
            Dict with phase, timestamps, and timing info.
        """
        return self._request("GET", f"/counterfactual/commit-status/{receipt_hash}")


# =============================================================================
# Convenience function for quick verification
# =============================================================================


def verify_receipt(
    receipt: Dict[str, Any],
    base_url: str = NotaryClient.DEFAULT_BASE_URL,
) -> bool:
    """
    Quick verification without API key (public endpoint).

    Args:
        receipt: Receipt dict to verify
        base_url: API base URL

    Returns:
        True if valid, False otherwise
    """
    url = f"{base_url.rstrip('/')}/v1/notary/verify"
    data = json.dumps({"receipt": receipt}).encode("utf-8")
    headers = {"Content-Type": "application/json"}

    try:
        req = Request(url, data=data, headers=headers, method="POST")
        with urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result.get("valid", False)
    except Exception:
        return False


# =============================================================================
# CLI for quick testing
# =============================================================================

def main():
    """CLI entry point for ats-notary command."""
    import sys

    if len(sys.argv) < 2:
        print(f"NotaryOS Python SDK v{__version__}")
        print()
        print("Usage:")
        print("  notaryos status [--url URL]")
        print("  notaryos issue <api_key> <action_type> [--url URL]")
        print("  notaryos verify <receipt_json> [--url URL]")
        print("  notaryos lookup <receipt_hash> [--url URL]")
        print()
        print("Quick start (no signup):")
        print("  from notaryos import NotaryClient")
        print("  notary = NotaryClient()  # uses free demo key (10 req/min)")
        print('  receipt = notary.seal("my_action", {"key": "value"})')
        print()
        print("Production (unlimited):")
        print('  notary = NotaryClient(api_key="notary_live_xxx")')
        print("  # Get your key at https://notaryos.org")
        sys.exit(0)

    cmd = sys.argv[1]
    url = None
    for i, arg in enumerate(sys.argv):
        if arg == "--url" and i + 1 < len(sys.argv):
            url = sys.argv[i + 1]

    if cmd == "status":
        # Status doesn't require API key - use a dummy for public endpoint
        base = url or NotaryClient.DEFAULT_BASE_URL
        req_url = f"{base.rstrip('/')}/v1/notary/status"
        try:
            req = Request(req_url, method="GET")
            with urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                print(json.dumps(data, indent=2))
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)

    elif cmd == "issue":
        if len(sys.argv) < 4:
            print("Usage: python notary_sdk.py issue <api_key> <action_type>")
            sys.exit(1)
        api_key = sys.argv[2]
        action_type = sys.argv[3]
        client = NotaryClient(api_key=api_key, base_url=url)
        receipt = client.issue(action_type, {"source": "cli", "timestamp": time.time()})
        print(json.dumps(receipt.to_dict(), indent=2))

    elif cmd == "verify":
        if len(sys.argv) < 3:
            print("Usage: python notary_sdk.py verify <receipt_json>")
            sys.exit(1)
        receipt_json = sys.argv[2]
        receipt_data = json.loads(receipt_json)
        is_valid = verify_receipt(receipt_data, base_url=url or NotaryClient.DEFAULT_BASE_URL)
        print(f"Valid: {is_valid}")

    elif cmd == "lookup":
        if len(sys.argv) < 3:
            print("Usage: python notary_sdk.py lookup <receipt_hash> [--url URL]")
            sys.exit(1)
        receipt_hash = sys.argv[2]
        base = url or NotaryClient.DEFAULT_BASE_URL
        req_url = f"{base.rstrip('/')}/v1/notary/r/{receipt_hash}"
        try:
            req = Request(req_url, method="GET")
            with urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                print(json.dumps(data, indent=2))
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
