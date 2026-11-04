package bussiness_manager

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func RegisterBusinessManagerRoutes(
	router *gin.RouterGroup,
	db *sqlx.DB,
	encryptionKey string,
) {
	repository := NewBusinessManagerRepository(db, encryptionKey)
	service := NewBusinessManagerService(repository)
	handler := NewBussinessManagerHandler(service)

	group := router.Group("/business-managers")

	group.GET("", handler.GetAllBusinessManagers)
	group.GET("/:id", handler.GetBusinessManagerByID)
	group.POST("/verify", handler.VerifyBusinessManager)
	group.POST("", handler.SaveBusinessManager)
	group.PUT("/:id", handler.UpdateBusinessManager)
	group.DELETE("/:id", handler.DeleteBusinessManager)
}

