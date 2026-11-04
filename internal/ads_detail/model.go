package ads_detail

import "time"

// FilterParams chứa các tham số lọc danh sách quảng cáo chi tiết
type FilterParams struct {
	StartDate   string   `json:"start_date"`
	EndDate     string   `json:"end_date"`
	Status      string   `json:"status"`
	BMIDs       []string `json:"bm_ids"`
	AccountIDs  []string `json:"account_ids"`
	CampaignIDs []string `json:"campaign_ids"`
	AdSetIDs    []string `json:"adset_ids"`
	BrandIDs    []int64  `json:"brand_ids"`
	Brands      []string `json:"brands"`
	Search      string   `json:"search"`
}

// AdDetailRow ánh xạ trực tiếp từ câu truy vấn SQL
type AdDetailRow struct {
	ID                     int64      `db:"id" json:"id"`
	AdSetID                int64      `db:"adset_id" json:"adset_id"`
	MetaAdID               string     `db:"meta_ad_id" json:"meta_ad_id"`
	AdName                 string     `db:"ad_name" json:"ad_name"`
	Status                 string     `db:"status" json:"status"`
	EffectiveStatus        string     `db:"effective_status" json:"effective_status"`
	CreativeType           string     `db:"creative_type" json:"creative_type"`
	PostID                 string     `db:"post_id" json:"post_id"`
	PostURL                string     `db:"post_url" json:"post_url"`
	PostMessage            string     `db:"post_message" json:"post_message"`
	ThumbnailURL           string     `db:"thumbnail_url" json:"thumbnail_url"`
	CampaignID             int64      `db:"campaign_id" json:"campaign_id"`
	MetaCampaignID         string     `db:"meta_campaign_id" json:"meta_campaign_id"`
	CampaignName           string     `db:"campaign_name" json:"campaign_name"`
	MetaAdSetID            string     `db:"meta_adset_id" json:"meta_adset_id"`
	AdSetName              string     `db:"adset_name" json:"adset_name"`
	MetaAccountID          string     `db:"meta_account_id" json:"meta_account_id"`
	AccountName            string     `db:"account_name" json:"account_name"`
	Currency               string     `db:"currency" json:"currency"`
	MetaBusinessID         string     `db:"meta_business_id" json:"meta_business_id"`
	BusinessName           string     `db:"business_name" json:"business_name"`
	BrandID                *int64     `db:"brand_id" json:"brand_id"`
	BrandName              string     `db:"brand_name" json:"brand_name"`
	SpendMeta              float64    `db:"spend_meta" json:"spend_meta"`
	Impressions            int64      `db:"impressions" json:"impressions"`
	Reach                  int64      `db:"reach" json:"reach"`
	Clicks                 int64      `db:"clicks" json:"clicks"`
	Messages               int64      `db:"messages" json:"messages"`
	Leads                  int64      `db:"leads" json:"leads"`
	CreatedAt              time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt              time.Time  `db:"updated_at" json:"updated_at"`
}

// AdDetailItem đại diện cho một Ad hoàn chỉnh trả về cho Frontend
type AdDetailItem struct {
	ID              int64      `json:"id"`
	AdSetID         int64      `json:"adset_id"`
	MetaAdID        string     `json:"meta_ad_id"`
	AdName          string     `json:"ad_name"`
	Status          string     `json:"status"`
	EffectiveStatus string     `json:"effective_status"`
	CreativeType    string     `json:"creative_type"`
	PostID          string     `json:"post_id"`
	PostURL         string     `json:"post_url"`
	PostMessage     string     `json:"post_message"`
	ThumbnailURL    string     `json:"thumbnail_url"`
	CampaignID      int64      `json:"campaign_id"`
	MetaCampaignID  string     `json:"meta_campaign_id"`
	CampaignName    string     `json:"campaign_name"`
	MetaAdSetID     string     `json:"meta_adset_id"`
	AdSetName       string     `json:"adset_name"`
	MetaAccountID   string     `json:"meta_account_id"`
	AccountName     string     `json:"account_name"`
	Currency        string     `json:"currency"`
	MetaBusinessID  string     `json:"meta_business_id"`
	BusinessName    string     `json:"business_name"`
	BrandID         *int64     `json:"brand_id"`
	BrandName       string     `json:"brand_name"`
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
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// AdsSummary thống kê tổng hợp toàn bộ các Ads được lọc
type AdsSummary struct {
	TotalAds       int            `json:"total_ads"`
	ActiveAds      int            `json:"active_ads"`
	TotalSpend     float64        `json:"total_spend"`
	SpendMeta      float64        `json:"spend_meta"`
	SpendVAT       float64        `json:"spend_vat"`
	FTFAmount      float64        `json:"ftf_amount"`
	Impressions    int64          `json:"impressions"`
	Clicks         int64          `json:"clicks"`
	Messages       int64          `json:"messages"`
	Leads          int64          `json:"leads"`
	Results        int64          `json:"results"`
	AvgCTR         float64        `json:"avg_ctr"`
	AvgCPC         float64        `json:"avg_cpc"`
	AvgCPA         float64        `json:"avg_cpa"`
	Ads            []AdDetailItem `json:"ads"`
}

// AdDailyMetric lưu trữ thông tin chỉ số từng ngày của một Ad
type AdDailyMetric struct {
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

// SingleAdDetail chứa thông tin chi tiết một quảng cáo cùng các chỉ số theo ngày
type SingleAdDetail struct {
	Ad           AdDetailItem    `json:"ad"`
	DailyMetrics []AdDailyMetric `json:"daily_metrics"`
}
