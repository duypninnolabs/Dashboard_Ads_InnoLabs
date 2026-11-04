// src/api/axios.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Cache IP của client máy tính
let cachedClientIP = "";

// Lấy IP Public thực tế của máy tính
fetch("https://api.ipify.org?format=json")
  .then((res) => res.json())
  .then((data) => {
    if (data && data.ip) {
      cachedClientIP = data.ip;
    }
  })
  .catch(() => {
    // Không chặn ứng dụng nếu mạng offline hoặc dịch vụ ipify không phản hồi
  });

// Attach Storefront Password & Client Real IP headers to all requests
api.interceptors.request.use((config) => {
  const storedPass = localStorage.getItem("storefront_password") || "TBU";
  config.headers["X-Storefront-Password"] = storedPass;
  if (cachedClientIP) {
    config.headers["X-Client-Real-IP"] = cachedClientIP;
  }
  return config;
});

export default api;