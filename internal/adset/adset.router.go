package adset

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func RegisterRoutes(router *gin.RouterGroup, db *sqlx.DB) {
	repo := NewRepository(db)
	service := NewService(repo)
	handler := NewHandler(service)

	group := router.Group("/adsets")
	{
		group.GET("", handler.GetAdSets)
		group.GET("/:id", handler.GetAdSetDetail)
	}
}
