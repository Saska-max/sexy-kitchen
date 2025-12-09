// src/api/smartKitchen.ts - Smart Kitchen API functions
import { apiRequestJSON, apiRequestFormData } from './client-fetch';
import {
  UserResponse,
  UserLookupResponse,
  LoginFaceResponse,
  ReservationAddResponse,
  ReservationCheckResponse,
  UserReservationsResponse,
  AllReservationsResponse,
  AllUsersResponse,
  SuccessResponse,
  HealthResponse,
  Reservation,
} from './types';
/**
 * Helper to create FormData for image uploads
 * Accepts a local image URI from React Native (expo-image-picker or camera)
 * React Native FormData accepts objects with uri, type, and name properties
 */
function createImageFormData(imageUri: string, fieldName: string = 'faceImage'): FormData {
  const formData = new FormData();
  
  // Get file info
  const filename = imageUri.split('/').pop() || 'face.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  
  // For React Native, FormData accepts objects with uri, type, and name
  formData.append(fieldName, {
    uri: imageUri,
    type: type,
    name: filename,
  } as any);
  
  return formData;
}

// ============ USER ENDPOINTS ============

/**
 * POST /user/create
 * Create a new user
 */
export async function createUser(payload: { isic_number: string; name: string }): Promise<UserResponse> {
  return apiRequestJSON<UserResponse>('/user/create', 'POST', payload);
}

/**
 * GET /user?isic={isic}
 * Get user information by ISIC number
 */
export async function getUser(isic: string): Promise<UserLookupResponse> {
  return apiRequestJSON<UserLookupResponse>(`/user?isic=${encodeURIComponent(isic)}`, 'GET');
}

/**
 * PUT /user/update?isic={isic}
 * Update user name
 */
export async function updateUser(isic: string, payload: { name: string }): Promise<UserResponse> {
  return apiRequestJSON<UserResponse>(`/user/update?isic=${encodeURIComponent(isic)}`, 'PUT', payload);
}

/**
 * DELETE /user/delete?isic={isic}
 * Delete a user
 */
export async function deleteUser(isic: string): Promise<SuccessResponse> {
  return apiRequestJSON<SuccessResponse>(`/user/delete?isic=${encodeURIComponent(isic)}`, 'DELETE');
}

// ============ FACE ENDPOINTS ============

/**
 * POST /face/enroll?isic={isic}
 * Enroll a face image for a user
 * @param isic - User's ISIC number
 * @param imageUri - Local URI from expo-image-picker or expo-camera
 */
export async function enrollFace(isic: string, imageUri: string): Promise<SuccessResponse> {
  const formData = createImageFormData(imageUri, 'faceImage');
  return apiRequestFormData<SuccessResponse>(`/face/enroll?isic=${encodeURIComponent(isic)}`, 'POST', formData);
}

/**
 * DELETE /face/delete?isic={isic}
 * Delete face enrollment for a user
 */
export async function deleteFace(isic: string): Promise<SuccessResponse> {
  return apiRequestJSON<SuccessResponse>(`/face/delete?isic=${encodeURIComponent(isic)}`, 'DELETE');
}

// ============ AUTH ENDPOINTS ============

/**
 * POST /auth/login-face
 * Login using face recognition
 * @param imageUri - Local URI from expo-image-picker or expo-camera
 */
export async function loginWithFace(imageUri: string): Promise<LoginFaceResponse> {
  const formData = createImageFormData(imageUri, 'faceImage');
  return apiRequestFormData<LoginFaceResponse>('/auth/login-face', 'POST', formData);
}

// ============ RESERVATION ENDPOINTS ============

/**
 * POST /reservation/add?isic={isic}
 * Create a new reservation
 * @param isic - User's ISIC number
 * @param payload - Reservation times (ISO timestamps)
 */
export async function addReservation(
  isic: string,
  payload: { start_time: string; end_time: string }
): Promise<ReservationAddResponse> {
  return apiRequestJSON<ReservationAddResponse>(
    `/reservation/add?isic=${encodeURIComponent(isic)}`,
    'POST',
    payload
  );
}

/**
 * GET /reservation/check?isic={isic}
 * Check if user has an active reservation
 */
export async function checkReservation(isic: string): Promise<ReservationCheckResponse> {
  return apiRequestJSON<ReservationCheckResponse>(`/reservation/check?isic=${encodeURIComponent(isic)}`, 'GET');
}

/**
 * GET /user/reservations?isic={isic}
 * Get all reservations for a user
 */
export async function getUserReservations(isic: string): Promise<UserReservationsResponse> {
  return apiRequestJSON<UserReservationsResponse>(`/user/reservations?isic=${encodeURIComponent(isic)}`, 'GET');
}

/**
 * DELETE /reservation/delete?reservation_id={id}
 * Delete a reservation
 */
export async function deleteReservation(reservationId: number): Promise<SuccessResponse & { deleted_isic: string }> {
  return apiRequestJSON<SuccessResponse & { deleted_isic: string }>(
    `/reservation/delete?reservation_id=${reservationId}`,
    'DELETE'
  );
}

/**
 * GET /reservations/all
 * Get all reservations (admin endpoint)
 */
export async function getAllReservations(params?: { skip?: number; limit?: number }): Promise<AllReservationsResponse> {
  const queryString = params ? `?skip=${params.skip || 0}&limit=${params.limit || 100}` : '';
  return apiRequestJSON<AllReservationsResponse>(`/reservations/all${queryString}`, 'GET');
}

// ============ USER LIST ENDPOINT ============

/**
 * GET /users/all
 * Get all users (admin endpoint)
 */
export async function getAllUsers(params?: { skip?: number; limit?: number }): Promise<AllUsersResponse> {
  const queryString = params ? `?skip=${params.skip || 0}&limit=${params.limit || 100}` : '';
  return apiRequestJSON<AllUsersResponse>(`/users/all${queryString}`, 'GET');
}

// ============ HEALTH CHECK ============

/**
 * GET /health
 * Health check endpoint
 */
export async function getHealth(): Promise<HealthResponse> {
  return apiRequestJSON<HealthResponse>('/health', 'GET');
}

