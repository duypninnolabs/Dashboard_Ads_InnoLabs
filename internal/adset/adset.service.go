package adset

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"strings"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetAdSetsSummary(ctx context.Context, params FilterParams) (*AdSetsSummary, error) {
	vatRate, ftfRate, err := s.repo.GetRates(ctx)
	if err != nil {
		vatRate = 0.10
		ftfRate = 0.011
	}

	// Đảm bảo các campaign mới tạo luôn có adsets tương ứng
	_ = s.repo.SeedInitialAdSets(ctx)

	rows, err := s.repo.FetchAdSets(ctx, params)
	if err != nil {
		return nil, err
	}

	summary := &AdSetsSummary{
		TotalAdSets: len(rows),
		AdSets:      make([]AdSetItem, 0, len(rows)),
	}

	for _, r := range rows {
		item := s.computeAdSetItem(r, vatRate, ftfRate)

		if item.Status == "ACTIVE" {
			summary.ActiveAdSets++
		}
		summary.SpendMeta += item.SpendMeta
		summary.SpendVAT += item.SpendVAT
		summary.FTFAmount += item.FTFAmount
		summary.TotalSpend += item.TotalSpend
		summary.Impressions += item.Impressions
		summary.Clicks += item.Clicks
		summary.Messages += item.Messages
		summary.Leads += item.Leads
		summary.Results += item.Results

		summary.AdSets = append(summary.AdSets, item)
	}

	// Rollup summary averages
	if summary.Impressions > 0 {
		summary.AvgCTR = roundDecimals(float64(summary.Clicks)/float64(summary.Impressions)*100, 2)
	}
	if summary.Clicks > 0 {
		summary.AvgCPC = roundDecimals(summary.SpendMeta/float64(summary.Clicks), 0)
	}
	if summary.Results > 0 {
		summary.AvgCPA = roundDecimals(summary.TotalSpend/float64(summary.Results), 0)
	}

	return summary, nil
}

func (s *Service) GetAdSetDetail(ctx context.Context, id int64, startDate, endDate string) (*AdSetDetail, error) {
	vatRate, ftfRate, err := s.repo.GetRates(ctx)
	if err != nil {
		vatRate = 0.10
		ftfRate = 0.011
	}

	// Đảm bảo adsets và child ads luôn được tạo đầy đủ
	_ = s.repo.SeedInitialAdSets(ctx)

	row, err := s.repo.GetAdSetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	item := s.computeAdSetItem(*row, vatRate, ftfRate)

	// Fetch daily metrics (ưu tiên trực tiếp từ ad_daily_insights của các mẫu ads thuộc adset này)
	dailyRows, err := s.repo.GetDailyMetrics(ctx, id, row.CampaignID)
	if err != nil {
		dailyRows = []DailyMetric{}
	}

	computedDaily := make([]DailyMetric, 0, len(dailyRows))
	for _, d := range dailyRows {
		vat := roundDecimals(d.SpendMeta*vatRate, 0)
		ftf := roundDecimals((d.SpendMeta+vat)*ftfRate, 0)
		tot := d.SpendMeta + vat + ftf

		results := d.Messages + d.Leads
		cpa := 0.0
		if results > 0 {
			cpa = roundDecimals(tot/float64(results), 0)
		}
		ctr := 0.0
		if d.Impressions > 0 {
			ctr = roundDecimals(float64(d.Clicks)/float64(d.Impressions)*100, 2)
		}
		cpc := 0.0
		if d.Clicks > 0 {
			cpc = roundDecimals(d.SpendMeta/float64(d.Clicks), 0)
		}
		cpm := 0.0
		if d.Impressions > 0 {
			cpm = roundDecimals((d.SpendMeta/float64(d.Impressions))*1000, 0)
		}

		computedDaily = append(computedDaily, DailyMetric{
			Date:          d.Date,
			SpendMeta:     d.SpendMeta,
			SpendVAT:      vat,
			FTFAmount:     ftf,
			TotalSpend:    tot,
			Impressions:   d.Impressions,
			Reach:         d.Reach,
			Clicks:        d.Clicks,
			Messages:      d.Messages,
			Leads:         d.Leads,
			Results:       results,
			CostPerResult: cpa,
			CTR:           ctr,
			CPC:           cpc,
			CPM:           cpm,
		})
	}

	// Fetch child ads (lọc chính xác theo dải ngày nếu người dùng chọn)
	childAds, _ := s.repo.GetChildAds(ctx, id, startDate, endDate)

	computedAds := make([]ChildAd, 0, len(childAds))
	for _, a := range childAds {
		vat := roundDecimals(a.SpendMeta*vatRate, 0)
		ftf := roundDecimals((a.SpendMeta+vat)*ftfRate, 0)
		tot := a.SpendMeta + vat + ftf
		ctr := 0.0
		if a.Impressions > 0 {
			ctr = roundDecimals(float64(a.Clicks)/float64(a.Impressions)*100, 2)
		}
		cpc := 0.0
		if a.Clicks > 0 {
			cpc = roundDecimals(a.SpendMeta/float64(a.Clicks), 0)
		}

		computedAds = append(computedAds, ChildAd{
			ID:           a.ID,
			AdSetID:      a.AdSetID,
			MetaAdID:     a.MetaAdID,
			AdName:       a.AdName,
			Status:       a.Status,
			CreativeType: a.CreativeType,
			PostID:       a.PostID,
			PostURL:      a.PostURL,
			PostMessage:  a.PostMessage,
			ThumbnailURL: a.ThumbnailURL,
			SpendMeta:    a.SpendMeta,
			SpendVAT:     vat,
			TotalSpend:   tot,
			Impressions:  a.Impressions,
			Clicks:       a.Clicks,
			Messages:     a.Messages,
			CTR:          ctr,
			CPC:          cpc,
			CreatedAt:    a.CreatedAt,
		})
	}

	// Nếu có lọc ngày, cập nhật các chỉ số tổng quan của AdSet theo đúng khoảng ngày
	sDate := strings.TrimSpace(startDate)
	eDate := strings.TrimSpace(endDate)
	if sDate != "" && eDate == "" {
		eDate = sDate
	}
	if sDate == "" && eDate != "" {
		sDate = eDate
	}
	if sDate != "" && eDate != "" {
		var rangeMeta, rangeVAT, rangeFTF, rangeTotal float64
		var rangeImp, rangeReach, rangeClicks, rangeMsg, rangeLeads, rangeResults int64

		for _, d := range computedDaily {
			if d.Date >= sDate && d.Date <= eDate {
				rangeMeta += d.SpendMeta
				rangeVAT += d.SpendVAT
				rangeFTF += d.FTFAmount
				rangeTotal += d.TotalSpend
				rangeImp += d.Impressions
				rangeReach += d.Reach
				rangeClicks += d.Clicks
				rangeMsg += d.Messages
				rangeLeads += d.Leads
				rangeResults += d.Results
			}
		}

		if rangeImp > 0 || rangeMeta > 0 || rangeClicks > 0 || rangeResults > 0 {
			item.SpendMeta = rangeMeta
			item.SpendVAT = rangeVAT
			item.FTFAmount = rangeFTF
			item.TotalSpend = rangeTotal
			item.Impressions = rangeImp
			item.Reach = rangeReach
			item.Clicks = rangeClicks
			item.Messages = rangeMsg
			item.Leads = rangeLeads
			item.Results = rangeResults
			if rangeImp > 0 {
				item.CTR = roundDecimals(float64(rangeClicks)/float64(rangeImp)*100, 2)
				item.CPM = roundDecimals(rangeMeta/float64(rangeImp)*1000, 0)
			}
			if rangeClicks > 0 {
				item.CPC = roundDecimals(rangeMeta/float64(rangeClicks), 0)
			}
			if rangeResults > 0 {
				item.CostPerResult = roundDecimals(rangeTotal/float64(rangeResults), 0)
			}
		}
	}

	detail := &AdSetDetail{
		AdSet:         item,
		DailyMetrics:  computedDaily,
		ChildAds:      computedAds,
		TargetingInfo: parseTargetingInfo(row.TargetingSummary, item.OptimizationGoal, item.BillingEvent),
	}

	return detail, nil
}

func parseTargetingInfo(rawTargeting *string, defaultGoal, defaultEvent string) TargetingInfo {
	info := TargetingInfo{
		AgeMin:            18,
		AgeMax:            65,
		AgeRange:          "18 - 65+ tuổi",
		Genders:           "Tất cả (Nam & Nữ)",
		Locations:         []string{"Việt Nam"},
		CustomLocations:   []string{},
		Interests:         []string{},
		FamilyStatuses:    []string{},
		EducationStatuses: []string{},
		BrandSafety:       []string{},
		Placements:        []string{"Tất cả vị trí tự động (Advantage+ Placements)"},
		OptimizationGoal:  defaultGoal,
		BillingEvent:      defaultEvent,
		Attribution:       "7 ngày nhấp hoặc 1 ngày xem (7-day click, 1-day view)",
	}

	if rawTargeting == nil || strings.TrimSpace(*rawTargeting) == "" {
		return info
	}

	var raw map[string]interface{}
	if err := json.Unmarshal([]byte(*rawTargeting), &raw); err != nil {
		return info
	}

	if aMin, ok := raw["age_min"].(float64); ok && aMin > 0 {
		info.AgeMin = int(aMin)
	}
	if aMax, ok := raw["age_max"].(float64); ok && aMax > 0 {
		info.AgeMax = int(aMax)
	}
	if aRange, ok := raw["age_range"].([]interface{}); ok && len(aRange) == 2 {
		rMin, _ := aRange[0].(float64)
		rMax, _ := aRange[1].(float64)
		if rMin > 0 && rMax > 0 {
			info.AgeRange = fmt.Sprintf("%.0f - %.0f tuổi", rMin, rMax)
		}
	} else if info.AgeMin > 0 && info.AgeMax > 0 {
		info.AgeRange = fmt.Sprintf("%d - %d tuổi", info.AgeMin, info.AgeMax)
	}

	if genders, ok := raw["genders"].([]interface{}); ok && len(genders) > 0 {
		if len(genders) == 1 {
			if gVal, ok := genders[0].(float64); ok {
				if int(gVal) == 1 {
					info.Genders = "Nam"
				} else if int(gVal) == 2 {
					info.Genders = "Nữ"
				}
			}
		} else {
			info.Genders = "Tất cả (Nam & Nữ)"
		}
	}

	// Parse Geo Locations & Custom Locations (coordinates, radius)
	if geo, ok := raw["geo_locations"].(map[string]interface{}); ok {
		var locs []string
		var customLocs []string

		if custom, ok := geo["custom_locations"].([]interface{}); ok {
			for _, c := range custom {
				if cm, ok := c.(map[string]interface{}); ok {
					country, _ := cm["country"].(string)
					rad, _ := cm["radius"].(float64)
					unit, _ := cm["distance_unit"].(string)
					lat, _ := cm["latitude"].(float64)
					lng, _ := cm["longitude"].(float64)

					unitStr := unit
					if unit == "kilometer" {
						unitStr = "km"
					} else if unit == "mile" {
						unitStr = "dặm"
					}

					var desc string
					if rad > 0 && lat != 0 && lng != 0 {
						desc = fmt.Sprintf("Tọa độ (%.4f, %.4f) • Bán kính %.0f %s • %s", lat, lng, rad, unitStr, country)
					} else if country != "" {
						desc = country
					}
					if desc != "" {
						customLocs = append(customLocs, desc)
						locs = append(locs, desc)
					}
				}
			}
		}

		if places, ok := geo["places"].([]interface{}); ok {
			for _, p := range places {
				if pm, ok := p.(map[string]interface{}); ok {
					name, _ := pm["name"].(string)
					rad, _ := pm["radius"].(float64)
					unit, _ := pm["distance_unit"].(string)
					if name != "" {
						if rad > 0 {
							locs = append(locs, fmt.Sprintf("%s (Bán kính %.0f %s)", name, rad, unit))
						} else {
							locs = append(locs, name)
						}
					}
				}
			}
		}
		if cities, ok := geo["cities"].([]interface{}); ok {
			for _, c := range cities {
				if cm, ok := c.(map[string]interface{}); ok {
					if name, ok := cm["name"].(string); ok && name != "" {
						locs = append(locs, name)
					}
				}
			}
		}
		if regions, ok := geo["regions"].([]interface{}); ok {
			for _, r := range regions {
				if rm, ok := r.(map[string]interface{}); ok {
					if name, ok := rm["name"].(string); ok && name != "" {
						locs = append(locs, name)
					}
				}
			}
		}
		if countries, ok := geo["countries"].([]interface{}); ok && len(locs) == 0 {
			for _, ct := range countries {
				if ctStr, ok := ct.(string); ok && ctStr != "" {
					locs = append(locs, ctStr)
				}
			}
		}
		if len(locs) > 0 {
			info.Locations = locs
		}
		if len(customLocs) > 0 {
			info.CustomLocations = customLocs
		}
	}

	// Parse Detailed Targeting (flexible_spec: interests, family_statuses, education_statuses)
	if flexSpec, ok := raw["flexible_spec"].([]interface{}); ok {
		for _, fs := range flexSpec {
			if fsm, ok := fs.(map[string]interface{}); ok {
				// Interests
				if ints, ok := fsm["interests"].([]interface{}); ok {
					for _, item := range ints {
						if im, ok := item.(map[string]interface{}); ok {
							if name, ok := im["name"].(string); ok && name != "" {
								info.Interests = append(info.Interests, name)
							}
						}
					}
				}
				// Family Statuses
				if fams, ok := fsm["family_statuses"].([]interface{}); ok {
					for _, item := range fams {
						if fm, ok := item.(map[string]interface{}); ok {
							if name, ok := fm["name"].(string); ok && name != "" {
								info.FamilyStatuses = append(info.FamilyStatuses, name)
							}
						}
					}
				}
				// Education Statuses
				if edus, ok := fsm["education_statuses"].([]interface{}); ok {
					eduMap := map[int]string{
						1: "Đang học trung học",
						2: "Tốt nghiệp trung học",
						3: "Đang học đại học",
						4: "Tốt nghiệp đại học",
						5: "Bằng thạc sĩ / tiến sĩ",
						6: "Đang học cao học",
					}
					for _, item := range edus {
						if eCode, ok := item.(float64); ok {
							if txt, exists := eduMap[int(eCode)]; exists {
								info.EducationStatuses = append(info.EducationStatuses, txt)
							} else {
								info.EducationStatuses = append(info.EducationStatuses, fmt.Sprintf("Học vấn mã %.0f", eCode))
							}
						}
					}
				}
			}
		}
	}

	// Parse Advantage+ Audience (targeting_automation)
	if auto, ok := raw["targeting_automation"].(map[string]interface{}); ok {
		if adv, ok := auto["advantage_audience"].(float64); ok && adv == 1 {
			info.AdvantageAudience = true
		}
	}

	// Brand safety
	if bs, ok := raw["brand_safety_content_filter_levels"].([]interface{}); ok {
		for _, b := range bs {
			if bStr, ok := b.(string); ok && bStr != "" {
				info.BrandSafety = append(info.BrandSafety, bStr)
			}
		}
	}

	// Parse Publisher Platforms & Positions
	if platforms, ok := raw["publisher_platforms"].([]interface{}); ok && len(platforms) > 0 {
		var platList []string
		for _, pl := range platforms {
			if plStr, ok := pl.(string); ok && plStr != "" {
				platList = append(platList, strings.Title(plStr))
			}
		}
		if len(platList) > 0 {
			info.Placements = platList
		}
	}

	return info
}

func (s *Service) computeAdSetItem(r AdSetRow, vatRate float64, ftfRate float64) AdSetItem {
	brandName := "Chưa gán Brand"
	if r.BrandName != nil && *r.BrandName != "" {
		brandName = *r.BrandName
	}

	targeting := "Chưa cấu hình"
	if r.TargetingSummary != nil && *r.TargetingSummary != "" {
		targeting = *r.TargetingSummary
	}

	spendVAT := roundDecimals(r.SpendMeta*(1.0+vatRate), 0)
	ftfAmount := roundDecimals(spendVAT*ftfRate, 0)
	totalSpend := spendVAT + ftfAmount

	results := r.Messages + r.Leads
	costPerResult := 0.0
	if results > 0 {
		costPerResult = roundDecimals(totalSpend/float64(results), 0)
	}

	ctr := 0.0
	if r.Impressions > 0 {
		ctr = roundDecimals(float64(r.Clicks)/float64(r.Impressions)*100, 2)
	}

	cpc := 0.0
	if r.Clicks > 0 {
		cpc = roundDecimals(r.SpendMeta/float64(r.Clicks), 0)
	}

	cpm := 0.0
	if r.Impressions > 0 {
		cpm = roundDecimals((r.SpendMeta/float64(r.Impressions))*1000, 0)
	}

	return AdSetItem{
		ID:               r.ID,
		CampaignID:       r.CampaignID,
		MetaAdSetID:      r.MetaAdSetID,
		AdSetName:        r.AdSetName,
		Status:           r.Status,
		EffectiveStatus:  r.EffectiveStatus,
		DailyBudget:      r.DailyBudget,
		LifetimeBudget:   r.LifetimeBudget,
		OptimizationGoal: r.OptimizationGoal,
		BillingEvent:     r.BillingEvent,
		TargetingSummary: targeting,
		MetaCampaignID:   r.MetaCampaignID,
		CampaignName:     r.CampaignName,
		MetaAccountID:    r.MetaAccountID,
		AccountName:      r.AccountName,
		Currency:         r.Currency,
		MetaBusinessID:   r.MetaBusinessID,
		BusinessName:     r.BusinessName,
		BrandID:          r.BrandID,
		BrandName:        brandName,
		SpendMeta:        r.SpendMeta,
		SpendVAT:         spendVAT,
		FTFAmount:        ftfAmount,
		TotalSpend:       totalSpend,
		Impressions:      r.Impressions,
		Reach:            r.Reach,
		Clicks:           r.Clicks,
		Messages:         r.Messages,
		Leads:            r.Leads,
		Results:          results,
		CostPerResult:    costPerResult,
		CTR:              ctr,
		CPC:              cpc,
		CPM:              cpm,
		LastSyncedAt:     r.LastSyncedAt,
	}
}

func roundDecimals(val float64, decimals int) float64 {
	pow := math.Pow(10, float64(decimals))
	return math.Round(val*pow) / pow
}
