import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CreateBusinessManagerApi,
  GetBusinessManagerApi,
  VerifyBusinessManagerApi,
  UpdateBusinessManagerApi,
  DeleteBusinessManagerApi,
  GetBusinessManagerByIdApi,
} from "../api/business-manager/business-manager.api"

export const useCreateBusinessManager = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: CreateBusinessManagerApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["business-managers"],
      })
    },
  })
}

export const useVerifyBusinessManager = () => {
  return useMutation({
    mutationFn: VerifyBusinessManagerApi,
  })
}

export const useUpdateBusinessManager = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: UpdateBusinessManagerApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["business-managers"],
      })
    },
  })
}

export const useDeleteBusinessManager = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: DeleteBusinessManagerApi,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["business-managers"],
      })
    },
  })
}

export function useGetBusinessManagerById(id: string) {
  return useQuery({
    queryKey: ["business-manager", id],
    queryFn: () => GetBusinessManagerByIdApi(id),
    enabled: !!id,
  })
}

export function useGetBusinessManagers() {
  return useQuery({
    queryKey: ["business-managers"],
    queryFn: GetBusinessManagerApi,

    staleTime: 1000 * 60 * 60,      // 1 giờ
    gcTime: 1000 * 60 * 60 * 2,     // giữ cache 2 giờ

    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}