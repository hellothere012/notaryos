// Package notary provides a Go SDK for NotaryOS - Cryptographic Receipt Verification in 3 Lines.
//
// Usage:
//
//	client := notary.NewClient("notary_live_xxx", nil)
//	receipt, err := client.Issue("my_action", map[string]any{"key": "value"})
//	result, err := client.Verify(receipt)
//
// Zero external dependencies - uses only net/http from the standard library.
package notary

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"sort"
	"strings"
	"time"
)

const (
	// SDKVersion is the current SDK version.
	SDKVersion = "2.0.0"

	// DefaultBaseURL is the default NotaryOS API endpoint.
	DefaultBaseURL = "https://api.agenttownsquare.com"

	// DefaultTimeout is the default request timeout.
	DefaultTimeout = 30 * time.Second

	// DefaultMaxRetries is the default number of retry attempts.
	DefaultMaxRetries = 2
)

// Error code constants mirroring the backend API.
const (
	ErrReceiptNotFound     = "ERR_RECEIPT_NOT_FOUND"
	ErrInvalidSignature    = "ERR_INVALID_SIGNATURE"
	ErrInvalidStructure    = "ERR_INVALID_STRUCTURE"
	ErrInvalidTimestamp    = "ERR_INVALID_TIMESTAMP"
	ErrUnknownSigner       = "ERR_UNKNOWN_SIGNER"
	ErrUnsupportedAlgorithm = "ERR_UNSUPPORTED_ALGORITHM"
	ErrChainBroken         = "ERR_CHAIN_BROKEN"
	ErrChainMissing        = "ERR_CHAIN_MISSING"
	ErrPayloadTooLarge     = "ERR_PAYLOAD_TOO_LARGE"
	ErrRateLimitExceeded   = "ERR_RATE_LIMIT_EXCEEDED"
	ErrInvalidAPIKey       = "ERR_INVALID_API_KEY"
	ErrInsufficientScope   = "ERR_INSUFFICIENT_SCOPE"
	ErrValidationFailed    = "ERR_VALIDATION_FAILED"
	ErrInternalError       = "ERR_INTERNAL_ERROR"
	ErrDatabaseError       = "ERR_DATABASE_ERROR"
	ErrSigningError        = "ERR_SIGNING_ERROR"
)

// Config holds client configuration options.
type Config struct {
	BaseURL    string
	Timeout    time.Duration
	MaxRetries int
}

// Receipt represents a signed Notary receipt.
type Receipt struct {
	ReceiptID           string         `json:"receipt_id"`
	Timestamp           string         `json:"timestamp"`
	AgentID             string         `json:"agent_id"`
	ActionType          string         `json:"action_type"`
	PayloadHash         string         `json:"payload_hash"`
	Signature           string         `json:"signature"`
	SignatureType       string         `json:"signature_type"`
	KeyID               string         `json:"key_id"`
	KID                 string         `json:"kid,omitempty"`
	Alg                 string         `json:"alg,omitempty"`
	SchemaVersion       string         `json:"schema_version,omitempty"`
	ChainSequence       *int           `json:"chain_sequence,omitempty"`
	PreviousReceiptHash *string        `json:"previous_receipt_hash,omitempty"`
	ReceiptHash         string         `json:"receipt_hash,omitempty"`
	VerifyURL           string         `json:"verify_url,omitempty"`
	Raw                 map[string]any `json:"-"`
}

// VerificationResult holds the result of receipt verification.
type VerificationResult struct {
	Valid       bool           `json:"valid"`
	SignatureOK bool           `json:"signature_ok"`
	StructureOK bool           `json:"structure_ok"`
	ChainOK     *bool          `json:"chain_ok,omitempty"`
	Reason      string         `json:"reason"`
	Details     map[string]any `json:"details"`
	FromCache   bool           `json:"from_cache,omitempty"`
}

// ServiceStatus holds the Notary service health info.
type ServiceStatus struct {
	Status        string   `json:"status"`
	SignatureType string   `json:"signature_type"`
	KeyID         string   `json:"key_id"`
	HasPublicKey  bool     `json:"has_public_key"`
	Capabilities  []string `json:"capabilities"`
	Timestamp     string   `json:"timestamp"`
}

// PublicKeyInfo holds the public key for offline verification.
type PublicKeyInfo struct {
	KeyID            string `json:"key_id"`
	SignatureType    string `json:"signature_type"`
	PublicKeyPEM     string `json:"public_key_pem"`
	VerificationNote string `json:"verification_note"`
}

// AgentInfo holds authenticated agent details.
type AgentInfo struct {
	AgentID          string   `json:"agent_id"`
	AgentName        string   `json:"agent_name"`
	Tier             string   `json:"tier"`
	Scopes           []string `json:"scopes"`
	RateLimitPerMin  int      `json:"rate_limit_per_minute"`
}

// NotaryError represents an API error.
type NotaryError struct {
	Message string
	Code    string
	Status  int
	Details map[string]any
}

func (e *NotaryError) Error() string {
	if e.Code != "" {
		return fmt.Sprintf("NotaryError [%s] (HTTP %d): %s", e.Code, e.Status, e.Message)
	}
	return fmt.Sprintf("NotaryError (HTTP %d): %s", e.Status, e.Message)
}

// IssueOptions holds optional parameters for issuing receipts.
type IssueOptions struct {
	PreviousReceiptHash string
	Metadata            map[string]any
}

// Client is the NotaryOS API client.
type Client struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
	maxRetries int
}

// NewClient creates a new Notary client.
//
// Pass nil for config to use defaults.
func NewClient(apiKey string, config *Config) (*Client, error) {
	if !strings.HasPrefix(apiKey, "notary_live_") && !strings.HasPrefix(apiKey, "notary_test_") {
		return nil, &NotaryError{
			Message: "Invalid API key format. Keys must start with notary_live_ or notary_test_",
			Code:    "ERR_INVALID_API_KEY",
			Status:  0,
		}
	}

	baseURL := DefaultBaseURL
	timeout := DefaultTimeout
	maxRetries := DefaultMaxRetries

	if config != nil {
		if config.BaseURL != "" {
			baseURL = strings.TrimRight(config.BaseURL, "/")
		}
		if config.Timeout > 0 {
			timeout = config.Timeout
		}
		if config.MaxRetries >= 0 {
			maxRetries = config.MaxRetries
		}
	}

	return &Client{
		apiKey:  apiKey,
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
		maxRetries: maxRetries,
	}, nil
}

func (c *Client) doRequest(method, path string, body any) ([]byte, error) {
	url := c.baseURL + "/v1/notary" + path

	var bodyReader io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return nil, &NotaryError{Message: "failed to marshal request body", Code: "ERR_MARSHAL"}
		}
		bodyReader = bytes.NewReader(data)
	}

	var lastErr error
	for attempt := 0; attempt <= c.maxRetries; attempt++ {
		// Reset body reader for retries
		if body != nil {
			data, _ := json.Marshal(body)
			bodyReader = bytes.NewReader(data)
		}

		req, err := http.NewRequest(method, url, bodyReader)
		if err != nil {
			return nil, &NotaryError{Message: fmt.Sprintf("failed to create request: %v", err), Code: "ERR_REQUEST"}
		}

		req.Header.Set("X-API-Key", c.apiKey)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("User-Agent", "notary-go-sdk/"+SDKVersion)

		resp, err := c.httpClient.Do(req)
		if err != nil {
			if attempt < c.maxRetries {
				time.Sleep(time.Duration(math.Pow(2, float64(attempt))) * time.Second)
				lastErr = err
				continue
			}
			return nil, &NotaryError{
				Message: fmt.Sprintf("connection failed: %v", err),
				Code:    "ERR_CONNECTION",
			}
		}

		respBody, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return nil, &NotaryError{Message: "failed to read response", Code: "ERR_READ"}
		}

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			return respBody, nil
		}

		// Parse error
		var errResp struct {
			Error struct {
				Code    string         `json:"code"`
				Message string         `json:"message"`
				Details map[string]any `json:"details"`
			} `json:"error"`
		}
		_ = json.Unmarshal(respBody, &errResp)
		errMsg := errResp.Error.Message
		if errMsg == "" {
			errMsg = string(respBody)
		}
		errCode := errResp.Error.Code

		switch {
		case resp.StatusCode == 401:
			return nil, &NotaryError{Message: errMsg, Code: errCode, Status: 401}
		case resp.StatusCode == 429:
			if attempt < c.maxRetries {
				time.Sleep(5 * time.Second)
				continue
			}
			return nil, &NotaryError{Message: errMsg, Code: "ERR_RATE_LIMIT_EXCEEDED", Status: 429}
		case resp.StatusCode == 422:
			return nil, &NotaryError{Message: errMsg, Code: errCode, Status: 422, Details: errResp.Error.Details}
		case resp.StatusCode >= 500:
			if attempt < c.maxRetries {
				time.Sleep(time.Duration(math.Pow(2, float64(attempt))) * time.Second)
				lastErr = &NotaryError{Message: errMsg, Code: errCode, Status: resp.StatusCode}
				continue
			}
			return nil, &NotaryError{Message: errMsg, Code: errCode, Status: resp.StatusCode}
		default:
			return nil, &NotaryError{Message: errMsg, Code: errCode, Status: resp.StatusCode, Details: errResp.Error.Details}
		}
	}

	if lastErr != nil {
		return nil, &NotaryError{Message: fmt.Sprintf("max retries exceeded: %v", lastErr), Code: "ERR_MAX_RETRIES"}
	}
	return nil, &NotaryError{Message: "request failed", Code: "ERR_UNKNOWN"}
}

// Issue creates a signed receipt for an action.
//
//	receipt, err := client.Issue("my_action", map[string]any{"key": "value"})
func (c *Client) Issue(actionType string, payload map[string]any, opts ...IssueOptions) (*Receipt, error) {
	body := map[string]any{
		"action_type": actionType,
		"payload":     payload,
	}
	if len(opts) > 0 {
		if opts[0].PreviousReceiptHash != "" {
			body["previous_receipt_hash"] = opts[0].PreviousReceiptHash
		}
		if opts[0].Metadata != nil {
			body["metadata"] = opts[0].Metadata
		}
	}

	respBody, err := c.doRequest("POST", "/issue", body)
	if err != nil {
		return nil, err
	}

	var resp struct {
		Receipt       map[string]any `json:"receipt"`
		ReceiptHash   string         `json:"receipt_hash"`
		VerifyURL     string         `json:"verify_url"`
		ChainPosition *int           `json:"chain_position"`
	}
	if err := json.Unmarshal(respBody, &resp); err != nil {
		return nil, &NotaryError{Message: "failed to parse response", Code: "ERR_PARSE"}
	}

	// Re-marshal the receipt portion and unmarshal into Receipt struct
	receiptBytes, _ := json.Marshal(resp.Receipt)
	var receipt Receipt
	if err := json.Unmarshal(receiptBytes, &receipt); err != nil {
		return nil, &NotaryError{Message: "failed to parse receipt", Code: "ERR_PARSE"}
	}

	receipt.ReceiptHash = resp.ReceiptHash
	receipt.VerifyURL = resp.VerifyURL
	receipt.ChainSequence = resp.ChainPosition
	receipt.Raw = resp.Receipt

	return &receipt, nil
}

// Verify checks a receipt's signature and integrity.
//
//	result, err := client.Verify(receipt)
//	fmt.Println(result.Valid)
func (c *Client) Verify(receipt *Receipt) (*VerificationResult, error) {
	receiptMap := receipt.Raw
	if receiptMap == nil {
		data, _ := json.Marshal(receipt)
		_ = json.Unmarshal(data, &receiptMap)
	}

	respBody, err := c.doRequest("POST", "/verify", map[string]any{"receipt": receiptMap})
	if err != nil {
		return nil, err
	}

	var result VerificationResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, &NotaryError{Message: "failed to parse verification result", Code: "ERR_PARSE"}
	}

	return &result, nil
}

// VerifyByID verifies a receipt by its ID (server-side lookup).
func (c *Client) VerifyByID(receiptID string) (*VerificationResult, error) {
	respBody, err := c.doRequest("POST", "/verify", map[string]any{"receipt_id": receiptID})
	if err != nil {
		return nil, err
	}

	var result VerificationResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, &NotaryError{Message: "failed to parse verification result", Code: "ERR_PARSE"}
	}

	return &result, nil
}

// Status returns the Notary service health info.
//
//	status, err := client.Status()
//	fmt.Println(status.Status) // "active"
func (c *Client) Status() (*ServiceStatus, error) {
	respBody, err := c.doRequest("GET", "/status", nil)
	if err != nil {
		return nil, err
	}

	var status ServiceStatus
	if err := json.Unmarshal(respBody, &status); err != nil {
		return nil, &NotaryError{Message: "failed to parse status", Code: "ERR_PARSE"}
	}

	return &status, nil
}

// PublicKey returns the public key for offline verification.
func (c *Client) PublicKey() (*PublicKeyInfo, error) {
	respBody, err := c.doRequest("GET", "/public-key", nil)
	if err != nil {
		return nil, err
	}

	var info PublicKeyInfo
	if err := json.Unmarshal(respBody, &info); err != nil {
		return nil, &NotaryError{Message: "failed to parse public key", Code: "ERR_PARSE"}
	}

	return &info, nil
}

// Me returns info about the authenticated agent.
func (c *Client) Me() (*AgentInfo, error) {
	respBody, err := c.doRequest("GET", "/agents/me", nil)
	if err != nil {
		return nil, err
	}

	var info AgentInfo
	if err := json.Unmarshal(respBody, &info); err != nil {
		return nil, &NotaryError{Message: "failed to parse agent info", Code: "ERR_PARSE"}
	}

	return &info, nil
}

// LookupResult holds the result of a receipt lookup by hash.
type LookupResult struct {
	Found        bool                `json:"found"`
	Receipt      map[string]any      `json:"receipt"`
	Verification *VerificationResult `json:"verification"`
	Meta         map[string]any      `json:"meta"`
}

// Lookup looks up a receipt by hash (public endpoint).
//
//	result, err := client.Lookup("abc123def456...")
//	if result.Found && result.Verification.Valid {
//	    fmt.Println("Receipt is valid!")
//	}
func (c *Client) Lookup(receiptHash string) (*LookupResult, error) {
	url := c.baseURL + "/v1/notary/r/" + receiptHash

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, &NotaryError{Message: fmt.Sprintf("failed to create request: %v", err), Code: "ERR_REQUEST"}
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "notary-go-sdk/"+SDKVersion)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, &NotaryError{
			Message: fmt.Sprintf("connection failed: %v", err),
			Code:    "ERR_CONNECTION",
		}
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, &NotaryError{Message: "failed to read response", Code: "ERR_READ"}
	}

	if resp.StatusCode == 404 {
		return &LookupResult{Found: false}, nil
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, &NotaryError{
			Message: string(respBody),
			Code:    "ERR_LOOKUP",
			Status:  resp.StatusCode,
		}
	}

	var result LookupResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, &NotaryError{Message: "failed to parse lookup result", Code: "ERR_PARSE"}
	}

	return &result, nil
}

// Counterfactual returns a sub-client for counterfactual receipt operations.
func (c *Client) Counterfactual() *CounterfactualClient {
	return &CounterfactualClient{client: c}
}

// ComputeHash computes SHA-256 of a payload matching server-side hashing.
// Uses sorted-key JSON serialization for deterministic output.
func ComputeHash(payload map[string]any) string {
	// Sort keys for deterministic serialization
	keys := make([]string, 0, len(payload))
	for k := range payload {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// Build sorted JSON manually with compact separators
	data, _ := json.Marshal(payload)
	// json.Marshal already uses compact format, but we need sorted keys
	// Re-marshal with sorted keys by building ordered map
	ordered := make([]byte, 0, len(data))
	ordered = append(ordered, '{')
	for i, k := range keys {
		if i > 0 {
			ordered = append(ordered, ',')
		}
		keyBytes, _ := json.Marshal(k)
		valBytes, _ := json.Marshal(payload[k])
		ordered = append(ordered, keyBytes...)
		ordered = append(ordered, ':')
		ordered = append(ordered, valBytes...)
	}
	ordered = append(ordered, '}')

	hash := sha256.Sum256(ordered)
	return hex.EncodeToString(hash[:])
}

// HistoryOptions holds parameters for receipt history queries.
type HistoryOptions struct {
	Page       int
	PageSize   int
	Status     string
	Search     string
	StartDate  string
	EndDate    string
	ClerkToken string
}

// HistoryResult holds paginated receipt history.
type HistoryResult struct {
	Items      []map[string]any `json:"items"`
	Total      int              `json:"total"`
	TotalPages int              `json:"totalPages"`
	Page       int              `json:"page"`
	PageSize   int              `json:"pageSize"`
}

// History returns paginated receipt history (requires Clerk JWT).
func (c *Client) History(opts HistoryOptions) (*HistoryResult, error) {
	if opts.Page == 0 {
		opts.Page = 1
	}
	if opts.PageSize == 0 {
		opts.PageSize = 10
	}

	url := fmt.Sprintf("%s/v1/notary/history?page=%d&page_size=%d",
		c.baseURL, opts.Page, opts.PageSize)
	if opts.Status != "" {
		url += "&status=" + opts.Status
	}
	if opts.Search != "" {
		url += "&search=" + opts.Search
	}
	if opts.StartDate != "" {
		url += "&start_date=" + opts.StartDate
	}
	if opts.EndDate != "" {
		url += "&end_date=" + opts.EndDate
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, &NotaryError{Message: fmt.Sprintf("failed to create request: %v", err), Code: "ERR_REQUEST"}
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "notary-go-sdk/"+SDKVersion)
	if opts.ClerkToken != "" {
		req.Header.Set("Authorization", "Bearer "+opts.ClerkToken)
	} else {
		req.Header.Set("X-API-Key", c.apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, &NotaryError{Message: fmt.Sprintf("connection failed: %v", err), Code: "ERR_CONNECTION"}
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, &NotaryError{Message: "failed to read response", Code: "ERR_READ"}
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, &NotaryError{Message: string(body), Code: "ERR_HISTORY", Status: resp.StatusCode}
	}

	var result HistoryResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, &NotaryError{Message: "failed to parse history", Code: "ERR_PARSE"}
	}
	return &result, nil
}

// Provenance returns the provenance DAG report for a receipt (public).
func (c *Client) Provenance(receiptHash string) (map[string]any, error) {
	url := c.baseURL + "/v1/notary/r/" + receiptHash + "/provenance"

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, &NotaryError{Message: fmt.Sprintf("failed to create request: %v", err), Code: "ERR_REQUEST"}
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "notary-go-sdk/"+SDKVersion)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, &NotaryError{Message: fmt.Sprintf("connection failed: %v", err), Code: "ERR_CONNECTION"}
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, &NotaryError{Message: "failed to read response", Code: "ERR_READ"}
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, &NotaryError{Message: string(body), Code: "ERR_PROVENANCE", Status: resp.StatusCode}
	}

	var result map[string]any
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, &NotaryError{Message: "failed to parse provenance", Code: "ERR_PARSE"}
	}
	return result, nil
}

// VerifyReceipt is a convenience function for quick verification without an API key.
// Uses the public /verify endpoint.
func VerifyReceipt(receipt map[string]any, baseURL string) (bool, error) {
	if baseURL == "" {
		baseURL = DefaultBaseURL
	}

	data, err := json.Marshal(map[string]any{"receipt": receipt})
	if err != nil {
		return false, err
	}

	resp, err := http.Post(
		strings.TrimRight(baseURL, "/")+"/v1/notary/verify",
		"application/json",
		bytes.NewReader(data),
	)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return false, nil
	}

	var result struct {
		Valid bool `json:"valid"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false, err
	}

	return result.Valid, nil
}
