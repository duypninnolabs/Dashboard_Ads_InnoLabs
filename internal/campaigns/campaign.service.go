package campaign

import (
	"context"
	"math"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetCampaignsSummary(ctx context.Context, params FilterParams) (*CampaignsSummary, error) {
	vatRate, ftfRate, err := s.repo.GetRates(ctx)
	if err != nil {
		vatRate = 0.10
		ftfRate = 0.011
	}

	rows, err := s.repo.FetchCampaigns(ctx, params)
	if err != nil {
		return nil, err
	}

	summary := &CampaignsSummary{
		TotalCampaigns: len(rows),
		Campaigns:      make([]CampaignItem, 0, len(rows)),
	}

	for _, r := range rows {
		item := s.computeCampaignItem(r, vatRate, ftfRate)

		if item.Status == "ACTIVE" {
			summary.ActiveCampaigns++
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

		summary.Campaigns = append(summary.Campaigns, item)
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

func (s *Service) GetCampaignDetail(ctx context.Context, id int64) (*CampaignDetail, error) {
	vatRate, ftfRate, err := s.repo.GetRates(ctx)
	if err != nil {
		vatRate = 0.10
		ftfRate = 0.011
	}

	row, err := s.repo.GetCampaignByID(ctx, id)
	if err != nil {
		return nil, err
	}

	campaignItem := s.computeCampaignItem(*row, vatRate, ftfRate)

	rawDaily, err := s.repo.GetCampaignDailyMetrics(ctx, id)
	if err != nil {
		return nil, err
	}

	computedDaily := make([]DailyMetric, 0, len(rawDaily))
	for _, d := range rawDaily {
		spendVat := d.SpendMeta * (1 + vatRate)
		ftf := spendVat * ftfRate
		totalSpend := spendVat + ftf
		results := d.Messages + d.Leads

		var cpr, ctr, cpc, cpm float64
		if results > 0 {
			cpr = roundDecimals(totalSpend/float64(results), 0)
		}
		if d.Impressions > 0 {
			ctr = roundDecimals(float64(d.Clicks)/float64(d.Impressions)*100, 2)
			cpm = roundDecimals(d.SpendMeta/float64(d.Impressions)*1000, 0)
		}
		if d.Clicks > 0 {
			cpc = roundDecimals(d.SpendMeta/float64(d.Clicks), 0)
		}

		computedDaily = append(computedDaily, DailyMetric{
			Date:          d.Date,
			SpendMeta:     d.SpendMeta,
			SpendVAT:      spendVat,
			FTFAmount:     ftf,
			TotalSpend:    totalSpend,
			Impressions:   d.Impressions,
			Reach:         d.Reach,
			Clicks:        d.Clicks,
			Messages:      d.Messages,
			Leads:         d.Leads,
			Results:       results,
			CostPerResult: cpr,
			CTR:           ctr,
			CPC:           cpc,
			CPM:           cpm,
		})
	}

	return &CampaignDetail{
		Campaign:     campaignItem,
		DailyMetrics: computedDaily,
		TotalDays:    len(computedDaily),
	}, nil
}

func (s *Service) computeCampaignItem(r CampaignRow, vatRate, ftfRate float64) CampaignItem {
	spendVat := r.SpendMeta * (1 + vatRate)
	ftfAmount := spendVat * ftfRate
	totalSpend := spendVat + ftfAmount

	brandName := "Unassigned"
	if r.BrandName != nil && *r.BrandName != "" {
		brandName = *r.BrandName
	}

	status := "PAUSED"
	if r.EffectiveStatus != nil && *r.EffectiveStatus != "" {
		status = *r.EffectiveStatus
	} else if r.CampaignStatus != nil && *r.CampaignStatus != "" {
		status = *r.CampaignStatus
	}

	objective := "OUTCOME_TRAFFIC"
	if r.Objective != nil && *r.Objective != "" {
		objective = *r.Objective
	}

	campStatus := ""
	if r.CampaignStatus != nil {
		campStatus = *r.CampaignStatus
	}

	effStatus := ""
	if r.EffectiveStatus != nil {
		effStatus = *r.EffectiveStatus
	}

	results := r.Messages + r.Leads

	var cpr, ctr, cpc, cpm float64
	if results > 0 {
		cpr = roundDecimals(totalSpend/float64(results), 0)
	}
	if r.Impressions > 0 {
		ctr = roundDecimals(float64(r.Clicks)/float64(r.Impressions)*100, 2)
		cpm = roundDecimals(r.SpendMeta/float64(r.Impressions)*1000, 0)
	}
	if r.Clicks > 0 {
		cpc = roundDecimals(r.SpendMeta/float64(r.Clicks), 0)
	}

	return CampaignItem{
		ID:              r.ID,
		AdAccountID:     r.AdAccountID,
		MetaAccountID:   r.MetaAccountID,
		AccountName:     r.AccountName,
		Currency:        r.Currency,
		MetaBusinessID:  r.MetaBusinessID,
		BusinessName:    r.BusinessName,
		BrandID:         r.BrandID,
		BrandName:       brandName,
		MetaCampaignID:  r.MetaCampaignID,
		CampaignName:    r.CampaignName,
		Objective:       objective,
		CampaignStatus:  campStatus,
		EffectiveStatus: effStatus,
		Status:          status,
		IsSyncEnabled:   r.IsSyncEnabled,
		SpendMeta:       r.SpendMeta,
		SpendVAT:        spendVat,
		FTFAmount:       ftfAmount,
		TotalSpend:      totalSpend,
		Impressions:     r.Impressions,
		Reach:           r.Reach,
		Clicks:          r.Clicks,
		Messages:        r.Messages,
		Leads:           r.Leads,
		Results:         results,
		CostPerResult:   cpr,
		CTR:             ctr,
		CPC:             cpc,
		CPM:             cpm,
		LastSyncedAt:    r.LastSyncedAt,
		CreatedAt:       r.CreatedAt,
	}
}

func roundDecimals(val float64, places int) float64 {
	pow := math.Pow(10, float64(places))
	return math.Round(val*pow) / pow
}
