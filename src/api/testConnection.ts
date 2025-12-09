// src/api/testConnection.ts - Test API connection
import { API_BASE_URL } from './config';
import apiClient from './client';

/**
 * Test if the API is reachable
 */
export async function testConnection(): Promise<{ success: boolean; message: string; url: string }> {
  const url = `${API_BASE_URL}/health`;
  console.log('[Test Connection] Testing:', url);
  
  try {
    const response = await apiClient.get('/health');
    return {
      success: true,
      message: 'Connection successful',
      url: API_BASE_URL,
    };
  } catch (error: any) {
    console.error('[Test Connection] Error:', error);
    return {
      success: false,
      message: error.message || 'Connection failed',
      url: API_BASE_URL,
    };
  }
}

