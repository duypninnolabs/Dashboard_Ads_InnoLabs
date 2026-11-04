package bussiness_manager

import "time"

type BussinessManagerModel struct {
	ID                   string     `db:"id" json:"id"`
	Platform             string     `db:"platform" json:"platform"`
	MetaBusinessID       string     `db:"meta_business_id" json:"meta_business_id"`
	BusinessName         string     `db:"business_name" json:"business_name"`
	IsActive             bool       `db:"is_active" json:"is_active"`
	InitialSyncCompleted bool       `db:"initial_sync_completed" json:"initial_sync_completed"`
	LastSyncedAt         *time.Time `db:"last_synced_at" json:"last_synced_at"`
	CreatedAt            time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt            time.Time  `db:"updated_at" json:"updated_at"`
}

type VerifyBusinessManagerRequest struct {
	Platform string `json:"platform"`
	BMID     string `json:"bm_id" binding:"required"`
	Token    string `json:"token" binding:"required"`
}

type VerifyBusinessManagerResponse struct {
	Valid        bool   `json:"valid"`
	BMID         string `json:"bm_id"`
	BusinessName string `json:"business_name"`
	Message      string `json:"message"`
}

type SaveBusinessManagerRequest struct {
	Platform     string `json:"platform"`
	BMID         string `json:"bm_id" binding:"required"`
	BusinessName string `json:"business_name"`
	Token        string `json:"token" binding:"required"`
	IsActive     *bool  `json:"is_active"`
}

