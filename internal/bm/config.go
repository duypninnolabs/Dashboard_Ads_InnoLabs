package bm

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

type MetaBusinessConfig struct {
	BMID  string `json:"bm_id"`
	Token string `json:"token"`
}

func LoadMetaBusinessConfigs() ([]MetaBusinessConfig, error) {
	raw := strings.TrimSpace(os.Getenv("META_BUSINESSES"))
	if raw == "" {
		return nil, fmt.Errorf("META_BUSINESSES chưa được cấu hình")
	}

	var configs []MetaBusinessConfig
	if err := json.Unmarshal([]byte(raw), &configs); err != nil {
		return nil, fmt.Errorf("META_BUSINESSES JSON không hợp lệ: %w", err)
	}

	if len(configs) == 0 {
		return nil, fmt.Errorf("META_BUSINESSES không có Business Manager nào")
	}

	seen := make(map[string]struct{}, len(configs))

	for i := range configs {
		configs[i].BMID = strings.TrimSpace(configs[i].BMID)
		configs[i].Token = strings.TrimSpace(configs[i].Token)

		if configs[i].BMID == "" {
			return nil, fmt.Errorf("META_BUSINESSES[%d] thiếu bm_id", i)
		}
		if configs[i].Token == "" {
			return nil, fmt.Errorf("META_BUSINESSES[%d] bm_id=%s thiếu token", i, configs[i].BMID)
		}
		if _, exists := seen[configs[i].BMID]; exists {
			return nil, fmt.Errorf("META_BUSINESSES bị trùng bm_id=%s", configs[i].BMID)
		}
		seen[configs[i].BMID] = struct{}{}
	}

	return configs, nil
}
