// src/api/types.ts - TypeScript types for Smart Kitchen API responses

/**
 * User information
 */
export interface User {
  isic_number: string;
  name: string;
  hasFace: boolean;
}

/**
 * Response from user creation endpoint
 */
export interface UserResponse {
  success: boolean;
  message?: string;
  user: User;
  created?: boolean;
}

/**
 * Response from user lookup endpoint
 */
export interface UserLookupResponse {
  exists: boolean;
  name: string;
  hasFace: boolean;
}

/**
 * Response from face login endpoint
 */
export interface LoginFaceResponse {
  success: boolean;
  user: User;
  similarity: number;
  message?: string;
}

/**
 * Reservation information
 */
export interface Reservation {
  reservation_id: number;
  isic_number: string;
  start_time: string; // ISO timestamp
  end_time: string; // ISO timestamp
  created_at?: string;
}

/**
 * Response from reservation add endpoint
 */
export interface ReservationAddResponse {
  success: boolean;
  message: string;
  start_time: string;
  end_time: string;
  db_now: string;
  is_future: boolean;
}

/**
 * Response from reservation check endpoint
 */
export interface ReservationCheckResponse {
  hasReservation: boolean;
  reservation?: Reservation;
  message?: string;
}

/**
 * Response from user reservations endpoint
 */
export interface UserReservationsResponse {
  reservations: Reservation[];
  count: number;
}

/**
 * Response from all reservations endpoint
 */
export interface AllReservationsResponse {
  reservations: Reservation[];
  count: number;
  skip?: number;
  limit?: number;
}

/**
 * Response from all users endpoint
 */
export interface AllUsersResponse {
  users: User[];
  count: number;
  skip?: number;
  limit?: number;
}

/**
 * Generic success response
 */
export interface SuccessResponse {
  success: boolean;
  message: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
}

/**
 * API Error response structure
 */
export interface ApiError {
  status: number;
  message: string;
  data?: any;
  detail?: string;
  reason?: string;
}

