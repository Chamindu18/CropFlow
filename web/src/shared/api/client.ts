import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { getCsrfToken, getCsrfHeaderName } from './csrf';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1';

let currentAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function clearAccessToken(): void {
  currentAccessToken = null;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = config.method?.toLowerCase();

  if (currentAccessToken) {
    config.headers.set('Authorization', `Bearer ${currentAccessToken}`);
  }

  if (method && MUTATING_METHODS.has(method)) {
    const token = getCsrfToken();
    const headerName = getCsrfHeaderName();
    if (token) {
      config.headers.set(headerName, token);
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);