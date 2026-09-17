// src/api/client.ts
// -----------------
// Shared HTTP helpers. Every call returns an envelope:
//   { base_response: { success, message }, ...payload }
// Nothing throws.

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { API_URL } from "../config/api";

export interface BaseResponse {
  success: boolean;
  message: string;
}

export type ApiEnvelope<T = {}> = { base_response: BaseResponse } & T;

function failure(message: string): BaseResponse {
  return { success: false, message };
}

// ── Auth helpers ───────────────────────────────────────────────────────
export async function getJwt(): Promise<string | null> {
  return AsyncStorage.getItem("jwt");
}

export async function getUserId(): Promise<string | null> {
  return AsyncStorage.getItem("userId");
}

export async function saveAuth(jwt: string, userId: string): Promise<void> {
  await AsyncStorage.multiSet([
    ["jwt", jwt],
    ["userId", userId],
  ]);
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove(["jwt", "userId"]);
}

// ── Axios instance ─────────────────────────────────────────────────────
const http = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use(async (config) => {
  const jwt = await getJwt();
  if (jwt) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${jwt}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) await clearAuth();
    return Promise.reject(error);
  },
);

// ── Error → envelope ───────────────────────────────────────────────────
function errorToResponse(error: unknown): BaseResponse {
  if (axios.isAxiosError(error)) {
    const axErr = error as AxiosError<any>;
    if (axErr.response) {
      const msg =
        axErr.response.data?.base_response?.message ||
        axErr.response.data?.message ||
        `Server error (${axErr.response.status})`;
      return failure(msg);
    }
    if (axErr.request)
      return failure("Network error — could not connect to server");
  }
  return failure(error instanceof Error ? error.message : "Unexpected error");
}

async function wrap<T extends object>(
  fn: () => Promise<{ data: any }>,
): Promise<ApiEnvelope<T>> {
  try {
    const res = await fn();
    if (
      res.data &&
      typeof res.data === "object" &&
      "base_response" in res.data
    ) {
      return res.data as ApiEnvelope<T>;
    }
    return {
      base_response: { success: true, message: "OK" },
      ...(res.data as T),
    };
  } catch (error) {
    return { base_response: errorToResponse(error) } as ApiEnvelope<T>;
  }
}

export const api = {
  get<T extends object = {}>(url: string, config?: AxiosRequestConfig) {
    return wrap<T>(() => http.get(url, config));
  },
  post<T extends object = {}>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ) {
    return wrap<T>(() => http.post(url, body, config));
  },
  patch<T extends object = {}>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ) {
    return wrap<T>(() => http.patch(url, body, config));
  },
  put<T extends object = {}>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ) {
    return wrap<T>(() => http.put(url, body, config));
  },
  delete<T extends object = {}>(url: string, config?: AxiosRequestConfig) {
    return wrap<T>(() => http.delete(url, config));
  },
};

export { http as axiosInstance };
