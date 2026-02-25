"""NotaryOS + LangChain: Auto-receipt every tool call."""

import os

from langchain_core.tools import tool
from notaryos import NotaryClient

API_KEY = os.environ.get("NOTARY_API_KEY", "notary_test_demo")
notary = NotaryClient(api_key=API_KEY)


class OrderService:
    def place_order(self, item: str, qty: int) -> dict:
        return {"order_id": "ORD-001", "item": item, "qty": qty, "status": "placed"}

    def check_status(self, order_id: str) -> dict:
        return {"order_id": order_id, "status": "processing"}


svc = OrderService()
notary.wrap(svc)  # <-- 1 line: every method call is now receipted


@tool
def place_order(item: str, qty: int) -> str:
    """Place an order for an item."""
    result = svc.place_order(item, qty)
    return f"Order {result['order_id']}: {result['qty']}x {result['item']}"


if __name__ == "__main__":
    # Simulate agent calling the tool
    print(place_order.invoke({"item": "laptop", "qty": 1}))
    print(place_order.invoke({"item": "keyboard", "qty": 3}))

    print(f"\nReceipts issued: {notary.receipt_stats}")
    print("Every action is now cryptographically proven.")
