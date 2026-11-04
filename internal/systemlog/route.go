package systemlog

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(
	router *gin.RouterGroup,
	db *sql.DB,
) {
	repository := NewRepository(db)
	handler := NewHandler(repository)

	router.GET(
		"/system-logs",
		handler.GetAll,
	)

	router.GET(
		"/system-logs/:log_id",
		handler.GetByID,
	)
}
