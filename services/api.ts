// services/api.ts - SmartKitchen API Service Layer v2.0
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

// ⚠️ IMPORTANT: Replace with your computer's local IP for Expo Go testing
// FastAPI backend runs on port 8000
const BASE_URL = "http://172.20.10.3:8000";

const TOKEN_KEY = "smartkitchen_jwt";

// ============ TYPES ============

export interface User {
  id: number;
  isic: string;
  name: string;
  face_enrolled?: boolean;
  theme_palette?: string;
  theme_dark_mode?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface FaceEnrollResponse {
  success: boolean;
  message?: string;
  user?: User;
}

export interface FaceVerifyResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  similarity?: number;
}

export interface Appliance {
  id: string;
  type: "microwave" | "oven" | "stove_left" | "stove_right";
  name: string;
}

export interface ApplianceCounts {
  microwave: number;
  oven: number;
  stove_left: number;
  stove_right: number;
}

export interface Kitchen {
  id: number;
  kitchen_number: number;
  floor: number;
  name: string;
  appliance_counts?: ApplianceCounts;
  appliances?: Appliance[];
}

export interface ApplianceReservation {
  id: string;
  startTime: string;
  endTime: string;
  userId: number;
}

export interface ApplianceAvailability {
  applianceId: string;
  applianceType: string;
  applianceName: string;
  reservations: ApplianceReservation[];
}

export interface AvailabilityResponse {
  date: string;
  kitchenId: number | null;
  operatingHours: { start: string; end: string };
  minDuration: number;
  maxDuration: number;
  appliances: ApplianceAvailability[];
  totalReservations: number;
}

export interface Reservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  kitchenId: number;
  applianceId: string;
  applianceType: string;
  status: "confirmed" | "pending" | "cancelled";
  userId?: number;
  kitchen?: { id: number; floor: number; kitchen_number: number };
  appliance?: Appliance;
}

export interface CreateReservationData {
  date: string;
  startTime: string;
  endTime: string;
  kitchenId: number;
  applianceId: string;
}

// ============ AXIOS INSTANCE ============

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add JWT token as query parameter
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token && config.params) {
        config.params.token = token;
      } else if (token && config.url) {
        // Add token as query parameter if params don't exist
        const separator = config.url.includes('?') ? '&' : '?';
        config.url = `${config.url}${separator}token=${token}`;
      }
    } catch (error) {
      console.warn("Error reading token from SecureStore:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } catch (e) {
        console.warn("Error deleting token:", e);
      }
    }
    return Promise.reject(error);
  }
);

// ============ TOKEN MANAGEMENT ============

export const saveToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn("Error getting token:", error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn("Error removing token:", error);
  }
};

// ============ VALIDATION ============

export const validateISIC = (isic: string): boolean => {
  const isicRegex = /^S\d{10,11}$/;
  return isicRegex.test(isic);
};

// ============ API FUNCTIONS ============

/**
 * Login with ISIC
 */
export const login = async (isic: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(`/login?isic=${encodeURIComponent(isic)}`);
  return response.data;
};

/**
 * Enroll face for FaceID authentication - tied to user's ISIC
 */
export const enrollFace = async (
  image: string,
  isic: string
): Promise<FaceEnrollResponse> => {
  // Ensure base64 string (add data URI prefix if not present)
  const base64Image = image.includes(',') ? image : `data:image/jpeg;base64,${image}`;
  
  // Use FormData for multipart/form-data
  const formData = new FormData();
  formData.append('image', base64Image);
  
  const response = await api.post<FaceEnrollResponse>(
    `/face/enroll?isic=${encodeURIComponent(isic)}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Verify face for FaceID login
 */
export const verifyFace = async (image: string): Promise<FaceVerifyResponse> => {
  // Ensure base64 string (add data URI prefix if not present)
  const base64Image = image.includes(',') ? image : `data:image/jpeg;base64,${image}`;
  
  // Use FormData for multipart/form-data
  const formData = new FormData();
  formData.append('image', base64Image);
  
  const response = await api.post<FaceVerifyResponse>(
    "/face/verify",
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Get all kitchens
 */
export const getKitchens = async (): Promise<Kitchen[]> => {
  const response = await api.get<Kitchen[]>("/kitchens");
  return response.data;
};

/**
 * Get kitchen details by ID
 */
export const getKitchenById = async (id: number): Promise<Kitchen> => {
  const response = await api.get<Kitchen>(`/kitchens/${id}`);
  return response.data;
};

/**
 * Get appliances for a specific kitchen
 */
export const getKitchenAppliances = async (
  kitchenId: number
): Promise<Appliance[]> => {
  const response = await api.get<Appliance[]>(`/kitchens/${kitchenId}/appliances`);
  return response.data;
};

/**
 * Get availability for a specific date and kitchen
 */
export const getAvailability = async (
  date: string,
  kitchenId?: number
): Promise<AvailabilityResponse> => {
  const params: any = { date };
  if (kitchenId) {
    params.kitchen = kitchenId;
  }
  const response = await api.get<AvailabilityResponse>("/availability", { params });
  return response.data;
};

/**
 * Create a new reservation with custom time window
 */
export const createReservation = async (
  data: CreateReservationData
): Promise<Reservation> => {
  const token = await getToken();
  const response = await api.post<{ success: boolean; id: string }>(
    `/reserve?date=${encodeURIComponent(data.date)}&startTime=${encodeURIComponent(data.startTime)}&endTime=${encodeURIComponent(data.endTime)}&kitchenId=${data.kitchenId}&applianceId=${encodeURIComponent(data.applianceId)}&token=${token || ''}`
  );
  // Return a reservation object matching the expected format
  return {
    id: response.data.id,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    kitchenId: data.kitchenId,
    applianceId: data.applianceId,
    applianceType: "",
    status: "confirmed" as const,
  };
};

/**
 * Cancel a reservation
 */
export const cancelReservation = async (id: string): Promise<void> => {
  const token = await getToken();
  await api.delete(`/reservation/${id}?token=${token || ''}`);
};

/**
 * Get current user's reservations
 */
export const getMyReservations = async (): Promise<Reservation[]> => {
  const token = await getToken();
  const response = await api.get<Reservation[]>(`/reservations/me?token=${token || ''}`);
  return response.data;
};

export const updateUserTheme = async (theme_palette: string, theme_dark_mode: boolean): Promise<User> => {
  const token = await getToken();
  const response = await api.put<{ success: boolean; user: User }>(
    `/user/theme?theme_palette=${theme_palette}&theme_dark_mode=${theme_dark_mode}&token=${token || ''}`
  );
  return response.data.user;
};

export default api;
