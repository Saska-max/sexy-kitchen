// src/api/client.ts - Axios client for Smart Kitchen API
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from './config';
import { ApiError } from './types';

/**
 * Create axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Android specific settings
  validateStatus: (status) => status < 500, // Accept all responses below 500
});

/**
 * Request interceptor (can be used for auth tokens, etc.)
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log request for debugging
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log('[API] Request:', config.method?.toUpperCase(), fullUrl, config.data ? '(with data)' : '');
    
    // Remove Content-Type header for FormData (let axios set it automatically with boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error normalization
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API] Success:', response.config.method?.toUpperCase(), response.config.url);
    return response;
  },
  (error: AxiosError) => {
    // Log the error for debugging
    console.error('[API] Error:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      message: error.message,
      code: error.code,
      responseData: error.response?.data,
    });

    // Handle network errors (no response from server)
    if (!error.response) {
      const networkError: ApiError = {
        status: 0,
        message: 
          error.code === 'ECONNABORTED' 
            ? 'Request timeout. Please check your connection.'
            : error.message?.includes('Network Error')
            ? 'Network error. Please check your internet connection and try again.'
            : `Network error: ${error.message || 'Unable to connect to server'}`,
        data: null,
      };
      return Promise.reject(networkError);
    }

    // Normalize errors into consistent shape
    const apiError: ApiError = {
      status: error.response.status,
      message: 
        (error.response.data as any)?.detail ||
        (error.response.data as any)?.message ||
        error.message ||
        'An unexpected error occurred',
      data: error.response.data,
      detail: (error.response.data as any)?.detail,
      reason: (error.response.data as any)?.reason,
    };
    
    return Promise.reject(apiError);
  }
);

export default apiClient;

