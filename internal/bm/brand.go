package bm

import "strings"

// ExtractBrandNameFromCampaignName lấy nội dung trong cặp [] đầu tiên.
//
// Ví dụ:
//
//   [TOÁN THẦY SƠN] [MESS] 27-08
//   => TOÁN THẦY SƠN
//
//   [PMP] [TOEIC] [MESS]
//   => PMP
//
// Nếu campaign không có [] hợp lệ thì ok = false.
// Khi đó campaign vẫn sync bình thường với brand_id = NULL
// hoặc giữ brand_id cũ nếu campaign đã từng được map.
func ExtractBrandNameFromCampaignName(
	campaignName string,
) (
	brandName string,
	ok bool,
) {
	start := strings.Index(
		campaignName,
		"[",
	)

	if start < 0 {
		return "", false
	}

	remaining := campaignName[start+1:]

	end := strings.Index(
		remaining,
		"]",
	)

	if end < 0 {
		return "", false
	}

	brandName = strings.TrimSpace(
		remaining[:end],
	)

	if brandName == "" {
		return "", false
	}

	return brandName, true
}
