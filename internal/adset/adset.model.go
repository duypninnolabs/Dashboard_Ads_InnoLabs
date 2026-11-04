package adset

import "time"

// FilterParams defines query parameters for fetching adsets
type FilterParams struct {
	StartDate   string   `form:"start_date"`
	EndDate     string   `form:"end_date"`
	BMIDs       []string `form:"bm_id"`
	AccountIDs  []string `form:"account_id"`
	BrandIDs    []int64  `form:"brand_id"`
	Brands      []string `form:"brand"`
	CampaignIDs []string `form:"campaign_id"`
	Status      string   `form:"status"`
	Search      string   `form:"search"`
}

// AdSetRow is the raw query row from MySQL
type AdSetRow struct {
	ID               int64      `db:"id"`
	CampaignID       int64      `db:"campaign_id"`
	MetaAdSetID      string     `db:"meta_adset_id"`
	AdSetName        string     `db:"adset_name"`
	Status           string     `db:"status"`
	EffectiveStatus  string     `db:"effective_status"`
	DailyBudget      *float64   `db:"daily_budget"`
	LifetimeBudget   *float64   `db:"lifetime_budget"`
	OptimizationGoal string     `db:"optimization_goal"`
	BillingEvent     string     `db:"billing_event"`
	TargetingSummary *string    `db:"targeting_summary"`
	MetaCampaignID   string     `db:"meta_campaign_id"`
	CampaignName     string     `db:"campaign_name"`
	MetaAccountID    string     `db:"meta_account_id"`
	AccountName      string     `db:"account_name"`
	Currency         string     `db:"currency"`
	MetaBusinessID   string     `db:"meta_business_id"`
	BusinessName     string     `db:"business_name"`
	BrandID          *int64     `db:"brand_id"`
	BrandName        *string    `db:"brand_name"`
	SpendMeta        float64    `db:"spend_meta"`
	Impressions      int64      `db:"impressions"`
	Reach            int64      `db:"reach"`
	Clicks           int64      `db:"clicks"`
	Messages         int64      `db:"messages"`
	Leads            int64      `db:"leads"`
	LastSyncedAt     *time.Time `db:"last_synced_at"`
	CreatedAt        time.Time  `db:"created_at"`
	UpdatedAt        time.Time  `db:"updated_at"`
}

// AdSetItem represents computed adset for API response
type AdSetItem struct {
	ID               int64      `json:"id"`
	CampaignID       int64      `json:"campaign_id"`
	MetaAdSetID      string     `json:"meta_adset_id"`
	AdSetName        string     `json:"adset_name"`
	Status           string     `json:"status"`
	EffectiveStatus  string     `json:"effective_status"`
	DailyBudget      *float64   `json:"daily_budget"`
	LifetimeBudget   *float64   `json:"lifetime_budget"`
	OptimizationGoal string     `json:"optimization_goal"`
	BillingEvent     string     `json:"billing_event"`
	TargetingSummary string     `json:"targeting_summary"`
	MetaCampaignID   string     `json:"meta_campaign_id"`
	CampaignName     string     `json:"campaign_name"`
	MetaAccountID    string     `json:"meta_account_id"`
	AccountName      string     `json:"account_name"`
	Currency         string     `json:"currency"`
	MetaBusinessID   string     `json:"meta_business_id"`
	BusinessName     string     `json:"business_name"`
	BrandID          *int64     `json:"brand_id"`
	BrandName        string     `json:"brand_name"`
	SpendMeta        float64    `json:"spend_meta"`
	SpendVAT         float64    `json:"spend_vat"`
	FTFAmount        float64    `json:"ftf_amount"`
	TotalSpend       float64    `json:"total_spend"`
	Impressions      int64      `json:"impressions"`
	Reach            int64      `json:"reach"`
	Clicks           int64      `json:"clicks"`
	Messages         int64      `json:"messages"`
	Leads            int64      `json:"leads"`
	Results          int64      `json:"results"`
	CostPerResult    float64    `json:"cost_per_result"`
	CTR              float64    `json:"ctr"`
	CPC              float64    `json:"cpc"`
	CPM              float64    `json:"cpm"`
	LastSyncedAt     *time.Time `json:"last_synced_at,omitempty"`
}

// DailyMetric is daily insight row for AdSet detail
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

// ChildAd represents a creative/ad under an adset
type ChildAd struct {
	ID           int64     `db:"id" json:"id"`
	AdSetID      int64     `db:"adset_id" json:"adset_id"`
	MetaAdID     string    `db:"meta_ad_id" json:"meta_ad_id"`
	AdName       string    `db:"ad_name" json:"ad_name"`
	Status       string    `db:"status" json:"status"`
	CreativeType string    `db:"creative_type" json:"creative_type"`
	PostID       string    `db:"post_id" json:"post_id"`
	PostURL      string    `db:"post_url" json:"post_url"`
	PostMessage  string    `db:"post_message" json:"post_message"`
	ThumbnailURL string    `db:"thumbnail_url" json:"thumbnail_url"`
	SpendMeta    float64   `db:"spend" json:"spend_meta"`
	SpendVAT     float64   `json:"spend_vat"`
	TotalSpend   float64   `json:"total_spend"`
	Impressions  int64     `db:"impressions" json:"impressions"`
	Clicks       int64     `db:"clicks" json:"clicks"`
	Messages     int64     `db:"messages" json:"messages"`
	CTR          float64   `json:"ctr"`
	CPC          float64   `json:"cpc"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

// AdSetDetail contains full drilldown data for an adset
type AdSetDetail struct {
	AdSet         AdSetItem     `json:"adset"`
	DailyMetrics  []DailyMetric `json:"daily_metrics"`
	ChildAds      []ChildAd     `json:"child_ads"`
	TargetingInfo TargetingInfo `json:"targeting_info"`
}

// TargetingInfo provides structured targeting details
type TargetingInfo struct {
	AgeMin            int      `json:"age_min"`
	AgeMax            int      `json:"age_max"`
	AgeRange          string   `json:"age_range"`
	Genders           string   `json:"genders"`
	Locations         []string `json:"locations"`
	CustomLocations   []string `json:"custom_locations"`
	Interests         []string `json:"interests"`
	FamilyStatuses    []string `json:"family_statuses"`
	EducationStatuses []string `json:"education_statuses"`
	AdvantageAudience bool     `json:"advantage_audience"`
	BrandSafety       []string `json:"brand_safety"`
	Placements        []string `json:"placements"`
	OptimizationGoal  string   `json:"optimization_goal"`
	BillingEvent      string   `json:"billing_event"`
	Attribution       string   `json:"attribution"`
}

// AdSetsSummary provides rollup figures for adset page
type AdSetsSummary struct {
	TotalAdSets   int       `json:"total_adsets"`
	ActiveAdSets  int       `json:"active_adsets"`
	TotalSpend    float64   `json:"total_spend"`
	SpendMeta     float64   `json:"spend_meta"`
	SpendVAT      float64   `json:"spend_vat"`
	FTFAmount     float64   `json:"ftf_amount"`
	Impressions   int64     `json:"impressions"`
	Clicks        int64     `json:"clicks"`
	Messages      int64     `json:"messages"`
	Leads         int64     `json:"leads"`
	Results       int64     `json:"results"`
	AvgCTR        float64   `json:"avg_ctr"`
	AvgCPC        float64   `json:"avg_cpc"`
	AvgCPA        float64   `json:"avg_cpa"`
	AdSets        []AdSetItem `json:"adsets"`
}
