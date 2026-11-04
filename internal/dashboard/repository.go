package dashboard

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

func (r *Repository) FetchInsights(ctx context.Context, params FilterParams) ([]RawInsightRow, error) {
	query := `
		SELECT
			DATE_FORMAT(di.insight_date, '%Y-%m-%d') AS insight_date,
			bp.meta_business_id,
			bp.business_name,
			acc.meta_account_id,
			acc.account_name,
			c.meta_campaign_id,
			c.campaign_name,
			c.brand_id,
			b.brand_name,
			acc.currency,
			di.spend,
			di.last_synced_at
		FROM campaign_daily_insights di
		INNER JOIN campaigns c ON c.id = di.campaign_id
		INNER JOIN ad_accounts acc ON acc.id = c.ad_account_id
		INNER JOIN business_portfolios bp ON bp.id = acc.business_portfolio_id
		LEFT JOIN brands b ON b.id = c.brand_id
		WHERE 1 = 1
	`
	var args []interface{}

	if params.StartDate != "" {
		query += " AND di.insight_date >= ?"
		args = append(args, params.StartDate)
	}
	if params.EndDate != "" {
		query += " AND di.insight_date <= ?"
		args = append(args, params.EndDate)
	}

	if len(params.BMIDs) > 0 {
		placeholders := make([]string, len(params.BMIDs))
		for i, id := range params.BMIDs {
			placeholders[i] = "?"
			args = append(args, id)
		}
		query += fmt.Sprintf(" AND bp.meta_business_id IN (%s)", strings.Join(placeholders, ","))
	}

	if len(params.AccountIDs) > 0 {
		placeholders := make([]string, len(params.AccountIDs))
		for i, id := range params.AccountIDs {
			placeholders[i] = "?"
			args = append(args, id)
		}
		query += fmt.Sprintf(" AND acc.meta_account_id IN (%s)", strings.Join(placeholders, ","))
	}

	if len(params.Brands) > 0 {
		placeholders := make([]string, len(params.Brands))
		for i, br := range params.Brands {
			placeholders[i] = "?"
			args = append(args, br)
		}
		query += fmt.Sprintf(" AND b.brand_name IN (%s)", strings.Join(placeholders, ","))
	}

	query += " ORDER BY di.insight_date DESC, di.spend DESC"

	var rows []RawInsightRow
	err := r.db.SelectContext(ctx, &rows, query, args...)
	if err != nil {
		return nil, err
	}

	return rows, nil
}

func (r *Repository) FetchFilterOptions(ctx context.Context) (*FilterOptionsResponse, error) {
	var bms []FilterOptionItem
	bmQuery := `
		SELECT
			meta_business_id AS value,
			business_name AS label,
			meta_business_id AS metaId
		FROM business_portfolios
		WHERE is_active = TRUE
		ORDER BY business_name ASC
	`
	_ = r.db.SelectContext(ctx, &bms, bmQuery)

	var accounts []FilterOptionItem
	accQuery := `
		SELECT
			acc.meta_account_id AS value,
			acc.account_name AS label,
			acc.meta_account_id AS metaId,
			bp.meta_business_id AS category
		FROM ad_accounts acc
		INNER JOIN business_portfolios bp ON bp.id = acc.business_portfolio_id
		WHERE acc.is_sync_enabled = TRUE
		ORDER BY acc.account_name ASC
	`
	_ = r.db.SelectContext(ctx, &accounts, accQuery)

	var brands []FilterOptionItem
	brandQuery := `
		SELECT
			brand_name AS value,
			brand_name AS label
		FROM brands
		ORDER BY brand_name ASC
	`
	_ = r.db.SelectContext(ctx, &brands, brandQuery)

	return &FilterOptionsResponse{
		BMs:      bms,
		Accounts: accounts,
		Brands:   brands,
	}, nil
}
