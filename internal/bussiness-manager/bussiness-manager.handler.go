package bussiness_manager

import (
	"net/http"

	"dashboard--ads/pkg/response"

	"github.com/gin-gonic/gin"
)

type BussinessManagerHandler struct {
	service BussinessManagerService
}

func NewBussinessManagerHandler(
	service BussinessManagerService,
) *BussinessManagerHandler {
	return &BussinessManagerHandler{
		service: service,
	}
}

func (h *BussinessManagerHandler) GetAllBusinessManagers(c *gin.Context) {
	data, err := h.service.GetAllBusinessManagers()
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Lấy danh sách Business Manager thất bại: "+err.Error(),
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
			"Lấy danh sách Business Manager thành công",
			data,
		),
	)
}

func (h *BussinessManagerHandler) VerifyBusinessManager(c *gin.Context) {
	var req VerifyBusinessManagerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(
			http.StatusBadRequest,
			response.ErrorResponse(
				response.StatusError,
				http.StatusBadRequest,
				"Dữ liệu không hợp lệ: "+err.Error(),
				nil,
			),
		)
		return
	}

	res, err := h.service.VerifyBusinessManager(c.Request.Context(), req)
	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Lỗi xác thực: "+err.Error(),
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
			"Kiểm tra token hoàn tất",
			res,
		),
	)
}

func (h *BussinessManagerHandler) SaveBusinessManager(c *gin.Context) {
	var req SaveBusinessManagerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(
			http.StatusBadRequest,
			response.ErrorResponse(
				response.StatusError,
				http.StatusBadRequest,
				"Dữ liệu không hợp lệ: "+err.Error(),
				nil,
			),
		)
		return
	}

	if err := h.service.SaveBusinessManager(c.Request.Context(), req); err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Lưu Business Manager thất bại: "+err.Error(),
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
			"Lưu Business Manager thành công",
			gin.H{"bm_id": req.BMID},
		),
	)
}

func (h *BussinessManagerHandler) GetBusinessManagerByID(c *gin.Context) {
	id := c.Param("id")
	data, err := h.service.GetBusinessManagerByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(
			http.StatusNotFound,
			response.ErrorResponse(
				response.StatusError,
				http.StatusNotFound,
				"Không tìm thấy Business Manager: "+err.Error(),
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
			"Lấy thông tin Business Manager thành công",
			data,
		),
	)
}

func (h *BussinessManagerHandler) UpdateBusinessManager(c *gin.Context) {
	id := c.Param("id")
	var req SaveBusinessManagerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(
			http.StatusBadRequest,
			response.ErrorResponse(
				response.StatusError,
				http.StatusBadRequest,
				"Dữ liệu không hợp lệ: "+err.Error(),
				nil,
			),
		)
		return
	}

	if err := h.service.UpdateBusinessManager(c.Request.Context(), id, req); err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Cập nhật Business Manager thất bại: "+err.Error(),
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
			"Cập nhật Business Manager thành công",
			gin.H{"id": id},
		),
	)
}

func (h *BussinessManagerHandler) DeleteBusinessManager(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.DeleteBusinessManager(c.Request.Context(), id); err != nil {
		c.JSON(
			http.StatusInternalServerError,
			response.ErrorResponse(
				response.StatusError,
				http.StatusInternalServerError,
				"Xóa Business Manager thất bại: "+err.Error(),
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
			"Xóa Business Manager thành công",
			gin.H{"id": id},
		),
	)
}


