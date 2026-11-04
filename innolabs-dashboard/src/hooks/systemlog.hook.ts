import { useQuery } from "@tanstack/react-query";
import { getSystemLogsApi, GetSystemLogsParams } from "../api/systemlog.api";

export const useGetSystemLogs = (params?: GetSystemLogsParams) => {
  return useQuery({
    queryKey: ["system-logs", params],
    queryFn: () => getSystemLogsApi(params),
    refetchInterval: 10000, // Tự động làm mới mỗi 10 giây
  });
};
