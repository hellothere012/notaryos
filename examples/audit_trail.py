#!/usr/bin/env python3
"""
Audit Trail Example

Demonstrates building and maintaining an audit trail of agent communications
using NotaryOS.

Use Case:
    Enterprise needs proof their AI agents communicated correctly.
    After each action, issue/verify a receipt and store it.

Usage:
    export NOTARY_API_KEY="notary_test_demo"
    python audit_trail.py
"""

import json
import os
import sys
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'sdk', 'python'))

from notaryos import NotaryClient, NotaryError, Receipt


@dataclass
class AuditEntry:
    """An entry in the audit trail."""
    receipt: dict
    verified_at: str
    verification_result: dict
    notes: Optional[str] = None


class AuditTrail:
    """
    Maintains an audit trail of verified receipts.

    In production, you'd store this in a database with proper indexing.
    This example uses a JSON file for simplicity.
    """

    def __init__(self, storage_path: str = "audit_trail.json", api_key: Optional[str] = None):
        self.storage_path = Path(storage_path)
        self.notary = NotaryClient(
            api_key=api_key or os.environ.get("NOTARY_API_KEY", "notary_test_demo")
        )
        self.entries: list[AuditEntry] = []

        # Load existing entries if any
        if self.storage_path.exists():
            self._load()

    def _load(self):
        """Load existing audit trail from disk."""
        with open(self.storage_path) as f:
            data = json.load(f)
            self.entries = [
                AuditEntry(**entry) for entry in data.get("entries", [])
            ]

    def _save(self):
        """Save audit trail to disk."""
        data = {
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "entry_count": len(self.entries),
            "entries": [asdict(e) for e in self.entries],
        }
        with open(self.storage_path, "w") as f:
            json.dump(data, f, indent=2)

    def add_receipt(self, receipt: Receipt | dict, notes: str = None) -> bool:
        """
        Verify and add a receipt to the audit trail.

        Returns:
            True if receipt was valid and added, False otherwise.
        """
        # Convert to dict if needed
        receipt_dict = receipt.to_dict() if isinstance(receipt, Receipt) else receipt

        # Verify the receipt
        result = self.notary.verify(receipt_dict)

        # Create audit entry
        entry = AuditEntry(
            receipt=receipt_dict,
            verified_at=datetime.utcnow().isoformat() + "Z",
            verification_result={
                "valid": result.valid,
                "signature_ok": result.signature_ok,
                "structure_ok": result.structure_ok,
                "chain_ok": result.chain_ok,
                "reason": result.reason,
            },
            notes=notes,
        )

        self.entries.append(entry)
        self._save()

        return result.valid

    def get_receipts_by_agent(self, agent_id: str) -> list[dict]:
        """Get all receipts involving a specific agent."""
        return [
            e.receipt for e in self.entries
            if e.receipt.get("agent_id") == agent_id
        ]

    def get_receipts_by_action(self, action_type: str) -> list[dict]:
        """Get all receipts for a specific action type."""
        return [
            e.receipt for e in self.entries
            if e.receipt.get("action_type") == action_type
        ]

    def get_invalid_receipts(self) -> list[AuditEntry]:
        """Get all entries where verification failed."""
        return [
            e for e in self.entries
            if not e.verification_result.get("valid", False)
        ]

    def verify_entire_trail(self) -> dict:
        """Re-verify all receipts in the audit trail."""
        results = {
            "total": len(self.entries),
            "valid": 0,
            "invalid": 0,
            "invalid_indices": [],
        }

        for i, entry in enumerate(self.entries):
            result = self.notary.verify(entry.receipt)
            if result.valid:
                results["valid"] += 1
            else:
                results["invalid"] += 1
                results["invalid_indices"].append(i)

        return results

    def export_for_auditor(self, output_path: str = "audit_export.json"):
        """Export audit trail in a format suitable for external auditors."""
        # Get public key for independent verification
        key_info = self.notary.public_key()

        export_data = {
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "public_key_pem": key_info["public_key_pem"],
            "key_id": key_info.get("key_id"),
            "signature_type": key_info.get("signature_type"),
            "receipts": [e.receipt for e in self.entries],
            "verification_instructions": "See INDEPENDENT_VERIFICATION.md",
        }

        with open(output_path, "w") as f:
            json.dump(export_data, f, indent=2)

        return output_path


def main():
    print("NotaryOS - Audit Trail Example")
    print("=" * 50)

    # Create audit trail (uses local JSON file)
    trail = AuditTrail("example_audit_trail.json")

    try:
        # Simulate adding receipts from agent communications
        print("\n1. Issuing and adding receipts to audit trail...")

        # Issue receipts (in production, these come from real agent actions)
        for i in range(3):
            receipt = trail.notary.issue(
                "audit_demo",
                {"step": i + 1, "data": f"Sample action {i + 1}"}
            )
            valid = trail.add_receipt(
                receipt,
                notes=f"Sample receipt {i + 1} for demonstration"
            )
            status = "VALID" if valid else "INVALID"
            print(f"   Receipt {i + 1}: {receipt.receipt_id[:30]}... [{status}]")

        # Show audit trail stats
        print(f"\n2. Audit trail statistics:")
        print(f"   Total entries: {len(trail.entries)}")
        print(f"   Invalid entries: {len(trail.get_invalid_receipts())}")

        # Verify entire trail
        print("\n3. Re-verifying entire audit trail...")
        verification = trail.verify_entire_trail()
        print(f"   Total: {verification['total']}")
        print(f"   Valid: {verification['valid']}")
        print(f"   Invalid: {verification['invalid']}")

        # Export for external audit
        print("\n4. Exporting for external auditor...")
        export_path = trail.export_for_auditor("auditor_export.json")
        print(f"   Exported to: {export_path}")

        # Query by action type
        print("\n5. Querying audit trail...")
        demo_receipts = trail.get_receipts_by_action("audit_demo")
        print(f"   Receipts for 'audit_demo': {len(demo_receipts)}")

    except NotaryError as e:
        print(f"\nError: {e}")
        return 1

    print("\n" + "=" * 50)
    print("Audit trail example complete!")
    print("\nFiles created:")
    print("  - example_audit_trail.json (internal audit log)")
    print("  - auditor_export.json (for external verification)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
