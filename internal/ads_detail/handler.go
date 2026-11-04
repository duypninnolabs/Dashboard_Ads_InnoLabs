package ads_detail

import (
	"dashboard--ads/pkg/response"
	"fmt"
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

// GetAdsList trả về danh sách toàn bộ các Ads chi tiết kèm bộ lọc
func (h *Handler) GetAdsList(c *gin.Context) {
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
	if adset := c.Query("adset_id"); adset != "" {
		params.AdSetIDs = strings.Split(adset, ",")
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

	data, err := h.service.GetAdsSummary(c.Request.Context(), params)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Lấy danh sách Ads chi tiết thất bại: "+err.Error(),
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
			"Lấy danh sách Ads chi tiết thành công",
			data,
		),
	)
}

// GetAdDetail trả về chi tiết 1 Ad cụ thể và biểu đồ số liệu theo ngày
func (h *Handler) GetAdDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		c.JSON(
			http.StatusBadRequest,
			response.ErrorResponse(
				response.StatusInvalid,
				http.StatusBadRequest,
				"Ad ID không hợp lệ",
				nil,
			),
		)
		return
	}

	detail, err := h.service.GetAdDetail(c.Request.Context(), id)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Lấy thông tin chi tiết Ad thất bại: "+err.Error(),
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
			"Lấy chi tiết Ad thành công",
			detail,
		),
	)
}

// TriggerSyncAccountAds kích hoạt kéo dữ liệu Ads thật từ Meta Graph API
func (h *Handler) TriggerSyncAccountAds(c *gin.Context) {
	type SyncReq struct {
		AccountID string `json:"account_id"`
		StartDate string `json:"start_date"`
		EndDate   string `json:"end_date"`
	}
	var req SyncReq
	_ = c.ShouldBindJSON(&req)

	apiVersion := "v22.0"
	type ApiVerRow struct {
		Value string `db:"value"`
	}
	var vRow ApiVerRow
	if err := h.service.repo.db.GetContext(c.Request.Context(), &vRow, "SELECT `value` FROM settings WHERE `key` = 'meta_api_version' LIMIT 1"); err == nil && vRow.Value != "" {
		apiVersion = vRow.Value
	}

	count, err := h.service.SyncAllActiveAccountsAds(c.Request.Context(), apiVersion, req.AccountID, req.StartDate, req.EndDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.ErrorResponse(response.StatusError, http.StatusInternalServerError, "Lỗi đồng bộ Ads chi tiết: "+err.Error(), nil))
		return
	}

	c.JSON(http.StatusOK, response.SuccessResponse(http.StatusOK, response.StatusSuccess, fmt.Sprintf("Đồng bộ Ads chi tiết từ Meta thành công: đã quét và cập nhật %d Ads", count), map[string]interface{}{
		"synced_ads_count": count,
	}))
}
