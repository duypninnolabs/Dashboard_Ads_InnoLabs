package setting

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func RegisterRoutes(
	router *gin.RouterGroup,
	db *sqlx.DB,
) {
	repository := NewSettingRepository(db)
	handler := NewSettingHandler(repository)

	settingGroup := router.Group("/setting")
	{
		settingGroup.GET("", handler.GetAll)
		settingGroup.GET("/:key", handler.GetByKey)
		settingGroup.PUT("/:key", handler.Update)
	}

}
