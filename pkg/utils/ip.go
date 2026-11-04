package utils

import (
	"strings"

	"github.com/gin-gonic/gin"
)

// GetRealIP lấy IP của client.
// Nếu đang chạy local (127.0.0.1 hoặc ::1), ưu tiên lấy từ header X-Client-Real-IP do Frontend gửi lên.
func GetRealIP(c *gin.Context) string {
	clientIP := c.ClientIP()
	if clientIP == "127.0.0.1" || clientIP == "::1" || strings.HasPrefix(clientIP, "127.") || clientIP == "" {
		if realIP := strings.TrimSpace(c.GetHeader("X-Client-Real-IP")); realIP != "" {
			return realIP
		}
	}
	return clientIP
}
