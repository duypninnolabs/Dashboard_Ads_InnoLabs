package brand

import "time"

type BrandModel struct {
	ID            int64     `db:"id" json:"id"`
	BrandName     string    `db:"brand_name" json:"brand_name"`
	CampaignCount int       `db:"campaign_count" json:"campaign_count"`
	AccountCount  int       `db:"account_count" json:"account_count"`
	AdSetCount    int       `db:"adset_count" json:"adset_count"`
	AdsCount      int       `db:"ads_count" json:"ads_count"`
	SpendMeta     float64   `db:"spend_meta" json:"spend_meta"`
	TotalSpend    float64   `db:"total_spend" json:"total_spend"`
	Messages      int64     `db:"messages" json:"messages"`
	Clicks        int64     `db:"clicks" json:"clicks"`
	Impressions   int64     `db:"impressions" json:"impressions"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time `db:"updated_at" json:"updated_at"`
}

type CreateBrandRequest struct {
	BrandName string `json:"brand_name" binding:"required"`
}
