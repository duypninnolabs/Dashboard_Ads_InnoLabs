package campaign

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/jmoiron/sqlx"
)

type Repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetRates(ctx context.Context) (float64, float64, error) {
	vatRate := 0.10
	ftfRate := 0.011

	type SettingRow struct {
		Key   string `db:"key"`
		Value string `db:"value"`
	}

	var rows []SettingRow
	err := r.db.SelectContext(ctx, &rows, "SELECT `key`, `value` FROM system_settings WHERE `key` IN ('vat_rate', 'ftf_rate')")
	if err == nil {
		for _, row := range rows {
			if val, err := strconv.ParseFloat(row.Value, 64); err == nil {
				if row.Key == "vat_rate" {
					vatRate = val
				} else if row.Key == "ftf_rate" {
					ftfRate = val
				}
			}
		}
	}

	return vatRate, ftfRate, nil
}

func (r *Repository) FetchCampaigns(ctx context.Context, params FilterParams) ([]CampaignRow, error) {
	var dateFilter string
	var dateArgs []interface{}

	if params.StartDate != "" {
		dateFilter += " AND di.insight_date >= ?"
		dateArgs = append(dateArgs, params.StartDate)
	}
	if params.EndDate != "" {
		dateFilter += " AND di.insight_date <= ?"
		dateArgs = append(dateArgs, params.EndDate)
	}

	query := fmt.Sprintf(`
		SELECT
			c.id,
			c.ad_account_id,
			acc.meta_account_id,
			acc.account_name,
			acc.currency,
			bp.meta_business_id,
			bp.business_name,
			b.id AS brand_id,
			b.brand_name,
			c.meta_campaign_id,
			c.campaign_name,
			c.objective,
			c.campaign_status,
			c.effective_status,
			c.is_sync_enabled,
			COALESCE(SUM(di.spend), 0) AS spend_meta,
			COALESCE(SUM(di.impressions), 0) AS impressions,
			COALESCE(SUM(di.reach), 0) AS reach,
			COALESCE(SUM(di.clicks), 0) AS clicks,
			COALESCE(SUM(di.messages), 0) AS messages,
			COALESCE(SUM(di.leads), 0) AS leads,
			MAX(di.last_synced_at) AS last_synced_at,
			c.first_seen_at,
			c.created_at,
			c.updated_at
		FROM campaigns c
		INNER JOIN ad_accounts acc ON acc.id = c.ad_account_id
		INNER JOIN business_portfolios bp ON bp.id = acc.business_portfolio_id
		LEFT JOIN brands b ON b.id = c.brand_id
		LEFT JOIN campaign_daily_insights di ON di.campaign_id = c.id %s
		WHERE 1 = 1
	`, dateFilter)

	args := append([]interface{}{}, dateArgs...)

	if len(params.BMIDs) > 0 {
		placeholders := make([]string, len(params.BMIDs))
		for i, id := range params.BMIDs {
			placeholders[i] = "?"
			args = append(args, strings.TrimSpace(id))
		}
		query += fmt.Sprintf(" AND bp.meta_business_id IN (%s)", strings.Join(placeholders, ","))
	}

	if len(params.AccountIDs) > 0 {
		placeholders := make([]string, len(params.AccountIDs))
		for i, id := range params.AccountIDs {
			placeholders[i] = "?"
			args = append(args, strings.TrimSpace(id))
		}
		query += fmt.Sprintf(" AND acc.meta_account_id IN (%s)", strings.Join(placeholders, ","))
	}

	if len(params.BrandIDs) > 0 {
		placeholders := make([]string, len(params.BrandIDs))
		for i, id := range params.BrandIDs {
			placeholders[i] = "?"
			args = append(args, id)
		}
		query += fmt.Sprintf(" AND b.id IN (%s)", strings.Join(placeholders, ","))
	}

	if params.Status != "" && params.Status != "ALL" {
		query += " AND (c.campaign_status = ? OR c.effective_status = ?)"
		args = append(args, params.Status, params.Status)
	}

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query += " AND (c.campaign_name LIKE ? OR c.meta_campaign_id LIKE ? OR acc.account_name LIKE ? OR b.brand_name LIKE ?)"
		args = append(args, searchPattern, searchPattern, searchPattern, searchPattern)
	}

	query += `
		GROUP BY
			c.id,
			c.ad_account_id,
			acc.meta_account_id,
			acc.account_name,
			acc.currency,
			bp.meta_business_id,
			bp.business_name,
			b.id,
			b.brand_name,
			c.meta_campaign_id,
			c.campaign_name,
			c.objective,
			c.campaign_status,
			c.effective_status,
			c.is_sync_enabled,
			c.first_seen_at,
			c.created_at,
			c.updated_at
		ORDER BY spend_meta DESC, c.id DESC
	`

	var rows []CampaignRow
	err := r.db.SelectContext(ctx, &rows, query, args...)
	if err != nil {
		return nil, fmt.Errorf("lỗi truy vấn danh sách chiến dịch: %w", err)
	}

	return rows, nil
}

func (r *Repository) GetCampaignByID(ctx context.Context, id int64) (*CampaignRow, error) {
	query := `
		SELECT
			c.id,
			c.ad_account_id,
			acc.meta_account_id,
			acc.account_name,
			acc.currency,
			bp.meta_business_id,
			bp.business_name,
			b.id AS brand_id,
			b.brand_name,
			c.meta_campaign_id,
			c.campaign_name,
			c.objective,
			c.campaign_status,
			c.effective_status,
			c.is_sync_enabled,
			COALESCE(SUM(di.spend), 0) AS spend_meta,
			COALESCE(SUM(di.impressions), 0) AS impressions,
			COALESCE(SUM(di.reach), 0) AS reach,
			COALESCE(SUM(di.clicks), 0) AS clicks,
			COALESCE(SUM(di.messages), 0) AS messages,
			COALESCE(SUM(di.leads), 0) AS leads,
			MAX(di.last_synced_at) AS last_synced_at,
			c.first_seen_at,
			c.created_at,
			c.updated_at
		FROM campaigns c
		INNER JOIN ad_accounts acc ON acc.id = c.ad_account_id
		INNER JOIN business_portfolios bp ON bp.id = acc.business_portfolio_id
		LEFT JOIN brands b ON b.id = c.brand_id
		LEFT JOIN campaign_daily_insights di ON di.campaign_id = c.id
		WHERE c.id = ?
		GROUP BY
			c.id,
			c.ad_account_id,
			acc.meta_account_id,
			acc.account_name,
			acc.currency,
			bp.meta_business_id,
			bp.business_name,
			b.id,
			b.brand_name,
			c.meta_campaign_id,
			c.campaign_name,
			c.objective,
			c.campaign_status,
			c.effective_status,
			c.is_sync_enabled,
			c.first_seen_at,
			c.created_at,
			c.updated_at
	`

	var row CampaignRow
	err := r.db.GetContext(ctx, &row, query, id)
	if err != nil {
		return nil, fmt.Errorf("không tìm thấy chiến dịch %d: %w", id, err)
	}

	return &row, nil
}

func (r *Repository) GetCampaignDailyMetrics(ctx context.Context, campaignID int64) ([]DailyMetric, error) {
	query := `
		SELECT
			DATE_FORMAT(insight_date, '%Y-%m-%d') AS insight_date,
			COALESCE(spend, 0) AS spend,
			COALESCE(impressions, 0) AS impressions,
			COALESCE(reach, 0) AS reach,
			COALESCE(clicks, 0) AS clicks,
			COALESCE(messages, 0) AS messages,
			COALESCE(leads, 0) AS leads
		FROM campaign_daily_insights
		WHERE campaign_id = ?
		ORDER BY insight_date DESC
		LIMIT 90
	`

	var rows []DailyMetric
	err := r.db.SelectContext(ctx, &rows, query, campaignID)
	if err != nil {
		return nil, fmt.Errorf("lỗi truy vấn daily insights của campaign %d: %w", campaignID, err)
	}

	return rows, nil
}
