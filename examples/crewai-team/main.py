"""NotaryOS + CrewAI: Multi-agent accountability."""

import os

from notaryos import NotaryClient

API_KEY = os.environ.get("NOTARY_API_KEY", "notary_test_demo")
notary = NotaryClient(api_key=API_KEY)


class ComplianceChecker:
    def check_policy(self, doc: str) -> dict:
        return {"compliant": True, "document": doc, "score": 0.95}

    def flag_violation(self, rule: str) -> dict:
        return {"flagged": True, "rule": rule}


class DataProcessor:
    def process(self, records: int) -> dict:
        return {"processed": records, "errors": 0}


checker = ComplianceChecker()
processor = DataProcessor()

notary.wrap(checker)   # receipt every compliance check
notary.wrap(processor) # receipt every data operation

if __name__ == "__main__":
    print(checker.check_policy("contract_v2.pdf"))
    print(checker.flag_violation("GDPR-17"))
    print(processor.process(500))

    print(f"\nReceipts issued: {notary.receipt_stats}")
    print("Multi-agent accountability built-in.")
