#!/usr/bin/env python3
"""
Chain Verification Example

Demonstrates how hash chaining works and how to verify
an entire chain of receipts for tampering detection.

Use Case:
    Verify that no receipts in a communication history have been
    modified, deleted, or inserted.

Usage:
    export NOTARY_API_KEY="notary_live_..."  # Get one at https://notaryos.org/api-keys
    python chain_verification.py
"""

import hashlib
import json
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'sdk', 'python'))

from notaryos import NotaryClient, NotaryError, Receipt


def compute_receipt_hash(receipt: dict) -> str:
    """
    Compute SHA-256 hash of a receipt for chain linking.

    This is the same algorithm used by the notary to create
    the previous_receipt_hash field.
    """
    # Sort keys for consistent hashing
    receipt_json = json.dumps(receipt, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(receipt_json.encode()).hexdigest()


def verify_chain_integrity(receipts: list[dict]) -> dict:
    """
    Verify the integrity of a receipt chain.

    Checks that each receipt correctly links to the previous one.

    Args:
        receipts: List of receipts in chronological order

    Returns:
        Dict with verification results
    """
    result = {
        "valid": True,
        "total_receipts": len(receipts),
        "verified_links": 0,
        "first_receipt": None,
        "last_receipt": None,
        "broken_at": None,
        "details": [],
    }

    if not receipts:
        result["error"] = "No receipts to verify"
        return result

    result["first_receipt"] = receipts[0].get("receipt_id")
    result["last_receipt"] = receipts[-1].get("receipt_id")

    for i, receipt in enumerate(receipts):
        link_info = {
            "index": i,
            "receipt_id": receipt.get("receipt_id"),
            "previous_hash": receipt.get("previous_receipt_hash"),
            "expected_hash": None,
            "valid": False,
        }

        if i == 0:
            # First receipt should reference GENESIS
            expected = "GENESIS"
            link_info["expected_hash"] = expected
            link_info["valid"] = receipt.get("previous_receipt_hash") == expected

            if not link_info["valid"]:
                result["valid"] = False
                result["broken_at"] = i
                link_info["error"] = "First receipt should have previous_receipt_hash='GENESIS'"
        else:
            # Subsequent receipts should reference the hash of the previous receipt
            expected = compute_receipt_hash(receipts[i - 1])
            link_info["expected_hash"] = expected
            link_info["valid"] = receipt.get("previous_receipt_hash") == expected

            if not link_info["valid"]:
                result["valid"] = False
                result["broken_at"] = i
                link_info["error"] = f"Hash mismatch: expected {expected[:16]}..."

        if link_info["valid"]:
            result["verified_links"] += 1

        result["details"].append(link_info)

    return result


def demonstrate_tampering_detection():
    """
    Demonstrate how tampering is detected through chain verification.
    """
    print("\n" + "=" * 50)
    print("TAMPERING DETECTION DEMONSTRATION")
    print("=" * 50)

    # Create a simple chain manually using the current SDK receipt format
    def create_receipt(receipt_id: str, prev_hash: str, data: str) -> dict:
        return {
            "receipt_id": receipt_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "agent_id": "demo_agent",
            "action_type": "demo",
            "payload_hash": hashlib.sha256(data.encode()).hexdigest(),
            "previous_receipt_hash": prev_hash,
            "signature": "demo_signature",
            "signature_type": "ed25519",
            "key_id": "demo-key",
            "schema_version": "1.0",
        }

    # Build a valid chain
    receipt1 = create_receipt("receipt_1", "GENESIS", "First message")
    receipt2 = create_receipt("receipt_2", compute_receipt_hash(receipt1), "Second message")
    receipt3 = create_receipt("receipt_3", compute_receipt_hash(receipt2), "Third message")

    valid_chain = [receipt1, receipt2, receipt3]

    print("\n1. Original chain (valid):")
    result = verify_chain_integrity(valid_chain)
    print(f"   Chain valid: {result['valid']}")
    print(f"   Links verified: {result['verified_links']}/{result['total_receipts']}")

    # Now demonstrate tampering
    print("\n2. Tamper with middle receipt (change payload_hash):")
    tampered_chain = [
        receipt1.copy(),
        {**receipt2, "payload_hash": "tampered_hash"},  # Tampered!
        receipt3.copy(),
    ]

    result = verify_chain_integrity(tampered_chain)
    print(f"   Chain valid: {result['valid']}")
    print(f"   Broken at index: {result['broken_at']}")

    # Tampering with the first receipt
    print("\n3. Tamper with first receipt:")
    tampered_chain2 = [
        {**receipt1, "agent_id": "malicious_agent"},  # Tampered!
        receipt2.copy(),
        receipt3.copy(),
    ]

    result = verify_chain_integrity(tampered_chain2)
    print(f"   Chain valid: {result['valid']}")
    print(f"   Broken at index: {result['broken_at']}")

    # Remove a receipt (gap detection)
    print("\n4. Remove middle receipt (gap in chain):")
    gapped_chain = [receipt1.copy(), receipt3.copy()]  # Missing receipt2!

    result = verify_chain_integrity(gapped_chain)
    print(f"   Chain valid: {result['valid']}")
    print(f"   Broken at index: {result['broken_at']}")


def main():
    print("NotaryOS - Chain Verification Example")
    print("=" * 50)

    api_key = os.environ.get("NOTARY_API_KEY")
    if not api_key:
        print("Error: Set NOTARY_API_KEY env var. Get one at https://notaryos.org/api-keys")
        sys.exit(1)
    notary = NotaryClient(api_key=api_key)

    try:
        # 1. Issue a chain of receipts
        print("\n1. Issuing a chain of receipts...")
        receipts = []
        prev_hash = None
        for i in range(5):
            receipt = notary.issue(
                "chain_demo",
                {"step": i + 1, "data": f"Message {i + 1}"},
                previous_receipt_hash=prev_hash,
            )
            receipts.append(receipt.to_dict())
            prev_hash = receipt.receipt_hash
            print(f"   Receipt {i + 1}: {receipt.receipt_id[:30]}...")

        # 2. Verify signatures first
        print("\n2. Verifying individual receipt signatures...")
        for i, receipt in enumerate(receipts):
            result = notary.verify(receipt)
            status = "VALID" if result.valid else "INVALID"
            print(f"   Receipt {i + 1}: {status}")

        # 3. Verify chain integrity
        print("\n3. Verifying chain integrity...")

        result = verify_chain_integrity(receipts)

        print(f"   Total receipts: {result['total_receipts']}")
        print(f"   Chain valid: {result['valid']}")

        if not result['valid']:
            print(f"   Note: Chain integrity depends on server-side chaining configuration")

        # 4. Demonstrate tampering detection
        demonstrate_tampering_detection()

        # 5. Show chain visualization
        print("\n" + "=" * 50)
        print("CHAIN VISUALIZATION")
        print("=" * 50)

        print("""
    Receipt 1 (GENESIS)
    +-- previous_receipt_hash: "GENESIS"
    +-- payload_hash: SHA256(payload1)
    +-- signature: Ed25519(...)
           |
           v SHA256(Receipt1)
    Receipt 2
    +-- previous_receipt_hash: hash(Receipt1)
    +-- payload_hash: SHA256(payload2)
    +-- signature: Ed25519(...)
           |
           v SHA256(Receipt2)
    Receipt 3
    +-- previous_receipt_hash: hash(Receipt2)
    +-- payload_hash: SHA256(payload3)
    +-- signature: Ed25519(...)

    If ANY receipt is modified:
    - Its hash changes
    - The next receipt's previous_receipt_hash no longer matches
    - Chain verification fails, pinpointing the tampered receipt
        """)

    except NotaryError as e:
        print(f"\nError: {e}")
        return 1

    print("\n" + "=" * 50)
    print("Chain verification example complete!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
