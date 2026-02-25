"""
NotaryOS SDK - Cryptographic receipts for AI agent actions.

Usage:
    from notaryos import NotaryClient
    notary = NotaryClient(api_key="notary_live_xxx")
    receipt = notary.issue("my_action", {"key": "value"})
"""

from notary_sdk import (
    NotaryClient,
    NotaryError,
    AuthenticationError,
    RateLimitError,
    ValidationError,
    Receipt,
    VerificationResult,
    ServiceStatus,
    verify_receipt,
    receipted,
    CounterfactualClient,
    AutoReceiptConfig,
    __version__,
)

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
    "receipted",
    "CounterfactualClient",
    "AutoReceiptConfig",
    "__version__",
]
