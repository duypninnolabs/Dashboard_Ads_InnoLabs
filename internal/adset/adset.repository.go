package adset

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"

	"github.com/jmoiron/sqlx"
)

type Repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *Repository {
	repo := &Repository{db: db}
	_ = repo.EnsureSchema(context.Background())
	return repo
}

func (r *Repository) EnsureSchema(ctx context.Context) error {
	tblAdsets := `
	CREATE TABLE IF NOT EXISTS adsets (
		id BIGINT AUTO_INCREMENT PRIMARY KEY,
		campaign_id BIGINT NOT NULL,
		meta_adset_id VARCHAR(100) NOT NULL UNIQUE,
		adset_name VARCHAR(255) NOT NULL,
		status VARCHAR(50) DEFAULT 'ACTIVE',
		effective_status VARCHAR(50) DEFAULT 'ACTIVE',
		daily_budget DECIMAL(15,2) DEFAULT 500000.00,
		lifetime_budget DECIMAL(15,2) DEFAULT NULL,
		optimization_goal VARCHAR(100) DEFAULT 'MESSAGES',
		billing_event VARCHAR(100) DEFAULT 'IMPRESSIONS',
		targeting_summary TEXT DEFAULT NULL,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		INDEX idx_adset_campaign (campaign_id),
		CONSTRAINT fk_adset_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`

	if _, err := r.db.ExecContext(ctx, tblAdsets); err != nil {
		log.Printf("[AdSet] EnsureSchema adsets err: %v", err)
		return err
	}

	tblAds := `
	CREATE TABLE IF NOT EXISTS ads (
		id BIGINT AUTO_INCREMENT PRIMARY KEY,
		adset_id BIGINT NOT NULL,
		meta_ad_id VARCHAR(100) NOT NULL UNIQUE,
		ad_name VARCHAR(255) NOT NULL,
		status VARCHAR(50) DEFAULT 'ACTIVE',
		creative_type VARCHAR(50) DEFAULT 'IMAGE',
		post_id VARCHAR(100) DEFAULT NULL,
		post_url TEXT DEFAULT NULL,
		post_message TEXT DEFAULT NULL,
		thumbnail_url TEXT DEFAULT NULL,
		spend DECIMAL(15,2) DEFAULT 0,
		impressions BIGINT DEFAULT 0,
		clicks BIGINT DEFAULT 0,
		messages BIGINT DEFAULT 0,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		INDEX idx_ad_adset (adset_id)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`

	if _, err := r.db.ExecContext(ctx, tblAds); err != nil {
		log.Printf("[AdSet] EnsureSchema ads err: %v", err)
		return err
	}

	// Đồng bộ các ngày chi tiêu từ ad_daily_insights sang campaign_daily_insights để không bao giờ bị lệch ngày
	syncInsights := `
		INSERT INTO campaign_daily_insights (
			campaign_id, insight_date, spend, impressions, reach, clicks, messages, leads, is_finalized, last_synced_at
		)
		SELECT 
			a.campaign_id,
			adi.insight_date,
			SUM(adi.spend),
			SUM(adi.impressions),
			SUM(adi.reach),
			SUM(adi.clicks),
			SUM(adi.messages),
			SUM(adi.leads),
			FALSE,
			NOW()
		FROM ad_daily_insights adi
		JOIN ads a ON a.id = adi.ad_id
		WHERE a.campaign_id IS NOT NULL AND a.campaign_id > 0
		GROUP BY a.campaign_id, adi.insight_date
		ON DUPLICATE KEY UPDATE
			spend = IF(campaign_daily_insights.spend = 0 AND VALUES(spend) > 0, VALUES(spend), campaign_daily_insights.spend),
			impressions = IF(campaign_daily_insights.impressions = 0 AND VALUES(impressions) > 0, VALUES(impressions), campaign_daily_insights.impressions),
			clicks = IF(campaign_daily_insights.clicks = 0 AND VALUES(clicks) > 0, VALUES(clicks), campaign_daily_insights.clicks),
			messages = IF(campaign_daily_insights.messages = 0 AND VALUES(messages) > 0, VALUES(messages), campaign_daily_insights.messages);`
	_, _ = r.db.ExecContext(ctx, syncInsights)

	return nil
}

func (r *Repository) SeedInitialAdSets(ctx context.Context) error {
	// KhÃ´ng seed dá»¯ liá»‡u giáº£ ná»¯a Ä‘á»ƒ Ä‘áº£m báº£o báº£ng ads chá»‰ lÆ°u sá»‘ liá»‡u tháº­t Ä‘Æ°á»£c Ä‘á»“ng bá»™ tá»« Meta
	return nil
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

func (r *Repository) FetchAdSets(ctx context.Context, params FilterParams) ([]AdSetRow, error) {
	// Kiểm tra nếu bảng adsets đã có dữ liệu thật từ Meta
	var adsetsCount int
	_ = r.db.GetContext(ctx, &adsetsCount, "SELECT COUNT(*) FROM adsets")

	if adsetsCount > 0 {
		var conditions []string
		var args []interface{}

		if len(params.BMIDs) > 0 {
			placeholders := make([]string, len(params.BMIDs))
			for i, id := range params.BMIDs {
				placeholders[i] = "?"
				args = append(args, id)
			}
			conditions = append(conditions, fmt.Sprintf("bp.meta_business_id IN (%s)", strings.Join(placeholders, ",")))
		}

		if len(params.AccountIDs) > 0 {
			placeholders := make([]string, len(params.AccountIDs))
			for i, id := range params.AccountIDs {
				placeholders[i] = "?"
				args = append(args, id)
			}
			conditions = append(conditions, fmt.Sprintf("acc.meta_account_id IN (%s)", strings.Join(placeholders, ",")))
		}

		if len(params.BrandIDs) > 0 {
			placeholders := make([]string, len(params.BrandIDs))
			for i, id := range params.BrandIDs {
				placeholders[i] = "?"
				args = append(args, id)
			}
			conditions = append(conditions, fmt.Sprintf("b.id IN (%s)", strings.Join(placeholders, ",")))
		}

		if len(params.Brands) > 0 {
			var brandConds []string
			for _, name := range params.Brands {
				trimmed := strings.TrimSpace(name)
				brandConds = append(brandConds, `(
					LOWER(COALESCE(b.brand_name, '')) = LOWER(?)
					OR LOWER(c.campaign_name) LIKE LOWER(?)
					OR LOWER(ast.adset_name) LIKE LOWER(?)
				)`)
				tagPattern := "%[" + trimmed + "]%"
				args = append(args, trimmed, tagPattern, tagPattern)
			}
			conditions = append(conditions, "("+strings.Join(brandConds, " OR ")+")")
		}

		if len(params.CampaignIDs) > 0 {
			placeholders := make([]string, len(params.CampaignIDs))
			for i, id := range params.CampaignIDs {
				placeholders[i] = "?"
				args = append(args, id)
			}
			conditions = append(conditions, fmt.Sprintf("c.meta_campaign_id IN (%s)", strings.Join(placeholders, ",")))
		}

		if params.Status != "" && strings.ToUpper(params.Status) != "ALL" {
			conditions = append(conditions, "(ast.status = ? OR ast.effective_status = ?)")
			args = append(args, strings.ToUpper(params.Status), strings.ToUpper(params.Status))
		}

		if params.Search != "" {
			conditions = append(conditions, "(ast.adset_name LIKE ? OR ast.meta_adset_id LIKE ? OR c.campaign_name LIKE ?)")
			pattern := "%" + params.Search + "%"
			args = append(args, pattern, pattern, pattern)
		}

		// Loại bỏ các bản ghi giả/placeholder cũ có tiền tố 'adset_'
		conditions = append(conditions, "ast.meta_adset_id NOT LIKE 'adset_%'")

		whereSQL := ""
		if len(conditions) > 0 {
			whereSQL = " WHERE " + strings.Join(conditions, " AND ")
		}

		query := fmt.Sprintf(`
			SELECT
				ast.id AS id,
				ast.campaign_id AS campaign_id,
				ast.meta_adset_id AS meta_adset_id,
				ast.adset_name AS adset_name,
				COALESCE(ast.status, 'ACTIVE') AS status,
				COALESCE(ast.effective_status, 'ACTIVE') AS effective_status,
				COALESCE(ast.daily_budget, 0) AS daily_budget,
				ast.lifetime_budget AS lifetime_budget,
				COALESCE(ast.optimization_goal, 'MESSAGES') AS optimization_goal,
				COALESCE(ast.billing_event, 'IMPRESSIONS') AS billing_event,
				COALESCE(ast.targeting_summary, '') AS targeting_summary,
				c.meta_campaign_id,
				c.campaign_name,
				acc.meta_account_id,
				acc.account_name,
				acc.currency,
				bp.meta_business_id,
				bp.business_name,
				b.id AS brand_id,
				b.brand_name,
				COALESCE(SUM(ads.spend), 0) AS spend_meta,
				COALESCE(SUM(ads.impressions), 0) AS impressions,
				COALESCE(SUM(ads.reach), 0) AS reach,
				COALESCE(SUM(ads.clicks), 0) AS clicks,
				COALESCE(SUM(ads.messages), 0) AS messages,
				COALESCE(SUM(ads.leads), 0) AS leads,
				ast.updated_at AS last_synced_at,
				ast.created_at,
				ast.updated_at
			FROM adsets ast
			INNER JOIN campaigns c ON c.id = ast.campaign_id
			INNER JOIN ad_accounts acc ON acc.id = c.ad_account_id
			INNER JOIN business_portfolios bp ON bp.id = acc.business_portfolio_id
			LEFT JOIN brands b ON (b.id = ast.brand_id OR b.id = c.brand_id)
			LEFT JOIN ads ON (ads.adset_id = ast.id OR (ads.meta_adset_id != '' AND ads.meta_adset_id = ast.meta_adset_id))
			%s
			GROUP BY
				ast.id, ast.campaign_id, ast.meta_adset_id, ast.adset_name, ast.status, ast.effective_status,
				ast.daily_budget, ast.lifetime_budget, ast.optimization_goal, ast.billing_event, ast.targeting_summary,
				c.meta_campaign_id, c.campaign_name, acc.meta_account_id, acc.account_name, acc.currency,
				bp.meta_business_id, bp.business_name, b.id, b.brand_name, ast.created_at, ast.updated_at
			ORDER BY spend_meta DESC, ast.id DESC
		`, whereSQL)

		var rows []AdSetRow
		err := r.db.SelectContext(ctx, &rows, query, args...)
		if err == nil {
			return rows, nil
		}
	}

	// Fallback sang campaign nếu chưa có adset nào
	query := `
		SELECT
			c.id AS id,
			c.id AS campaign_id,
			c.meta_campaign_id AS meta_adset_id,
			c.campaign_name AS adset_name,
			COALESCE(c.campaign_status, 'ACTIVE') AS status,
			COALESCE(c.effective_status, 'ACTIVE') AS effective_status,
			0.00 AS daily_budget,
			NULL AS lifetime_budget,
			'MESSAGES' AS optimization_goal,
			'IMPRESSIONS' AS billing_event,
			'' AS targeting_summary,
			c.meta_campaign_id,
			c.campaign_name,
			acc.meta_account_id,
			acc.account_name,
			acc.currency,
			bp.meta_business_id,
			bp.business_name,
			b.id AS brand_id,
			b.brand_name,
			COALESCE(SUM(di.spend), 0) AS spend_meta,
			COALESCE(SUM(di.impressions), 0) AS impressions,
			COALESCE(SUM(di.reach), 0) AS reach,
			COALESCE(SUM(di.clicks), 0) AS clicks,
			COALESCE(SUM(di.messages), 0) AS messages,
			COALESCE(SUM(di.leads), 0) AS leads,
			MAX(di.last_synced_at) AS last_synced_at,
			c.created_at,
			c.updated_at
		FROM campaigns c
		INNER JOIN ad_accounts acc ON acc.id = c.ad_account_id
		INNER JOIN business_portfolios bp ON bp.id = acc.business_portfolio_id
		LEFT JOIN brands b ON (b.id = ast.brand_id OR b.id = c.brand_id)
		LEFT JOIN campaign_daily_insights di ON di.campaign_id = c.id
	`

	var joinConditions []string
	var joinArgs []interface{}
	if params.StartDate != "" {
		joinConditions = append(joinConditions, "di.insight_date >= ?")
		joinArgs = append(joinArgs, params.StartDate)
	}
	if params.EndDate != "" {
		joinConditions = append(joinConditions, "di.insight_date <= ?")
		joinArgs = append(joinArgs, params.EndDate)
	}

	if len(joinConditions) > 0 {
		query += " AND " + strings.Join(joinConditions, " AND ")
	}

	var conditions []string
	var args []interface{}
	args = append(args, joinArgs...)

	if len(params.BMIDs) > 0 {
		placeholders := make([]string, len(params.BMIDs))
		for i, id := range params.BMIDs {
			placeholders[i] = "?"
			args = append(args, id)
		}
		conditions = append(conditions, fmt.Sprintf("bp.meta_business_id IN (%s)", strings.Join(placeholders, ",")))
	}

	if len(params.AccountIDs) > 0 {
		placeholders := make([]string, len(params.AccountIDs))
		for i, id := range params.AccountIDs {
			placeholders[i] = "?"
			args = append(args, id)
		}
		conditions = append(conditions, fmt.Sprintf("acc.meta_account_id IN (%s)", strings.Join(placeholders, ",")))
	}

	if len(params.BrandIDs) > 0 {
		placeholders := make([]string, len(params.BrandIDs))
		for i, id := range params.BrandIDs {
			placeholders[i] = "?"
			args = append(args, id)
		}
		conditions = append(conditions, fmt.Sprintf("b.id IN (%s)", strings.Join(placeholders, ",")))
	}

	if len(params.Brands) > 0 {
		var brandConds []string
		for _, name := range params.Brands {
			trimmed := strings.TrimSpace(name)
			// Khá»›p chÃ­nh xÃ¡c tÃªn Brand trong báº£ng brands HOáº¶C tag brand trong dáº¥u ngoáº·c vuÃ´ng [Brand] cá»§a campaign_name
			brandConds = append(brandConds, `(
				LOWER(COALESCE(b.brand_name, '')) = LOWER(?)
				OR LOWER(c.campaign_name) LIKE LOWER(?)
			)`)
			tagPattern := "%[" + trimmed + "]%"
			args = append(args, trimmed, tagPattern)
		}
		conditions = append(conditions, "("+strings.Join(brandConds, " OR ")+")")
	}

	if len(params.CampaignIDs) > 0 {
		placeholders := make([]string, len(params.CampaignIDs))
		for i, id := range params.CampaignIDs {
			placeholders[i] = "?"
			args = append(args, id)
		}
		conditions = append(conditions, fmt.Sprintf("c.meta_campaign_id IN (%s)", strings.Join(placeholders, ",")))
	}

	if params.Status != "" && strings.ToUpper(params.Status) != "ALL" {
		conditions = append(conditions, "COALESCE(c.campaign_status, 'ACTIVE') = ?")
		args = append(args, strings.ToUpper(params.Status))
	}

	if params.Search != "" {
		conditions = append(conditions, "(c.campaign_name LIKE ? OR c.meta_campaign_id LIKE ?)")
		pattern := "%" + params.Search + "%"
		args = append(args, pattern, pattern)
	}

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}

	query += `
		GROUP BY
			c.id,
			c.meta_campaign_id,
			c.campaign_name,
			c.campaign_status,
			c.effective_status,
			acc.meta_account_id,
			acc.account_name,
			acc.currency,
			bp.meta_business_id,
			bp.business_name,
			b.id,
			b.brand_name,
			c.created_at,
			c.updated_at
		ORDER BY c.id DESC
	`

	var rows []AdSetRow
	err := r.db.SelectContext(ctx, &rows, query, args...)
	if err != nil {
		return nil, fmt.Errorf("truy váº¥n AdSets tháº¥t báº¡i: %w", err)
	}

	return rows, nil
}

func (r *Repository) GetAdSetByID(ctx context.Context, id int64) (*AdSetRow, error) {
	// Ưu tiên lấy từ bảng adsets thật đã đồng bộ từ Meta
	queryReal := `
		SELECT
			ast.id AS id,
			ast.campaign_id AS campaign_id,
			ast.meta_adset_id AS meta_adset_id,
			ast.adset_name AS adset_name,
			COALESCE(ast.status, 'ACTIVE') AS status,
			COALESCE(ast.effective_status, 'ACTIVE') AS effective_status,
			COALESCE(ast.daily_budget, 0) AS daily_budget,
			ast.lifetime_budget AS lifetime_budget,
			COALESCE(ast.optimization_goal, 'MESSAGES') AS optimization_goal,
			COALESCE(ast.billing_event, 'IMPRESSIONS') AS billing_event,
			COALESCE(ast.targeting_summary, '') AS targeting_summary,
			c.meta_campaign_id,
			c.campaign_name,
			acc.meta_account_id,
			acc.account_name,
			acc.currency,
			bp.meta_business_id,
			bp.business_name,
			b.id AS brand_id,
			b.brand_name,
			COALESCE(SUM(ads.spend), 0) AS spend_meta,
			COALESCE(SUM(ads.impressions), 0) AS impressions,
			COALESCE(SUM(ads.reach), 0) AS reach,
			COALESCE(SUM(ads.clicks), 0) AS clicks,
			COALESCE(SUM(ads.messages), 0) AS messages,
			COALESCE(SUM(ads.leads), 0) AS leads,
			ast.updated_at AS last_synced_at,
			ast.created_at,
			ast.updated_at
		FROM adsets ast
		INNER JOIN campaigns c ON c.id = ast.campaign_id
		INNER JOIN ad_accounts acc ON acc.id = c.ad_account_id
		INNER JOIN business_portfolios bp ON bp.id = acc.business_portfolio_id
		LEFT JOIN brands b ON (b.id = ast.brand_id OR b.id = c.brand_id)
		LEFT JOIN ads ON (ads.adset_id = ast.id OR (ads.meta_adset_id != '' AND ads.meta_adset_id = ast.meta_adset_id))
		WHERE ast.id = ?
		GROUP BY ast.id, ast.campaign_id, ast.meta_adset_id, ast.adset_name, ast.status, ast.effective_status,
		         ast.daily_budget, ast.lifetime_budget, ast.optimization_goal, ast.billing_event, ast.targeting_summary,
		         c.meta_campaign_id, c.campaign_name, acc.meta_account_id, acc.account_name, acc.currency,
		         bp.meta_business_id, bp.business_name, b.id, b.brand_name, ast.created_at, ast.updated_at
		LIMIT 1
	`
	var row AdSetRow
	err := r.db.GetContext(ctx, &row, queryReal, id)
	if err == nil {
		return &row, nil
	}

	// Fallback sang campaign nếu id truyền vào là id của campaign
	queryFallback := `
		SELECT
			c.id AS id,
			c.id AS campaign_id,
			c.meta_campaign_id AS meta_adset_id,
			c.campaign_name AS adset_name,
			COALESCE(c.campaign_status, 'ACTIVE') AS status,
			COALESCE(c.effective_status, 'ACTIVE') AS effective_status,
			0.00 AS daily_budget,
			NULL AS lifetime_budget,
			'MESSAGES' AS optimization_goal,
			'IMPRESSIONS' AS billing_event,
			'' AS targeting_summary,
			c.meta_campaign_id,
			c.campaign_name,
			acc.meta_account_id,
			acc.account_name,
			acc.currency,
			bp.meta_business_id,
			bp.business_name,
			b.id AS brand_id,
			b.brand_name,
			COALESCE(SUM(di.spend), 0) AS spend_meta,
			COALESCE(SUM(di.impressions), 0) AS impressions,
			COALESCE(SUM(di.reach), 0) AS reach,
			COALESCE(SUM(di.clicks), 0) AS clicks,
			COALESCE(SUM(di.messages), 0) AS messages,
			COALESCE(SUM(di.leads), 0) AS leads,
			MAX(di.last_synced_at) AS last_synced_at,
			c.created_at,
			c.updated_at
		FROM campaigns c
		INNER JOIN ad_accounts acc ON acc.id = c.ad_account_id
		INNER JOIN business_portfolios bp ON bp.id = acc.business_portfolio_id
		LEFT JOIN brands b ON (b.id = ast.brand_id OR b.id = c.brand_id)
		LEFT JOIN campaign_daily_insights di ON di.campaign_id = c.id
		WHERE c.id = ?
		GROUP BY
			c.id,
			c.meta_campaign_id,
			c.campaign_name,
			c.campaign_status,
			c.effective_status,
			acc.meta_account_id,
			acc.account_name,
			acc.currency,
			bp.meta_business_id,
			bp.business_name,
			b.id,
			b.brand_name,
			c.created_at,
			c.updated_at
	`
	err = r.db.GetContext(ctx, &row, queryFallback, id)
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *Repository) GetDailyMetrics(ctx context.Context, adsetID int64, campaignID int64) ([]DailyMetric, error) {
	// 1. Ưu tiên lấy trực tiếp từ ad_daily_insights của các mẫu ads thuộc AdSet này
	queryAds := `
		SELECT
			DATE_FORMAT(adi.insight_date, '%Y-%m-%d') AS insight_date,
			COALESCE(SUM(adi.spend), 0) AS spend,
			COALESCE(SUM(adi.impressions), 0) AS impressions,
			COALESCE(SUM(adi.reach), 0) AS reach,
			COALESCE(SUM(adi.clicks), 0) AS clicks,
			COALESCE(SUM(adi.messages), 0) AS messages,
			COALESCE(SUM(adi.leads), 0) AS leads
		FROM ad_daily_insights adi
		JOIN ads a ON a.id = adi.ad_id
		WHERE a.adset_id = ? OR (a.meta_adset_id != '' AND a.meta_adset_id = (SELECT meta_adset_id FROM adsets WHERE id = ?))
		GROUP BY DATE_FORMAT(adi.insight_date, '%Y-%m-%d')
		ORDER BY insight_date DESC
		LIMIT 90
	`
	var rows []DailyMetric
	err := r.db.SelectContext(ctx, &rows, queryAds, adsetID, adsetID)
	if err == nil && len(rows) > 0 {
		return rows, nil
	}

	// 2. Fallback sang campaign_daily_insights nếu ads chưa có ad_daily_insights
	queryCamp := `
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
	err = r.db.SelectContext(ctx, &rows, queryCamp, campaignID)
	if err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *Repository) GetChildAds(ctx context.Context, adsetID int64, startDate, endDate string) ([]ChildAd, error) {
	sDate := strings.TrimSpace(startDate)
	eDate := strings.TrimSpace(endDate)
	if sDate != "" && eDate == "" {
		eDate = sDate
	}
	if sDate == "" && eDate != "" {
		sDate = eDate
	}
	hasDateFilter := sDate != "" && eDate != ""

	// 1. Kiểm tra xem adsetID có tồn tại trong bảng adsets hay không
	var count int
	_ = r.db.GetContext(ctx, &count, "SELECT COUNT(*) FROM adsets WHERE id = ?", adsetID)

	var rows []ChildAd

	if count > 0 {
		if hasDateFilter {
			// Lấy dữ liệu mẫu quảng cáo con lọc chính xác theo dải ngày đã chọn từ ad_daily_insights
			query := `
				SELECT
					ads.id,
					ads.adset_id,
					ads.meta_ad_id,
					ads.ad_name,
					ads.status,
					ads.creative_type,
					COALESCE(ads.post_id, '') AS post_id,
					COALESCE(ads.post_url, '') AS post_url,
					COALESCE(ads.post_message, '') AS post_message,
					COALESCE(ads.thumbnail_url, '') AS thumbnail_url,
					COALESCE(SUM(adi.spend), 0) AS spend,
					COALESCE(SUM(adi.impressions), 0) AS impressions,
					COALESCE(SUM(adi.clicks), 0) AS clicks,
					COALESCE(SUM(adi.messages), 0) AS messages,
					ads.created_at
				FROM ads
				LEFT JOIN ad_daily_insights adi ON adi.ad_id = ads.id AND adi.insight_date BETWEEN ? AND ?
				WHERE ads.adset_id = ?
				   OR (ads.meta_adset_id != '' AND ads.meta_adset_id = (SELECT meta_adset_id FROM adsets WHERE id = ?))
				GROUP BY
					ads.id, ads.adset_id, ads.meta_ad_id, ads.ad_name, ads.status, ads.creative_type,
					ads.post_id, ads.post_url, ads.post_message, ads.thumbnail_url, ads.created_at
				ORDER BY spend DESC, ads.id ASC
				LIMIT 100
			`
			err := r.db.SelectContext(ctx, &rows, query, sDate, eDate, adsetID, adsetID)
			if err == nil && len(rows) > 0 {
				return rows, nil
			}
		} else {
			// Toàn bộ thời gian (lifetime)
			query := `
				SELECT
					ads.id,
					ads.adset_id,
					ads.meta_ad_id,
					ads.ad_name,
					ads.status,
					ads.creative_type,
					COALESCE(ads.post_id, '') AS post_id,
					COALESCE(ads.post_url, '') AS post_url,
					COALESCE(ads.post_message, '') AS post_message,
					COALESCE(ads.thumbnail_url, '') AS thumbnail_url,
					ads.spend,
					ads.impressions,
					ads.clicks,
					COALESCE(ads.messages, 0) AS messages,
					ads.created_at
				FROM ads
				WHERE ads.adset_id = ?
				   OR (ads.meta_adset_id != '' AND ads.meta_adset_id = (SELECT meta_adset_id FROM adsets WHERE id = ?))
				ORDER BY ads.spend DESC, ads.id ASC
				LIMIT 100
			`
			err := r.db.SelectContext(ctx, &rows, query, adsetID, adsetID)
			if err == nil && len(rows) > 0 {
				return rows, nil
			}
		}

		// Fallback an toàn: Nếu AdSet không có ads trực tiếp (như adset đơn đại diện cho campaign),
		// lấy các mẫu ads thuộc chiến dịch của AdSet này để luôn hiển thị đầy đủ
		if hasDateFilter {
			queryCamp := `
				SELECT
					ads.id,
					ads.adset_id,
					ads.meta_ad_id,
					ads.ad_name,
					ads.status,
					ads.creative_type,
					COALESCE(ads.post_id, '') AS post_id,
					COALESCE(ads.post_url, '') AS post_url,
					COALESCE(ads.post_message, '') AS post_message,
					COALESCE(ads.thumbnail_url, '') AS thumbnail_url,
					COALESCE(SUM(adi.spend), 0) AS spend,
					COALESCE(SUM(adi.impressions), 0) AS impressions,
					COALESCE(SUM(adi.clicks), 0) AS clicks,
					COALESCE(SUM(adi.messages), 0) AS messages,
					ads.created_at
				FROM ads
				LEFT JOIN ad_daily_insights adi ON adi.ad_id = ads.id AND adi.insight_date BETWEEN ? AND ?
				WHERE ads.campaign_id = (SELECT campaign_id FROM adsets WHERE id = ?)
				GROUP BY
					ads.id, ads.adset_id, ads.meta_ad_id, ads.ad_name, ads.status, ads.creative_type,
					ads.post_id, ads.post_url, ads.post_message, ads.thumbnail_url, ads.created_at
				ORDER BY spend DESC, ads.id ASC
				LIMIT 100
			`
			_ = r.db.SelectContext(ctx, &rows, queryCamp, sDate, eDate, adsetID)
			return rows, nil
		}

		queryCampAll := `
			SELECT
				ads.id,
				ads.adset_id,
				ads.meta_ad_id,
				ads.ad_name,
				ads.status,
				ads.creative_type,
				COALESCE(ads.post_id, '') AS post_id,
				COALESCE(ads.post_url, '') AS post_url,
				COALESCE(ads.post_message, '') AS post_message,
				COALESCE(ads.thumbnail_url, '') AS thumbnail_url,
				ads.spend,
				ads.impressions,
				ads.clicks,
				COALESCE(ads.messages, 0) AS messages,
				ads.created_at
			FROM ads
			WHERE ads.campaign_id = (SELECT campaign_id FROM adsets WHERE id = ?)
			ORDER BY ads.spend DESC, ads.id ASC
			LIMIT 100
		`
		_ = r.db.SelectContext(ctx, &rows, queryCampAll, adsetID)
		return rows, nil
	}

	// 2. Fallback nếu ID truyền vào là id của campaign (cho các chiến dịch cũ chưa có adset)
	if hasDateFilter {
		queryFallback := `
			SELECT
				ads.id,
				ads.adset_id,
				ads.meta_ad_id,
				ads.ad_name,
				ads.status,
				ads.creative_type,
				COALESCE(ads.post_id, '') AS post_id,
				COALESCE(ads.post_url, '') AS post_url,
				COALESCE(ads.post_message, '') AS post_message,
				COALESCE(ads.thumbnail_url, '') AS thumbnail_url,
				COALESCE(SUM(adi.spend), 0) AS spend,
				COALESCE(SUM(adi.impressions), 0) AS impressions,
				COALESCE(SUM(adi.clicks), 0) AS clicks,
				COALESCE(SUM(adi.messages), 0) AS messages,
				ads.created_at
			FROM ads
			LEFT JOIN ad_daily_insights adi ON adi.ad_id = ads.id AND adi.insight_date BETWEEN ? AND ?
			WHERE ads.campaign_id = ?
			   OR (ads.meta_campaign_id != '' AND ads.meta_campaign_id = (SELECT meta_campaign_id FROM campaigns WHERE id = ?))
			GROUP BY
				ads.id, ads.adset_id, ads.meta_ad_id, ads.ad_name, ads.status, ads.creative_type,
				ads.post_id, ads.post_url, ads.post_message, ads.thumbnail_url, ads.created_at
			ORDER BY spend DESC, ads.id ASC
			LIMIT 100
		`
		err := r.db.SelectContext(ctx, &rows, queryFallback, sDate, eDate, adsetID, adsetID)
		if err != nil {
			return nil, err
		}
		return rows, nil
	}

	queryFallbackAll := `
		SELECT
			ads.id,
			ads.adset_id,
			ads.meta_ad_id,
			ads.ad_name,
			ads.status,
			ads.creative_type,
			COALESCE(ads.post_id, '') AS post_id,
			COALESCE(ads.post_url, '') AS post_url,
			COALESCE(ads.post_message, '') AS post_message,
			COALESCE(ads.thumbnail_url, '') AS thumbnail_url,
			ads.spend,
			ads.impressions,
			ads.clicks,
			COALESCE(ads.messages, 0) AS messages,
			ads.created_at
		FROM ads
		WHERE ads.campaign_id = ?
		   OR (ads.meta_campaign_id != '' AND ads.meta_campaign_id = (SELECT meta_campaign_id FROM campaigns WHERE id = ?))
		ORDER BY ads.spend DESC, ads.id ASC
		LIMIT 100
	`
	err := r.db.SelectContext(ctx, &rows, queryFallbackAll, adsetID, adsetID)
	if err != nil {
		return nil, err
	}
	return rows, nil
}
