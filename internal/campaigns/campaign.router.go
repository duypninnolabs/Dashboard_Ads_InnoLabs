package campaign

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func RegisterRoutes(router *gin.RouterGroup, db *sqlx.DB) {
	repo := NewRepository(db)
	service := NewService(repo)
	handler := NewHandler(service)

	group := router.Group("/campaigns")
	{
		group.GET("", handler.GetCampaigns)
		group.GET("/:id", handler.GetCampaignDetail)
	}
}
