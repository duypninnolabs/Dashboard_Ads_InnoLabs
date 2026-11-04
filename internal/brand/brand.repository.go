package brand

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type BrandRepository interface {
	GetAllBrands(ctx context.Context) ([]BrandModel, error)
	GetBrandByID(ctx context.Context, id int64) (*BrandModel, error)
	CreateBrand(ctx context.Context, name string) (*BrandModel, error)
	DeleteBrand(ctx context.Context, id int64) error
}

type brandRepository struct {
	db *sqlx.DB
}

func NewBrandRepository(db *sqlx.DB) BrandRepository {
	return &brandRepository{
		db: db,
	}
}

func (r *brandRepository) GetAllBrands(ctx context.Context) ([]BrandModel, error) {
	var brands []BrandModel
	query := `
		SELECT
			b.id,
			b.brand_name,
			COALESCE(c.camps_count, 0) AS campaign_count,
			COALESCE(c.accs_count, 0) AS account_count,
			COALESCE(ast.adsets_count, 0) AS adset_count,
			COALESCE(a.ads_count, 0) AS ads_count,
			COALESCE(a.spend_meta, 0) AS spend_meta,
			COALESCE(a.spend_meta * 1.111, 0) AS total_spend,
			COALESCE(a.messages, 0) AS messages,
			COALESCE(a.clicks, 0) AS clicks,
			COALESCE(a.impressions, 0) AS impressions,
			b.created_at,
			b.updated_at
		FROM brands b
		LEFT JOIN (
			SELECT brand_id, COUNT(DISTINCT id) AS camps_count, COUNT(DISTINCT ad_account_id) AS accs_count
			FROM campaigns WHERE brand_id IS NOT NULL GROUP BY brand_id
		) c ON c.brand_id = b.id
		LEFT JOIN (
			SELECT brand_id, COUNT(DISTINCT id) AS adsets_count
			FROM adsets WHERE brand_id IS NOT NULL GROUP BY brand_id
		) ast ON ast.brand_id = b.id
		LEFT JOIN (
			SELECT brand_id, COUNT(DISTINCT id) AS ads_count, SUM(spend) AS spend_meta, SUM(messages) AS messages,
			       SUM(clicks) AS clicks, SUM(impressions) AS impressions
			FROM ads WHERE brand_id IS NOT NULL GROUP BY brand_id
		) a ON a.brand_id = b.id
		ORDER BY spend_meta DESC, b.id DESC
	`
	err := r.db.SelectContext(ctx, &brands, query)
	if err != nil {
		return nil, err
	}
	return brands, nil
}

func (r *brandRepository) GetBrandByID(ctx context.Context, id int64) (*BrandModel, error) {
	var item BrandModel
	query := `
		SELECT
			b.id,
			b.brand_name,
			COALESCE(c.camps_count, 0) AS campaign_count,
			COALESCE(c.accs_count, 0) AS account_count,
			COALESCE(ast.adsets_count, 0) AS adset_count,
			COALESCE(a.ads_count, 0) AS ads_count,
			COALESCE(a.spend_meta, 0) AS spend_meta,
			COALESCE(a.spend_meta * 1.111, 0) AS total_spend,
			COALESCE(a.messages, 0) AS messages,
			COALESCE(a.clicks, 0) AS clicks,
			COALESCE(a.impressions, 0) AS impressions,
			b.created_at,
			b.updated_at
		FROM brands b
		LEFT JOIN (
			SELECT brand_id, COUNT(DISTINCT id) AS camps_count, COUNT(DISTINCT ad_account_id) AS accs_count
			FROM campaigns WHERE brand_id = ? GROUP BY brand_id
		) c ON c.brand_id = b.id
		LEFT JOIN (
			SELECT brand_id, COUNT(DISTINCT id) AS adsets_count
			FROM adsets WHERE brand_id = ? GROUP BY brand_id
		) ast ON ast.brand_id = b.id
		LEFT JOIN (
			SELECT brand_id, COUNT(DISTINCT id) AS ads_count, SUM(spend) AS spend_meta, SUM(messages) AS messages,
			       SUM(clicks) AS clicks, SUM(impressions) AS impressions
			FROM ads WHERE brand_id = ? GROUP BY brand_id
		) a ON a.brand_id = b.id
		WHERE b.id = ?
		LIMIT 1
	`
	err := r.db.GetContext(ctx, &item, query, id, id, id, id)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *brandRepository) CreateBrand(ctx context.Context, name string) (*BrandModel, error) {
	res, err := r.db.ExecContext(ctx, "INSERT INTO brands (brand_name) VALUES (?)", name)
	if err != nil {
		return nil, fmt.Errorf("thêm thương hiệu thất bại hoặc tên đã tồn tại: %w", err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return r.GetBrandByID(ctx, id)
}

func (r *brandRepository) DeleteBrand(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM brands WHERE id = ?", id)
	return err
}
