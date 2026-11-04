package ads_detail

import (
	"context"
	"dashboard--ads/pkg/crypto"
	"fmt"
	"log"
	"strings"
)

type AccountSyncInfo struct {
	AccountID   string `db:"meta_account_id"`
	AccessToken string `db:"access_token"`
}

// SyncAllActiveAccountsAds quét tất cả tài khoản trong hệ thống và đồng bộ Ads + Insights
func (s *Service) SyncAllActiveAccountsAds(ctx context.Context, apiVersion, targetAccountID, startDate, endDate string) (int, error) {
	query := `
		SELECT 
			a.meta_account_id,
			bp.access_token
		FROM ad_accounts a
		JOIN business_portfolios bp ON bp.id = a.business_portfolio_id
		WHERE bp.is_active = 1
	`
	args := []interface{}{}
	if targetAccountID != "" {
		query += " AND (a.meta_account_id = ? OR a.meta_account_id = ?)"
		args = append(args, targetAccountID, "act_"+targetAccountID)
	}

	var accounts []AccountSyncInfo
	err := s.repo.db.SelectContext(ctx, &accounts, query, args...)
	if err != nil {
		return 0, fmt.Errorf("không lấy được danh sách tài khoản: %w", err)
	}

	totalSynced := 0
	for _, acc := range accounts {
		if acc.AccessToken == "" || acc.AccountID == "" {
			continue
		}

		// Giải mã token nếu token đang được mã hóa AES bằng encryptionKey
		realToken := acc.AccessToken
		if s.encryptionKey != "" {
			if decrypted, err := crypto.Decrypt(acc.AccessToken, s.encryptionKey); err == nil && decrypted != "" {
				realToken = decrypted
			}
		}

		// Đảm bảo token sạch không có khoảng trắng thừa
		realToken = strings.TrimSpace(realToken)

		log.Printf("[AdsDetail] Bắt đầu đồng bộ Ads cho tài khoản: %s (token length=%d)", acc.AccountID, len(realToken))

		// 1. Đồng bộ Ads & Creatives
		ads, err := FetchAccountAdsInventory(ctx, apiVersion, acc.AccountID, realToken)
		if err != nil {
			log.Printf("[AdsDetail] Lỗi kéo Ads inventory %s: %v", acc.AccountID, err)
		} else if len(ads) > 0 {
			if err := s.repo.UpsertMetaAds(ctx, ads); err != nil {
				log.Printf("[AdsDetail] Lỗi lưu Ads %s: %v", acc.AccountID, err)
			} else {
				totalSynced += len(ads)
				log.Printf("[AdsDetail] Đã lưu %d Ads cho tài khoản %s", len(ads), acc.AccountID)
			}
		}

		// 2. Đồng bộ Insights (level=ad)
		insights, err := FetchAccountAdsInsights(ctx, apiVersion, acc.AccountID, startDate, endDate, realToken)
		if err != nil {
			log.Printf("[AdsDetail] Lỗi kéo Ad Insights %s: %v", acc.AccountID, err)
		} else if len(insights) > 0 {
			if err := s.repo.UpsertMetaAdInsights(ctx, insights); err != nil {
				log.Printf("[AdsDetail] Lỗi lưu Ad Insights %s: %v", acc.AccountID, err)
			} else {
				log.Printf("[AdsDetail] Đã lưu %d bản ghi Insights cho tài khoản %s", len(insights), acc.AccountID)
			}
		}
	}

	return totalSynced, nil
}
