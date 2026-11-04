package bm

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"dashboard--ads/pkg/crypto"

	"github.com/jmoiron/sqlx"
)

type Repository struct {
	db        *sqlx.DB
	secretKey string
}

func NewRepository(
	db *sqlx.DB,
	secretKey string,
) *Repository {
	return &Repository{
		db:        db,
		secretKey: secretKey,
	}
}

// ======================================================
// BUSINESS
// ======================================================

func (r *Repository) UpsertBusiness(
	ctx context.Context,
	business MetaBusiness,
	token string,
	now time.Time,
) (*BusinessPortfolio, error) {
	encryptedToken, err := crypto.Encrypt(
		token,
		r.secretKey,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"mÃ£ hÃ³a access token tháº¥t báº¡i: %w",
			err,
		)
	}

	query := `
		INSERT INTO business_portfolios (
			platform,
			meta_business_id,
			business_name,
			access_token,
			is_active,
			last_synced_at
		)
		VALUES (
			'META',
			?,
			?,
			?,
			TRUE,
			?
		)
		ON DUPLICATE KEY UPDATE
			business_name = VALUES(business_name),
			access_token = VALUES(access_token),
			is_active = TRUE,
			last_synced_at = VALUES(last_synced_at),
			updated_at = CURRENT_TIMESTAMP
	`

	_, err = r.db.ExecContext(
		ctx,
		query,
		business.ID,
		business.Name,
		encryptedToken,
		now,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"lÆ°u Business Portfolio tháº¥t báº¡i: %w",
			err,
		)
	}

	var saved BusinessPortfolio

	err = r.db.GetContext(
		ctx,
		&saved,
		`
			SELECT *
			FROM business_portfolios
			WHERE platform = 'META'
			  AND meta_business_id = ?
			LIMIT 1
		`,
		business.ID,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"Ä‘á»c Business Portfolio vá»«a lÆ°u tháº¥t báº¡i: %w",
			err,
		)
	}

	return &saved, nil
}

func (r *Repository) MarkInitialSyncCompleted(
	ctx context.Context,
	businessID int64,
	now time.Time,
) error {
	_, err := r.db.ExecContext(
		ctx,
		`
			UPDATE business_portfolios
			SET
				initial_sync_completed = TRUE,
				last_synced_at = ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`,
		now,
		businessID,
	)

	return err
}
func ExtractBrandFromCampaignName(
	campaignName string,
) (string, bool) {

	start := strings.Index(
		campaignName,
		"[",
	)

	if start < 0 {
		return "", false
	}

	remaining :=
		campaignName[start+1:]

	end := strings.Index(
		remaining,
		"]",
	)

	if end < 0 {
		return "", false
	}

	brandName :=
		strings.TrimSpace(
			remaining[:end],
		)

	if brandName == "" {
		return "", false
	}

	return brandName, true
}

// ======================================================
// BRANDS
// ======================================================

// ResolveBrandIDFromCampaignName láº¥y pháº§n [] Ä‘áº§u tiÃªn trong campaign_name,
// tá»± táº¡o brand náº¿u chÆ°a tá»“n táº¡i vÃ  tráº£ vá» brands.id.
//
// Náº¿u campaign khÃ´ng Ä‘Ãºng format [BRAND] ... thÃ¬ tráº£ nil, nil.
// Sync campaign váº«n tiáº¿p tá»¥c vÃ  brand_id sáº½ Ä‘á»ƒ NULL / giá»¯ brand cÅ©.
func (r *Repository) ResolveBrandIDFromCampaignName(
	ctx context.Context,
	campaignName string,
) (*int64, error) {
	brandName, ok :=
		ExtractBrandFromCampaignName(
			campaignName,
		)

	if !ok {
		return nil, nil
	}

	query := `
		INSERT INTO brands (
			brand_name
		)
		VALUES (?)
		ON DUPLICATE KEY UPDATE
			brand_name = VALUES(brand_name)
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		brandName,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"lÆ°u brand %s tháº¥t báº¡i: %w",
			brandName,
			err,
		)
	}

	var brandID int64

	err = r.db.GetContext(
		ctx,
		&brandID,
		`
			SELECT id
			FROM brands
			WHERE brand_name = ?
			LIMIT 1
		`,
		brandName,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"Ä‘á»c brand id %s tháº¥t báº¡i: %w",
			brandName,
			err,
		)
	}

	return &brandID, nil
}

func (r *Repository) ListBrands(
	ctx context.Context,
) ([]Brand, error) {
	brands := make(
		[]Brand,
		0,
	)

	err := r.db.SelectContext(
		ctx,
		&brands,
		`
			SELECT
				id,
				brand_name,
				created_at,
				updated_at
			FROM brands
			ORDER BY brand_name ASC
		`,
	)

	return brands, err
}

// ======================================================
// AD ACCOUNT
// ======================================================

func (r *Repository) UpsertAdAccount(
	ctx context.Context,
	businessID int64,
	account MetaAdAccount,
	now time.Time,
) (int64, error) {
	metaAccountID := account.AccountID

	if metaAccountID == "" {
		metaAccountID = account.ID
	}

	metaAccountID = strings.TrimPrefix(
		metaAccountID,
		"act_",
	)

	query := `
		INSERT INTO ad_accounts (
			business_portfolio_id,
			meta_account_id,
			account_name,
			currency,
			timezone_name,
			account_status,
			is_sync_enabled,
			last_synced_at
		)
		VALUES (
			?,
			?,
			?,
			?,
			?,
			?,
			TRUE,
			?
		)
		ON DUPLICATE KEY UPDATE
			business_portfolio_id = VALUES(business_portfolio_id),
			account_name = VALUES(account_name),
			currency = VALUES(currency),
			timezone_name = VALUES(timezone_name),
			account_status = VALUES(account_status),
			last_synced_at = VALUES(last_synced_at),
			updated_at = CURRENT_TIMESTAMP
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		businessID,
		metaAccountID,
		account.Name,
		account.Currency,
		account.TimezoneName,
		account.AccountStatus,
		now,
	)
	if err != nil {
		return 0, fmt.Errorf(
			"lÆ°u ad account %s tháº¥t báº¡i: %w",
			metaAccountID,
			err,
		)
	}

	var id int64

	err = r.db.GetContext(
		ctx,
		&id,
		`
			SELECT id
			FROM ad_accounts
			WHERE meta_account_id = ?
			LIMIT 1
		`,
		metaAccountID,
	)
	if err != nil {
		return 0, fmt.Errorf(
			"Ä‘á»c internal ad account id tháº¥t báº¡i: %w",
			err,
		)
	}

	return id, nil
}

// ======================================================
// ADSETS INVENTORY
// ======================================================

func (r *Repository) UpsertAdSets(
	ctx context.Context,
	adAccountID int64,
	adsets []MetaAdSet,
	now time.Time,
) error {
	if len(adsets) == 0 {
		return nil
	}

	query := `
		INSERT INTO adsets (
			brand_id,
			campaign_id,
			meta_adset_id,
			adset_name,
			status,
			effective_status,
			daily_budget,
			lifetime_budget,
			optimization_goal,
			billing_event,
			targeting_summary
		)
		SELECT
			c.brand_id,
			c.id,
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?
		FROM campaigns c
		WHERE c.meta_campaign_id = ?
		LIMIT 1
		ON DUPLICATE KEY UPDATE
			brand_id = COALESCE(VALUES(brand_id), adsets.brand_id),
			campaign_id = VALUES(campaign_id),
			adset_name = VALUES(adset_name),
			status = VALUES(status),
			effective_status = VALUES(effective_status),
			daily_budget = VALUES(daily_budget),
			lifetime_budget = VALUES(lifetime_budget),
			optimization_goal = VALUES(optimization_goal),
			billing_event = VALUES(billing_event),
			targeting_summary = VALUES(targeting_summary),
			updated_at = CURRENT_TIMESTAMP
	`

	stmt, err := r.db.PrepareContext(ctx, query)
	if err != nil {
		return fmt.Errorf("prepare upsert adsets thất bại: %w", err)
	}
	defer stmt.Close()

	for _, as := range adsets {
		if as.ID == "" || as.CampaignID == "" {
			continue
		}

		var dailyBudget, lifetimeBudget *float64
		if b, err := strconv.ParseFloat(as.DailyBudget, 64); err == nil && b > 0 {
			dailyBudget = &b
		}
		if b, err := strconv.ParseFloat(as.LifetimeBudget, 64); err == nil && b > 0 {
			lifetimeBudget = &b
		}

		var targetingSummary string
		if as.Targeting != nil {
			if b, err := json.Marshal(as.Targeting); err == nil {
				targetingSummary = string(b)
			}
		}

		effStatus := as.EffectiveStatus
		if effStatus == "" {
			effStatus = as.Status
		}

		_, _ = stmt.ExecContext(
			ctx,
			as.ID,
			as.Name,
			as.Status,
			effStatus,
			dailyBudget,
			lifetimeBudget,
			as.OptimizationGoal,
			as.BillingEvent,
			targetingSummary,
			as.CampaignID,
		)
	}

	return nil
}

// ======================================================
// CAMPAIGNS
// ======================================================

// UpsertCampaign dÃ¹ng cho Campaign Inventory.
//
// brand_id Ä‘Æ°á»£c tá»± Ä‘á»™ng resolve tá»« pháº§n [] Ä‘áº§u tiÃªn
// trong campaign_name.
func (r *Repository) UpsertCampaign(
	ctx context.Context,
	adAccountID int64,
	campaign MetaCampaign,
	now time.Time,
) (*CampaignUpsertResult, error) {
	isActive := campaign.Status == "ACTIVE" &&
		campaign.EffectiveStatus == "ACTIVE"

	brandID, err :=
		r.ResolveBrandIDFromCampaignName(
			ctx,
			campaign.Name,
		)
	if err != nil {
		return nil, err
	}

	query := `
		INSERT INTO campaigns (
			ad_account_id,
			brand_id,
			meta_campaign_id,
			campaign_name,
			campaign_status,
			effective_status,
			is_sync_enabled,
			history_synced,
			first_seen_at,
			last_active_at
		)
		VALUES (
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			FALSE,
			?,
			?
		)
		ON DUPLICATE KEY UPDATE
			ad_account_id = VALUES(ad_account_id),

			brand_id = CASE
				WHEN VALUES(brand_id) IS NOT NULL
				THEN VALUES(brand_id)
				ELSE brand_id
			END,

			campaign_name = VALUES(campaign_name),
			campaign_status = VALUES(campaign_status),
			effective_status = VALUES(effective_status),
			is_sync_enabled = VALUES(is_sync_enabled),

			last_active_at = CASE
				WHEN VALUES(is_sync_enabled) = TRUE
				THEN VALUES(last_active_at)
				ELSE last_active_at
			END,

			updated_at = CURRENT_TIMESTAMP
	`

	var lastActiveAt interface{}

	if isActive {
		lastActiveAt = now
	} else {
		lastActiveAt = nil
	}

	_, err = r.db.ExecContext(
		ctx,
		query,
		adAccountID,
		brandID,
		campaign.ID,
		campaign.Name,
		nullableString(campaign.Status),
		nullableString(campaign.EffectiveStatus),
		isActive,
		now,
		lastActiveAt,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"lÆ°u campaign %s tháº¥t báº¡i: %w",
			campaign.ID,
			err,
		)
	}

	return r.getCampaignUpsertResult(
		ctx,
		campaign.ID,
	)
}

// EnsureCampaignFromInsight báº£o Ä‘áº£m campaign cÃ³ trong inventory
// ká»ƒ cáº£ trÆ°á»ng há»£p campaign Ä‘Ã£ DELETED/ARCHIVED vÃ  edge /campaigns
// khÃ´ng cÃ²n tráº£ object Ä‘Ã³ nhÆ°ng historical insights váº«n cÃ³ campaign_id.
//
// Tá»± Ä‘á»™ng resolve brand_id tá»« campaign_name náº¿u cÃ³.
// KhÃ´ng ghi Ä‘Ã¨ status hiá»‡n cÃ³.
func (r *Repository) EnsureCampaignFromInsight(
	ctx context.Context,
	adAccountID int64,
	metaCampaignID string,
	campaignName string,
	now time.Time,
) (*CampaignUpsertResult, error) {
	if strings.TrimSpace(metaCampaignID) == "" {
		return nil, fmt.Errorf(
			"campaign_id rá»—ng trong Meta insight",
		)
	}

	if strings.TrimSpace(campaignName) == "" {
		campaignName =
			"Meta Campaign " +
				metaCampaignID
	}

	brandID, err :=
		r.ResolveBrandIDFromCampaignName(
			ctx,
			campaignName,
		)
	if err != nil {
		return nil, err
	}

	query := `
		INSERT INTO campaigns (
			ad_account_id,
			brand_id,
			meta_campaign_id,
			campaign_name,
			campaign_status,
			effective_status,
			is_sync_enabled,
			history_synced,
			first_seen_at,
			last_active_at
		)
		VALUES (
			?,
			?,
			?,
			?,
			NULL,
			NULL,
			FALSE,
			FALSE,
			?,
			NULL
		)
		ON DUPLICATE KEY UPDATE
			ad_account_id = VALUES(ad_account_id),

			brand_id = CASE
				WHEN VALUES(brand_id) IS NOT NULL
				THEN VALUES(brand_id)
				ELSE brand_id
			END,

			campaign_name = CASE
				WHEN campaign_name IS NULL
				  OR campaign_name = ''
				THEN VALUES(campaign_name)
				ELSE campaign_name
			END,

			updated_at = CURRENT_TIMESTAMP
	`

	_, err = r.db.ExecContext(
		ctx,
		query,
		adAccountID,
		brandID,
		metaCampaignID,
		campaignName,
		now,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"táº¡o campaign tá»« insight %s tháº¥t báº¡i: %w",
			metaCampaignID,
			err,
		)
	}

	return r.getCampaignUpsertResult(
		ctx,
		metaCampaignID,
	)
}

func (r *Repository) getCampaignUpsertResult(
	ctx context.Context,
	metaCampaignID string,
) (*CampaignUpsertResult, error) {
	var result CampaignUpsertResult

	err := r.db.GetContext(
		ctx,
		&result,
		`
			SELECT
				id,
				history_synced
			FROM campaigns
			WHERE meta_campaign_id = ?
			LIMIT 1
		`,
		metaCampaignID,
	)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (r *Repository) GetUnsyncedCampaigns(
	ctx context.Context,
	adAccountID int64,
) ([]UnsyncedCampaign, error) {
	campaigns := make(
		[]UnsyncedCampaign,
		0,
	)

	err := r.db.SelectContext(
		ctx,
		&campaigns,
		`
			SELECT
				id,
				meta_campaign_id
			FROM campaigns
			WHERE ad_account_id = ?
			  AND history_synced = FALSE
			ORDER BY id ASC
		`,
		adAccountID,
	)

	return campaigns, err
}

func (r *Repository) MarkCampaignHistorySynced(
	ctx context.Context,
	campaignID int64,
	now time.Time,
) error {
	_, err := r.db.ExecContext(
		ctx,
		`
			UPDATE campaigns
			SET
				history_synced = TRUE,
				history_synced_at = ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`,
		now,
		campaignID,
	)

	return err
}

func (r *Repository) MarkAccountCampaignsHistorySynced(
	ctx context.Context,
	adAccountID int64,
	now time.Time,
) error {
	_, err := r.db.ExecContext(
		ctx,
		`
			UPDATE campaigns
			SET
				history_synced = TRUE,
				history_synced_at = ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE ad_account_id = ?
			  AND history_synced = FALSE
		`,
		now,
		adAccountID,
	)

	return err
}

// ======================================================
// DAILY INSIGHTS
// ======================================================

func (r *Repository) EnsureDailyRow(
	ctx context.Context,
	campaignID int64,
	date string,
) error {
	_, err := r.db.ExecContext(
		ctx,
		`
			INSERT INTO campaign_daily_insights (
				campaign_id,
				insight_date,
				is_finalized
			)
			VALUES (
				?,
				?,
				FALSE
			)
			ON DUPLICATE KEY UPDATE
				campaign_id = VALUES(campaign_id)
		`,
		campaignID,
		date,
	)

	return err
}

func (r *Repository) UpsertInsight(
	ctx context.Context,
	campaignID int64,
	metrics InsightMetrics,
	finalized bool,
	now time.Time,
) error {
	var finalizedAt interface{}

	if finalized {
		finalizedAt = now
	} else {
		finalizedAt = nil
	}

	query := `
		INSERT INTO campaign_daily_insights (
			campaign_id,
			insight_date,
			spend,
			impressions,
			reach,
			clicks,
			messages,
			leads,
			ctr,
			cpc,
			cpm,
			is_finalized,
			finalized_at,
			last_synced_at
		)
		VALUES (
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?
		)
		ON DUPLICATE KEY UPDATE
			spend = VALUES(spend),
			impressions = VALUES(impressions),
			reach = VALUES(reach),
			clicks = VALUES(clicks),
			messages = VALUES(messages),
			leads = VALUES(leads),
			ctr = VALUES(ctr),
			cpc = VALUES(cpc),
			cpm = VALUES(cpm),

			is_finalized = CASE
				WHEN VALUES(is_finalized) = TRUE
				THEN TRUE
				ELSE is_finalized
			END,

			finalized_at = CASE
				WHEN VALUES(is_finalized) = TRUE
				THEN VALUES(finalized_at)
				ELSE finalized_at
			END,

			last_synced_at = VALUES(last_synced_at),
			updated_at = CURRENT_TIMESTAMP
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		campaignID,
		metrics.Date,
		metrics.Spend,
		metrics.Impressions,
		metrics.Reach,
		metrics.Clicks,
		metrics.Messages,
		metrics.Leads,
		metrics.CTR,
		metrics.CPC,
		metrics.CPM,
		finalized,
		finalizedAt,
		now,
	)

	return err
}

func (r *Repository) HasUnfinalizedRowsForAccountDate(
	ctx context.Context,
	adAccountID int64,
	date string,
) (bool, error) {
	var count int

	err := r.db.GetContext(
		ctx,
		&count,
		`
			SELECT COUNT(*)
			FROM campaign_daily_insights di
			INNER JOIN campaigns c
				ON c.id = di.campaign_id
			WHERE c.ad_account_id = ?
			  AND di.insight_date = ?
			  AND di.is_finalized = FALSE
		`,
		adAccountID,
		date,
	)

	return count > 0, err
}

// FinalizeDateForAccount chá»‘t luÃ´n nhá»¯ng row zero khÃ´ng Ä‘Æ°á»£c Meta tráº£ vá».
// VÃ­ dá»¥ campaign ACTIVE nhÆ°ng cáº£ ngÃ y chÆ°a cÃ³ delivery.
func (r *Repository) FinalizeDateForAccount(
	ctx context.Context,
	adAccountID int64,
	date string,
	now time.Time,
) (int64, error) {
	result, err := r.db.ExecContext(
		ctx,
		`
			UPDATE campaign_daily_insights di
			INNER JOIN campaigns c
				ON c.id = di.campaign_id
			SET
				di.is_finalized = TRUE,
				di.finalized_at = ?,
				di.last_synced_at = COALESCE(di.last_synced_at, ?),
				di.updated_at = CURRENT_TIMESTAMP
			WHERE c.ad_account_id = ?
			  AND di.insight_date = ?
			  AND di.is_finalized = FALSE
		`,
		now,
		now,
		adAccountID,
		date,
	)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

func nullableString(
	value string,
) interface{} {
	value = strings.TrimSpace(value)

	if value == "" {
		return nil
	}

	return value
}
