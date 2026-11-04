import { api } from "./axios";

export interface SystemLogItem {
  log_id: string;
  timestamp: string;
  level: string;
  message: string;
  service?: string;
  host?: string;
  user_id?: number;
  ip?: string;
  request_body?: any;
  response?: any;
  tags?: string[] | any;
  errors?: any;
  metadata?: any;
}

export interface GetSystemLogsParams {
  level?: string;
  service?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SystemLogsResponse {
  success: boolean;
  data: SystemLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export const getSystemLogsApi = async (
  params?: GetSystemLogsParams
): Promise<SystemLogsResponse> => {
  const response = await api.get("/system-logs", { params });
  return response.data;
};

export const getSystemLogByIdApi = async (
  logId: string
): Promise<{ success: boolean; data: SystemLogItem }> => {
  const response = await api.get(`/system-logs/${logId}`);
  return response.data;
};
