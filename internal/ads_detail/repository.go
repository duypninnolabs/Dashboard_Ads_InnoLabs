package ads_detail

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

// EnsureSchema táº¡o báº£ng ads vÃ  báº£ng lÆ°u sá»‘ liá»‡u chi tiáº¿t theo ngÃ y náº¿u chÆ°a cÃ³
func (r *Repository) EnsureSchema(ctx context.Context) error {
	tblAds := `
	CREATE TABLE IF NOT EXISTS ads (
		id BIGINT AUTO_INCREMENT PRIMARY KEY,
		adset_id BIGINT NOT NULL,
		meta_ad_id VARCHAR(100) NOT NULL UNIQUE,
		ad_name VARCHAR(255) NOT NULL,
		status VARCHAR(50) DEFAULT 'ACTIVE',
		effective_status VARCHAR(50) DEFAULT 'ACTIVE',
		creative_type VARCHAR(50) DEFAULT 'IMAGE',
		post_id VARCHAR(100) DEFAULT NULL,
		post_url TEXT DEFAULT NULL,
		post_message TEXT DEFAULT NULL,
		thumbnail_url TEXT DEFAULT NULL,
		spend DECIMAL(15,2) DEFAULT 0,
		impressions BIGINT DEFAULT 0,
		reach BIGINT DEFAULT 0,
		clicks BIGINT DEFAULT 0,
		messages BIGINT DEFAULT 0,
		leads BIGINT DEFAULT 0,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		INDEX idx_ad_adset (adset_id),
		INDEX idx_ad_meta_id (meta_ad_id)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`

	if _, err := r.db.ExecContext(ctx, tblAds); err != nil {
		log.Printf("[AdsDetail] EnsureSchema ads err: %v", err)
	}

	// Äáº£m báº£o bá»• sung an toÃ n cÃ¡c cá»™t má»›i náº¿u báº£ng ads Ä‘Ã£ tá»“n táº¡i tá»« phiÃªn báº£n cÅ©
	type ColInfo struct {
		Field string `db:"Field"`
	}
	var existingCols []ColInfo
	_ = r.db.SelectContext(ctx, &existingCols, "DESCRIBE ads")
	hasCol := func(name string) bool {
		for _, c := range existingCols {
			if strings.EqualFold(c.Field, name) {
				return true
			}
		}
		return false
	}

	if !hasCol("effective_status") {
		_, _ = r.db.ExecContext(ctx, "ALTER TABLE ads ADD COLUMN effective_status VARCHAR(50) DEFAULT 'ACTIVE' AFTER status")
	}
	if !hasCol("post_id") {
		_, _ = r.db.ExecContext(ctx, "ALTER TABLE ads ADD COLUMN post_id VARCHAR(100) DEFAULT NULL AFTER creative_type")
	}
	if !hasCol("post_url") {
		_, _ = r.db.ExecContext(ctx, "ALTER TABLE ads ADD COLUMN post_url TEXT DEFAULT NULL AFTER post_id")
	}
	if !hasCol("post_message") {
		_, _ = r.db.ExecContext(ctx, "ALTER TABLE ads ADD COLUMN post_message TEXT DEFAULT NULL AFTER post_url")
	}
	if !hasCol("thumbnail_url") {
		_, _ = r.db.ExecContext(ctx, "ALTER TABLE ads ADD COLUMN thumbnail_url TEXT DEFAULT NULL AFTER post_message")
	}
	if !hasCol("reach") {
		_, _ = r.db.ExecContext(ctx, "ALTER TABLE ads ADD COLUMN reach BIGINT DEFAULT 0 AFTER impressions")
	}
	if !hasCol("messages") {
		_, _ = r.db.ExecContext(ctx, "ALTER TABLE ads ADD COLUMN messages BIGINT DEFAULT 0 AFTER clicks")
	}
	if !hasCol("leads") {
		_, _ = r.db.ExecContext(ctx, "ALTER TABLE ads ADD COLUMN leads BIGINT DEFAULT 0 AFTER messages")
	}
	if !hasCol("campaign_id") {
		_, _ = r.db.ExecContext(ctx, "ALTER TABLE ads ADD COLUMN campaign_id BIGINT DEFAULT NULL AFTER adset_id")
	}
	if !hasCol("meta_campaign_id") {
		_, _ = r.db.ExecContext(ctx, "ALTER TABLE ads ADD COLUMN meta_campaign_id VARCHAR(100) DEFAULT NULL AFTER meta_ad_id")
	}
	if !hasCol("meta_adset_id") {
		_, _ = r.db.ExecContext(ctx, "ALTER TABLE ads ADD COLUMN meta_adset_id VARCHAR(100) DEFAULT NULL AFTER meta_campaign_id")
	}

	tblAdDaily := `
	CREATE TABLE IF NOT EXISTS ad_daily_insights (
		id BIGINT AUTO_INCREMENT PRIMARY KEY,
		ad_id BIGINT NOT NULL,
		insight_date DATE NOT NULL,
		spend DECIMAL(15,2) NOT NULL DEFAULT 0,
		impressions BIGINT NOT NULL DEFAULT 0,
		reach BIGINT NOT NULL DEFAULT 0,
		clicks BIGINT NOT NULL DEFAULT 0,
		messages BIGINT NOT NULL DEFAULT 0,
		leads BIGINT NOT NULL DEFAULT 0,
		ctr DECIMAL(10,4) NOT NULL DEFAULT 0,
		cpc DECIMAL(15,2) NOT NULL DEFAULT 0,
		cpm DECIMAL(15,2) NOT NULL DEFAULT 0,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		UNIQUE KEY uq_ad_date (ad_id, insight_date),
		INDEX idx_ad_insight_date (insight_date),
		CONSTRAINT fk_insight_ad FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`

	if _, err := r.db.ExecContext(ctx, tblAdDaily); err != nil {
		log.Printf("[AdsDetail] EnsureSchema ad_daily_insights err: %v", err)
	}

	return nil
}

func (r *Repository) GetRates(ctx context.Context) (float64, float64, error) {
	vatRate := 0.10
	ftfRate := 0.011

	type SettingRow struct {
		Key   string `db:"key"`
		Value string `db:"value"`
	}
	var settings []SettingRow
	err := r.db.SelectContext(ctx, &settings, "SELECT `key`, `value` FROM settings WHERE `key` IN ('vat_rate', 'ftf_rate')")
	if err == nil {
		for _, s := range settings {
			if s.Key == "vat_rate" {
				if v, err := strconv.ParseFloat(s.Value, 64); err == nil {
					vatRate = v
				}
			} else if s.Key == "ftf_rate" {
				if v, err := strconv.ParseFloat(s.Value, 64); err == nil {
					ftfRate = v
				}
			}
		}
	}
	return vatRate, ftfRate, nil
}

// GetAdsList truy váº¥n danh sÃ¡ch ads kÃ¨m theo thÃ´ng tin adset, campaign, account, business vÃ  brand
func (r *Repository) GetAdsList(ctx context.Context, params FilterParams) ([]AdDetailRow, error) {
	whereClauses := []string{"1=1"}
	args := []interface{}{}

	if params.Search != "" {
		whereClauses = append(whereClauses, "(ads.ad_name LIKE ? OR ads.meta_ad_id LIKE ? OR ads.post_id LIKE ? OR ast.adset_name LIKE ? OR c.campaign_name LIKE ?)")
		searchTerm := "%" + params.Search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
	}

	if params.Status != "" && params.Status != "ALL" {
		whereClauses = append(whereClauses, "(ads.status = ? OR ads.effective_status = ?)")
		args = append(args, params.Status, params.Status)
	}

	if len(params.BMIDs) > 0 {
		placeholders := make([]string, len(params.BMIDs))
		for i, id := range params.BMIDs {
			placeholders[i] = "?"
			args = append(args, id)
		}
		whereClauses = append(whereClauses, fmt.Sprintf("bp.meta_business_id IN (%s)", strings.Join(placeholders, ",")))
	}

	if len(params.AccountIDs) > 0 {
		placeholders := make([]string, len(params.AccountIDs))
		for i, id := range params.AccountIDs {
			placeholders[i] = "?"
			args = append(args, id)
		}
		whereClauses = append(whereClauses, fmt.Sprintf("acc.meta_account_id IN (%s)", strings.Join(placeholders, ",")))
	}

	if len(params.CampaignIDs) > 0 {
		placeholders := make([]string, len(params.CampaignIDs))
		for i, id := range params.CampaignIDs {
			placeholders[i] = "?"
			args = append(args, id)
		}
		whereClauses = append(whereClauses, fmt.Sprintf("(c.meta_campaign_id IN (%s) OR c.id IN (%s))", strings.Join(placeholders, ","), strings.Join(placeholders, ",")))
		for _, id := range params.CampaignIDs {
			args = append(args, id)
		}
	}

	if len(params.AdSetIDs) > 0 {
		placeholders := make([]string, len(params.AdSetIDs))
		for i, id := range params.AdSetIDs {
			placeholders[i] = "?"
			args = append(args, id)
		}
		whereClauses = append(whereClauses, fmt.Sprintf("(ast.meta_adset_id IN (%s) OR ast.id IN (%s))", strings.Join(placeholders, ","), strings.Join(placeholders, ",")))
		for _, id := range params.AdSetIDs {
			args = append(args, id)
		}
	}

	if len(params.BrandIDs) > 0 {
		placeholders := make([]string, len(params.BrandIDs))
		for i, id := range params.BrandIDs {
			placeholders[i] = "?"
			args = append(args, id)
		}
		whereClauses = append(whereClauses, fmt.Sprintf("(ads.brand_id IN (%s) OR ast.brand_id IN (%s) OR c.brand_id IN (%s))", strings.Join(placeholders, ","), strings.Join(placeholders, ","), strings.Join(placeholders, ",")))
		for _, id := range params.BrandIDs {
			args = append(args, id)
		}
		for _, id := range params.BrandIDs {
			args = append(args, id)
		}
	}

	if len(params.Brands) > 0 {
		placeholders := make([]string, len(params.Brands))
		for i, b := range params.Brands {
			placeholders[i] = "?"
			args = append(args, b)
		}
		whereClauses = append(whereClauses, fmt.Sprintf("(b.brand_name IN (%s) OR LOWER(b.brand_name) IN (%s))", strings.Join(placeholders, ","), strings.Join(placeholders, ",")))
		for _, b := range params.Brands {
			args = append(args, strings.ToLower(b))
		}
	}

	var query string
	if params.StartDate != "" && params.EndDate != "" {
		query = fmt.Sprintf(`
			SELECT
				ads.id,
				ads.adset_id,
				ads.meta_ad_id,
				ads.ad_name,
				COALESCE(ads.status, 'ACTIVE') AS status,
				COALESCE(ads.effective_status, 'ACTIVE') AS effective_status,
				COALESCE(ads.creative_type, 'IMAGE') AS creative_type,
				COALESCE(ads.post_id, '') AS post_id,
				COALESCE(ads.post_url, '') AS post_url,
				COALESCE(ads.post_message, '') AS post_message,
				COALESCE(ads.thumbnail_url, '') AS thumbnail_url,
				COALESCE(c.id, 0) AS campaign_id,
				COALESCE(c.meta_campaign_id, '') AS meta_campaign_id,
				COALESCE(c.campaign_name, 'Chiáº¿n dá»‹ch') AS campaign_name,
				COALESCE(ast.meta_adset_id, '') AS meta_adset_id,
				COALESCE(ast.adset_name, 'NhÃ³m quáº£ng cÃ¡o') AS adset_name,
				COALESCE(acc.meta_account_id, '') AS meta_account_id,
				COALESCE(acc.account_name, 'TÃ i khoáº£n') AS account_name,
				COALESCE(acc.currency, 'VND') AS currency,
				COALESCE(bp.meta_business_id, '') AS meta_business_id,
				COALESCE(bp.business_name, 'InnoLabs Portfolio') AS business_name,
				b.id AS brand_id,
				COALESCE(b.brand_name, 'ChÆ°a gÃ¡n Brand') AS brand_name,
				COALESCE(SUM(adi.spend), 0) AS spend_meta,
				COALESCE(SUM(adi.impressions), 0) AS impressions,
				COALESCE(SUM(adi.reach), 0) AS reach,
				COALESCE(SUM(adi.clicks), 0) AS clicks,
				COALESCE(SUM(adi.messages), 0) AS messages,
				COALESCE(SUM(adi.leads), 0) AS leads,
				ads.created_at,
				ads.updated_at
			FROM ads
			LEFT JOIN adsets ast ON (ast.id = ads.adset_id OR (ads.meta_adset_id != '' AND ast.meta_adset_id = ads.meta_adset_id))
			LEFT JOIN campaigns c ON (c.id = ads.campaign_id OR (ads.meta_campaign_id != '' AND c.meta_campaign_id = ads.meta_campaign_id) OR c.id = ast.campaign_id)
			LEFT JOIN ad_accounts acc ON acc.id = c.ad_account_id
			LEFT JOIN business_portfolios bp ON bp.id = acc.business_portfolio_id
			LEFT JOIN brands b ON (b.id = ads.brand_id OR b.id = ast.brand_id OR b.id = c.brand_id)
			LEFT JOIN ad_daily_insights adi ON adi.ad_id = ads.id AND adi.insight_date BETWEEN ? AND ?
			WHERE %s
			GROUP BY
				ads.id, ads.adset_id, ads.meta_ad_id, ads.ad_name, ads.status, ads.effective_status,
				ads.creative_type, ads.post_id, ads.post_url, ads.post_message, ads.thumbnail_url,
				c.id, c.meta_campaign_id, c.campaign_name, ast.meta_adset_id, ast.adset_name,
				acc.meta_account_id, acc.account_name, acc.currency, bp.meta_business_id, bp.business_name,
				b.id, b.brand_name, ads.created_at, ads.updated_at
			ORDER BY spend_meta DESC, ads.id DESC
		`, strings.Join(whereClauses, " AND "))
		args = append([]interface{}{params.StartDate, params.EndDate}, args...)
	} else {
		query = fmt.Sprintf(`
			SELECT
				ads.id,
				ads.adset_id,
				ads.meta_ad_id,
				ads.ad_name,
				COALESCE(ads.status, 'ACTIVE') AS status,
				COALESCE(ads.effective_status, 'ACTIVE') AS effective_status,
				COALESCE(ads.creative_type, 'IMAGE') AS creative_type,
				COALESCE(ads.post_id, '') AS post_id,
				COALESCE(ads.post_url, '') AS post_url,
				COALESCE(ads.post_message, '') AS post_message,
				COALESCE(ads.thumbnail_url, '') AS thumbnail_url,
				COALESCE(c.id, 0) AS campaign_id,
				COALESCE(c.meta_campaign_id, '') AS meta_campaign_id,
				COALESCE(c.campaign_name, 'Chiáº¿n dá»‹ch') AS campaign_name,
				COALESCE(ast.meta_adset_id, '') AS meta_adset_id,
				COALESCE(ast.adset_name, 'NhÃ³m quáº£ng cÃ¡o') AS adset_name,
				COALESCE(acc.meta_account_id, '') AS meta_account_id,
				COALESCE(acc.account_name, 'TÃ i khoáº£n') AS account_name,
				COALESCE(acc.currency, 'VND') AS currency,
				COALESCE(bp.meta_business_id, '') AS meta_business_id,
				COALESCE(bp.business_name, 'InnoLabs Portfolio') AS business_name,
				b.id AS brand_id,
				COALESCE(b.brand_name, 'ChÆ°a gÃ¡n Brand') AS brand_name,
				COALESCE(ads.spend, 0) AS spend_meta,
				COALESCE(ads.impressions, 0) AS impressions,
				COALESCE(ads.reach, 0) AS reach,
				COALESCE(ads.clicks, 0) AS clicks,
				COALESCE(ads.messages, 0) AS messages,
				COALESCE(ads.leads, 0) AS leads,
				ads.created_at,
				ads.updated_at
			FROM ads
			LEFT JOIN adsets ast ON (ast.id = ads.adset_id OR (ads.meta_adset_id != '' AND ast.meta_adset_id = ads.meta_adset_id))
			LEFT JOIN campaigns c ON (c.id = ads.campaign_id OR (ads.meta_campaign_id != '' AND c.meta_campaign_id = ads.meta_campaign_id) OR c.id = ast.campaign_id)
			LEFT JOIN ad_accounts acc ON acc.id = c.ad_account_id
			LEFT JOIN business_portfolios bp ON bp.id = acc.business_portfolio_id
			LEFT JOIN brands b ON (b.id = ads.brand_id OR b.id = ast.brand_id OR b.id = c.brand_id)
			WHERE %s
			ORDER BY spend_meta DESC, ads.id DESC
		`, strings.Join(whereClauses, " AND "))
	}

	var rows []AdDetailRow
	err := r.db.SelectContext(ctx, &rows, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query ads list error: %w", err)
	}

	return rows, nil
}

// GetAdByID láº¥y thÃ´ng tin 1 ad theo ID
func (r *Repository) GetAdByID(ctx context.Context, id int64) (*AdDetailRow, error) {
	query := `
		SELECT
			ads.id,
			ads.adset_id,
			ads.meta_ad_id,
			ads.ad_name,
			COALESCE(ads.status, 'ACTIVE') AS status,
			COALESCE(ads.effective_status, 'ACTIVE') AS effective_status,
			COALESCE(ads.creative_type, 'IMAGE') AS creative_type,
			COALESCE(ads.post_id, '') AS post_id,
			COALESCE(ads.post_url, '') AS post_url,
			COALESCE(ads.post_message, '') AS post_message,
			COALESCE(ads.thumbnail_url, '') AS thumbnail_url,
			c.id AS campaign_id,
			c.meta_campaign_id,
			c.campaign_name,
			ast.meta_adset_id,
			ast.adset_name,
			acc.meta_account_id,
			acc.account_name,
			COALESCE(acc.currency, 'VND') AS currency,
			bp.meta_business_id,
			bp.business_name,
			b.id AS brand_id,
			COALESCE(b.brand_name, 'ChÆ°a gÃ¡n Brand') AS brand_name,
			COALESCE(ads.spend, 0) AS spend_meta,
			COALESCE(ads.impressions, 0) AS impressions,
			COALESCE(ads.reach, 0) AS reach,
			COALESCE(ads.clicks, 0) AS clicks,
			COALESCE(ads.messages, 0) AS messages,
			COALESCE(ads.leads, 0) AS leads,
			ads.created_at,
			ads.updated_at
		FROM ads
		JOIN adsets ast ON ast.id = ads.adset_id
		JOIN campaigns c ON c.id = ast.campaign_id
		JOIN ad_accounts acc ON acc.id = c.ad_account_id
		JOIN business_portfolios bp ON bp.id = acc.business_portfolio_id
		LEFT JOIN brands b ON (b.id = ads.brand_id OR b.id = ast.brand_id OR b.id = c.brand_id)
		WHERE ads.id = ?
		LIMIT 1
	`
	var row AdDetailRow
	err := r.db.GetContext(ctx, &row, query, id)
	if err != nil {
		return nil, err
	}
	return &row, nil
}

// GetAdDailyMetrics láº¥y lá»‹ch sá»­ chá»‰ sá»‘ theo ngÃ y cá»§a 1 ad
func (r *Repository) GetAdDailyMetrics(ctx context.Context, adID int64) ([]AdDailyMetric, error) {
	query := `
		SELECT
			DATE_FORMAT(insight_date, '%Y-%m-%d') AS insight_date,
			COALESCE(spend, 0) AS spend,
			COALESCE(impressions, 0) AS impressions,
			COALESCE(reach, 0) AS reach,
			COALESCE(clicks, 0) AS clicks,
			COALESCE(messages, 0) AS messages,
			COALESCE(leads, 0) AS leads
		FROM ad_daily_insights
		WHERE ad_id = ?
		ORDER BY insight_date DESC
		LIMIT 90
	`
	var rows []AdDailyMetric
	err := r.db.SelectContext(ctx, &rows, query, adID)
	if err != nil {
		return nil, err
	}
	return rows, nil
}

// UpsertMetaAds lưu cấu trúc Ads và Creative từ Facebook Graph API
func (r *Repository) UpsertMetaAds(ctx context.Context, ads []MetaAdDetail) error {
	if len(ads) == 0 {
		return nil
	}

	// 1. Đảm bảo mọi AdSet từ Meta đều có mặt trong bảng adsets với đúng campaign_id và brand_id
	adsetUpsertQuery := `
		INSERT INTO adsets (
			brand_id,
			campaign_id,
			meta_adset_id,
			adset_name,
			status,
			effective_status,
			created_at,
			updated_at
		)
		SELECT
			c.brand_id,
			c.id,
			?,
			?,
			?,
			?,
			CURRENT_TIMESTAMP,
			CURRENT_TIMESTAMP
		FROM campaigns c
		WHERE c.meta_campaign_id = ?
		LIMIT 1
		ON DUPLICATE KEY UPDATE
			brand_id = COALESCE(VALUES(brand_id), adsets.brand_id),
			campaign_id = COALESCE(VALUES(campaign_id), adsets.campaign_id),
			status = COALESCE(VALUES(status), adsets.status),
			effective_status = COALESCE(VALUES(effective_status), adsets.effective_status),
			updated_at = CURRENT_TIMESTAMP
	`
	if adsetStmt, err := r.db.PrepareContext(ctx, adsetUpsertQuery); err == nil {
		defer adsetStmt.Close()
		seenAdSets := make(map[string]bool)
		for _, ad := range ads {
			if ad.AdSetID == "" || seenAdSets[ad.AdSetID] {
				continue
			}
			seenAdSets[ad.AdSetID] = true
			effStatus := ad.EffectiveStatus
			if effStatus == "" {
				effStatus = ad.Status
			}
			adsetName := fmt.Sprintf("Nhóm QC %s", ad.AdSetID)
			_, _ = adsetStmt.ExecContext(ctx, ad.AdSetID, adsetName, ad.Status, effStatus, ad.CampaignID)
		}
	}

	// 2. Lưu Ads và Creative vào bảng ads
	query := `
		INSERT INTO ads (
			brand_id,
			adset_id,
			campaign_id,
			meta_ad_id,
			meta_adset_id,
			meta_campaign_id,
			ad_name,
			status,
			effective_status,
			creative_type,
			post_id,
			post_url,
			post_message,
			thumbnail_url
		)
		SELECT 
			COALESCE(a.brand_id, c.brand_id),
			COALESCE(a.id, 0),
			COALESCE(c.id, a.campaign_id, 0),
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
		FROM (SELECT 1) dummy
		LEFT JOIN adsets a ON a.meta_adset_id = ?
		LEFT JOIN campaigns c ON c.meta_campaign_id = ?
		LIMIT 1
		ON DUPLICATE KEY UPDATE
			brand_id = COALESCE(VALUES(brand_id), ads.brand_id),
			adset_id = IF(VALUES(adset_id) > 0, VALUES(adset_id), ads.adset_id),
			campaign_id = IF(VALUES(campaign_id) > 0, VALUES(campaign_id), ads.campaign_id),
			meta_adset_id = VALUES(meta_adset_id),
			meta_campaign_id = VALUES(meta_campaign_id),
			ad_name = VALUES(ad_name),
			status = VALUES(status),
			effective_status = VALUES(effective_status),
			creative_type = VALUES(creative_type),
			post_id = COALESCE(VALUES(post_id), ads.post_id),
			post_url = COALESCE(VALUES(post_url), ads.post_url),
			post_message = COALESCE(VALUES(post_message), ads.post_message),
			thumbnail_url = COALESCE(VALUES(thumbnail_url), ads.thumbnail_url),
			updated_at = CURRENT_TIMESTAMP
	`

	stmt, err := r.db.PrepareContext(ctx, query)
	if err != nil {
		return fmt.Errorf("prepare upsert ads error: %w", err)
	}
	defer stmt.Close()

	for _, ad := range ads {
		var postID, postURL, postMsg, thumbURL string
		creativeType := "IMAGE"

		if ad.Creative != nil {
			postID = ad.Creative.EffectiveObjectStoryID
			if postID == "" {
				postID = ad.Creative.ID
			}

			if ad.Creative.ThumbnailUrl != "" {
				thumbURL = ad.Creative.ThumbnailUrl
				creativeType = "VIDEO"
			} else if ad.Creative.ImageUrl != "" {
				thumbURL = ad.Creative.ImageUrl
				creativeType = "IMAGE"
			}

			if ad.Creative.Body != "" {
				postMsg = ad.Creative.Body
			} else if ad.Creative.Title != "" {
				postMsg = ad.Creative.Title
			}

			if postID != "" {
				parts := strings.Split(postID, "_")
				if len(parts) == 2 {
					postURL = fmt.Sprintf("https://facebook.com/%s/posts/%s", parts[0], parts[1])
				} else {
					postURL = fmt.Sprintf("https://facebook.com/%s", postID)
				}
			}
		}

		effStatus := ad.EffectiveStatus
		if effStatus == "" {
			effStatus = ad.Status
		}

		_, _ = stmt.ExecContext(
			ctx,
			ad.ID,
			ad.AdSetID,
			ad.CampaignID,
			ad.Name,
			ad.Status,
			effStatus,
			creativeType,
			postID,
			postURL,
			postMsg,
			thumbURL,
			ad.AdSetID,
			ad.CampaignID,
		)
	}

	// 3. Đảm bảo liên kết adset_id chính xác 100%
	_, _ = r.db.ExecContext(ctx, `
		UPDATE ads a
		JOIN adsets ast ON ast.meta_adset_id = a.meta_adset_id
		SET a.adset_id = ast.id,
		    a.brand_id = COALESCE(ast.brand_id, a.brand_id),
		    a.campaign_id = COALESCE(ast.campaign_id, a.campaign_id)
		WHERE a.adset_id = 0 OR a.adset_id IS NULL OR a.brand_id IS NULL OR a.campaign_id IS NULL
	`)

	return nil
}

// UpsertMetaAdInsights lÆ°u sá»‘ liá»‡u chi tiáº¿t theo ngÃ y cá»§a tá»«ng Ad vÃ  cáº­p nháº­t tá»•ng spend vÃ o báº£ng ads
func (r *Repository) UpsertMetaAdInsights(ctx context.Context, insights []MetaInsightRow) error {
	if len(insights) == 0 {
		return nil
	}

	query := `
		INSERT INTO ad_daily_insights (
			ad_id,
			insight_date,
			spend,
			impressions,
			reach,
			clicks,
			messages,
			leads,
			ctr,
			cpc,
			cpm
		)
		SELECT
			ads.id,
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
		FROM ads
		WHERE ads.meta_ad_id = ?
		LIMIT 1
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
			updated_at = CURRENT_TIMESTAMP
	`

	stmt, err := r.db.PrepareContext(ctx, query)
	if err != nil {
		return fmt.Errorf("prepare upsert ad insights error: %w", err)
	}
	defer stmt.Close()

	updatedAdIDs := make(map[string]bool)

	for _, ins := range insights {
		if ins.AdID == "" || ins.DateStart == "" {
			continue
		}

		spend, _ := strconv.ParseFloat(ins.Spend, 64)
		imp, _ := strconv.ParseInt(ins.Impressions, 10, 64)
		reach, _ := strconv.ParseInt(ins.Reach, 10, 64)
		clicks, _ := strconv.ParseInt(ins.Clicks, 10, 64)
		ctr, _ := strconv.ParseFloat(ins.CTR, 64)
		cpc, _ := strconv.ParseFloat(ins.CPC, 64)
		cpm, _ := strconv.ParseFloat(ins.CPM, 64)
		messages, leads := parseMetaActions(ins.Actions)

		_, _ = stmt.ExecContext(
			ctx,
			ins.DateStart,
			spend,
			imp,
			reach,
			clicks,
			messages,
			leads,
			ctr,
			cpc,
			cpm,
			ins.AdID,
		)
		updatedAdIDs[ins.AdID] = true
	}

	updateSpendQuery := `
		UPDATE ads
		SET
			spend = (SELECT COALESCE(SUM(spend), 0) FROM ad_daily_insights WHERE ad_id = ads.id),
			impressions = (SELECT COALESCE(SUM(impressions), 0) FROM ad_daily_insights WHERE ad_id = ads.id),
			reach = (SELECT COALESCE(SUM(reach), 0) FROM ad_daily_insights WHERE ad_id = ads.id),
			clicks = (SELECT COALESCE(SUM(clicks), 0) FROM ad_daily_insights WHERE ad_id = ads.id),
			messages = (SELECT COALESCE(SUM(messages), 0) FROM ad_daily_insights WHERE ad_id = ads.id),
			leads = (SELECT COALESCE(SUM(leads), 0) FROM ad_daily_insights WHERE ad_id = ads.id),
			updated_at = CURRENT_TIMESTAMP
		WHERE meta_ad_id = ?
	`
	for metaAdID := range updatedAdIDs {
		_, _ = r.db.ExecContext(ctx, updateSpendQuery, metaAdID)
	}

	// Cập nhật tên thật của AdSet từ Meta Insights
	adsetNameUpdateQuery := `
		UPDATE adsets
		SET adset_name = ?, updated_at = CURRENT_TIMESTAMP
		WHERE meta_adset_id = ? AND (adset_name LIKE 'Nhóm QC %' OR adset_name = '' OR adset_name IS NULL)
	`
	if adsetNameStmt, err := r.db.PrepareContext(ctx, adsetNameUpdateQuery); err == nil {
		defer adsetNameStmt.Close()
		seenInsightAdSets := make(map[string]bool)
		for _, ins := range insights {
			if ins.AdSetID == "" || ins.AdSetName == "" || seenInsightAdSets[ins.AdSetID] {
				continue
			}
			seenInsightAdSets[ins.AdSetID] = true
			_, _ = adsetNameStmt.ExecContext(ctx, ins.AdSetName, ins.AdSetID)
		}
	}

	return nil
}
