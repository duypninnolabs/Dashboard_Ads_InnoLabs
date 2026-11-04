import api from './axios'

export interface CampaignItem {
  id: number
  ad_account_id: number
  meta_account_id: string
  account_name: string
  currency: string
  meta_business_id: string
  business_name: string
  brand_id?: number | null
  brand_name: string
  meta_campaign_id: string
  campaign_name: string
  objective: string
  campaign_status: string
  effective_status: string
  status: string
  is_sync_enabled: boolean
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
  created_at: string
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

export interface CampaignDetail {
  campaign: CampaignItem
  daily_metrics: DailyMetric[]
  total_days: number
}

export interface CampaignsSummary {
  total_campaigns: number
  active_campaigns: number
  spend_meta: number
  spend_vat: number
  ftf_amount: number
  total_spend: number
  impressions: number
  clicks: number
  messages: number
  leads: number
  results: number
  avg_ctr: number
  avg_cpc: number
  avg_cpa: number
  campaigns: CampaignItem[]
}

export interface CampaignFilterParams {
  start_date?: string
  end_date?: string
  bm_id?: string
  account_id?: string
  brand_id?: string
  status?: string
  search?: string
}

export async function fetchCampaignsApi(params: CampaignFilterParams = {}): Promise<CampaignsSummary> {
  const query = new URLSearchParams()
  if (params.start_date) query.set('start_date', params.start_date)
  if (params.end_date) query.set('end_date', params.end_date)
  if (params.bm_id) query.set('bm_id', params.bm_id)
  if (params.account_id) query.set('account_id', params.account_id)
  if (params.brand_id) query.set('brand_id', params.brand_id)
  if (params.status && params.status !== 'ALL') query.set('status', params.status)
  if (params.search) query.set('search', params.search)

  const response = await api.get(`/campaigns?${query.toString()}`)
  return response.data?.data
}

export async function fetchCampaignDetailApi(id: number): Promise<CampaignDetail> {
  const response = await api.get(`/campaigns/${id}`)
  return response.data?.data
}
