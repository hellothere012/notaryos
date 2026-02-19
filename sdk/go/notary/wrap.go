package notary

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// WrapConfig configures auto-receipting behavior.
type WrapConfig struct {
	// Mode: "all" (default), "errors_only", or "sample"
	Mode string
	// SampleRate for "sample" mode (0.0 - 1.0, default 1.0)
	SampleRate float64
	// FireAndForget sends receipts in a background goroutine (default true)
	FireAndForget bool
	// MaxPayloadBytes limits the receipt payload size (default 4096)
	MaxPayloadBytes int
	// DryRun logs instead of issuing receipts (default false)
	DryRun bool
}

// ReceiptMiddleware returns an HTTP middleware that auto-receipts requests.
// This is the idiomatic Go approach for auto-receipting HTTP handlers.
//
//	handler := notary.ReceiptMiddleware(client, next, nil)
//	http.ListenAndServe(":8080", handler)
type receiptQueueItem struct {
	actionType string
	payload    map[string]any
	prevHash   string
}

// ReceiptQueue manages background receipt issuance.
type ReceiptQueue struct {
	client   *Client
	ch       chan receiptQueueItem
	lastHash string
	mu       sync.Mutex
	issued   int
	failed   int
	dropped  int
	done     chan struct{}
	once     sync.Once
}

// NewReceiptQueue creates a background receipt queue.
func NewReceiptQueue(client *Client, bufSize int) *ReceiptQueue {
	if bufSize <= 0 {
		bufSize = 1000
	}
	q := &ReceiptQueue{
		client: client,
		ch:     make(chan receiptQueueItem, bufSize),
		done:   make(chan struct{}),
	}
	go q.consumer()
	return q
}

func (q *ReceiptQueue) consumer() {
	defer close(q.done)
	for item := range q.ch {
		receipt, err := q.client.Issue(item.actionType, item.payload, IssueOptions{
			PreviousReceiptHash: item.prevHash,
		})
		if err != nil {
			q.mu.Lock()
			q.failed++
			q.mu.Unlock()
			continue
		}
		q.mu.Lock()
		q.issued++
		if receipt.ReceiptHash != "" {
			q.lastHash = receipt.ReceiptHash
		}
		q.mu.Unlock()
	}
}

// Enqueue adds a receipt job. Non-blocking — drops if full.
func (q *ReceiptQueue) Enqueue(actionType string, payload map[string]any) {
	q.mu.Lock()
	prevHash := q.lastHash
	q.mu.Unlock()

	select {
	case q.ch <- receiptQueueItem{
		actionType: actionType,
		payload:    payload,
		prevHash:   prevHash,
	}:
	default:
		q.mu.Lock()
		q.dropped++
		q.mu.Unlock()
	}
}

// Close shuts down the queue and waits for pending items.
func (q *ReceiptQueue) Close() {
	q.once.Do(func() {
		close(q.ch)
		<-q.done
	})
}

// Stats returns queue statistics.
func (q *ReceiptQueue) Stats() map[string]int {
	q.mu.Lock()
	defer q.mu.Unlock()
	return map[string]int{
		"issued":  q.issued,
		"failed":  q.failed,
		"dropped": q.dropped,
		"pending": len(q.ch),
	}
}

// WrappedAction represents a function call that should be auto-receipted.
// Use RecordAction to issue a receipt for a completed action.
func RecordAction(
	client *Client,
	queue *ReceiptQueue,
	agentName string,
	functionName string,
	args map[string]any,
	result any,
	err error,
	durationMs float64,
	config *WrapConfig,
) {
	if config == nil {
		config = &WrapConfig{}
	}
	if config.Mode == "" {
		config.Mode = "all"
	}

	status := "success"
	var errorType string
	if err != nil {
		status = "error"
		errorType = fmt.Sprintf("%T", err)
	}

	// Check if we should receipt this call
	shouldReceipt := config.Mode == "all" ||
		(config.Mode == "errors_only" && status == "error")
	if !shouldReceipt {
		return
	}

	payload := map[string]any{
		"agent":          agentName,
		"auto_receipt":   true,
		"function":       functionName,
		"timestamp":      time.Now().UTC().Format(time.RFC3339),
		"duration_ms":    durationMs,
		"status":         status,
		"error_type":     errorType,
		"arguments":      safeReprMap(args),
		"result_summary": safeRepr(result),
	}

	if config.DryRun {
		data, _ := json.Marshal(payload)
		fmt.Printf("[NotaryOS DRY RUN] %s: %s\n", functionName, string(data))
		return
	}

	if queue != nil && (config.FireAndForget || config.Mode != "") {
		queue.Enqueue(functionName, payload)
	} else {
		// Synchronous issuance
		client.Issue(functionName, payload)
	}
}

func safeRepr(v any) any {
	if v == nil {
		return nil
	}
	switch val := v.(type) {
	case bool, int, int64, float64:
		return val
	case string:
		if len(val) > 500 {
			return val[:500]
		}
		return val
	default:
		return fmt.Sprintf("<%T>", v)
	}
}

func safeReprMap(m map[string]any) map[string]any {
	if m == nil {
		return nil
	}
	safe := make(map[string]any, len(m))
	for k, v := range m {
		safe[k] = safeRepr(v)
	}
	return safe
}
