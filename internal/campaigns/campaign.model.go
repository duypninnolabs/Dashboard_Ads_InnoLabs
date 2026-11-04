package campaign

import "time"

// FilterParams defines query parameters for fetching campaigns
type FilterParams struct {
	StartDate  string   `form:"start_date"`
	EndDate    string   `form:"end_date"`
	BMIDs      []string `form:"bm_id"`
	AccountIDs []string `form:"account_id"`
	BrandIDs   []int64  `form:"brand_id"`
	Status     string   `form:"status"`
	Search     string   `form:"search"`
}

// CampaignRow is the raw joined row from MySQL
type CampaignRow struct {
	ID              int64      `db:"id"`
	AdAccountID     int        `db:"ad_account_id"`
	MetaAccountID   string     `db:"meta_account_id"`
	AccountName     string     `db:"account_name"`
	Currency        string     `db:"currency"`
	MetaBusinessID  string     `db:"meta_business_id"`
	BusinessName    string     `db:"business_name"`
	BrandID         *int64     `db:"brand_id"`
	BrandName       *string    `db:"brand_name"`
	MetaCampaignID  string     `db:"meta_campaign_id"`
	CampaignName    string     `db:"campaign_name"`
	Objective       *string    `db:"objective"`
	CampaignStatus  *string    `db:"campaign_status"`
	EffectiveStatus *string    `db:"effective_status"`
	IsSyncEnabled   bool       `db:"is_sync_enabled"`
	SpendMeta       float64    `db:"spend_meta"`
	Impressions     int64      `db:"impressions"`
	Reach           int64      `db:"reach"`
	Clicks          int64      `db:"clicks"`
	Messages        int64      `db:"messages"`
	Leads           int64      `db:"leads"`
	LastSyncedAt    *time.Time `db:"last_synced_at"`
	FirstSeenAt     *time.Time `db:"first_seen_at"`
	CreatedAt       time.Time  `db:"created_at"`
	UpdatedAt       time.Time  `db:"updated_at"`
}

// CampaignItem represents the processed campaign item returned via API
type CampaignItem struct {
	ID              int64      `json:"id"`
	AdAccountID     int        `json:"ad_account_id"`
	MetaAccountID   string     `json:"meta_account_id"`
	AccountName     string     `json:"account_name"`
	Currency        string     `json:"currency"`
	MetaBusinessID  string     `json:"meta_business_id"`
	BusinessName    string     `json:"business_name"`
	BrandID         *int64     `json:"brand_id"`
	BrandName       string     `json:"brand_name"`
	MetaCampaignID  string     `json:"meta_campaign_id"`
	CampaignName    string     `json:"campaign_name"`
	Objective       string     `json:"objective"`
	CampaignStatus  string     `json:"campaign_status"`
	EffectiveStatus string     `json:"effective_status"`
	Status          string     `json:"status"` // Effective/Display Status
	IsSyncEnabled   bool       `json:"is_sync_enabled"`
	SpendMeta       float64    `json:"spend_meta"`
	SpendVAT        float64    `json:"spend_vat"`
	FTFAmount       float64    `json:"ftf_amount"`
	TotalSpend      float64    `json:"total_spend"`
	Impressions     int64      `json:"impressions"`
	Reach           int64      `json:"reach"`
	Clicks          int64      `json:"clicks"`
	Messages        int64      `json:"messages"`
	Leads           int64      `json:"leads"`
	Results         int64      `json:"results"`
	CostPerResult   float64    `json:"cost_per_result"`
	CTR             float64    `json:"ctr"`
	CPC             float64    `json:"cpc"`
	CPM             float64    `json:"cpm"`
	LastSyncedAt    *time.Time `json:"last_synced_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

// DailyMetric is daily insight row for Campaign detail
type DailyMetric struct {
	Date          string  `db:"insight_date" json:"date"`
	SpendMeta     float64 `db:"spend" json:"spend_meta"`
	SpendVAT      float64 `json:"spend_vat"`
	FTFAmount     float64 `json:"ftf_amount"`
	TotalSpend    float64 `json:"total_spend"`
	Impressions   int64   `db:"impressions" json:"impressions"`
	Reach         int64   `db:"reach" json:"reach"`
	Clicks        int64   `db:"clicks" json:"clicks"`
	Messages      int64   `db:"messages" json:"messages"`
	Leads         int64   `db:"leads" json:"leads"`
	Results       int64   `json:"results"`
	CostPerResult float64 `json:"cost_per_result"`
	CTR           float64 `json:"ctr"`
	CPC           float64 `json:"cpc"`
	CPM           float64 `json:"cpm"`
}

// CampaignDetail contains full details of a Campaign and its daily insights
type CampaignDetail struct {
	Campaign     CampaignItem  `json:"campaign"`
	DailyMetrics []DailyMetric `json:"daily_metrics"`
	TotalDays    int           `json:"total_days"`
}

// CampaignsSummary provides aggregated KPIs across campaigns
type CampaignsSummary struct {
	TotalCampaigns  int            `json:"total_campaigns"`
	ActiveCampaigns int            `json:"active_campaigns"`
	SpendMeta       float64        `json:"spend_meta"`
	SpendVAT        float64        `json:"spend_vat"`
	FTFAmount       float64        `json:"ftf_amount"`
	TotalSpend      float64        `json:"total_spend"`
	Impressions     int64          `json:"impressions"`
	Clicks          int64          `json:"clicks"`
	Messages        int64          `json:"messages"`
	Leads           int64          `json:"leads"`
	Results         int64          `json:"results"`
	AvgCTR          float64        `json:"avg_ctr"`
	AvgCPC          float64        `json:"avg_cpc"`
	AvgCPA          float64        `json:"avg_cpa"`
	Campaigns       []CampaignItem `json:"campaigns"`
}
