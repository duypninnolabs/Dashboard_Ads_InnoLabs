package adset

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

func (h *Handler) GetAdSets(c *gin.Context) {
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
	if camp := c.Query("campaign_id"); camp != "" {
		params.CampaignIDs = strings.Split(camp, ",")
	}
	if brand := c.Query("brand_id"); brand != "" {
		parts := strings.Split(brand, ",")
		for _, p := range parts {
			if id, err := strconv.ParseInt(strings.TrimSpace(p), 10, 64); err == nil {
				params.BrandIDs = append(params.BrandIDs, id)
			}
		}
	}
	if brandNames := c.Query("brand"); brandNames != "" {
		parts := strings.Split(brandNames, ",")
		for _, b := range parts {
			trimmed := strings.TrimSpace(b)
			if trimmed != "" {
				params.Brands = append(params.Brands, trimmed)
			}
		}
	}

	data, err := h.service.GetAdSetsSummary(c.Request.Context(), params)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Lấy danh sách Nhóm Quảng cáo (AdSet) thất bại: "+err.Error(),
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
			"Lấy danh sách AdSets thành công",
			data,
		),
	)
}

func (h *Handler) GetAdSetDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		c.JSON(
			http.StatusBadRequest,
			response.ErrorResponse(
				response.StatusInvalid,
				http.StatusBadRequest,
				"AdSet ID không hợp lệ",
				nil,
			),
		)
		return
	}

	startDate := strings.TrimSpace(c.Query("start_date"))
	endDate := strings.TrimSpace(c.Query("end_date"))

	detail, err := h.service.GetAdSetDetail(c.Request.Context(), id, startDate, endDate)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Lấy chi tiết AdSet thất bại: "+err.Error(),
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
			"Lấy chi tiết AdSet thành công",
			detail,
		),
	)
}
