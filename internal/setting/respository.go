package setting

import (
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"
)

type Repository struct {
	db *sqlx.DB
}

func NewSettingRepository(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetAll() ([]Setting, error) {
	settings := make([]Setting, 0)

	query := `
		SELECT ` + "`key`, `value`, `data_type`, `description`, `effective_date`, `updated_by`, `updated_at`" + ` 
		FROM system_settings
	`
	err := r.db.Select(&settings, query)
	if err != nil {
		return nil, err
	}

	return settings, nil
}

// GetByKey: Lấy 1 bản ghi theo Key
func (r *Repository) GetByKey(key string) (*Setting, error) {
	var setting Setting

	query := `
		SELECT ` + "`key`, `value`, `data_type`, `description`, `effective_date`, `updated_by`, `updated_at`" + ` 
		FROM system_settings 
		WHERE ` + "`key`" + ` = ? 
		LIMIT 1
	`

	err := r.db.Get(&setting, query, key)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil // Trả về nil nếu không tìm thấy record
		}
		return nil, err
	}

	return &setting, nil
}

// Update: Chỉnh sửa thông tin cấu hình theo Key
func (r *Repository) Update(setting *Setting) error {
	query := `
		UPDATE system_settings 
		SET ` + "`value` = :value, `data_type` = :data_type, `description` = :description, `effective_date` = :effective_date, `updated_by` = :updated_by, `updated_at` = NOW()" + `
		WHERE ` + "`key` = :key" + `
	`

	// NamedExec tự động bind các trường của struct setting vào placeholder :name
	result, err := r.db.NamedExec(query, setting)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("không tìm thấy bản ghi để cập nhật")
	}

	return nil
}
