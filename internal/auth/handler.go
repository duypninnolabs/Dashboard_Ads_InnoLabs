package auth

import (
	"database/sql"
	"fmt"
	"net/http"

	"dashboard--ads/internal/systemlog"
	"dashboard--ads/pkg/response"
	"dashboard--ads/pkg/utils"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	db                       *sql.DB
	logRepo                  *systemlog.Repository
	ExpectedUsername         string
	HashedStorefrontPassword string
}

func NewAuthHandler(db *sql.DB, username, hashedPassword string) *AuthHandler {
	var repo *systemlog.Repository
	if db != nil {
		repo = systemlog.NewRepository(db)
	}
	return &AuthHandler{
		db:                       db,
		logRepo:                  repo,
		ExpectedUsername:         username,
		HashedStorefrontPassword: hashedPassword,
	}
}

type VerifyRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) VerifyStorefront(c *gin.Context) {
	var req VerifyRequest

	clientIP := utils.GetRealIP(c)
	userAgent := c.GetHeader("User-Agent")

	// Validate body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(
			http.StatusBadRequest,
			response.ErrorResponse(
				response.StatusInvalid,
				http.StatusBadRequest,
				"Dữ liệu gửi lên không hợp lệ",
				nil,
			),
		)
		return
	}

	// Kiểm tra username
	if req.Username != h.ExpectedUsername {
		if h.logRepo != nil {
			_ = h.logRepo.Create(systemlog.CreateLogInput{
				Level:   "WARN",
				Message: fmt.Sprintf("Đăng nhập thất bại: Tài khoản '%s' không tồn tại", req.Username),
				Service: "auth",
				IP:      clientIP,
				Tags:    []string{"login", "auth", "failed"},
				Metadata: map[string]interface{}{
					"username":   req.Username,
					"user_agent": userAgent,
					"status":     "failed",
					"reason":     "wrong_username",
				},
			})
		}

		c.JSON(
			http.StatusUnauthorized,
			response.ErrorResponse(
				response.StatusError,
				http.StatusUnauthorized,
				"Tài khoản hoặc mật khẩu không chính xác",
				nil,
			),
		)
		return
	}

	// Kiểm tra password
	if !CheckPasswordHash(req.Password, h.HashedStorefrontPassword) {
		if h.logRepo != nil {
			_ = h.logRepo.Create(systemlog.CreateLogInput{
				Level:   "WARN",
				Message: fmt.Sprintf("Đăng nhập thất bại: Sai mật khẩu cho tài khoản '%s'", req.Username),
				Service: "auth",
				IP:      clientIP,
				Tags:    []string{"login", "auth", "failed"},
				Metadata: map[string]interface{}{
					"username":   req.Username,
					"user_agent": userAgent,
					"status":     "failed",
					"reason":     "wrong_password",
				},
			})
		}

		c.JSON(
			http.StatusUnauthorized,
			response.ErrorResponse(
				response.StatusError,
				http.StatusUnauthorized,
				"Tài khoản hoặc mật khẩu không chính xác",
				nil,
			),
		)
		return
	}

	// Xác thực thành công
	if h.logRepo != nil {
		_ = h.logRepo.Create(systemlog.CreateLogInput{
			Level:   "INFO",
			Message: fmt.Sprintf("Người dùng '%s' đăng nhập thành công vào hệ thống", req.Username),
			Service: "auth",
			IP:      clientIP,
			Tags:    []string{"login", "auth", "success"},
			Metadata: map[string]interface{}{
				"username":   req.Username,
				"user_agent": userAgent,
				"status":     "success",
			},
		})
	}

	c.SetCookie(
		"storefront_pass",
		req.Password,
		86400,
		"/",
		"",
		false,
		true,
	)

	c.JSON(
		http.StatusOK,
		response.SuccessResponse(
			http.StatusOK,
			response.StatusSuccess,
			"Đăng nhập thành công",
			nil,
		),
	)
}

func (h *AuthHandler) LogoutStorefront(c *gin.Context) {
	if h.logRepo != nil {
		_ = h.logRepo.Create(systemlog.CreateLogInput{
			Level:   "INFO",
			Message: "Người dùng đăng xuất khỏi hệ thống",
			Service: "auth",
			IP:      utils.GetRealIP(c),
			Tags:    []string{"logout", "auth"},
			Metadata: map[string]interface{}{
				"user_agent": c.GetHeader("User-Agent"),
			},
		})
	}

	c.SetCookie(
		"storefront_pass",
		"",
		-1,
		"/",
		"",
		false,
		true,
	)

	c.JSON(
		http.StatusOK,
		response.SuccessResponse(
			http.StatusOK,
			response.StatusSuccess,
			"Đăng xuất thành công",
			nil,
		),
	)
}
