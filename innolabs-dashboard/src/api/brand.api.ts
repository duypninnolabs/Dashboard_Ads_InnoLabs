import { api } from './axios'

export interface BrandData {
  id: number
  brand_name: string
  campaign_count?: number
  account_count?: number
  adset_count?: number
  ads_count?: number
  spend_meta?: number
  total_spend?: number
  messages?: number
  clicks?: number
  impressions?: number
  created_at?: string
  updated_at?: string
}

export async function fetchBrandsApi(): Promise<BrandData[]> {
  try {
    const res = await api.get<{ success: boolean; data: BrandData[] }>('/brands')
    return res.data?.data || []
  } catch (error) {
    console.warn('Lỗi tải danh sách thương hiệu:', error)
    return []
  }
}

export async function fetchBrandByIdApi(id: number): Promise<BrandData | null> {
  try {
    const res = await api.get<{ success: boolean; data: BrandData }>(`/brands/${id}`)
    return res.data?.data || null
  } catch (error) {
    console.warn('Lỗi tải chi tiết thương hiệu:', error)
    return null
  }
}

export async function createBrandApi(brandName: string): Promise<BrandData> {
  const res = await api.post<{ success: boolean; data: BrandData; message: string }>('/brands', {
    brand_name: brandName,
  })
  if (!res.data?.success && !res.data?.data) {
    throw new Error(res.data?.message || 'Thêm thương hiệu thất bại')
  }
  return res.data.data
}

export async function deleteBrandApi(id: number): Promise<boolean> {
  const res = await api.delete<{ success: boolean; message: string }>(`/brands/${id}`)
  return res.data?.success ?? true
}
