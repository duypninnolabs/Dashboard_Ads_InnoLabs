import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query"
import { getSettingByKeyApi, updateSettingByKeyAPI } from "../api/setting/setting.api"

export const useGetSettings = (keys: string[]) => {
  return useQueries({
    queries: keys.map((key) => ({
      queryKey: ["setting", key],
      queryFn: () => getSettingByKeyApi(key),
      enabled: !!key,
    })),
  })
}


export const useUpdateSettingByKey = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      key,
      data,
    }: {
      key: string
      data: any
    }) => updateSettingByKeyAPI(key, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["setting"],
      })
    },
  })
}