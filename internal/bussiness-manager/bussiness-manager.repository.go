package bussiness_manager

import (
	"context"
	"fmt"
	"strings"

	"dashboard--ads/pkg/crypto"

	"github.com/jmoiron/sqlx"
)

type BussinessManagerRepository interface {
	GetAllBusinessManagers() ([]BussinessManagerModel, error)
	GetBusinessManagerByID(ctx context.Context, id string) (*BussinessManagerModel, error)
	UpsertBusinessManager(ctx context.Context, req SaveBusinessManagerRequest) error
	UpdateBusinessManager(ctx context.Context, id string, req SaveBusinessManagerRequest) error
	DeleteBusinessManager(ctx context.Context, id string) error
}

type businessManagerRepository struct {
	db            *sqlx.DB
	encryptionKey string
}

func NewBusinessManagerRepository(
	db *sqlx.DB,
	encryptionKey string,
) BussinessManagerRepository {
	return &businessManagerRepository{
		db:            db,
		encryptionKey: encryptionKey,
	}
}

func (r *businessManagerRepository) GetAllBusinessManagers() ([]BussinessManagerModel, error) {
	var managers []BussinessManagerModel

	query := `
		SELECT
			id,
			platform,
			meta_business_id,
			business_name,
			is_active,
			initial_sync_completed,
			last_synced_at,
			created_at,
			updated_at
		FROM business_portfolios
		ORDER BY created_at DESC
	`
	err := r.db.Select(&managers, query)
	if err != nil {
		return nil, err
	}

	return managers, nil
}

func (r *businessManagerRepository) UpsertBusinessManager(ctx context.Context, req SaveBusinessManagerRequest) error {
	platform := strings.ToUpper(strings.TrimSpace(req.Platform))
	if platform == "" {
		platform = "META"
	}

	encryptedToken, err := crypto.Encrypt(req.Token, r.encryptionKey)
	if err != nil {
		return fmt.Errorf("mã hóa access token thất bại: %w", err)
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	query := `
		INSERT INTO business_portfolios (
			platform,
			meta_business_id,
			business_name,
			access_token,
			is_active
		)
		VALUES (?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			business_name = VALUES(business_name),
			access_token = VALUES(access_token),
			is_active = VALUES(is_active),
			updated_at = CURRENT_TIMESTAMP
	`

	_, err = r.db.ExecContext(
		ctx,
		query,
		platform,
		strings.TrimSpace(req.BMID),
		strings.TrimSpace(req.BusinessName),
		encryptedToken,
		isActive,
	)
	if err != nil {
		return fmt.Errorf("lưu Business Portfolio thất bại: %w", err)
	}

	return nil
}

func (r *businessManagerRepository) GetBusinessManagerByID(ctx context.Context, id string) (*BussinessManagerModel, error) {
	var bm BussinessManagerModel
	query := `
		SELECT
			id,
			platform,
			meta_business_id,
			business_name,
			is_active,
			initial_sync_completed,
			last_synced_at,
			created_at,
			updated_at
		FROM business_portfolios
		WHERE id = ? OR meta_business_id = ?
		LIMIT 1
	`
	err := r.db.GetContext(ctx, &bm, query, id, id)
	if err != nil {
		return nil, err
	}
	return &bm, nil
}

func (r *businessManagerRepository) UpdateBusinessManager(ctx context.Context, id string, req SaveBusinessManagerRequest) error {
	platform := strings.ToUpper(strings.TrimSpace(req.Platform))
	if platform == "" {
		platform = "META"
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	// Nếu người dùng có nhập token mới thì mã hóa và cập nhật token, nếu không nhập thì giữ nguyên token cũ
	if strings.TrimSpace(req.Token) != "" {
		encryptedToken, err := crypto.Encrypt(req.Token, r.encryptionKey)
		if err != nil {
			return fmt.Errorf("mã hóa access token thất bại: %w", err)
		}

		query := `
			UPDATE business_portfolios
			SET
				business_name = ?,
				platform = ?,
				access_token = ?,
				is_active = ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ? OR meta_business_id = ?
		`
		_, err = r.db.ExecContext(ctx, query, strings.TrimSpace(req.BusinessName), platform, encryptedToken, isActive, id, id)
		return err
	}

	query := `
		UPDATE business_portfolios
		SET
			business_name = ?,
			platform = ?,
			is_active = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ? OR meta_business_id = ?
	`
	_, err := r.db.ExecContext(ctx, query, strings.TrimSpace(req.BusinessName), platform, isActive, id, id)
	return err
}

func (r *businessManagerRepository) DeleteBusinessManager(ctx context.Context, id string) error {
	query := `DELETE FROM business_portfolios WHERE id = ? OR meta_business_id = ?`
	_, err := r.db.ExecContext(ctx, query, id, id)
	return err
}


