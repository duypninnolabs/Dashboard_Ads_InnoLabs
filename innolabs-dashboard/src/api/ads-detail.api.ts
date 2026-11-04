import { api } from './axios'

export interface AdDetailItem {
  id: number
  adset_id: number
  meta_ad_id: string
  ad_name: string
  status: string
  effective_status: string
  creative_type: string
  post_id: string
  post_url: string
  post_message: string
  thumbnail_url: string
  campaign_id: number
  meta_campaign_id: string
  campaign_name: string
  meta_adset_id: string
  adset_name: string
  meta_account_id: string
  account_name: string
  currency: string
  meta_business_id: string
  business_name: string
  brand_id: number | null
  brand_name: string
  spend_meta: number
  spend_vat: number
  ftf_amount: number
  total_spend: number
  impressions: number
  reach: number
  clicks: number
  messages: number
  leads: number
  results: number
  cost_per_result: number
  ctr: number
  cpc: number
  cpm: number
  created_at: string
  updated_at: string
}

export interface AdsSummary {
  total_ads: number
  active_ads: number
  total_spend: number
  spend_meta: number
  spend_vat: number
  ftf_amount: number
  impressions: number
  clicks: number
  messages: number
  leads: number
  results: number
  avg_ctr: number
  avg_cpc: number
  avg_cpa: number
  ads: AdDetailItem[]
}

export interface AdDailyMetric {
  date: string
  spend_meta: number
  spend_vat: number
  ftf_amount: number
  total_spend: number
  impressions: number
  reach: number
  clicks: number
  messages: number
  leads: number
  results: number
  cost_per_result: number
  ctr: number
  cpc: number
  cpm: number
}

export interface SingleAdDetail {
  ad: AdDetailItem
  daily_metrics: AdDailyMetric[]
}

export interface AdsFilterParams {
  start_date?: string
  end_date?: string
  status?: string
  bm_id?: string
  account_id?: string
  campaign_id?: string
  adset_id?: string
  brand_id?: string
  brand?: string
  search?: string
}

export async function fetchAdsDetailListApi(params?: AdsFilterParams): Promise<AdsSummary> {
  const query = new URLSearchParams()
  if (params?.start_date) query.set('start_date', params.start_date)
  if (params?.end_date) query.set('end_date', params.end_date)
  if (params?.status && params.status !== 'ALL') query.set('status', params.status)
  if (params?.bm_id) query.set('bm_id', params.bm_id)
  if (params?.account_id) query.set('account_id', params.account_id)
  if (params?.campaign_id) query.set('campaign_id', params.campaign_id)
  if (params?.adset_id) query.set('adset_id', params.adset_id)
  if (params?.brand_id) query.set('brand_id', params.brand_id)
  if (params?.brand) query.set('brand', params.brand)
  if (params?.search) query.set('search', params.search)

  const res = await api.get(`/ads-detail?${query.toString()}`)
  return res.data?.data || {
    total_ads: 0,
    active_ads: 0,
    total_spend: 0,
    spend_meta: 0,
    spend_vat: 0,
    ftf_amount: 0,
    impressions: 0,
    clicks: 0,
    messages: 0,
    leads: 0,
    results: 0,
    avg_ctr: 0,
    avg_cpc: 0,
    avg_cpa: 0,
    ads: [],
  }
}

export async function fetchSingleAdDetailApi(id: number): Promise<SingleAdDetail> {
  const res = await api.get(`/ads-detail/${id}`)
  return res.data?.data
}

export async function triggerSyncAdsApi(accountId?: string, startDate?: string, endDate?: string) {
  const res = await api.post('/ads-detail/sync', {
    account_id: accountId,
    start_date: startDate,
    end_date: endDate,
  })
  return res.data
}

