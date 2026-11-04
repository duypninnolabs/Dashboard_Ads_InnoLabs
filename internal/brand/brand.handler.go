package brand

import (
	"dashboard--ads/pkg/response"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type BrandHandler struct {
	service BrandService
}

func NewBrandHandler(service BrandService) *BrandHandler {
	return &BrandHandler{
		service: service,
	}
}

func (h *BrandHandler) GetAllBrands(c *gin.Context) {
	data, err := h.service.GetAllBrands(c.Request.Context())
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Lấy danh sách Brand thất bại: "+err.Error(),
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
			"Lấy danh sách Brand thành công",
			data,
		),
	)
}

func (h *BrandHandler) GetDetailBrand(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		c.JSON(
			http.StatusBadRequest,
			response.ErrorResponse(
				response.StatusError,
				http.StatusBadRequest,
				"Brand ID không hợp lệ",
				nil,
			),
		)
		return
	}

	data, err := h.service.GetBrandByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Lấy chi tiết Brand thất bại: "+err.Error(),
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
			"Lấy chi tiết Brand thành công",
			data,
		),
	)
}

func (h *BrandHandler) CreateBrand(c *gin.Context) {
	var req CreateBrandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(
			http.StatusBadRequest,
			response.ErrorResponse(
				response.StatusInvalid,
				http.StatusBadRequest,
				"Dữ liệu gửi lên không hợp lệ, vui lòng nhập tên Brand",
				nil,
			),
		)
		return
	}

	name := strings.TrimSpace(req.BrandName)
	if name == "" {
		c.JSON(
			http.StatusBadRequest,
			response.ErrorResponse(
				response.StatusInvalid,
				http.StatusBadRequest,
				"Tên thương hiệu không được để trống",
				nil,
			),
		)
		return
	}

	data, err := h.service.CreateBrand(c.Request.Context(), name)
	if err != nil {
		c.JSON(
			http.StatusBadRequest,
			response.ErrorResponse(
				response.StatusError,
				http.StatusBadRequest,
				err.Error(),
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
			"Thêm thương hiệu thành công",
			data,
		),
	)
}

func (h *BrandHandler) DeleteBrand(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		c.JSON(
			http.StatusBadRequest,
			response.ErrorResponse(
				response.StatusError,
				http.StatusBadRequest,
				"Brand ID không hợp lệ",
				nil,
			),
		)
		return
	}

	err = h.service.DeleteBrand(c.Request.Context(), id)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Xóa Brand thất bại: "+err.Error(),
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
			"Xóa thương hiệu thành công",
			nil,
		),
	)
}