package campaign

import (
	"dashboard--ads/pkg/response"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetCampaigns(c *gin.Context) {
	var params FilterParams
	params.StartDate = c.Query("start_date")
	params.EndDate = c.Query("end_date")
	params.Status = c.Query("status")
	params.Search = strings.TrimSpace(c.Query("search"))

	if bm := c.Query("bm_id"); bm != "" {
		params.BMIDs = strings.Split(bm, ",")
	}
	if acc := c.Query("account_id"); acc != "" {
		params.AccountIDs = strings.Split(acc, ",")
	}
	if brand := c.Query("brand_id"); brand != "" {
		parts := strings.Split(brand, ",")
		for _, p := range parts {
			if id, err := strconv.ParseInt(strings.TrimSpace(p), 10, 64); err == nil {
				params.BrandIDs = append(params.BrandIDs, id)
			}
		}
	}

	data, err := h.service.GetCampaignsSummary(c.Request.Context(), params)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Lấy danh sách Chiến dịch (Campaign) thất bại: "+err.Error(),
				nil,
			),
		)
		return
	}

	c.JSON(
		http.StatusOK,
		response.SuccessResponse(
			http.StatusOK,
			response.StatusSuccess,
			"Lấy danh sách Chiến dịch thành công",
			data,
		),
	)
}

func (h *Handler) GetCampaignDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		c.JSON(
			http.StatusBadRequest,
			response.ErrorResponse(
				response.StatusInvalid,
				http.StatusBadRequest,
				"Campaign ID không hợp lệ",
				nil,
			),
		)
		return
	}

	detail, err := h.service.GetCampaignDetail(c.Request.Context(), id)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Lấy chi tiết Chiến dịch thất bại: "+err.Error(),
				nil,
			),
		)
		return
	}

	c.JSON(
		http.StatusOK,
		response.SuccessResponse(
			http.StatusOK,
			response.StatusSuccess,
			"Lấy chi tiết Chiến dịch thành công",
			detail,
		),
	)
}
