# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Scope

This security policy covers:
- **Notary UI** — React frontend for receipt verification
- **Notary API** — Backend verification endpoints
- **Verification Core** — Cryptographic verification logic
- **Hosted Demo** — Public demo at agents.agenttownsquare.com

---

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**Email:** security@agenttownsquare.com

**Include in your report:**
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Your suggested fix (optional)
5. Version affected

### What to Expect

| Timeline | Action |
|----------|--------|
| 24 hours | Acknowledgment of your report |
| 72 hours | Initial assessment and severity rating |
| 7 days | Status update on fix progress |
| 30 days | Target for patch release (critical/high) |
| 90 days | Target for patch release (medium/low) |

### Coordinated Disclosure

We request a 90-day disclosure window before public disclosure. We will:
- Credit you in security advisories (unless you prefer anonymity)
- Notify you before public disclosure
- Work with you on timing if needed

---

## Security Considerations / Threat Model

### What Notary Protects Against

| Threat | Protection |
|--------|------------|
| **Receipt tampering** | Cryptographic signatures detect any modification |
| **Spoofed receipts** | Signature verification requires valid signing key |
| **Chain manipulation** | Hash linkage detects inserted/removed receipts |
| **Replay attacks** | Timestamps and sequence numbers prevent replay |
| **Signer impersonation** | Key-based authentication of signer identity |

### What Notary Does NOT Protect Against

| Threat | Why |
|--------|-----|
| **Lying signers** | A valid signature doesn't prove the event actually happened |
| **Key compromise** | If signing key is stolen, attacker can create valid receipts |
| **Insider threats** | Authorized signers can create fraudulent but valid receipts |
| **Network interception** | Notary verifies receipts, not transport security (use TLS) |
| **Availability attacks** | DoS protection is infrastructure-level, not in core |

### Trust Boundaries

**Verification proves:**
- Receipt content matches what was signed (integrity)
- Signature was created by holder of the signing key (authenticity)
- Chain links are cryptographically consistent (if present)

**Verification does NOT prove:**
- The underlying event actually occurred
- The signer was authorized to perform the action
- All events were recorded (completeness)
- Legal non-repudiation (requires additional procedures)

---

## Known Sensitive Areas

### Canonicalization / Signing

The verification process is sensitive to:
- Field ordering during hash computation
- Whitespace normalization
- Number representation
- Null/undefined handling

**Mitigation:** Strict canonicalization rules documented in RECEIPT_SPEC.md

### Key Parsing / Algorithm Handling

- Ed25519 key parsing must validate curve points
- HMAC key derivation uses standard HKDF
- Algorithm identifiers must be exact matches (no aliases)

**Mitigation:** Use well-tested cryptographic libraries (cryptography, tweetnacl)

### Webhooks

Webhook endpoints should:
- Verify request signatures (HMAC of body)
- Implement replay protection (timestamp + nonce)
- Use HTTPS only
- Timeout after reasonable period

### Auth / Session Management

- JWT tokens with short expiration (1 hour)
- Refresh tokens stored securely (httpOnly cookies)
- Session invalidation on password change
- Rate limiting on auth endpoints

---

## Data Handling & Privacy (Hosted Demo)

### What We Log

| Data | Retention | Purpose |
|------|-----------|---------|
| Receipt hashes | 30 days | Verification history |
| Verification results | 30 days | Audit trail |
| IP addresses | 7 days | Rate limiting, abuse prevention |
| Error details | 30 days | Debugging |

### What We Do NOT Log

- Full receipt content (only hashes)
- Signing keys or secrets
- User passwords (only bcrypt hashes)
- API key values (only hashed prefixes)

### User Guidance

**Do not paste into the verifier:**
- Private keys or secrets
- Sensitive business data
- Personally identifiable information (PII)
- Credentials or tokens

The hosted demo is provided as-is. For sensitive use cases, self-host.

---

## Hardening Recommendations (Self-Hosting)

### Transport Security

```nginx
# Enforce HTTPS
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
}
```

### Security Headers

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Rate Limiting

```nginx
# Limit verification requests
limit_req_zone $binary_remote_addr zone=verify:10m rate=10r/s;

location /v1/notary/verify {
    limit_req zone=verify burst=20 nodelay;
    proxy_pass http://backend;
}
```

### CORS Configuration

```python
# Only allow specific origins
CORS_ORIGINS = [
    "https://your-domain.com",
    "https://app.your-domain.com",
]
```

### Secret Management

| Secret | Storage | Rotation |
|--------|---------|----------|
| `NOTARY_SECRET_KEY` | Environment variable or secrets manager | Annually or on compromise |
| JWT signing key | Environment variable | Quarterly |
| Database credentials | Secrets manager (Vault, AWS Secrets) | On access changes |

### Audit Logging

- Log all verification attempts (hash only, not content)
- Log admin actions (key rotation, config changes)
- Log authentication events (login, logout, failures)
- Store logs separately from application data
- Retain for compliance period (typically 1-7 years)

---

## Dependency / Supply Chain Security

### Dependency Updates

- Automated vulnerability scanning via Dependabot/Snyk
- Weekly dependency update reviews
- Security patches applied within 72 hours for critical CVEs

### Lockfiles

All package managers use lockfiles:
- `package-lock.json` for npm
- `poetry.lock` for Python

**Never commit without lockfile updates.**

### Build Verification

- CI builds from clean environment
- No external script execution during build
- Source maps disabled in production

### SBOM (Software Bill of Materials)

Generate SBOM for compliance:

```bash
# npm
npm sbom --sbom-format cyclonedx

# Python
pip-audit --format cyclonedx
```

---

## Security Contacts

| Role | Contact |
|------|---------|
| Security Reports | security@agenttownsquare.com |
| PGP Key | [keys.openpgp.org/...](https://keys.openpgp.org) |
| Bug Bounty | Coming soon |

---

## Credits

We gratefully acknowledge security researchers who have helped improve Notary:

*No reports yet. Be the first!*

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-31 | Initial SECURITY.md created |

---

*Last updated: 2026-01-31*
