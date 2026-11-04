package bm

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

var httpClient = &http.Client{
	Timeout: 45 * time.Second,
}

type MetaAPIError struct {
	Error struct {
		Message      string `json:"message"`
		Type         string `json:"type"`
		Code         int    `json:"code"`
		ErrorSubcode int    `json:"error_subcode"`
		FBTraceID    string `json:"fbtrace_id"`
	} `json:"error"`
}

func doMetaGET(
	ctx context.Context,
	endpoint string,
	target interface{},
) error {
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		endpoint,
		nil,
	)
	if err != nil {
		return fmt.Errorf("khÃ´ng thá»ƒ táº¡o Meta request: %w", err)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("khÃ´ng thá»ƒ káº¿t ná»‘i Meta API: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("khÃ´ng thá»ƒ Ä‘á»c Meta response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var metaErr MetaAPIError

		if err := json.Unmarshal(body, &metaErr); err == nil &&
			metaErr.Error.Message != "" {
			return fmt.Errorf(
				"Meta API: %s | code=%d | subcode=%d | trace=%s",
				metaErr.Error.Message,
				metaErr.Error.Code,
				metaErr.Error.ErrorSubcode,
				metaErr.Error.FBTraceID,
			)
		}

		return fmt.Errorf(
			"Meta API HTTP %d: %s",
			resp.StatusCode,
			string(body),
		)
	}

	if err := json.Unmarshal(body, target); err != nil {
		return fmt.Errorf(
			"khÃ´ng thá»ƒ decode Meta JSON: %w",
			err,
		)
	}

	return nil
}

func normalizeAdAccountID(
	metaAccountID string,
) string {
	metaAccountID =
		strings.TrimSpace(metaAccountID)

	metaAccountID =
		strings.TrimPrefix(
			metaAccountID,
			"act_",
		)

	return metaAccountID
}

// ======================================================
// BUSINESS
// ======================================================

func FetchBusiness(
	ctx context.Context,
	apiVersion string,
	bmID string,
	token string,
) (*MetaBusiness, error) {
	endpoint := fmt.Sprintf(
		"https://graph.facebook.com/%s/%s",
		apiVersion,
		bmID,
	)

	q := url.Values{}
	q.Set("fields", "id,name")
	q.Set("access_token", token)

	var business MetaBusiness

	if err := doMetaGET(
		ctx,
		endpoint+"?"+q.Encode(),
		&business,
	); err != nil {
		return nil, err
	}

	return &business, nil
}

// ======================================================
// AD ACCOUNTS
// ======================================================

// FetchAdAccounts hiá»‡n láº¥y owned_ad_accounts cá»§a tá»«ng BM.
//
// Náº¿u sau nÃ y báº¡n cáº§n cáº£ ad account Ä‘Æ°á»£c share cho BM,
// cÃ³ thá»ƒ bá»• sung client_ad_accounts vÃ  dedupe theo account_id.
func FetchAdAccounts(
	ctx context.Context,
	apiVersion string,
	bmID string,
	token string,
) ([]MetaAdAccount, error) {
	endpoint := fmt.Sprintf(
		"https://graph.facebook.com/%s/%s/owned_ad_accounts",
		apiVersion,
		bmID,
	)

	q := url.Values{}
	q.Set(
		"fields",
		"id,account_id,name,currency,timezone_name,account_status",
	)
	q.Set("limit", "100")
	q.Set("access_token", token)

	nextURL :=
		endpoint + "?" + q.Encode()

	accounts :=
		make([]MetaAdAccount, 0)

	for nextURL != "" {
		var response MetaAdAccountsResponse

		if err := doMetaGET(
			ctx,
			nextURL,
			&response,
		); err != nil {
			return nil, err
		}

		accounts = append(
			accounts,
			response.Data...,
		)

		nextURL =
			response.Paging.Next
	}

	return accounts, nil
}

// ======================================================
// CAMPAIGN INVENTORY
// ======================================================

// FetchAllCampaigns cá»‘ gáº¯ng láº¥y toÃ n bá»™ campaign Meta cÃ²n cho phÃ©p Ä‘á»c:
// ACTIVE, PAUSED, ARCHIVED, DELETED.
//
// Náº¿u edge/version khÃ´ng cháº¥p nháº­n effective_status parameter,
// hÃ m retry khÃ´ng filter.
//
// Campaign Ä‘Ã£ xÃ³a lÃ¢u mÃ  edge /campaigns khÃ´ng cÃ²n tráº£ váº«n cÃ³ thá»ƒ
// Ä‘Æ°á»£c táº¡o láº¡i tá»« historical insights trong service.
func FetchAllCampaigns(
	ctx context.Context,
	apiVersion string,
	metaAccountID string,
	token string,
) ([]MetaCampaign, error) {
	metaAccountID =
		normalizeAdAccountID(
			metaAccountID,
		)

	baseURL := fmt.Sprintf(
		"https://graph.facebook.com/%s/act_%s/campaigns",
		apiVersion,
		metaAccountID,
	)

	q := url.Values{}
	q.Set(
		"fields",
		"id,name,status,effective_status",
	)
	q.Set("limit", "100")
	q.Set("access_token", token)

	q.Set(
		"effective_status",
		`["ACTIVE","PAUSED","ARCHIVED","DELETED"]`,
	)

	campaigns, err :=
		fetchCampaignPages(
			ctx,
			baseURL+"?"+q.Encode(),
		)

	if err == nil {
		return campaigns, nil
	}

	q.Del("effective_status")

	return fetchCampaignPages(
		ctx,
		baseURL+"?"+q.Encode(),
	)
}

func fetchCampaignPages(
	ctx context.Context,
	nextURL string,
) ([]MetaCampaign, error) {
	campaigns :=
		make([]MetaCampaign, 0)

	for nextURL != "" {
		var response MetaCampaignsResponse

		if err := doMetaGET(
			ctx,
			nextURL,
			&response,
		); err != nil {
			return nil, err
		}

		campaigns = append(
			campaigns,
			response.Data...,
		)

		nextURL =
			response.Paging.Next
	}

	return campaigns, nil
}

// ======================================================
// ADSET INVENTORY
// ======================================================

func FetchAllAdSets(
	ctx context.Context,
	apiVersion string,
	metaAccountID string,
	token string,
) ([]MetaAdSet, error) {
	metaAccountID = normalizeAdAccountID(metaAccountID)
	baseURL := fmt.Sprintf("https://graph.facebook.com/%s/act_%s/adsets", apiVersion, metaAccountID)

	q := url.Values{}
	q.Set("fields", "id,campaign_id,name,status,effective_status,daily_budget,lifetime_budget,optimization_goal,billing_event,targeting")
	q.Set("limit", "100")
	q.Set("access_token", token)

	var allAdSets []MetaAdSet
	nextURL := baseURL + "?" + q.Encode()

	for nextURL != "" {
		var response MetaAdSetsResponse
		if err := doMetaGET(ctx, nextURL, &response); err != nil {
			return nil, err
		}
		allAdSets = append(allAdSets, response.Data...)
		nextURL = response.Paging.Next
	}

	return allAdSets, nil
}

// ======================================================
// ACCOUNT INSIGHTS
// ======================================================

func FetchAccountHistory(
	ctx context.Context,
	apiVersion string,
	metaAccountID string,
	token string,
) ([]MetaInsight, error) {
	metaAccountID =
		normalizeAdAccountID(
			metaAccountID,
		)

	baseURL := fmt.Sprintf(
		"https://graph.facebook.com/%s/act_%s/insights",
		apiVersion,
		metaAccountID,
	)

	q := buildAccountInsightQuery(
		token,
	)

	q.Set(
		"date_preset",
		"maximum",
	)

	return fetchInsightsWithStatusFallback(
		ctx,
		baseURL,
		q,
	)
}

func FetchAccountInsightsForDate(
	ctx context.Context,
	apiVersion string,
	metaAccountID string,
	date string,
	token string,
) ([]MetaInsight, error) {
	metaAccountID =
		normalizeAdAccountID(
			metaAccountID,
		)

	baseURL := fmt.Sprintf(
		"https://graph.facebook.com/%s/act_%s/insights",
		apiVersion,
		metaAccountID,
	)

	q := buildAccountInsightQuery(
		token,
	)

	timeRange := fmt.Sprintf(
		`{"since":"%s","until":"%s"}`,
		date,
		date,
	)

	q.Set(
		"time_range",
		timeRange,
	)

	return fetchInsightsWithStatusFallback(
		ctx,
		baseURL,
		q,
	)
}

func buildAccountInsightQuery(
	token string,
) url.Values {
	q := url.Values{}

	q.Set(
		"fields",
		"campaign_id,campaign_name,date_start,date_stop,spend,impressions,reach,clicks,ctr,cpc,cpm,actions",
	)

	q.Set("level", "campaign")
	q.Set("time_increment", "1")
	q.Set("limit", "500")
	q.Set("access_token", token)

	q.Set(
		"filtering",
		`[{"field":"campaign.effective_status","operator":"IN","value":["ACTIVE","PAUSED","ARCHIVED","DELETED"]}]`,
	)

	return q
}

func fetchInsightsWithStatusFallback(
	ctx context.Context,
	baseURL string,
	q url.Values,
) ([]MetaInsight, error) {
	insights, err :=
		fetchInsightPages(
			ctx,
			baseURL+"?"+q.Encode(),
		)

	if err == nil {
		return insights, nil
	}

	// Má»™t sá»‘ API version cÃ³ thá»ƒ khÃ´ng cháº¥p nháº­n filter status
	// trÃªn insights. Khi Ä‘Ã³ retry khÃ´ng filter.
	q.Del("filtering")

	return fetchInsightPages(
		ctx,
		baseURL+"?"+q.Encode(),
	)
}

func fetchInsightPages(
	ctx context.Context,
	nextURL string,
) ([]MetaInsight, error) {
	insights :=
		make([]MetaInsight, 0)

	for nextURL != "" {
		var response MetaInsightsResponse

		if err := doMetaGET(
			ctx,
			nextURL,
			&response,
		); err != nil {
			return nil, err
		}

		insights = append(
			insights,
			response.Data...,
		)

		nextURL =
			response.Paging.Next
	}

	return insights, nil
}

// ======================================================
// NEW CAMPAIGN HISTORY
// ======================================================

// FetchCampaignHistory chá»‰ dÃ¹ng khi má»™t campaign má»›i xuáº¥t hiá»‡n
// sau khi BM Ä‘Ã£ initial sync.
//
// Initial backfill chÃ­nh váº«n cháº¡y á»Ÿ cáº¥p Ad Account Ä‘á»ƒ nháº¹ API.
func FetchCampaignHistory(
	ctx context.Context,
	apiVersion string,
	campaignID string,
	token string,
) ([]MetaInsight, error) {
	baseURL := fmt.Sprintf(
		"https://graph.facebook.com/%s/%s/insights",
		apiVersion,
		campaignID,
	)

	q := url.Values{}

	q.Set(
		"fields",
		"campaign_id,campaign_name,date_start,date_stop,spend,impressions,reach,clicks,ctr,cpc,cpm,actions",
	)

	q.Set("date_preset", "maximum")
	q.Set("time_increment", "1")
	q.Set("limit", "500")
	q.Set("access_token", token)

	return fetchInsightPages(
		ctx,
		baseURL+"?"+q.Encode(),
	)
}
