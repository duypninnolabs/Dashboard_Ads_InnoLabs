package ads_detail

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

var httpClient = &http.Client{
	Timeout: 45 * time.Second,
}

func normalizeAccountID(id string) string {
	id = strings.TrimSpace(id)
	return strings.TrimPrefix(id, "act_")
}

// MetaAction đại diện cho lượt chuyển đổi/tin nhắn từ Meta
type MetaAction struct {
	ActionType string `json:"action_type"`
	Value      string `json:"value"`
}

// MetaInsightRow kết quả trả về từ endpoint /insights
type MetaInsightRow struct {
	CampaignID   string       `json:"campaign_id"`
	CampaignName string       `json:"campaign_name"`
	AdSetID      string       `json:"adset_id"`
	AdSetName    string       `json:"adset_name"`
	AdID         string       `json:"ad_id"`
	AdName       string       `json:"ad_name"`
	DateStart    string       `json:"date_start"`
	DateStop     string       `json:"date_stop"`
	Spend        string       `json:"spend"`
	Impressions  string       `json:"impressions"`
	Reach        string       `json:"reach"`
	Clicks       string       `json:"clicks"`
	CTR          string       `json:"ctr"`
	CPC          string       `json:"cpc"`
	CPM          string       `json:"cpm"`
	Actions      []MetaAction `json:"actions"`
}

// MetaCreativeDetail chi tiết creative bài post
type MetaCreativeDetail struct {
	ID                     string `json:"id"`
	Name                   string `json:"name"`
	Title                  string `json:"title"`
	Body                   string `json:"body"`
	ImageUrl               string `json:"image_url"`
	ThumbnailUrl           string `json:"thumbnail_url"`
	EffectiveObjectStoryID string `json:"effective_object_story_id"`
}

// MetaAdDetail cấu trúc ad trả về từ /ads
type MetaAdDetail struct {
	ID              string              `json:"id"`
	AdSetID         string              `json:"adset_id"`
	CampaignID      string              `json:"campaign_id"`
	Name            string              `json:"name"`
	Status          string              `json:"status"`
	EffectiveStatus string              `json:"effective_status"`
	Creative        *MetaCreativeDetail `json:"creative"`
}

type metaPaging struct {
	Next string `json:"next"`
}

type metaAdsResponse struct {
	Data   []MetaAdDetail `json:"data"`
	Paging metaPaging     `json:"paging"`
}

type metaInsightsResponse struct {
	Data   []MetaInsightRow `json:"data"`
	Paging metaPaging       `json:"paging"`
}

func doMetaGET(ctx context.Context, endpoint string, target interface{}) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("Meta API HTTP %d: %s", resp.StatusCode, string(body))
	}

	return json.Unmarshal(body, target)
}

// FetchAccountAdsInventory lấy danh sách tất cả Ads và bài post Creative của 1 tài khoản
func FetchAccountAdsInventory(ctx context.Context, apiVersion, accountID, token string) ([]MetaAdDetail, error) {
	accClean := normalizeAccountID(accountID)
	baseURL := fmt.Sprintf("https://graph.facebook.com/%s/act_%s/ads", apiVersion, accClean)

	q := url.Values{}
	q.Set("fields", "id,adset_id,campaign_id,name,status,effective_status,creative{id,name,title,body,image_url,thumbnail_url,effective_object_story_id}")
	q.Set("limit", "100")
	q.Set("access_token", token)

	var allAds []MetaAdDetail
	nextURL := baseURL + "?" + q.Encode()

	for nextURL != "" {
		var resp metaAdsResponse
		if err := doMetaGET(ctx, nextURL, &resp); err != nil {
			return nil, err
		}
		allAds = append(allAds, resp.Data...)
		nextURL = resp.Paging.Next
	}

	return allAds, nil
}

// FetchAccountAdsInsights lấy số liệu thực tế chi tiết từng Ad theo dải ngày (level=ad)
func FetchAccountAdsInsights(ctx context.Context, apiVersion, accountID, startDate, endDate, token string) ([]MetaInsightRow, error) {
	accClean := normalizeAccountID(accountID)
	baseURL := fmt.Sprintf("https://graph.facebook.com/%s/act_%s/insights", apiVersion, accClean)

	// Nếu không truyền startDate/endDate, mặc định lấy 60 ngày gần nhất thay vì date_preset=maximum
	// để tránh lỗi Meta HTTP 500: "Please reduce the amount of data you're asking for"
	if startDate == "" || endDate == "" {
		now := time.Now()
		endDate = now.Format("2006-01-02")
		startDate = now.AddDate(0, 0, -60).Format("2006-01-02")
	}

	q := url.Values{}
	q.Set("fields", "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,date_start,date_stop,spend,impressions,reach,clicks,ctr,cpc,cpm,actions")
	q.Set("level", "ad")
	q.Set("time_increment", "1")
	q.Set("limit", "500")
	q.Set("access_token", token)
	q.Set("time_range", fmt.Sprintf(`{"since":"%s","until":"%s"}`, startDate, endDate))

	var allInsights []MetaInsightRow
	nextURL := baseURL + "?" + q.Encode()

	for nextURL != "" {
		var resp metaInsightsResponse
		if err := doMetaGET(ctx, nextURL, &resp); err != nil {
			return nil, err
		}
		allInsights = append(allInsights, resp.Data...)
		nextURL = resp.Paging.Next
	}

	return allInsights, nil
}

func parseMetaActions(actions []MetaAction) (int64, int64) {
	var messages, leads int64
	for _, act := range actions {
		v, _ := strconv.ParseInt(act.Value, 10, 64)
		switch act.ActionType {
		case "onsite_conversion.messaging_conversation_started_7d",
			"onsite_conversion.messaging_first_reply",
			"onsite_conversion.total_messaging_connection":
			if v > messages {
				messages = v
			}
		case "lead", "onsite_conversion.lead_grouped":
			if v > leads {
				leads = v
			}
		}
	}
	return messages, leads
}

