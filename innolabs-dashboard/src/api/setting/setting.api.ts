import { api } from "../axios"

export const getSettingByKeyApi=async(key: string)=>{
    const response=await api.get<any>(
       `/setting/${key}`
    )
    return response.data
}

export const updateSettingByKeyAPI = async (key: string, data: any) => {
  const response = await api.put<any>(
    `/setting/${key}`,
    data
  )
  return response.data
}