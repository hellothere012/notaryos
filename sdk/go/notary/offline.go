package notary

import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// OfflineVerificationResult holds the result of offline verification.
type OfflineVerificationResult struct {
	Valid       bool   `json:"valid"`
	SignatureOK bool   `json:"signature_ok"`
	StructureOK bool   `json:"structure_ok"`
	Reason      string `json:"reason"`
	KeyID       string `json:"key_id"`
}

// OfflineVerifier verifies Notary receipt signatures using cached Ed25519 public keys.
// It fetches keys from JWKS and performs all verification locally.
type OfflineVerifier struct {
	keys map[string]ed25519.PublicKey // kid -> 32-byte public key
}

// JWK represents a JSON Web Key (Ed25519 OKP).
type jwkKey struct {
	Kty    string `json:"kty"`
	Crv    string `json:"crv"`
	Alg    string `json:"alg"`
	Use    string `json:"use"`
	Kid    string `json:"kid"`
	X      string `json:"x"`
	Status string `json:"status,omitempty"`
}

type jwksResponse struct {
	Keys []jwkKey `json:"keys"`
}

// NewOfflineVerifier creates an OfflineVerifier by fetching JWKS from the server.
//
//	verifier, err := notary.NewOfflineVerifier("")
//	result := verifier.Verify(receiptMap)
//	fmt.Println(result.Valid)
func NewOfflineVerifier(baseURL string) (*OfflineVerifier, error) {
	if baseURL == "" {
		baseURL = DefaultBaseURL
	}

	url := strings.TrimRight(baseURL, "/") + "/.well-known/jwks.json"

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("JWKS fetch failed with status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read JWKS response: %w", err)
	}

	var jwks jwksResponse
	if err := json.Unmarshal(body, &jwks); err != nil {
		return nil, fmt.Errorf("failed to parse JWKS: %w", err)
	}

	keys := make(map[string]ed25519.PublicKey)
	for _, jwk := range jwks.Keys {
		if jwk.Kty != "OKP" || jwk.Crv != "Ed25519" {
			continue
		}
		if jwk.Kid == "" || jwk.X == "" {
			continue
		}

		// Decode base64url-encoded public key
		rawKey, err := base64.RawURLEncoding.DecodeString(jwk.X)
		if err != nil {
			// Try with padding
			rawKey, err = base64.URLEncoding.DecodeString(jwk.X)
			if err != nil {
				continue
			}
		}

		if len(rawKey) == ed25519.PublicKeySize {
			keys[jwk.Kid] = ed25519.PublicKey(rawKey)
		}
	}

	if len(keys) == 0 {
		return nil, fmt.Errorf("no Ed25519 keys found in JWKS response")
	}

	return &OfflineVerifier{keys: keys}, nil
}

// Verify checks a receipt's signature offline using cached Ed25519 keys.
func (v *OfflineVerifier) Verify(receipt map[string]any) *OfflineVerificationResult {
	// Check structure
	required := []string{
		"receipt_id", "timestamp", "agent_id", "action_type",
		"payload_hash", "signature", "signature_type",
	}
	var missing []string
	for _, field := range required {
		val, ok := receipt[field]
		if !ok || val == nil || val == "" {
			missing = append(missing, field)
		}
	}
	if len(missing) > 0 {
		return &OfflineVerificationResult{
			Valid:       false,
			SignatureOK: false,
			StructureOK: false,
			Reason:      fmt.Sprintf("Missing required fields: %s", strings.Join(missing, ", ")),
		}
	}

	// Find the key
	kid := getString(receipt, "kid")
	if kid == "" {
		kid = getString(receipt, "key_id")
	}

	pubKey, found := v.keys[kid]
	if !found {
		// Try prefix match
		for storedKid, storedKey := range v.keys {
			if len(kid) >= 8 && len(storedKid) >= 8 {
				if strings.HasPrefix(storedKid, kid[:8]) || strings.HasPrefix(kid, storedKid[:8]) {
					pubKey = storedKey
					kid = storedKid
					found = true
					break
				}
			}
		}
	}

	if !found {
		return &OfflineVerificationResult{
			Valid:       false,
			SignatureOK: false,
			StructureOK: true,
			Reason:      fmt.Sprintf("Unknown key ID: %s", kid),
			KeyID:       kid,
		}
	}

	// Reconstruct canonical message
	canonical := buildCanonical(receipt)

	// Decode signature
	sigStr := getString(receipt, "signature")
	sigBytes, err := base64.StdEncoding.DecodeString(sigStr)
	if err != nil {
		// Try URL-safe base64
		sigBytes, err = base64.RawURLEncoding.DecodeString(sigStr)
		if err != nil {
			return &OfflineVerificationResult{
				Valid:       false,
				SignatureOK: false,
				StructureOK: true,
				Reason:      fmt.Sprintf("Failed to decode signature: %v", err),
				KeyID:       kid,
			}
		}
	}

	// Verify Ed25519 signature
	valid := ed25519.Verify(pubKey, []byte(canonical), sigBytes)

	reason := "Signature verified locally"
	if !valid {
		reason = "Signature mismatch"
	}

	return &OfflineVerificationResult{
		Valid:       valid,
		SignatureOK: valid,
		StructureOK: true,
		Reason:      reason,
		KeyID:       kid,
	}
}

// KeyIDs returns all cached key IDs.
func (v *OfflineVerifier) KeyIDs() []string {
	ids := make([]string, 0, len(v.keys))
	for kid := range v.keys {
		ids = append(ids, kid)
	}
	return ids
}

func buildCanonical(receipt map[string]any) string {
	prevHash := getString(receipt, "previous_receipt_hash")
	if prevHash == "" {
		prevHash = "GENESIS"
	}

	parts := []string{
		getString(receipt, "receipt_id"),
		getString(receipt, "timestamp"),
		getString(receipt, "agent_id"),
		"notary",
		getString(receipt, "action_type"),
		getString(receipt, "payload_hash"),
		prevHash,
	}
	return strings.Join(parts, "|")
}

func getString(m map[string]any, key string) string {
	v, ok := m[key]
	if !ok || v == nil {
		return ""
	}
	s, ok := v.(string)
	if !ok {
		return fmt.Sprintf("%v", v)
	}
	return s
}
