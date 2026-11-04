import { useMutation } from "@tanstack/react-query";
import { loginApi, logoutApi } from "../api/auth/auth.api";

export const useLogin = () => {
  return useMutation({
    mutationFn: loginApi,
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: logoutApi,
  });
};