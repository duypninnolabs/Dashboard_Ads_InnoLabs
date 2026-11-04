package auth

import "golang.org/x/crypto/bcrypt"

// HashPassword băm mật khẩu ra chuỗi mã hóa Bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash so sánh mật khẩu nhập vào với chuỗi Bcrypt đã băm
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
