package dashboard

import (
	"context"
	"fmt"
	"math"
	"time"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetDashboardSpend(ctx context.Context, params FilterParams) (*SpendApiResponse, error) {
	vatRate, ftfRate, err := s.repo.GetRates(ctx)
	if err != nil {
		vatRate = 0.10
		ftfRate = 0.011
	}

	rows, err := s.repo.FetchInsights(ctx, params)
	if err != nil {
		return nil, err
	}

	items := make([]SpendItem, 0, len(rows))
	var totalSpendMeta, totalSpendVAT, totalFTFAmount, grandTotalSpend float64
	bmSet := make(map[string]struct{})
	accSet := make(map[string]struct{})
	brandSet := make(map[string]struct{})

	var lastSyncedStr string

	for _, r := range rows {
		brandName := "Unbranded"
		if r.BrandName != nil && *r.BrandName != "" {
			brandName = *r.BrandName
		}

		// Calculations according to Section 7
		spendMeta := math.Round(r.Spend)
		vatAmount := spendMeta * vatRate
		spendVat := math.Round(spendMeta + vatAmount)
		ftfAmount := math.Round(spendVat * ftfRate)
		totalSpend := math.Round(spendVat + ftfAmount)

		totalSpendMeta += spendMeta
		totalSpendVAT += spendVat
		totalFTFAmount += ftfAmount
		grandTotalSpend += totalSpend

		bmSet[r.BMID] = struct{}{}
		accSet[r.AccountID] = struct{}{}
		brandSet[brandName] = struct{}{}

		if r.LastSyncedAt != nil && lastSyncedStr == "" {
			lastSyncedStr = r.LastSyncedAt.Format(time.RFC3339)
		}

		items = append(items, SpendItem{
			ID:           fmt.Sprintf("%s_%s_%s_%s", r.InsightDate, r.BMID, r.AccountID, r.CampaignID),
			Date:         r.InsightDate,
			BMID:         r.BMID,
			BMName:       r.BMName,
			AccountID:    r.AccountID,
			AccountName:  r.AccountName,
			CampaignID:   r.CampaignID,
			CampaignName: r.CampaignName,
			BrandID:      r.BrandID,
			Brand:        brandName,
			Currency:     r.Currency,
			SpendMeta:    spendMeta,
			VATRate:      vatRate,
			SpendVAT:     spendVat,
			FTFRate:      ftfRate,
			FTFAmount:    ftfAmount,
			TotalSpend:   totalSpend,
			LastSyncedAt: r.LastSyncedAt,
		})
	}

	dateRangeText := "Tất cả thời gian"
	if params.StartDate != "" && params.EndDate != "" {
		dateRangeText = fmt.Sprintf("%s - %s", params.StartDate, params.EndDate)
	}

	if lastSyncedStr == "" {
		lastSyncedStr = time.Now().Format(time.RFC3339)
	}

	summary := DashboardSummary{
		SpendMeta:     totalSpendMeta,
		VATRate:       vatRate,
		SpendVAT:      totalSpendVAT,
		FTFRate:       ftfRate,
		FTFAmount:     totalFTFAmount,
		TotalSpend:    grandTotalSpend,
		TotalBMs:      len(bmSet),
		TotalAccounts: len(accSet),
		TotalBrands:   len(brandSet),
		DateRangeText: dateRangeText,
		LastSyncedAt:  lastSyncedStr,
	}

	return &SpendApiResponse{
		Items:        items,
		Summary:      summary,
		LastSyncedAt: lastSyncedStr,
	}, nil
}

func (s *Service) GetFilterOptions(ctx context.Context) (*FilterOptionsResponse, error) {
	return s.repo.FetchFilterOptions(ctx)
}
