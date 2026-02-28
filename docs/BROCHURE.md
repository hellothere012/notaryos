# NotaryOS

## Cryptographic Receipts for AI Agents

**When AI agents make decisions, you need proof.**

---

## The Problem

Your AI agents are making thousands of autonomous decisions every day. They transfer funds. Route messages. Analyze data. Recommend actions. Escalate alerts. They communicate across organizations, jurisdictions, and trust boundaries.

And there is **no audit trail**.

When something goes wrong -- and it will -- the questions are immediate:

- Did Agent A actually send that message?
- Was the data modified after transmission?
- Which decision came first?
- Did the agent evaluate the opportunity and choose restraint, or did it simply miss it?

Log files can be edited. Databases can be rewritten. Timestamps can be backdated. None of these provide the cryptographic evidence that regulators, auditors, and partners demand.

---

## The Solution: NotaryOS

NotaryOS gives every agent-to-agent message a **cryptographic receipt** -- a Stamp -- that proves what was sent, by whom, when, and that nothing has been tampered with.

```python
from notaryos import NotaryClient
notary = NotaryClient(api_key="notary_live_xxx")
receipt = notary.issue("my_action", {"message": "hello"})
```

Three lines of code. Immutable proof.

---

## How It Works

### 1. Seal

Your agent sends a message. NotaryOS creates a Stamp: a SHA-256 hash of the payload, signed with Ed25519 cryptography, linked to the agent's previous receipt in a tamper-evident hash chain.

### 2. Chain

Every agent builds its own chain of receipts. Each receipt links to the one before it. If any receipt is modified, deleted, or reordered -- the chain breaks. Tampering is immediately detectable.

### 3. Verify

Anyone with the public key can verify any receipt. No server access. No API key. No network connection. The math either checks out or it doesn't.

**Signing is the paid service. Verification is free, unlimited, and offline.**

---

## What Makes NotaryOS Different

### Real Cryptography, Not Logging

NotaryOS uses Ed25519 -- the same algorithm that secures SSH, Signal, and Tor. Every receipt is a real cryptographic proof, not a log entry that can be edited.

### Enterprise-Grade Performance

Under the hood, NotaryOS runs a high-performance signing engine with 7-layer zero-trust security, 4.70ms P50 verification latency, and 178+ receipts/sec throughput. Benchmarked on a 4 vCPU / 8 GB RAM DigitalOcean droplet running 8 workers — 5,416 requests, 100% success rate. The architecture is purpose-built to make receipts fast, reliable, and scalable.

### Provenance Tracking

Receipts can reference upstream receipts, creating a Provenance DAG (Directed Acyclic Graph). This answers the question: "What data was this decision based on?" If any upstream receipt is invalidated, all downstream receipts are automatically flagged.

### Proof of Non-Action

Unique to NotaryOS: **Counterfactual Receipts** prove that an agent could have acted but chose not to. A financial agent that declined a trade due to risk? That deliberate restraint is now cryptographically provable. No other system offers this.

### Open Verification, Proprietary Signing

You can read every line of the cryptographic code. You can verify every receipt independently. You never have to trust us -- trust the math. The signing infrastructure (key management, chain persistence, abuse detection, uptime) is what you pay for.

---

## Use Cases

### Financial Services
- Prove trade decisions and deliberate non-trades
- Tamper-evident audit trails for regulatory compliance
- Cryptographic proof of message ordering between agents

### Healthcare AI
- Document diagnostic agent evaluations
- Prove treatment recommendations were considered and declined
- Immutable chain of care decisions

### Multi-Agent Systems
- Verifiable message history between autonomous agents
- Detect tampering, deletion, or reordering
- Independent verification by any third party

### Compliance and Legal
- Non-repudiation: agents cannot deny having sent a message
- Provenance chains establish data custody
- Counterfactual receipts document evaluated risks

---

## Platform at a Glance

| Capability | Detail |
|-----------|--------|
| Signing Algorithm | Ed25519 (primary), HMAC-SHA256 (legacy) |
| Receipt Latency | P50: 3.56ms, P99: 6.33ms (verified) |
| Verification Latency | P50: 4.70ms, P99: 9.56ms (verified) |
| Uptime Target | 99.9% |
| Key Rotation | Automatic (90 days, configurable) |
| SDKs | Python, TypeScript, Go |
| Offline Verification | Yes -- public key only |
| Third-Party Verification | Yes -- no account needed |
| JWKS Support | RFC 7517 compliant |
| Provenance DAG | Yes -- cycle detection, grounding checks |
| Counterfactual Receipts | Yes -- three-proof architecture |
| Abuse Detection | Auto-suspend on failure rate spikes |
| Telegram Notifications | Built-in receipt alerts |
| Stripe Billing | Integrated subscription management |

---

## Pricing

| | Starter | Explorer | Pro | Enterprise |
|-|---------|----------|-----|------------|
| **Price** | Free | $59/mo | $159/mo | Contact us |
| **Receipts** | 100/mo | 10,000/mo | 100,000/mo | Unlimited |
| **Verifications** | 500/mo | 50,000/mo | 500,000/mo | Unlimited |
| **Rate Limit** | 60/min | 300/min | 1,000/min | Custom |
| **Hash Chains** | -- | Yes | Yes | Yes |
| **Provenance** | -- | Yes | Yes | Yes |
| **Counterfactuals** | -- | -- | Yes | Yes |
| **Key Rotation** | Manual | Auto (90d) | Auto (custom) | Auto (custom) |
| **Priority Support** | -- | -- | Yes | Yes |

**Start free with Starter. Scale to Explorer, Pro, or Enterprise when ready.**

---

## The Trust Equation

```
Traditional Agent Systems:

  Agent A says it sent a message   ------>   Trust me
  Agent B says it never received   ------>   Trust me
  Auditor asks for proof           ------>   ...

With NotaryOS:

  Agent A sends a message          ------>   Stamp: seal:f3a1...8b2c
  Agent B receives with receipt    ------>   Verify: True
  Auditor checks independently     ------>   Public key verification: Authentic
```

**Proof > Promises.**

---

## Get Started

### Try It Now (No Account Needed)

```bash
# Get a live demo receipt
curl https://api.agenttownsquare.com/v1/notary/sample-receipt

# Verify it
curl -X POST https://api.agenttownsquare.com/v1/notary/verify \
  -H "Content-Type: application/json" \
  -d '{"receipt": <paste receipt here>}'
```

### Integrate in 3 Lines

```python
from notaryos import NotaryClient
notary = NotaryClient(api_key="notary_live_xxx")
receipt = notary.issue("my_action", {"message": "hello"})
```

### Learn More

- **Quick Start Guide**: 5-minute integration walkthrough
- **User Manual**: Complete developer documentation
- **Technical Manual**: Deep cryptographic reference
- **API Docs**: [notaryos.org/api-docs](https://notaryos.org/api-docs)
- **Public Key**: `https://api.agenttownsquare.com/v1/notary/public-key`

---

## Why Now

AI agents are proliferating across every industry. Autonomous systems are making real decisions with real consequences. The gap between what agents do and what can be proven grows wider every day.

NotaryOS closes that gap with battle-tested cryptography, 4.70ms P50 verification latency, and a verification model that requires zero trust in any central authority.

**Your agents are already making decisions. Now you can prove it.**

---

*NotaryOS v1.5.21 | notaryos.org*
