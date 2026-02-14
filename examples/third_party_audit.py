#!/usr/bin/env python3
"""
Third-Party Audit Example

Demonstrates how an external auditor can verify receipts WITHOUT
access to the notary API (except for initial public key fetch).

Use Case:
    External auditor needs to verify agent communications independently.
    They receive an export file and the public key, then verify offline.

Usage:
    export NOTARY_API_KEY="notary_live_..."  # Get one at https://notaryos.org/api-keys
    python third_party_audit.py
"""

import base64
import hashlib
import json
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    from cryptography.hazmat.primitives.serialization import load_pem_public_key
    from cryptography.exceptions import InvalidSignature
    HAS_CRYPTOGRAPHY = True
except ImportError:
    HAS_CRYPTOGRAPHY = False
    print("Warning: 'cryptography' not installed. Install with: pip install cryptography")


def verify_receipt_independently(receipt: dict, public_key_pem: str) -> dict:
    """
    Verify a NotaryOS receipt without using the API.

    This is the core function for third-party verification.

    Args:
        receipt: The receipt dict
        public_key_pem: PEM-encoded Ed25519 public key

    Returns:
        Dict with verification results
    """
    result = {
        "receipt_id": receipt.get("receipt_id"),
        "valid": False,
        "checks": {
            "structure": False,
            "signature": False,
        },
        "error": None,
    }

    # Check required fields (matching current SDK Receipt format)
    required_fields = [
        "receipt_id", "timestamp", "agent_id", "action_type",
        "payload_hash", "previous_receipt_hash",
        "signature", "key_id"
    ]

    missing = [f for f in required_fields if f not in receipt]
    if missing:
        result["error"] = f"Missing fields: {missing}"
        return result

    result["checks"]["structure"] = True

    if not HAS_CRYPTOGRAPHY:
        result["error"] = "cryptography library not installed"
        return result

    try:
        # Load public key
        public_key = load_pem_public_key(public_key_pem.encode())
        if not isinstance(public_key, Ed25519PublicKey):
            result["error"] = "Not an Ed25519 public key"
            return result

        # Reconstruct canonical data (exact field order matching SDK Receipt)
        canonical_data = {
            "receipt_id": receipt["receipt_id"],
            "timestamp": receipt["timestamp"],
            "agent_id": receipt["agent_id"],
            "action_type": receipt["action_type"],
            "payload_hash": receipt["payload_hash"],
            "previous_receipt_hash": receipt["previous_receipt_hash"],
            "key_id": receipt["key_id"],
        }

        # Create canonical JSON
        canonical_json = json.dumps(canonical_data, separators=(",", ":"), sort_keys=False)

        # Hash the canonical JSON
        data_hash = hashlib.sha256(canonical_json.encode()).digest()

        # Decode signature
        signature = base64.b64decode(receipt["signature"])

        # Verify
        public_key.verify(signature, data_hash)
        result["checks"]["signature"] = True
        result["valid"] = True

    except InvalidSignature:
        result["error"] = "Invalid signature"
    except Exception as e:
        result["error"] = str(e)

    return result


def verify_chain(receipts: list[dict]) -> dict:
    """
    Verify the hash chain linking receipts together.

    Args:
        receipts: List of receipts in chronological order

    Returns:
        Dict with chain verification results
    """
    result = {
        "valid": True,
        "total": len(receipts),
        "verified": 0,
        "broken_at": None,
        "error": None,
    }

    for i, receipt in enumerate(receipts):
        if i == 0:
            # First receipt should link to GENESIS
            if receipt.get("previous_receipt_hash") != "GENESIS":
                result["valid"] = False
                result["broken_at"] = i
                result["error"] = f"First receipt should have previous_receipt_hash='GENESIS'"
                return result
        else:
            # Compute expected hash of previous receipt
            prev_json = json.dumps(receipts[i - 1], sort_keys=True, separators=(",", ":"))
            expected_hash = hashlib.sha256(prev_json.encode()).hexdigest()

            if receipt.get("previous_receipt_hash") != expected_hash:
                result["valid"] = False
                result["broken_at"] = i
                result["error"] = f"Chain broken at index {i}: hash mismatch"
                return result

        result["verified"] += 1

    return result


def perform_audit(export_file: str) -> dict:
    """
    Perform a complete audit of an export file.

    Args:
        export_file: Path to the auditor export JSON file

    Returns:
        Comprehensive audit report
    """
    report = {
        "audit_started": datetime.utcnow().isoformat() + "Z",
        "export_file": export_file,
        "summary": {
            "total_receipts": 0,
            "valid_signatures": 0,
            "invalid_signatures": 0,
            "chain_valid": None,
        },
        "receipt_results": [],
        "chain_result": None,
        "recommendations": [],
    }

    # Load export file
    try:
        with open(export_file) as f:
            data = json.load(f)
    except Exception as e:
        report["error"] = f"Failed to load export file: {e}"
        return report

    public_key_pem = data.get("public_key_pem")
    receipts = data.get("receipts", [])

    if not public_key_pem:
        report["error"] = "No public key in export file"
        return report

    report["summary"]["total_receipts"] = len(receipts)

    # Verify each receipt's signature
    for receipt in receipts:
        result = verify_receipt_independently(receipt, public_key_pem)
        report["receipt_results"].append(result)

        if result["valid"]:
            report["summary"]["valid_signatures"] += 1
        else:
            report["summary"]["invalid_signatures"] += 1

    # Verify chain integrity
    chain_result = verify_chain(receipts)
    report["chain_result"] = chain_result
    report["summary"]["chain_valid"] = chain_result["valid"]

    # Generate recommendations
    if report["summary"]["invalid_signatures"] > 0:
        report["recommendations"].append(
            f"CRITICAL: {report['summary']['invalid_signatures']} receipt(s) have invalid signatures. "
            "These may have been tampered with."
        )

    if not chain_result["valid"]:
        report["recommendations"].append(
            f"CRITICAL: Hash chain is broken at index {chain_result['broken_at']}. "
            "Receipt history may have been modified."
        )

    if not report["recommendations"]:
        report["recommendations"].append(
            "All receipts verified successfully. No tampering detected."
        )

    report["audit_completed"] = datetime.utcnow().isoformat() + "Z"
    return report


def main():
    print("NotaryOS - Third-Party Audit Example")
    print("=" * 50)

    if not HAS_CRYPTOGRAPHY:
        print("\nThis example requires the 'cryptography' library.")
        print("Install with: pip install cryptography")
        return 1

    # First, create a sample export file (simulating what an auditor would receive)
    print("\n1. Creating sample export file...")

    # In real use, the auditor would receive this file from the client
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'sdk', 'python'))
    from notaryos import NotaryClient

    api_key = os.environ.get("NOTARY_API_KEY")
    if not api_key:
        print("Error: Set NOTARY_API_KEY env var. Get one at https://notaryos.org/api-keys")
        sys.exit(1)
    notary = NotaryClient(api_key=api_key)

    # Get public key and issue some receipts
    key_info = notary.public_key()
    receipts = [
        notary.issue("audit_action", {"item": i + 1}).to_dict()
        for i in range(3)
    ]

    export_data = {
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "public_key_pem": key_info["public_key_pem"],
        "receipts": receipts,
    }

    export_file = "sample_export_for_audit.json"
    with open(export_file, "w") as f:
        json.dump(export_data, f, indent=2)
    print(f"   Created: {export_file}")

    # Now perform the audit (as if we're the third-party auditor)
    print("\n2. Performing independent audit (no API access)...")
    report = perform_audit(export_file)

    # Display results
    print("\n" + "=" * 50)
    print("AUDIT REPORT")
    print("=" * 50)

    print(f"\nAudit Period: {report['audit_started']} to {report['audit_completed']}")
    print(f"Export File: {report['export_file']}")

    print("\nSummary:")
    print(f"  Total Receipts:     {report['summary']['total_receipts']}")
    print(f"  Valid Signatures:   {report['summary']['valid_signatures']}")
    print(f"  Invalid Signatures: {report['summary']['invalid_signatures']}")
    print(f"  Chain Valid:        {report['summary']['chain_valid']}")

    print("\nReceipt Details:")
    for i, result in enumerate(report['receipt_results']):
        status = "VALID" if result['valid'] else "INVALID"
        print(f"  {i + 1}. {result['receipt_id'][:30]}... [{status}]")
        if result.get('error'):
            print(f"      Error: {result['error']}")

    print("\nChain Verification:")
    chain = report['chain_result']
    print(f"  Receipts Checked: {chain['verified']}/{chain['total']}")
    print(f"  Chain Intact: {chain['valid']}")
    if chain.get('error'):
        print(f"  Error: {chain['error']}")

    print("\nRecommendations:")
    for rec in report['recommendations']:
        print(f"  - {rec}")

    # Save report
    report_file = "audit_report.json"
    with open(report_file, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nFull report saved to: {report_file}")

    print("\n" + "=" * 50)
    print("Third-party audit example complete!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
