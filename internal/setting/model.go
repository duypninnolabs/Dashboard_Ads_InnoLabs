package setting

import "time"

type Setting struct {
	Key           string     `db:"key" json:"key"`
	Value         string     `db:"value" json:"value"`
	DataType      string     `db:"data_type" json:"data_type"` // THÊM db:"data_type"
	Description   *string    `db:"description" json:"description"`
	EffectiveDate *time.Time `db:"effective_date" json:"effective_date"`
	UpdatedBy     *string    `db:"updated_by" json:"updated_by"`
	UpdatedAt     time.Time  `db:"updated_at" json:"updated_at"`
}
type SettingResponseItem struct {
	Key           string      `json:"key"`
	Value         interface{} `json:"value"` // Đã parse ra float, int, bool...
	DataType      string      `json:"data_type"`
	Description   string      `json:"description"`
	EffectiveDate *string     `json:"effective_date,omitempty"`
	UpdatedBy     *string     `json:"updated_by,omitempty"`
	UpdatedAt     string      `json:"updated_at"`
}
