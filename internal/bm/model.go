package bm

import "time"

// ======================================================
// DATABASE MODELS
// ======================================================

type BusinessPortfolio struct {
	ID                   int64      `db:"id" json:"id"`
	Platform             string     `db:"platform" json:"platform"`
	MetaBusinessID       string     `db:"meta_business_id" json:"meta_business_id"`
	BusinessName         string     `db:"business_name" json:"business_name"`
	AccessToken          string     `db:"access_token" json:"-"`
	IsActive             bool       `db:"is_active" json:"is_active"`
	InitialSyncCompleted bool       `db:"initial_sync_completed" json:"initial_sync_completed"`
	LastSyncedAt         *time.Time `db:"last_synced_at" json:"last_synced_at,omitempty"`
	CreatedAt            time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt            time.Time  `db:"updated_at" json:"updated_at"`
}

type AdAccount struct {
	ID                  int64      `db:"id" json:"id"`
	BusinessPortfolioID int64      `db:"business_portfolio_id" json:"business_portfolio_id"`
	MetaAccountID       string     `db:"meta_account_id" json:"meta_account_id"`
	AccountName         string     `db:"account_name" json:"account_name"`
	Currency            string     `db:"currency" json:"currency"`
	TimezoneName        string     `db:"timezone_name" json:"timezone_name"`
	AccountStatus       *int       `db:"account_status" json:"account_status"`
	IsSyncEnabled       bool       `db:"is_sync_enabled" json:"is_sync_enabled"`
	LastSyncedAt        *time.Time `db:"last_synced_at" json:"last_synced_at,omitempty"`
	CreatedAt           time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt           time.Time  `db:"updated_at" json:"updated_at"`
}

type Brand struct {
	ID        int64     `db:"id" json:"id"`
	BrandName string    `db:"brand_name" json:"brand_name"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type Campaign struct {
	ID              int64      `db:"id" json:"id"`
	AdAccountID     int64      `db:"ad_account_id" json:"ad_account_id"`
	BrandID         *int64     `db:"brand_id" json:"brand_id,omitempty"`
	MetaCampaignID  string     `db:"meta_campaign_id" json:"meta_campaign_id"`
	CampaignName    string     `db:"campaign_name" json:"campaign_name"`
	CampaignStatus  *string    `db:"campaign_status" json:"campaign_status,omitempty"`
	EffectiveStatus *string    `db:"effective_status" json:"effective_status,omitempty"`
	IsSyncEnabled   bool       `db:"is_sync_enabled" json:"is_sync_enabled"`
	HistorySynced   bool       `db:"history_synced" json:"history_synced"`
	HistorySyncedAt *time.Time `db:"history_synced_at" json:"history_synced_at,omitempty"`
	FirstSeenAt     *time.Time `db:"first_seen_at" json:"first_seen_at,omitempty"`
	LastActiveAt    *time.Time `db:"last_active_at" json:"last_active_at,omitempty"`
	CreatedAt       time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time  `db:"updated_at" json:"updated_at"`
}

// ======================================================
// META API MODELS
// ======================================================

type MetaBusiness struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type MetaAdAccount struct {
	ID            string `json:"id"`
	AccountID     string `json:"account_id"`
	Name          string `json:"name"`
	Currency      string `json:"currency"`
	TimezoneName  string `json:"timezone_name"`
	AccountStatus int    `json:"account_status"`
}

type MetaCampaign struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Status          string `json:"status"`
	EffectiveStatus string `json:"effective_status"`
}

type MetaAdSet struct {
	ID               string      `json:"id"`
	CampaignID       string      `json:"campaign_id"`
	Name             string      `json:"name"`
	Status           string      `json:"status"`
	EffectiveStatus  string      `json:"effective_status"`
	DailyBudget      string      `json:"daily_budget"`
	LifetimeBudget   string      `json:"lifetime_budget"`
	OptimizationGoal string      `json:"optimization_goal"`
	BillingEvent     string      `json:"billing_event"`
	Targeting        interface{} `json:"targeting"`
}

type MetaAdSetsResponse struct {
	Data   []MetaAdSet `json:"data"`
	Paging MetaPaging  `json:"paging"`
}

type MetaAction struct {
	ActionType string `json:"action_type"`
	Value      string `json:"value"`
}

type MetaInsight struct {
	CampaignID   string       `json:"campaign_id"`
	CampaignName string       `json:"campaign_name"`
	DateStart    string       `json:"date_start"`
	DateStop     string       `json:"date_stop"`
	Spend        string       `json:"spend"`
	Impressions  string       `json:"impressions"`
	Reach        string       `json:"reach"`
	Clicks       string       `json:"clicks"`
	CTR          string       `json:"ctr"`
	CPC          string       `json:"cpc"`
	CPM          string       `json:"cpm"`
	Actions      []MetaAction `json:"actions"`
}

// ======================================================
// META PAGING
// ======================================================

type MetaPaging struct {
	Next string `json:"next"`
}

type MetaAdAccountsResponse struct {
	Data   []MetaAdAccount `json:"data"`
	Paging MetaPaging      `json:"paging"`
}

type MetaCampaignsResponse struct {
	Data   []MetaCampaign `json:"data"`
	Paging MetaPaging     `json:"paging"`
}

type MetaInsightsResponse struct {
	Data   []MetaInsight `json:"data"`
	Paging MetaPaging    `json:"paging"`
}

// ======================================================
// INTERNAL MODELS
// ======================================================

type CampaignUpsertResult struct {
	ID            int64 `db:"id"`
	HistorySynced bool  `db:"history_synced"`
}

type UnsyncedCampaign struct {
	ID             int64  `db:"id"`
	MetaCampaignID string `db:"meta_campaign_id"`
}

type InsightMetrics struct {
	Date        string
	Spend       float64
	Impressions int64
	Reach       int64
	Clicks      int64
	Messages    int64
	Leads       int64
	CTR         float64
	CPC         float64
	CPM         float64
}

// ======================================================
// API RESPONSE
// ======================================================

type BusinessSyncResult struct {
	BusinessID           string `json:"business_id"`
	BusinessName         string `json:"business_name"`
	InitialSync          bool   `json:"initial_sync"`
	AdAccounts           int    `json:"ad_accounts"`
	CampaignInventory    int    `json:"campaign_inventory"`
	HistoryRows          int    `json:"history_rows"`
	TodayRows            int    `json:"today_rows"`
	FinalizedYesterday   int64  `json:"finalized_yesterday"`
	NewCampaignBackfills int    `json:"new_campaign_backfills"`
}

type SyncResult struct {
	Businesses           int                  `json:"businesses"`
	AdAccounts           int                  `json:"ad_accounts"`
	CampaignInventory    int                  `json:"campaign_inventory"`
	HistoryRows          int                  `json:"history_rows"`
	TodayRows            int                  `json:"today_rows"`
	FinalizedYesterday   int64                `json:"finalized_yesterday"`
	NewCampaignBackfills int                  `json:"new_campaign_backfills"`
	BusinessResults      []BusinessSyncResult `json:"business_results"`
	SyncedAt             string               `json:"synced_at"`
}
