#!/usr/bin/env python3
"""
TradeBotAlpha — Demo of NotaryOS auto-receipting.

Every public method call on the agent automatically produces a
cryptographic receipt. No changes needed to the agent class itself.

Usage:
    python examples/tradebot_alpha.py

Set NOTARY_API_KEY env var, or it defaults to dry-run mode.
"""

import os
import sys
import time

# Allow running from sdk/python/ directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from notary_sdk import NotaryClient, AutoReceiptConfig


# ---------------------------------------------------------------------------
# Agent class — no NotaryOS awareness whatsoever
# ---------------------------------------------------------------------------

class TradeBotAlpha:
    """A simple trading agent that knows nothing about receipts."""

    def __init__(self, name: str = "TradeBotAlpha"):
        self.name = name
        self.portfolio = {"BTC": 1.5, "ETH": 10.0, "SOL": 200.0}

    def get_portfolio(self):
        """Return current portfolio holdings."""
        return dict(self.portfolio)

    def place_order(self, symbol: str, qty: float, side: str = "buy"):
        """Place a trade order."""
        if symbol not in ("BTC", "ETH", "SOL", "DOGE"):
            raise ValueError(f"Unknown symbol: {symbol}")
        current = self.portfolio.get(symbol, 0.0)
        if side == "buy":
            self.portfolio[symbol] = current + qty
        else:
            self.portfolio[symbol] = max(0, current - qty)
        return {"order_id": "ORD-12345", "symbol": symbol, "qty": qty, "side": side, "status": "filled"}

    def analyze_market(self, symbols=None, api_key="default_key"):
        """Analyze market data (api_key should be redacted in receipts)."""
        symbols = symbols or ["BTC", "ETH"]
        return {s: {"trend": "bullish", "confidence": 0.85} for s in symbols}

    def rebalance(self, target_weights=None, secret_key="rebalance_secret"):
        """Rebalance portfolio (secret_key should be redacted)."""
        return {"rebalanced": True, "positions": len(self.portfolio)}

    def _internal_calc(self):
        """Private method — should NOT be wrapped."""
        return 42


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    api_key = os.environ.get("NOTARY_API_KEY", "")

    if api_key:
        notary = NotaryClient(api_key=api_key)
        config = AutoReceiptConfig()
        print("Using live NotaryOS API")
    else:
        notary = NotaryClient(api_key="notary_test_dryrun000000000")
        config = AutoReceiptConfig(dry_run=True)
        print("No NOTARY_API_KEY set — running in dry-run mode\n")

    # Create agent and wrap it — that's it!
    bot = TradeBotAlpha()
    notary.wrap(bot, config=config)

    # Normal usage — every call is auto-receipted
    print("\n--- get_portfolio ---")
    portfolio = bot.get_portfolio()
    print(f"Portfolio: {portfolio}")

    print("\n--- place_order ---")
    order = bot.place_order("BTC", 0.5, side="buy")
    print(f"Order: {order}")

    print("\n--- analyze_market (secret redaction) ---")
    analysis = bot.analyze_market(api_key="sk_live_supersecret123")
    print(f"Analysis: {analysis}")

    print("\n--- rebalance (secret redaction) ---")
    result = bot.rebalance(secret_key="my_rebalance_key_999")
    print(f"Rebalance: {result}")

    print("\n--- error capture ---")
    try:
        bot.place_order("INVALID", 1.0)
    except ValueError as e:
        print(f"Caught expected error: {e}")

    # Show stats
    time.sleep(0.5)  # Let queue drain if using live mode
    print(f"\n--- receipt_stats ---")
    print(f"Stats: {notary.receipt_stats}")

    # Demonstrate unwrap
    print("\n--- unwrap ---")
    notary.unwrap(bot)
    bot.get_portfolio()  # No receipt issued
    print("Unwrapped — no more auto-receipts")


if __name__ == "__main__":
    main()
