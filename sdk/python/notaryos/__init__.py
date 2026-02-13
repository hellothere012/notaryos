"""
NotaryOS SDK - Cryptographic receipts for AI agent actions.

Usage:
    from notaryos import NotaryClient
    notary = NotaryClient(api_key="notary_live_xxx")
    receipt = notary.issue("my_action", {"key": "value"})
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from notary_sdk import (  # noqa: E402
    NotaryClient,
    NotaryError,
    AuthenticationError,
    RateLimitError,
    ValidationError,
    Receipt,
    VerificationResult,
    ServiceStatus,
    verify_receipt,
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
    "__version__",
]
