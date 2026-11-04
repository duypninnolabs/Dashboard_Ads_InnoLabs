package systemlog

import (
	"encoding/json"
	"time"
)

type SystemLog struct {
	Timestamp   time.Time       `json:"timestamp"`
	Level       string          `json:"level"`
	Message     string          `json:"message"`
	LogID       string          `json:"log_id"`
	Service     *string         `json:"service,omitempty"`
	Host        *string         `json:"host,omitempty"`
	UserID      *uint64         `json:"user_id,omitempty"`
	IP          *string         `json:"ip,omitempty"`
	RequestBody json.RawMessage `json:"request_body,omitempty"`
	Response    json.RawMessage `json:"response,omitempty"`
	Tags        json.RawMessage `json:"tags,omitempty"`
	Errors      json.RawMessage `json:"errors,omitempty"`
	Metadata    json.RawMessage `json:"metadata,omitempty"`
}

type CreateLogInput struct {
	Level       string
	Message     string
	Service     string
	Host        string
	UserID      *uint64
	IP          string
	RequestBody any
	Response    any
	Tags        any
	Errors      any
	Metadata    any
}
