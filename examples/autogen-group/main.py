"""NotaryOS + AutoGen: Enterprise multi-agent audit trail."""

import os

from notaryos import NotaryClient

API_KEY = os.environ.get("NOTARY_API_KEY", "notary_test_demo")
notary = NotaryClient(api_key=API_KEY)


class AnalyticsEngine:
    def analyze(self, dataset: str) -> dict:
        return {"dataset": dataset, "rows": 1000, "anomalies": 3}

    def report(self, analysis_id: str) -> str:
        return f"Report: {analysis_id} — 3 anomalies detected"


engine = AnalyticsEngine()
notary.wrap(engine)  # every analysis is receipted

if __name__ == "__main__":
    print(engine.analyze("sales_q4"))
    print(engine.report("sales_q4"))

    print(f"\nReceipts issued: {notary.receipt_stats}")
