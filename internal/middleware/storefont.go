package middleware

import (
	"crypto/subtle"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func StorefrontPassword() gin.HandlerFunc {
	return func(c *gin.Context) {
		username, password, ok := c.Request.BasicAuth()

		expectedUsername := os.Getenv("STOREFRONT_USERNAME")
		expectedPassword := os.Getenv("STOREFRONT_PASSWORD")

		usernameValid := subtle.ConstantTimeCompare(
			[]byte(username),
			[]byte(expectedUsername),
		) == 1

		passwordValid := subtle.ConstantTimeCompare(
			[]byte(password),
			[]byte(expectedPassword),
		) == 1

		if !ok || !usernameValid || !passwordValid {
			c.Header(
				"WWW-Authenticate",
				`Basic realm="InnoLabs Dashboard"`,
			)

			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			return
		}

		c.Next()
	}
}
