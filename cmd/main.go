package main

import (
	"context"
	"log"
	"os"
	"strconv"
	"time"

	"dashboard--ads/config"
	"dashboard--ads/config/database"
	"dashboard--ads/internal/ads_detail"
	"dashboard--ads/internal/auth"
	"dashboard--ads/internal/bm"
	"dashboard--ads/internal/middleware"
	"dashboard--ads/internal/routes"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func main() {
	cfg := config.Load()

	encryptionKey := os.Getenv("ENCRYPTION_KEY")
	if len(encryptionKey) != 32 {
		log.Fatal("FATAL: ENCRYPTION_KEY pháº£i Ä‘Ãºng 32 kÃ½ tá»± (AES-256)")
	}

	rawUser := os.Getenv("STOREFRONT_USERNAME")
	if rawUser == "" {
		rawUser = "admin"
	}

	rawPass := os.Getenv("STOREFRONT_PASSWORD")
	if rawPass == "" {
		rawPass = "TBU"
	}

	hashedPass, err := auth.HashPassword(rawPass)
	if err != nil {
		log.Fatalf("Lá»—i bÄƒm máº­t kháº©u: %v", err)
	}

	db, err := database.ConnectMySQL(cfg)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	sqlxDB := sqlx.NewDb(db, "mysql")

	router := gin.Default()

	// CORS middleware
	router.Use(middleware.CorsMiddleware())

	routes.RegisterRoutes(
		router,
		sqlxDB,
		rawUser,
		hashedPass,
		encryptionKey,
	)

	// ==========================================
	// Tá»° Äá»˜NG Äá»’NG Bá»˜ Ná»€N (BACKGROUND AUTO SYNC)
	// ==========================================
	go func() {
		bmRepo := bm.NewRepository(sqlxDB, encryptionKey)
		adsRepo := ads_detail.NewRepository(sqlxDB)
		adsService := ads_detail.NewService(adsRepo, encryptionKey)

		bmService := bm.NewService(bmRepo)
		bmService.SetAdsDetailService(adsService)

		// KhÃ´ng cháº¡y ngay khi vá»«a báº­t server, chá»‰ cháº¡y Ä‘á»‹nh ká»³ sau má»—i chu ká»³ interval

		// Cáº¥u hÃ¬nh chu ká»³ láº·p láº¡i: Æ°u tiÃªn Ä‘á»c tá»« báº£ng system_settings ('sync_interval_hours'), sau Ä‘Ã³ Ä‘áº¿n SYNC_INTERVAL_HOURS
		intervalHours := 4
		var dbHoursStr string
		if err := sqlxDB.Get(&dbHoursStr, "SELECT `value` FROM system_settings WHERE `key` = 'sync_interval_hours' LIMIT 1"); err == nil && dbHoursStr != "" {
			if h, err := strconv.Atoi(dbHoursStr); err == nil && h > 0 {
				intervalHours = h
			}
		} else if rawHours := os.Getenv("SYNC_INTERVAL_HOURS"); rawHours != "" {
			if h, err := strconv.Atoi(rawHours); err == nil && h > 0 {
				intervalHours = h
			}
		}
		interval := time.Duration(intervalHours) * time.Hour

		log.Printf("[AutoSync] Thiáº¿t láº­p lá»‹ch Ä‘á»“ng bá»™ tá»± Ä‘á»™ng má»—i %d giá» (%v)", intervalHours, interval)
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for range ticker.C {
			log.Println("[AutoSync] Báº¯t Ä‘áº§u chu ká»³ Ä‘á»“ng bá»™ Ä‘á»‹nh ká»³ Meta...")
			if _, err := bmService.SyncMeta(context.Background()); err != nil {
				log.Printf("[AutoSync] Lá»—i Ä‘á»“ng bá»™ Ä‘á»‹nh ká»³: %v", err)
			} else {
				log.Println("[AutoSync] Äá»“ng bá»™ Ä‘á»‹nh ká»³ hoÃ n táº¥t!")
			}
		}
	}()

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server Ä‘ang cháº¡y táº¡i port :%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Lá»—i khá»Ÿi cháº¡y server: %v", err)
	}
}
