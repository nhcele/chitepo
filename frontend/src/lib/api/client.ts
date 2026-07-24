import { withBasePath } from '../basePath';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getAuthHeaders, removeAuthToken } from '../auth';

const normalizeApiBase = (raw?: string) => {
  const fallback = 'http://localhost:3001/api';
  let base = (raw || fallback).trim();
  // Strip trailing slash
  base = base.replace(/\/$/, '');
  // If it doesn't end with /api, add it (backend uses global prefix)
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  return base;
};

const API_BASE_URL = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);

class ApiClient {
  private client: AxiosInstance | null = null;

  private getClient(): AxiosInstance {
    if (this.client) {
      return this.client;
    }

    // Only create client on client side
    if (typeof window === 'undefined') {
      // Return a mock client for SSR that will fail gracefully
      this.client = axios.create({
        baseURL: API_BASE_URL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return this.client;
    }

    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth headers
    this.client.interceptors.request.use(
      (config) => {
        // Only add auth headers on client side
        if (typeof window !== 'undefined') {
          const authHeaders = getAuthHeaders();
          if (config.headers) {
            Object.assign(config.headers, authHeaders);
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          removeAuthToken();
          if (typeof window !== 'undefined') {
            window.location.href = withBasePath('/auth/login');
          }
        }
        return Promise.reject(error);
      }
    );

    return this.client;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.getClient().get(url, config);
      return response.data;
    } catch (error: any) {
      // Enhance error with more context
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          const errorMessage = new Error(
            `Request failed: ${status}. Endpoint not found: ${API_BASE_URL}${url}. Please check if the backend server is running.`
          );
          (errorMessage as any).response = error.response;
          throw errorMessage;
        }
      } else if (error.request) {
        throw new Error(
          `Network error: Unable to reach the server at ${API_BASE_URL}. Please check if the backend server is running.`
        );
      }
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.getClient().post(url, data, config);
      return response.data;
    } catch (error: any) {
      // Enhance error with more context
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const statusText = error.response.statusText;
        const data = error.response.data;
        
        if (status === 404) {
          const errorMessage = new Error(
            `Request failed: ${status} ${statusText}. Endpoint not found: ${API_BASE_URL}${url}. Please check if the backend server is running.`
          );
          (errorMessage as any).response = error.response;
          throw errorMessage;
        }
      } else if (error.request) {
        // Request was made but no response received
        throw new Error(
          `Network error: Unable to reach the server at ${API_BASE_URL}. Please check if the backend server is running.`
        );
      }
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.getClient().put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.getClient().patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.getClient().delete(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
