package bm

import (
	"context"
	"dashboard--ads/internal/ads_detail"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

type Service struct {
	repo             *Repository
	adsDetailService *ads_detail.Service
}

func NewService(
	repo *Repository,
) *Service {
	return &Service{
		repo: repo,
	}
}

func (s *Service) SetAdsDetailService(adsDetailService *ads_detail.Service) {
	s.adsDetailService = adsDetailService
}

func (s *Service) ListBrands(
	ctx context.Context,
) ([]Brand, error) {
	return s.repo.ListBrands(
		ctx,
	)
}

// ======================================================
// MAIN MULTI-BM SYNC
// ======================================================

func (s *Service) SyncMeta(
	ctx context.Context,
) (*SyncResult, error) {
	apiVersion := strings.TrimSpace(
		os.Getenv("META_API_VERSION"),
	)

	if apiVersion == "" {
		return nil, fmt.Errorf(
			"META_API_VERSION chÆ°a Ä‘Æ°á»£c cáº¥u hÃ¬nh",
		)
	}

	configs, err := LoadMetaBusinessConfigs()
	if err != nil {
		return nil, err
	}

	location, err := time.LoadLocation(
		"Asia/Ho_Chi_Minh",
	)
	if err != nil {
		location = time.FixedZone(
			"Asia/Ho_Chi_Minh",
			7*60*60,
		)
	}

	now := time.Now().In(location)
	today := now.Format("2006-01-02")
	yesterday := now.AddDate(0, 0, -1).Format("2006-01-02")

	result := &SyncResult{
		BusinessResults: make(
			[]BusinessSyncResult,
			0,
			len(configs),
		),
		SyncedAt: now.Format(time.RFC3339),
	}

	for _, config := range configs {
		if err := ctx.Err(); err != nil {
			return nil, err
		}

		metaBusiness, err := FetchBusiness(
			ctx,
			apiVersion,
			config.BMID,
			config.Token,
		)
		if err != nil {
			return nil, fmt.Errorf(
				"láº¥y BM %s tháº¥t báº¡i: %w",
				config.BMID,
				err,
			)
		}

		businessResult, err := s.syncBusiness(
			ctx,
			apiVersion,
			config.Token,
			*metaBusiness,
			today,
			yesterday,
			now,
		)
		if err != nil {
			return nil, fmt.Errorf(
				"sync BM %s (%s) tháº¥t báº¡i: %w",
				metaBusiness.Name,
				metaBusiness.ID,
				err,
			)
		}

		result.BusinessResults = append(
			result.BusinessResults,
			*businessResult,
		)

		result.Businesses++
		result.AdAccounts += businessResult.AdAccounts
		result.CampaignInventory += businessResult.CampaignInventory
		result.HistoryRows += businessResult.HistoryRows
		result.TodayRows += businessResult.TodayRows
		result.FinalizedYesterday += businessResult.FinalizedYesterday
		result.NewCampaignBackfills += businessResult.NewCampaignBackfills
	}

	// ======================================================
	// UNIFIED ADS & CREATIVES & INSIGHTS SYNC
	// ======================================================
	if s.adsDetailService != nil {
		log.Println("[SyncMeta] Bắt đầu đồng bộ hợp nhất Ads chi tiết và Creatives...")
		if _, err := s.adsDetailService.SyncAllActiveAccountsAds(ctx, apiVersion, "", "", ""); err != nil {
			log.Printf("[SyncMeta] Lỗi đồng bộ Ads chi tiết: %v", err)
		} else {
			log.Println("[SyncMeta] Đồng bộ Ads chi tiết hoàn tất thành công!")
		}
	}

	return result, nil
}

// ======================================================
// ONE BUSINESS MANAGER
// ======================================================

func (s *Service) syncBusiness(
	ctx context.Context,
	apiVersion string,
	token string,
	metaBusiness MetaBusiness,
	today string,
	yesterday string,
	now time.Time,
) (*BusinessSyncResult, error) {
	// ==================================================
	// 1. SAVE / UPDATE BM
	// ==================================================

	business, err :=
		s.repo.UpsertBusiness(
			ctx,
			metaBusiness,
			token,
			now,
		)

	if err != nil {
		return nil, err
	}

	wasInitialSyncCompleted :=
		business.InitialSyncCompleted

	businessResult :=
		&BusinessSyncResult{
			BusinessID: metaBusiness.ID,

			BusinessName: metaBusiness.Name,

			InitialSync: !wasInitialSyncCompleted,
		}

	// ==================================================
	// 2. AD ACCOUNTS OF THIS BM
	// ==================================================

	metaAccounts, err :=
		FetchAdAccounts(
			ctx,
			apiVersion,
			metaBusiness.ID,
			token,
		)

	if err != nil {
		return nil, fmt.Errorf(
			"láº¥y ad accounts tháº¥t báº¡i: %w",
			err,
		)
	}

	type SavedAccount struct {
		ID            int64
		MetaAccountID string
	}

	savedAccounts :=
		make(
			[]SavedAccount,
			0,
			len(metaAccounts),
		)

	for _, account := range metaAccounts {

		accountID, err :=
			s.repo.UpsertAdAccount(
				ctx,
				business.ID,
				account,
				now,
			)

		if err != nil {
			return nil, err
		}

		metaAccountID :=
			account.AccountID

		if metaAccountID == "" {
			metaAccountID =
				account.ID
		}

		savedAccounts =
			append(
				savedAccounts,
				SavedAccount{
					ID: accountID,

					MetaAccountID: metaAccountID,
				},
			)
	}

	businessResult.AdAccounts =
		len(savedAccounts)

	// ==================================================
	// 3. FINALIZE YESTERDAY
	// ==================================================
	//
	// Campaign ACTIVE -> PAUSED trong ngÃ y hÃ´m qua váº«n
	// Ä‘Æ°á»£c cáº­p nháº­t vÃ¬ láº¥y insights á»Ÿ cáº¥p Ad Account,
	// level=campaign.
	// ==================================================

	if wasInitialSyncCompleted {
		for _, account := range savedAccounts {

			hasRows, err :=
				s.repo.HasUnfinalizedRowsForAccountDate(
					ctx,
					account.ID,
					yesterday,
				)

			if err != nil {
				return nil, err
			}

			if !hasRows {
				continue
			}

			insights, err :=
				FetchAccountInsightsForDate(
					ctx,
					apiVersion,
					account.MetaAccountID,
					yesterday,
					token,
				)

			if err != nil {
				return nil, fmt.Errorf(
					"láº¥y insight hÃ´m qua account %s tháº¥t báº¡i: %w",
					account.MetaAccountID,
					err,
				)
			}

			for _, insight := range insights {

				if insight.CampaignID == "" {
					continue
				}

				savedCampaign, err :=
					s.repo.EnsureCampaignFromInsight(
						ctx,
						account.ID,
						insight.CampaignID,
						insight.CampaignName,
						now,
					)

				if err != nil {
					return nil, err
				}

				metrics :=
					convertMetaInsight(
						insight,
					)

				metrics.Date =
					yesterday

				if err :=
					s.repo.UpsertInsight(
						ctx,
						savedCampaign.ID,
						metrics,
						true,
						now,
					); err != nil {
					return nil, err
				}
			}

			finalized, err :=
				s.repo.FinalizeDateForAccount(
					ctx,
					account.ID,
					yesterday,
					now,
				)

			if err != nil {
				return nil, err
			}

			businessResult.FinalizedYesterday +=
				finalized
		}
	}

	// ==================================================
	// 4. EACH AD ACCOUNT
	// ==================================================

	for _, account := range savedAccounts {

		if err := ctx.Err(); err != nil {
			return nil, err
		}

		// ==============================================
		// 4.1 FULL CAMPAIGN INVENTORY
		// ==============================================
		//
		// ACTIVE
		// PAUSED
		// ARCHIVED
		// DELETED
		//
		// campaign_name Ä‘Æ°á»£c repository parse [BRAND]
		// vÃ  tá»± map campaigns.brand_id.
		// ==============================================

		campaigns, err :=
			FetchAllCampaigns(
				ctx,
				apiVersion,
				account.MetaAccountID,
				token,
			)

		if err != nil {
			return nil, fmt.Errorf(
				"láº¥y campaign inventory account %s tháº¥t báº¡i: %w",
				account.MetaAccountID,
				err,
			)
		}

		businessResult.CampaignInventory +=
			len(campaigns)

		for _, campaign := range campaigns {

			savedCampaign, err :=
				s.repo.UpsertCampaign(
					ctx,
					account.ID,
					campaign,
					now,
				)

			if err != nil {
				return nil, err
			}

			// ACTIVE + ACTIVE hiá»‡n táº¡i:
			// táº¡o row TODAY ngay cáº£ khi chÆ°a spend.
			if campaign.Status == "ACTIVE" &&
				campaign.EffectiveStatus == "ACTIVE" {

				if err :=
					s.repo.EnsureDailyRow(
						ctx,
						savedCampaign.ID,
						today,
					); err != nil {
					return nil, err
				}
			}
		}

		// ==============================================
		// 4.1.1 FULL ADSET INVENTORY (NHÓM QUẢNG CÁO)
		// ==============================================
		adsets, err := FetchAllAdSets(
			ctx,
			apiVersion,
			account.MetaAccountID,
			token,
		)
		if err == nil && len(adsets) > 0 {
			if err := s.repo.UpsertAdSets(
				ctx,
				account.ID,
				adsets,
				now,
			); err != nil {
				log.Printf("[SyncMeta] Lỗi lưu AdSets account %s: %v", account.MetaAccountID, err)
			}
		}

		// ==============================================
		// 4.2 INITIAL HISTORY OF THIS BM
		// ==============================================
		//
		// BM chÆ°a initial sync:
		// backfill má»™t láº§n á»Ÿ cáº¥p AD ACCOUNT.
		//
		// Dá»¯ liá»‡u hÃ´m nay khÃ´ng lÆ°u á»Ÿ block history.
		// ==============================================

		if !wasInitialSyncCompleted {
			history, err :=
				FetchAccountHistory(
					ctx,
					apiVersion,
					account.MetaAccountID,
					token,
				)

			if err != nil {
				return nil, fmt.Errorf(
					"backfill account %s tháº¥t báº¡i: %w",
					account.MetaAccountID,
					err,
				)
			}

			for _, insight := range history {

				if insight.CampaignID == "" ||
					insight.DateStart == "" {
					continue
				}

				if insight.DateStart >= today {
					continue
				}

				// Náº¿u campaign DELETED lÃ¢u vÃ  /campaigns
				// khÃ´ng tráº£ ná»¯a, váº«n táº¡o tá»« insight.
				//
				// Campaign name cÃ³ [BRAND] váº«n tá»± map Brand.
				savedCampaign, err :=
					s.repo.EnsureCampaignFromInsight(
						ctx,
						account.ID,
						insight.CampaignID,
						insight.CampaignName,
						now,
					)

				if err != nil {
					return nil, err
				}

				metrics :=
					convertMetaInsight(
						insight,
					)

				if err :=
					s.repo.UpsertInsight(
						ctx,
						savedCampaign.ID,
						metrics,
						true,
						now,
					); err != nil {
					return nil, err
				}

				businessResult.HistoryRows++
			}

			if err :=
				s.repo.MarkAccountCampaignsHistorySynced(
					ctx,
					account.ID,
					now,
				); err != nil {
				return nil, err
			}

		} else {
			// ==========================================
			// 4.3 CAMPAIGN Má»šI SAU INITIAL SYNC
			// ==========================================

			unsyncedCampaigns, err :=
				s.repo.GetUnsyncedCampaigns(
					ctx,
					account.ID,
				)

			if err != nil {
				return nil, err
			}

			for _, campaign := range unsyncedCampaigns {

				history, err :=
					FetchCampaignHistory(
						ctx,
						apiVersion,
						campaign.MetaCampaignID,
						token,
					)

				if err != nil {
					return nil, fmt.Errorf(
						"backfill campaign má»›i %s tháº¥t báº¡i: %w",
						campaign.MetaCampaignID,
						err,
					)
				}

				for _, insight := range history {

					if insight.DateStart == "" ||
						insight.DateStart >= today {
						continue
					}

					metrics :=
						convertMetaInsight(
							insight,
						)

					if err :=
						s.repo.UpsertInsight(
							ctx,
							campaign.ID,
							metrics,
							true,
							now,
						); err != nil {
						return nil, err
					}

					businessResult.HistoryRows++
				}

				if err :=
					s.repo.MarkCampaignHistorySynced(
						ctx,
						campaign.ID,
						now,
					); err != nil {
					return nil, err
				}

				businessResult.NewCampaignBackfills++
			}
		}

		// ==============================================
		// 4.4 CURRENT DAY
		// ==============================================
		//
		// Case:
		// 08:00 ACTIVE
		// 15:00 PAUSED
		//
		// Náº¿u campaign cÃ³ delivery TODAY, account insight
		// váº«n tráº£ nÃ³ vÃ  row TODAY tiáº¿p tá»¥c Ä‘Æ°á»£c UPSERT.
		//
		// Sang ngÃ y mai náº¿u váº«n PAUSED thÃ¬ khÃ´ng cÃ³ row
		// ACTIVE má»›i vÃ  khÃ´ng tiáº¿p tá»¥c current-day tracking.
		// ==============================================

		todayInsights, err :=
			FetchAccountInsightsForDate(
				ctx,
				apiVersion,
				account.MetaAccountID,
				today,
				token,
			)

		if err != nil {
			return nil, fmt.Errorf(
				"láº¥y insight hÃ´m nay account %s tháº¥t báº¡i: %w",
				account.MetaAccountID,
				err,
			)
		}

		for _, insight := range todayInsights {

			if insight.CampaignID == "" {
				continue
			}

			savedCampaign, err :=
				s.repo.EnsureCampaignFromInsight(
					ctx,
					account.ID,
					insight.CampaignID,
					insight.CampaignName,
					now,
				)

			if err != nil {
				return nil, err
			}

			if err :=
				s.repo.EnsureDailyRow(
					ctx,
					savedCampaign.ID,
					today,
				); err != nil {
				return nil, err
			}

			metrics :=
				convertMetaInsight(
					insight,
				)

			metrics.Date =
				today

			if err :=
				s.repo.UpsertInsight(
					ctx,
					savedCampaign.ID,
					metrics,
					false,
					now,
				); err != nil {
				return nil, err
			}

			businessResult.TodayRows++
		}
	}

	// ==================================================
	// 5. INITIAL SYNC COMPLETED FOR THIS BM ONLY
	// ==================================================

	if !wasInitialSyncCompleted {
		if err :=
			s.repo.MarkInitialSyncCompleted(
				ctx,
				business.ID,
				now,
			); err != nil {
			return nil, err
		}
	}

	return businessResult, nil
}

// ======================================================
// META INSIGHT -> DATABASE METRICS
// ======================================================

func convertMetaInsight(
	insight MetaInsight,
) InsightMetrics {
	return InsightMetrics{
		Date: insight.DateStart,

		Spend: parseFloat(insight.Spend),

		Impressions: parseInt(insight.Impressions),

		Reach: parseInt(insight.Reach),

		Clicks: parseInt(insight.Clicks),

		Messages: extractMessages(insight.Actions),

		Leads: extractLeads(insight.Actions),

		CTR: parseFloat(insight.CTR),

		CPC: parseFloat(insight.CPC),

		CPM: parseFloat(insight.CPM),
	}
}

func parseFloat(
	value string,
) float64 {
	value =
		strings.TrimSpace(value)

	if value == "" {
		return 0
	}

	result, err :=
		strconv.ParseFloat(
			value,
			64,
		)

	if err != nil {
		return 0
	}

	return result
}

func parseInt(
	value string,
) int64 {
	value =
		strings.TrimSpace(value)

	if value == "" {
		return 0
	}

	result, err :=
		strconv.ParseInt(
			value,
			10,
			64,
		)

	if err != nil {
		return 0
	}

	return result
}

func extractMessages(
	actions []MetaAction,
) int64 {
	var total int64

	for _, action := range actions {

		switch action.ActionType {
		case
			"onsite_conversion.messaging_conversation_started_7d",
			"messaging_conversation_started_7d",
			"onsite_conversion.total_messaging_connection",
			"onsite_conversion.messaging_first_reply":

			total += parseInt(
				action.Value,
			)
		}
	}

	return total
}

func extractLeads(
	actions []MetaAction,
) int64 {
	var total int64

	for _, action := range actions {

		switch action.ActionType {
		case
			"lead",
			"onsite_conversion.lead_grouped",
			"offsite_conversion.fb_pixel_lead":

			total += parseInt(
				action.Value,
			)
		}
	}

	return total
}
