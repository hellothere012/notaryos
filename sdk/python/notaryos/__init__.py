"""
NotaryOS SDK - Cryptographic receipts for AI agent actions.

Usage (authenticated -- issue, seal, wrap, admin):
    from notaryos import NotaryClient
    notary = NotaryClient(api_key="notary_live_xxx")
    receipt = notary.issue("my_action", {"key": "value"})

Usage (public -- verify, lookup, status, public_key):
    from notaryos import NotaryClient
    notary = NotaryClient()  # no API key needed
    result = notary.verify(receipt_dict)

Quick verification (standalone, no client needed):
    from notaryos import verify_receipt, verify_receipt_detailed
    is_valid = verify_receipt(receipt_dict)           # returns bool
    result = verify_receipt_detailed(receipt_dict)     # returns VerificationResult
"""

from notary_sdk import (
    # Core client
    NotaryClient,
    # Exceptions
    NotaryError,
    AuthenticationError,
    RateLimitError,
    ValidationError,
    # Constants
    NotaryErrorCode,
    # Data classes
    Receipt,
    VerificationResult,
    ServiceStatus,
    # Auto-receipting
    AutoReceiptConfig,
    CounterfactualClient,
    receipted,
    # Standalone public functions (no API key required)
    verify_receipt,
    verify_receipt_detailed,
    # Version
    __version__,
)

__all__ = [
    # Core client
    "NotaryClient",
    # Exceptions
    "NotaryError",
    "AuthenticationError",
    "RateLimitError",
    "ValidationError",
    # Constants
    "NotaryErrorCode",
    # Data classes
    "Receipt",
    "VerificationResult",
    "ServiceStatus",
    # Auto-receipting
    "AutoReceiptConfig",
    "CounterfactualClient",
    "receipted",
    # Standalone public functions (no API key required)
    "verify_receipt",
    "verify_receipt_detailed",
    # Version
    "__version__",
]
