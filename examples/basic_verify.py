#!/usr/bin/env python3
"""
Basic Receipt Verification Example

Demonstrates the simplest use case: issue a receipt and verify it.

Usage:
    export NOTARY_API_KEY="notary_live_..."  # Get one at https://notaryos.org/api-keys
    python basic_verify.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'sdk', 'python'))

from notaryos import NotaryClient, NotaryError, Receipt


def main():
    print("NotaryOS - Basic Verification Example")
    print("=" * 50)

    # Create client (reads API key from environment)
    api_key = os.environ.get("NOTARY_API_KEY")
    if not api_key:
        print("Error: Set NOTARY_API_KEY env var. Get one at https://notaryos.org/api-keys")
        sys.exit(1)
    notary = NotaryClient(api_key=api_key)

    try:
        # 1. Check service status
        print("\n1. Checking service status...")
        status = notary.status()
        print(f"   Status: {status.status}")
        print(f"   Signature Type: {status.signature_type}")
        print(f"   Capabilities: {[c for c in status.capabilities if c]}")

        # 2. Issue a receipt
        print("\n2. Issuing a receipt...")
        receipt = notary.issue("demo_action", {"example": "data", "step": "basic_verify"})
        print(f"   Receipt ID: {receipt.receipt_id}")
        print(f"   Agent: {receipt.agent_id}")
        print(f"   Action: {receipt.action_type}")
        print(f"   Signature type: {receipt.signature_type}")

        # 3. Verify the receipt
        print("\n3. Verifying receipt...")
        result = notary.verify(receipt)

        print(f"\n   Verification Result:")
        print(f"   -------------------")
        print(f"   Valid:        {result.valid}")
        print(f"   Signature OK: {result.signature_ok}")
        print(f"   Structure OK: {result.structure_ok}")
        print(f"   Chain OK:     {result.chain_ok}")
        print(f"   Reason:       {result.reason}")

        # 4. Show what a tampered receipt would look like
        print("\n4. Testing tampered receipt...")
        tampered = receipt.to_dict()
        tampered["agent_id"] = "malicious_agent"  # Tamper with the data

        tampered_result = notary.verify(tampered)
        print(f"   Tampered receipt valid: {tampered_result.valid}")
        print(f"   Reason: {tampered_result.reason}")

    except NotaryError as e:
        print(f"\nError: {e}")
        return 1

    print("\n" + "=" * 50)
    print("Example complete!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
