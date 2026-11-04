package ads_detail

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func RegisterRoutes(router *gin.RouterGroup, db *sqlx.DB, encryptionKey string) {
	repo := NewRepository(db)
	service := NewService(repo, encryptionKey)
	handler := NewHandler(service)

	group := router.Group("/ads-detail")
	{
		group.GET("", handler.GetAdsList)
		group.GET("/:id", handler.GetAdDetail)
		group.POST("/sync", handler.TriggerSyncAccountAds)
	}
}
