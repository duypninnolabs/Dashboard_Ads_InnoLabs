package dashboard

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetSpend(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var bmIDs []string
	if rawBMs := c.Query("bm_ids"); rawBMs != "" {
		bmIDs = strings.Split(rawBMs, ",")
	}

	var accountIDs []string
	if rawAccs := c.Query("account_ids"); rawAccs != "" {
		accountIDs = strings.Split(rawAccs, ",")
	}

	var brands []string
	if rawBrands := c.Query("brands"); rawBrands != "" {
		brands = strings.Split(rawBrands, ",")
	}

	params := FilterParams{
		StartDate:  startDate,
		EndDate:    endDate,
		BMIDs:      bmIDs,
		AccountIDs: accountIDs,
		Brands:     brands,
	}

	result, err := h.service.GetDashboardSpend(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Lấy dữ liệu chi tiêu Meta Ads thành công",
		"data":    result,
	})
}

func (h *Handler) GetFilters(c *gin.Context) {
	result, err := h.service.GetFilterOptions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Lấy danh sách bộ lọc thành công",
		"data":    result,
	})
}
