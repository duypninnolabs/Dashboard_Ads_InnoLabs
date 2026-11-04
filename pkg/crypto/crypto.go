package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"io"
)

// Encrypt: Mã hóa chuỗi Plaintext Token thành chuỗi Base64
func Encrypt(plainText string, secretKey string) (string, error) {
	if plainText == "" {
		return "", nil
	}

	key := []byte(secretKey) // Bắt buộc Secret Key phải đúng 32 bytes (AES-256)
	if len(key) != 32 {
		return "", errors.New("secret key phải đúng 32 bytes")
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	cipherText := gcm.Seal(nonce, nonce, []byte(plainText), nil)
	return base64.StdEncoding.EncodeToString(cipherText), nil
}

// Decrypt: Giải mã chuỗi Base64 về Token ban đầu
func Decrypt(cryptoText string, secretKey string) (string, error) {
	if cryptoText == "" {
		return "", nil
	}

	key := []byte(secretKey)
	if len(key) != 32 {
		return "", errors.New("secret key phải đúng 32 bytes")
	}

	cipherText, err := base64.StdEncoding.DecodeString(cryptoText)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(cipherText) < nonceSize {
		return "", errors.New("dữ liệu mã hóa không hợp lệ")
	}

	nonce, cipherTextBytes := cipherText[:nonceSize], cipherText[nonceSize:]
	plainText, err := gcm.Open(nil, nonce, cipherTextBytes, nil)
	if err != nil {
		return "", err
	}

	return string(plainText), nil
}
