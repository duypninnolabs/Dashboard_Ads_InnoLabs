package routes

import (
	"dashboard--ads/internal/ads_detail"
	"dashboard--ads/internal/adset"
	"dashboard--ads/internal/auth"
	"dashboard--ads/internal/bm"
	"dashboard--ads/internal/brand"
	bussiness_manager "dashboard--ads/internal/bussiness-manager"
	campaign "dashboard--ads/internal/campaigns"
	"dashboard--ads/internal/dashboard"
	"dashboard--ads/internal/setting"
	"dashboard--ads/internal/systemlog"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func RegisterRoutes(
	router *gin.Engine,
	db *sqlx.DB,
	username string,
	hashedPass string,
	encryptionKey string,
) {
	api := router.Group("/api/v1")

	// Public
	auth.RegisterRoutes(
		api,
		db.DB,
		username,
		hashedPass,
	)

	// Protected
	protected := api.Group("")
	protected.Use(
		auth.StorefrontMiddleware(hashedPass),
	)

	{
		setting.RegisterRoutes(
			protected,
			db,
		)

		bm.RegisterRoutes(
			protected,
			db,
			encryptionKey,
		)

		bussiness_manager.RegisterBusinessManagerRoutes(
			protected,
			db,
			encryptionKey,
		)
		brand.RegisterBrandRoutes(
			protected,
			db,
		)
		adset.RegisterRoutes(
			protected,
			db,
		)
		ads_detail.RegisterRoutes(
			protected,
			db,
			encryptionKey,
		)
		campaign.RegisterRoutes(
			protected,
			db,
		)
		dashboard.RegisterRoutes(
			protected,
			db,
		)
		systemlog.RegisterRoutes(
			protected,
			db.DB,
		)
	}
}
