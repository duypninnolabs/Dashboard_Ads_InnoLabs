import { api } from "../axios";
import { LoginRequest, LoginResponse } from "./auth.type";

export const loginApi = async (
  payload: LoginRequest
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(
    "/auth/verify-storefront",
    payload
  );

  return response.data;
};

export const logoutApi=async()=>{
    const response = await api.post<any>(
        "/auth/logout"
    )
    return response.data
}