package response

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Success   bool        `json:"success"`
	Status    int         `json:"status"`
	Code      int         `json:"code"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data"`
	Timestamp string      `json:"timestamp"`
}

func SuccessResponse(
	code int,
	status int,
	message string,
	data interface{},
) APIResponse {
	if message == "" {
		message = StatusText[StatusSuccess]
	}
	return APIResponse{
		Success:   true,
		Status:    status,
		Code:      code,
		Message:   message,
		Data:      data,
		Timestamp: time.Now().Format("2006-01-02 15:04:05"),
	}
}

func ErrorResponse(
	status int,
	code int,
	message string,
	data interface{},
) APIResponse {
	if message == "" {
		message = StatusText[StatusError]
	}
	return APIResponse{
		Success:   false,
		Status:    status,
		Code:      code,
		Message:   message,
		Data:      data,
		Timestamp: time.Now().Format("2006-01-02 15:04:05"),
	}
}

func ResponseSuccess(c *gin.Context, message string, data any) {
	c.JSON(
		http.StatusOK,
		SuccessResponse(
			http.StatusOK,
			200,
			message,
			data,
		),
	)
}
