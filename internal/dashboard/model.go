package dashboard

import "time"

type SpendItem struct {
	ID           string     `json:"id"`
	Date         string     `json:"date"`
	BMID         string     `json:"bmId"`
	BMName       string     `json:"bmName"`
	AccountID    string     `json:"accountId"`
	AccountName  string     `json:"accountName"`
	CampaignID   string     `json:"campaignId"`
	CampaignName string     `json:"campaignName"`
	BrandID      *int64     `json:"brandId,omitempty"`
	Brand        string     `json:"brand"`
	Currency     string     `json:"currency"`
	SpendMeta    float64    `json:"spendMeta"`
	VATRate      float64    `json:"vatRate"`
	SpendVAT     float64    `json:"spendVat"`
	FTFRate      float64    `json:"ftfRate"`
	FTFAmount    float64    `json:"ftfAmount"`
	TotalSpend   float64    `json:"totalSpend"`
	LastSyncedAt *time.Time `json:"lastSyncedAt,omitempty"`
}

type DashboardSummary struct {
	SpendMeta     float64 `json:"spendMeta"`
	VATRate       float64 `json:"vatRate"`
	SpendVAT      float64 `json:"spendVat"`
	FTFRate       float64 `json:"ftfRate"`
	FTFAmount     float64 `json:"ftfAmount"`
	TotalSpend    float64 `json:"totalSpend"`
	TotalBMs      int     `json:"totalBms"`
	TotalAccounts int     `json:"totalAccounts"`
	TotalBrands   int     `json:"totalBrands"`
	DateRangeText string  `json:"dateRangeText"`
	LastSyncedAt  string  `json:"lastSyncedAt"`
}

type SpendApiResponse struct {
	Items        []SpendItem      `json:"items"`
	Summary      DashboardSummary `json:"summary"`
	LastSyncedAt string           `json:"lastSyncedAt"`
}

type FilterParams struct {
	StartDate  string   `form:"start_date"`
	EndDate    string   `form:"end_date"`
	BMIDs      []string `form:"bm_ids"`
	AccountIDs []string `form:"account_ids"`
	Brands     []string `form:"brands"`
}

type RawInsightRow struct {
	InsightDate  string     `db:"insight_date"`
	BMID         string     `db:"meta_business_id"`
	BMName       string     `db:"business_name"`
	AccountID    string     `db:"meta_account_id"`
	AccountName  string     `db:"account_name"`
	CampaignID   string     `db:"meta_campaign_id"`
	CampaignName string     `db:"campaign_name"`
	BrandID      *int64     `db:"brand_id"`
	BrandName    *string    `db:"brand_name"`
	Currency     string     `db:"currency"`
	Spend        float64    `db:"spend"`
	LastSyncedAt *time.Time `db:"last_synced_at"`
}

type FilterOptionItem struct {
	Value    string `json:"value"`
	Label    string `json:"label"`
	MetaID   string `json:"metaId,omitempty"`
	Category string `json:"category,omitempty"`
}

type FilterOptionsResponse struct {
	BMs      []FilterOptionItem `json:"bms"`
	Accounts []FilterOptionItem `json:"accounts"`
	Brands   []FilterOptionItem `json:"brands"`
}
