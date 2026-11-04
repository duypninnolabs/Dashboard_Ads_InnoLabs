package bm

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(
	service *Service,
) *Handler {
	return &Handler{
		service: service,
	}
}

func (h *Handler) ListBrands(
	c *gin.Context,
) {
	brands, err :=
		h.service.ListBrands(
			c.Request.Context(),
		)

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": err.Error(),
				"data":    nil,
			},
		)
		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"message": "Lấy danh sách brands thành công",
			"data":    brands,
		},
	)
}

func (h *Handler) SyncMeta(
	c *gin.Context,
) {
	result, err := h.service.SyncMeta(
		c.Request.Context(),
	)

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"message": err.Error(),
				"data":    nil,
			},
		)
		return
	}

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"message": "Đồng bộ Meta thành công",
			"data":    result,
		},
	)
}
