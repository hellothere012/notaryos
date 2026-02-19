package notary

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// CounterfactualClient provides operations for counterfactual receipts
// (proofs of non-action). Access via client.Counterfactual().
type CounterfactualClient struct {
	client *Client
}

// CounterfactualIssueOptions holds parameters for issuing v1 counterfactual receipts.
type CounterfactualIssueOptions struct {
	ActionNotTaken       string         `json:"action_not_taken"`
	CapabilityProof      map[string]any `json:"capability_proof"`
	OpportunityContext   map[string]any `json:"opportunity_context"`
	DecisionReason       string         `json:"decision_reason"`
	DeclinationReason    string         `json:"declination_reason,omitempty"`
	ProvenanceRefs       []string       `json:"provenance_refs,omitempty"`
	ValidityWindowMinutes int           `json:"validity_window_minutes,omitempty"`
}

// CounterfactualCommitOptions extends CounterfactualIssueOptions with commit-reveal parameters.
type CounterfactualCommitOptions struct {
	CounterfactualIssueOptions
	MinRevealDelaySeconds  int `json:"min_reveal_delay_seconds,omitempty"`
	MaxRevealWindowSeconds int `json:"max_reveal_window_seconds,omitempty"`
}

// Issue creates a v1 counterfactual receipt (proof of non-action).
func (c *CounterfactualClient) Issue(opts CounterfactualIssueOptions) (map[string]any, error) {
	if opts.DeclinationReason == "" {
		opts.DeclinationReason = "unknown"
	}
	if opts.ValidityWindowMinutes == 0 {
		opts.ValidityWindowMinutes = 60
	}

	body := map[string]any{
		"action_not_taken":       opts.ActionNotTaken,
		"capability_proof":       opts.CapabilityProof,
		"opportunity_context":    opts.OpportunityContext,
		"decision_reason":        opts.DecisionReason,
		"declination_reason":     opts.DeclinationReason,
		"validity_window_minutes": opts.ValidityWindowMinutes,
	}
	if len(opts.ProvenanceRefs) > 0 {
		body["provenance_refs"] = opts.ProvenanceRefs
	}

	respBody, err := c.client.doRequest("POST", "/counterfactual/issue", body)
	if err != nil {
		return nil, err
	}

	var result map[string]any
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, &NotaryError{Message: "failed to parse response", Code: "ERR_PARSE"}
	}
	return result, nil
}

// Get retrieves/verifies a counterfactual receipt by hash (public endpoint).
func (c *CounterfactualClient) Get(receiptHash string) (map[string]any, error) {
	return c.publicGet(fmt.Sprintf("/v1/notary/counterfactual/r/%s", receiptHash))
}

// ListByAgent returns counterfactual receipts for a specific agent (public).
func (c *CounterfactualClient) ListByAgent(agentID string, limit, offset int) (map[string]any, error) {
	if limit == 0 {
		limit = 50
	}
	return c.publicGet(fmt.Sprintf(
		"/v1/notary/counterfactual/agent/%s?limit=%d&offset=%d",
		agentID, limit, offset,
	))
}

// Commit creates a v2 counterfactual receipt (Phase 1 of commit-reveal).
func (c *CounterfactualClient) Commit(opts CounterfactualCommitOptions) (map[string]any, error) {
	if opts.DeclinationReason == "" {
		opts.DeclinationReason = "unknown"
	}
	if opts.ValidityWindowMinutes == 0 {
		opts.ValidityWindowMinutes = 60
	}
	if opts.MinRevealDelaySeconds == 0 {
		opts.MinRevealDelaySeconds = 300
	}
	if opts.MaxRevealWindowSeconds == 0 {
		opts.MaxRevealWindowSeconds = 86400
	}

	body := map[string]any{
		"action_not_taken":         opts.ActionNotTaken,
		"capability_proof":         opts.CapabilityProof,
		"opportunity_context":      opts.OpportunityContext,
		"decision_reason":          opts.DecisionReason,
		"declination_reason":       opts.DeclinationReason,
		"validity_window_minutes":  opts.ValidityWindowMinutes,
		"min_reveal_delay_seconds": opts.MinRevealDelaySeconds,
		"max_reveal_window_seconds": opts.MaxRevealWindowSeconds,
	}
	if len(opts.ProvenanceRefs) > 0 {
		body["provenance_refs"] = opts.ProvenanceRefs
	}

	respBody, err := c.client.doRequest("POST", "/counterfactual/commit", body)
	if err != nil {
		return nil, err
	}

	var result map[string]any
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, &NotaryError{Message: "failed to parse response", Code: "ERR_PARSE"}
	}
	return result, nil
}

// Reveal submits the plaintext decision reason (Phase 2 of commit-reveal).
func (c *CounterfactualClient) Reveal(receiptHash, decisionReasonPlaintext string) (map[string]any, error) {
	body := map[string]any{
		"receipt_hash":              receiptHash,
		"decision_reason_plaintext": decisionReasonPlaintext,
	}

	respBody, err := c.client.doRequest("POST", "/counterfactual/reveal", body)
	if err != nil {
		return nil, err
	}

	var result map[string]any
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, &NotaryError{Message: "failed to parse response", Code: "ERR_PARSE"}
	}
	return result, nil
}

// CommitStatus checks the commit-reveal lifecycle status (public).
func (c *CounterfactualClient) CommitStatus(receiptHash string) (map[string]any, error) {
	return c.publicGet(fmt.Sprintf("/v1/notary/counterfactual/commit-status/%s", receiptHash))
}

// Corroborate counter-signs a counterfactual receipt (corroboration).
func (c *CounterfactualClient) Corroborate(receiptHash string, signals []string) (map[string]any, error) {
	body := map[string]any{
		"receipt_hash":          receiptHash,
		"corroboration_signals": signals,
	}

	respBody, err := c.client.doRequest("POST", "/counterfactual/corroborate", body)
	if err != nil {
		return nil, err
	}

	var result map[string]any
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, &NotaryError{Message: "failed to parse response", Code: "ERR_PARSE"}
	}
	return result, nil
}

// Certificate generates a compliance certificate for a counterfactual receipt (public).
func (c *CounterfactualClient) Certificate(receiptHash, format string) (map[string]any, error) {
	if format == "" {
		format = "markdown"
	}
	return c.publicGet(fmt.Sprintf(
		"/v1/notary/counterfactual/r/%s/certificate?format=%s",
		receiptHash, format,
	))
}

// VerifyChain verifies counterfactual chain continuity for an agent (public).
func (c *CounterfactualClient) VerifyChain(agentID string) (map[string]any, error) {
	return c.publicGet(fmt.Sprintf("/v1/notary/counterfactual/chain/%s/verify", agentID))
}

// publicGet performs a public GET request (no API key).
func (c *CounterfactualClient) publicGet(path string) (map[string]any, error) {
	url := c.client.baseURL + path

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, &NotaryError{Message: fmt.Sprintf("failed to create request: %v", err), Code: "ERR_REQUEST"}
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "notary-go-sdk/"+SDKVersion)

	resp, err := c.client.httpClient.Do(req)
	if err != nil {
		return nil, &NotaryError{Message: fmt.Sprintf("connection failed: %v", err), Code: "ERR_CONNECTION"}
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, &NotaryError{Message: "failed to read response", Code: "ERR_READ"}
	}

	if resp.StatusCode == 404 {
		return map[string]any{"found": false}, nil
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, &NotaryError{Message: string(respBody), Code: "ERR_REQUEST", Status: resp.StatusCode}
	}

	var result map[string]any
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, &NotaryError{Message: "failed to parse response", Code: "ERR_PARSE"}
	}
	return result, nil
}
