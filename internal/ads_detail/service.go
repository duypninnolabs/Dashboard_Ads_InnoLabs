package ads_detail

import (
	"context"
	"math"
)

type Service struct {
	repo          *Repository
	encryptionKey string
}

func NewService(repo *Repository, encryptionKey string) *Service {
	return &Service{
		repo:          repo,
		encryptionKey: encryptionKey,
	}
}

func roundDecimals(val float64, decimals int) float64 {
	pow := math.Pow(10, float64(decimals))
	return math.Round(val*pow) / pow
}

func (s *Service) computeAdItem(row AdDetailRow, vatRate, ftfRate float64) AdDetailItem {
	spendMeta := row.SpendMeta
	spendVAT := roundDecimals(spendMeta*(1+vatRate), 0)
	ftfAmount := roundDecimals(spendVAT*ftfRate, 0)
	totalSpend := spendVAT + ftfAmount

	results := row.Messages + row.Leads
	cpa := 0.0
	if results > 0 {
		cpa = roundDecimals(totalSpend/float64(results), 0)
	}

	ctr := 0.0
	if row.Impressions > 0 {
		ctr = roundDecimals(float64(row.Clicks)/float64(row.Impressions)*100, 2)
	}

	cpc := 0.0
	if row.Clicks > 0 {
		cpc = roundDecimals(spendMeta/float64(row.Clicks), 0)
	}

	cpm := 0.0
	if row.Impressions > 0 {
		cpm = roundDecimals((spendMeta/float64(row.Impressions))*1000, 0)
	}

	return AdDetailItem{
		ID:              row.ID,
		AdSetID:         row.AdSetID,
		MetaAdID:        row.MetaAdID,
		AdName:          row.AdName,
		Status:          row.Status,
		EffectiveStatus: row.EffectiveStatus,
		CreativeType:    row.CreativeType,
		PostID:          row.PostID,
		PostURL:         row.PostURL,
		PostMessage:     row.PostMessage,
		ThumbnailURL:    row.ThumbnailURL,
		CampaignID:      row.CampaignID,
		MetaCampaignID:  row.MetaCampaignID,
		CampaignName:    row.CampaignName,
		MetaAdSetID:     row.MetaAdSetID,
		AdSetName:       row.AdSetName,
		MetaAccountID:   row.MetaAccountID,
		AccountName:     row.AccountName,
		Currency:        row.Currency,
		MetaBusinessID:  row.MetaBusinessID,
		BusinessName:    row.BusinessName,
		BrandID:         row.BrandID,
		BrandName:       row.BrandName,
		SpendMeta:       spendMeta,
		SpendVAT:        spendVAT,
		FTFAmount:       ftfAmount,
		TotalSpend:      totalSpend,
		Impressions:     row.Impressions,
		Reach:           row.Reach,
		Clicks:          row.Clicks,
		Messages:        row.Messages,
		Leads:           row.Leads,
		Results:         results,
		CostPerResult:   cpa,
		CTR:             ctr,
		CPC:             cpc,
		CPM:             cpm,
		CreatedAt:       row.CreatedAt,
		UpdatedAt:       row.UpdatedAt,
	}
}

func (s *Service) GetAdsSummary(ctx context.Context, params FilterParams) (*AdsSummary, error) {
	vatRate, ftfRate, err := s.repo.GetRates(ctx)
	if err != nil {
		vatRate = 0.10
		ftfRate = 0.011
	}

	rows, err := s.repo.GetAdsList(ctx, params)
	if err != nil {
		return nil, err
	}

	summary := &AdsSummary{
		TotalAds: len(rows),
		Ads:      make([]AdDetailItem, 0, len(rows)),
	}

	for _, r := range rows {
		item := s.computeAdItem(r, vatRate, ftfRate)
		if item.Status == "ACTIVE" || item.EffectiveStatus == "ACTIVE" {
			summary.ActiveAds++
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

		summary.Ads = append(summary.Ads, item)
	}

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

func (s *Service) GetAdDetail(ctx context.Context, id int64) (*SingleAdDetail, error) {
	vatRate, ftfRate, err := s.repo.GetRates(ctx)
	if err != nil {
		vatRate = 0.10
		ftfRate = 0.011
	}

	row, err := s.repo.GetAdByID(ctx, id)
	if err != nil {
		return nil, err
	}

	item := s.computeAdItem(*row, vatRate, ftfRate)

	dailyRows, err := s.repo.GetAdDailyMetrics(ctx, id)
	if err != nil {
		dailyRows = []AdDailyMetric{}
	}

	computedDaily := make([]AdDailyMetric, 0, len(dailyRows))
	for _, d := range dailyRows {
		vat := roundDecimals(d.SpendMeta*(1+vatRate), 0)
		ftf := roundDecimals(vat*ftfRate, 0)
		tot := vat + ftf

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

		computedDaily = append(computedDaily, AdDailyMetric{
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

	return &SingleAdDetail{
		Ad:           item,
		DailyMetrics: computedDaily,
	}, nil
}

// SyncAccountAds đồng bộ toàn bộ Ads inventory và Insights thực tế của một tài khoản quảng cáo
func (s *Service) SyncAccountAds(ctx context.Context, apiVersion, accountID, startDate, endDate, token string) error {
	ads, err := FetchAccountAdsInventory(ctx, apiVersion, accountID, token)
	if err == nil && len(ads) > 0 {
		_ = s.repo.UpsertMetaAds(ctx, ads)
	}

	insights, err := FetchAccountAdsInsights(ctx, apiVersion, accountID, startDate, endDate, token)
	if err == nil && len(insights) > 0 {
		_ = s.repo.UpsertMetaAdInsights(ctx, insights)
	}

	return nil
}
