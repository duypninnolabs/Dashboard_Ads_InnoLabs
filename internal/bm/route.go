package bm

import (
	"dashboard--ads/internal/ads_detail"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func RegisterRoutes(
	router *gin.RouterGroup,
	db *sqlx.DB,
	encryptionKey string,
) *Service {
	repo := NewRepository(
		db,
		encryptionKey,
	)

	adsRepo := ads_detail.NewRepository(db)
	adsService := ads_detail.NewService(adsRepo, encryptionKey)

	service := NewService(
		repo,
	)
	service.SetAdsDetailService(adsService)

	handler := NewHandler(
		service,
	)

	group := router.Group(
		"/business-manager",
	)

	{
		group.GET(
			"/brands",
			handler.ListBrands,
		)

		group.POST(
			"/sync-meta",
			handler.SyncMeta,
		)
	}

	return service
}
