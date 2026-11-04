import { api } from './axios'


export interface AdSetItem {
  id: number
  campaign_id: number
  meta_adset_id: string
  adset_name: string
  status: string
  effective_status: string
  daily_budget: number | null
  lifetime_budget: number | null
  optimization_goal: string
  billing_event: string
  targeting_summary: string
  meta_campaign_id: string
  campaign_name: string
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
  last_synced_at?: string
}

export interface AdSetsSummary {
  total_adsets: number
  active_adsets: number
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
  adsets: AdSetItem[]
}

export interface DailyMetric {
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

export interface ChildAd {
  id: number
  adset_id: number
  meta_ad_id: string
  ad_name: string
  status: string
  creative_type: string
  post_id?: string
  post_url?: string
  post_message?: string
  thumbnail_url?: string
  spend_meta: number
  spend_vat: number
  total_spend: number
  impressions: number
  clicks: number
  messages?: number
  ctr: number
  cpc: number
  created_at: string
}

export interface TargetingInfo {
  age_min: number
  age_max: number
  age_range?: string
  genders: string
  locations: string[]
  custom_locations?: string[]
  interests?: string[]
  family_statuses?: string[]
  education_statuses?: string[]
  advantage_audience?: boolean
  brand_safety?: string[]
  placements: string[]
  optimization_goal: string
  billing_event: string
  attribution: string
}

export interface AdSetDetail {
  adset: AdSetItem
  daily_metrics: DailyMetric[]
  child_ads: ChildAd[]
  targeting_info: TargetingInfo
}

export interface AdSetFilterParams {
  start_date?: string
  end_date?: string
  bm_id?: string
  account_id?: string
  brand_id?: string
  brand?: string
  campaign_id?: string
  status?: string
  search?: string
}

export async function fetchAdSetsApi(params: AdSetFilterParams = {}): Promise<AdSetsSummary> {
  const query = new URLSearchParams()
  if (params.start_date) query.append('start_date', params.start_date)
  if (params.end_date) query.append('end_date', params.end_date)
  if (params.bm_id) query.append('bm_id', params.bm_id)
  if (params.account_id) query.append('account_id', params.account_id)
  if (params.brand_id) query.append('brand_id', params.brand_id)
  if (params.brand) query.append('brand', params.brand)
  if (params.campaign_id) query.append('campaign_id', params.campaign_id)
  if (params.status) query.append('status', params.status)
  if (params.search) query.append('search', params.search)

  const res = await api.get(`/adsets?${query.toString()}`)
  return res.data?.data || {
    total_adsets: 0,
    active_adsets: 0,
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
    adsets: [],
  }
}

export async function fetchAdSetDetailApi(
  id: number,
  startDate?: string,
  endDate?: string
): Promise<AdSetDetail> {
  const query = new URLSearchParams()
  if (startDate) query.append('start_date', startDate)
  if (endDate) query.append('end_date', endDate)
  const qs = query.toString()
  const res = await api.get(`/adsets/${id}${qs ? `?${qs}` : ''}`)
  return res.data?.data
}

