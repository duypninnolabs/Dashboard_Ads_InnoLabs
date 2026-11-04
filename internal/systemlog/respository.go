package systemlog

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func toJSON(value any) []byte {
	if value == nil {
		return nil
	}

	data, err := json.Marshal(value)
	if err != nil {
		return nil
	}

	return data
}

func (r *Repository) Create(input CreateLogInput) error {
	query := `
		INSERT INTO system_logs (
			log_id,
			timestamp,
			level,
			message,
			service,
			host,
			user_id,
			ip,
			request_body,
			response,
			tags,
			errors,
			metadata
		) VALUES (?, NOW(3), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := r.db.Exec(
		query,
		uuid.NewString(),
		input.Level,
		input.Message,
		input.Service,
		input.Host,
		input.UserID,
		input.IP,
		toJSON(input.RequestBody),
		toJSON(input.Response),
		toJSON(input.Tags),
		toJSON(input.Errors),
		toJSON(input.Metadata),
	)

	return err
}

func (r *Repository) GetAll(
	level string,
	service string,
	search string,
	limit int,
	offset int,
) ([]SystemLog, int, error) {
	whereClauses := []string{"1=1"}
	args := []interface{}{}

	if level != "" {
		whereClauses = append(whereClauses, "level = ?")
		args = append(args, level)
	}

	if service != "" {
		whereClauses = append(whereClauses, "service = ?")
		args = append(args, service)
	}

	if search != "" {
		whereClauses = append(whereClauses, "(message LIKE ? OR ip LIKE ? OR service LIKE ?)")
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM system_logs WHERE %s", whereSQL)
	var total int
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		total = 0
	}

	query := fmt.Sprintf(`
		SELECT
			timestamp,
			level,
			message,
			log_id,
			service,
			host,
			user_id,
			ip,
			request_body,
			response,
			tags,
			errors,
			metadata
		FROM system_logs
		WHERE %s
		ORDER BY timestamp DESC
		LIMIT ? OFFSET ?
	`, whereSQL)

	queryArgs := append(args, limit, offset)
	rows, err := r.db.Query(query, queryArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	logs := make([]SystemLog, 0)

	for rows.Next() {
		var (
			item        SystemLog
			service     sql.NullString
			host        sql.NullString
			userID      sql.NullInt64
			ip          sql.NullString
			requestBody []byte
			response    []byte
			tags        []byte
			logErrors   []byte
			metadata    []byte
		)

		err := rows.Scan(
			&item.Timestamp,
			&item.Level,
			&item.Message,
			&item.LogID,
			&service,
			&host,
			&userID,
			&ip,
			&requestBody,
			&response,
			&tags,
			&logErrors,
			&metadata,
		)
		if err != nil {
			return nil, 0, err
		}

		if service.Valid {
			item.Service = &service.String
		}

		if host.Valid {
			item.Host = &host.String
		}

		if userID.Valid {
			value := uint64(userID.Int64)
			item.UserID = &value
		}

		if ip.Valid {
			item.IP = &ip.String
		}

		item.RequestBody = requestBody
		item.Response = response
		item.Tags = tags
		item.Errors = logErrors
		item.Metadata = metadata

		logs = append(logs, item)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

func (r *Repository) GetByID(
	logID string,
) (*SystemLog, error) {
	query := `
		SELECT
			timestamp,
			level,
			message,
			log_id,
			service,
			host,
			user_id,
			ip,
			request_body,
			response,
			tags,
			errors,
			metadata
		FROM system_logs
		WHERE log_id = ?
		LIMIT 1
	`

	var (
		item        SystemLog
		service     sql.NullString
		host        sql.NullString
		userID      sql.NullInt64
		ip          sql.NullString
		requestBody []byte
		response    []byte
		tags        []byte
		logErrors   []byte
		metadata    []byte
	)

	err := r.db.QueryRow(query, logID).Scan(
		&item.Timestamp,
		&item.Level,
		&item.Message,
		&item.LogID,
		&service,
		&host,
		&userID,
		&ip,
		&requestBody,
		&response,
		&tags,
		&logErrors,
		&metadata,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("system log not found")
		}

		return nil, err
	}

	if service.Valid {
		item.Service = &service.String
	}

	if host.Valid {
		item.Host = &host.String
	}

	if userID.Valid {
		value := uint64(userID.Int64)
		item.UserID = &value
	}

	if ip.Valid {
		item.IP = &ip.String
	}

	item.RequestBody = requestBody
	item.Response = response
	item.Tags = tags
	item.Errors = logErrors
	item.Metadata = metadata

	return &item, nil
}

func (r *Repository) DeleteOldLogs(
	before time.Time,
) error {
	_, err := r.db.Exec(
		`DELETE FROM system_logs WHERE timestamp < ?`,
		before,
	)

	return err
}
