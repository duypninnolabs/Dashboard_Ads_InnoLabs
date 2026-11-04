package auth

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup, db *sql.DB, username, hashedPassword string) {
	handler := NewAuthHandler(db, username, hashedPassword)

	authGroup := router.Group("/auth")
	{
		authGroup.POST("/verify-storefront", handler.VerifyStorefront)
		authGroup.POST("/logout", handler.LogoutStorefront)
	}
}
