package setting

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"dashboard--ads/internal/systemlog"
	"dashboard--ads/pkg/response"
	"dashboard--ads/pkg/utils"

	"github.com/gin-gonic/gin"
)

type UpdateSettingRequest struct {
	Value         interface{} `json:"value" binding:"required"`
	DataType      string      `json:"data_type" binding:"required"`
	Description   *string     `json:"description"`
	EffectiveDate *string     `json:"effective_date"`
	UpdatedBy     *string     `json:"updated_by"`
}

type Handler struct {
	repo    *Repository
	logRepo *systemlog.Repository
}

func NewSettingHandler(repository *Repository) *Handler {
	var lr *systemlog.Repository
	if repository != nil && repository.db != nil {
		lr = systemlog.NewRepository(repository.db.DB)
	}
	return &Handler{
		repo:    repository,
		logRepo: lr,
	}
}

func stringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// GetAll - Lấy toàn bộ danh sách cấu hình
func (h *Handler) GetAll(c *gin.Context) {
	settings, err := h.repo.GetAll()
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Lỗi hệ thống: "+err.Error(),
				nil,
			),
		)
		return
	}

	responseData := make([]SettingResponseItem, 0, len(settings))

	for _, s := range settings {
		responseData = append(
			responseData,
			mapToResponseItem(s),
		)
	}

	c.JSON(
		http.StatusOK,
		response.SuccessResponse(
			http.StatusOK,
			response.StatusSuccess,
			"Lấy danh sách cấu hình hệ thống thành công",
			responseData,
		),
	)
}

// GetByKey - Lấy cấu hình chi tiết theo Key
func (h *Handler) GetByKey(c *gin.Context) {
	key := c.Param("key")

	setting, err := h.repo.GetByKey(key)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Lỗi hệ thống: "+err.Error(),
				nil,
			),
		)
		return
	}

	if setting == nil {
		c.JSON(
			http.StatusNotFound,
			response.ErrorResponse(
				response.StatusNotFound,
				http.StatusNotFound,
				"Không tìm thấy cấu hình với key: "+key,
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
			"Lấy thông tin cấu hình thành công",
			mapToResponseItem(*setting),
		),
	)
}

// Update - Cập nhật cấu hình theo Key
func (h *Handler) Update(c *gin.Context) {
	key := c.Param("key")

	var req UpdateSettingRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(
			http.StatusBadRequest,
			response.ErrorResponse(
				response.StatusInvalid,
				http.StatusBadRequest,
				"Dữ liệu yêu cầu không hợp lệ: "+err.Error(),
				nil,
			),
		)
		return
	}

	existing, err := h.repo.GetByKey(key)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Lỗi hệ thống: "+err.Error(),
				nil,
			),
		)
		return
	}

	if existing == nil {
		c.JSON(
			http.StatusNotFound,
			response.ErrorResponse(
				response.StatusNotFound,
				http.StatusNotFound,
				"Không tìm thấy cấu hình để cập nhật",
				nil,
			),
		)
		return
	}

	settingToUpdate := &Setting{
		Key:         key,
		Value:       fmt.Sprintf("%v", req.Value),
		DataType:    req.DataType,
		Description: req.Description,
		UpdatedBy:   req.UpdatedBy,
	}

	if req.EffectiveDate != nil && *req.EffectiveDate != "" {
		t, err := time.Parse(
			"2006-01-02",
			*req.EffectiveDate,
		)

		if err != nil {
			c.JSON(
				http.StatusBadRequest,
				response.ErrorResponse(
					response.StatusInvalid,
					http.StatusBadRequest,
					"Định dạng ngày effective_date không hợp lệ (cần YYYY-MM-DD)",
					nil,
				),
			)
			return
		}

		settingToUpdate.EffectiveDate = &t
	}

	if err := h.repo.Update(settingToUpdate); err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Cập nhật cấu hình thất bại: "+err.Error(),
				nil,
			),
		)
		return
	}

	if h.logRepo != nil {
		oldVal := existing.Value
		newVal := settingToUpdate.Value
		_ = h.logRepo.Create(systemlog.CreateLogInput{
			Level:   "ACTION",
			Message: fmt.Sprintf("Thay đổi cấu hình '%s': %s -> %s", key, oldVal, newVal),
			Service: "setting",
			IP:      utils.GetRealIP(c),
			Tags:    []string{"config", "setting", key},
			Metadata: map[string]interface{}{
				"key":       key,
				"old_value": oldVal,
				"new_value": newVal,
				"user_agent": c.GetHeader("User-Agent"),
			},
		})
	}

	c.JSON(
		http.StatusOK,
		response.SuccessResponse(
			http.StatusOK,
			response.StatusSuccess,
			"Cập nhật cấu hình thành công",
			nil,
		),
	)
}

// Helper: Chuyển entity Setting sang DTO Response
func mapToResponseItem(s Setting) SettingResponseItem {
	item := SettingResponseItem{
		Key:         s.Key,
		Value:       parseSettingValue(s.Value, s.DataType),
		DataType:    s.DataType,
		Description: stringValue(s.Description),
		UpdatedBy:   s.UpdatedBy,
		UpdatedAt:   s.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	if s.EffectiveDate != nil {
		dateStr := s.EffectiveDate.Format("2006-01-02")
		item.EffectiveDate = &dateStr
	}

	return item
}

func parseSettingValue(
	value string,
	dataType string,
) interface{} {
	switch dataType {

	case "number", "float":
		if v, err := strconv.ParseFloat(value, 64); err == nil {
			return v
		}

	case "int", "integer":
		if v, err := strconv.Atoi(value); err == nil {
			return v
		}

	case "boolean", "bool":
		if v, err := strconv.ParseBool(value); err == nil {
			return v
		}
	}

	return value
}
