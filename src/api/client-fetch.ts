// src/api/client-fetch.ts - Fetch-based API client for better Android compatibility
import { API_BASE_URL, API_TIMEOUT } from './config';
import { ApiError } from './types';

/**
 * Fetch wrapper with timeout and error handling
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`[API Fetch] Timeout set to ${timeout}ms`);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms. Backend might be starting up, please try again.`);
    }
    throw error;
  }
}

/**
 * Make API request with fetch
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log('[API Fetch] Request:', options.method || 'GET', url);

  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    });

    console.log('[API Fetch] Response:', response.status, response.ok);

    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('[API Fetch] Non-JSON response:', text);
      throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
    }

    console.log('[API Fetch] Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        message: data.detail || data.message || `HTTP ${response.status}`,
        data: data,
        detail: data.detail,
      };
      console.error('[API Fetch] API Error:', error);
      throw error;
    }

    return data as T;
  } catch (error: any) {
    console.error('[API Fetch] Exception:', error);
    console.error('[API Fetch] Exception type:', error.constructor.name);
    console.error('[API Fetch] Exception message:', error.message);

    // If it's already an ApiError, rethrow it
    if (error.status !== undefined) {
      throw error;
    }

    // Network error
    const apiError: ApiError = {
      status: 0,
      message: error.message || 'Network error',
      data: null,
    };
    throw apiError;
  }
}

/**
 * Make API request with JSON body
 */
export async function apiRequestJSON<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Make API request with FormData
 */
export async function apiRequestFormData<T>(
  endpoint: string,
  method: 'POST' | 'PUT',
  formData: FormData
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method,
    body: formData,
    // Don't set Content-Type - let browser/React Native set it with boundary
  });
}

