package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// StorefrontMiddleware kiểm tra quyền truy cập Storefront
func StorefrontMiddleware(hashedPassword string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Lấy password từ Header "X-Storefront-Password"
		clientPassword := c.GetHeader("X-Storefront-Password")

		// 2. Nếu Header trống, lấy từ Cookie "storefront_pass"
		if clientPassword == "" {
			cookie, err := c.Cookie("storefront_pass")
			if err == nil {
				clientPassword = cookie
			}
		}

		// 3. Kiểm tra mật khẩu (Xác thực qua Bcrypt Hash)
		if clientPassword == "" || !CheckPasswordHash(clientPassword, hashedPassword) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Mật khẩu Storefront không chính xác hoặc chưa được cung cấp",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
