// src/api/config.ts - API Configuration
import Constants from 'expo-constants';

/**
 * Base URL for the Smart Kitchen API
 * Can be overridden via environment variable EXPO_PUBLIC_API_URL
 * Defaults to the production backend at https://smartkitchen.fly.dev
 * 
 * To override, set EXPO_PUBLIC_API_URL in your .env file or app.json extra config
 */
const getApiBaseUrl = (): string => {
  // Try app.json extra config first
  const appJsonUrl = Constants.expoConfig?.extra?.apiUrl;
  if (appJsonUrl) {
    console.log('[API Config] Using URL from app.json:', appJsonUrl);
    return appJsonUrl;
  }
  
  // Try environment variable
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    console.log('[API Config] Using URL from env:', process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Default
  const defaultUrl = 'https://smartkitchen.fly.dev';
  console.log('[API Config] Using default URL:', defaultUrl);
  return defaultUrl;
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * API timeout in milliseconds
 * Increased to 30 seconds for Fly.io cold starts
 */
export const API_TIMEOUT = 30000; // 30 seconds

