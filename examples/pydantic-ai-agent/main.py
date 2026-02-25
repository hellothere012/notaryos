"""NotaryOS + PydanticAI: Type-safe agent receipts."""

import os

from notaryos import NotaryClient

API_KEY = os.environ.get("NOTARY_API_KEY", "notary_test_demo")
notary = NotaryClient(api_key=API_KEY)


class DataService:
    def fetch_user(self, user_id: int) -> dict:
        return {"id": user_id, "name": "Alice", "active": True}

    def update_preferences(self, user_id: int, prefs: dict) -> dict:
        return {"user_id": user_id, "updated": True, "prefs": prefs}


svc = DataService()
notary.wrap(svc)  # every query is receipted

if __name__ == "__main__":
    print(svc.fetch_user(42))
    print(svc.update_preferences(42, {"theme": "dark"}))

    print(f"\nReceipts issued: {notary.receipt_stats}")
