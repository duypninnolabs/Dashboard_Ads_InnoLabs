import { api } from "../axios"


export type VerifyBMRequest = {
  platform?: string
  bm_id: string
  token: string
}

export type VerifyBMResponse = {
  valid: boolean
  bm_id: string
  business_name: string
  message: string
}

export type SaveBMRequest = {
  platform?: string
  bm_id: string
  business_name?: string
  bm_name?: string
  token: string
  is_active?: boolean
}

export const VerifyBusinessManagerApi = async (data: VerifyBMRequest) => {
  const response = await api.post<{
    success: boolean
    message: string
    data: VerifyBMResponse
  }>('/business-managers/verify', data)
  return response.data
}

export const CreateBusinessManagerApi = async (data: SaveBMRequest) => {
  const response = await api.post<any>('/business-managers', data)
  return response.data
}

export const GetBusinessManagerApi = async () => {
  const response = await api.get<any>('/business-managers')
  return response.data
}

export const GetBusinessManagerByIdApi = async (id: string) => {
  const response = await api.get<{
    success: boolean
    message: string
    data: any
  }>(`/business-managers/${id}`)
  return response.data
}

export const UpdateBusinessManagerApi = async ({
  id,
  data,
}: {
  id: string
  data: SaveBMRequest
}) => {
  const response = await api.put<any>(`/business-managers/${id}`, data)
  return response.data
}

export const DeleteBusinessManagerApi = async (id: string) => {
  const response = await api.delete<any>(`/business-managers/${id}`)
  return response.data
}
