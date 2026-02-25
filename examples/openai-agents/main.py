"""NotaryOS + OpenAI Agents SDK: Audit every tool invocation."""

import os

from notaryos import NotaryClient

API_KEY = os.environ.get("NOTARY_API_KEY", "notary_test_demo")
notary = NotaryClient(api_key=API_KEY)


class ResearchService:
    def search(self, query: str) -> dict:
        return {"query": query, "results": ["paper_1", "paper_2"], "count": 2}

    def summarize(self, text: str) -> str:
        return f"Summary: {text[:80]}..."


svc = ResearchService()
notary.wrap(svc)  # every method call is receipted

if __name__ == "__main__":
    print(svc.search("quantum computing 2026"))
    print(svc.summarize("A long paper about quantum entanglement and its uses..."))

    print(f"\nReceipts issued: {notary.receipt_stats}")
