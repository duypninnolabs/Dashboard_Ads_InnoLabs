package brand

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func RegisterBrandRoutes(
	router *gin.RouterGroup,
	db *sqlx.DB,

) {
	respository := NewBrandRepository(db)
	service := NewBrandService(respository)
	handler := NewBrandHandler(service)
	group := router.Group("/brands")
	group.GET("", handler.GetAllBrands)
	group.POST("", handler.CreateBrand)
	group.GET("/:id", handler.GetDetailBrand)
	group.DELETE("/:id", handler.DeleteBrand)
}
