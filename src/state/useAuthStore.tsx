// src/state/useAuthStore.ts - Global state management for Smart Kitchen app
// Using React Context + useReducer for state management
import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { User, Reservation } from '../api/types';

// ============ STATE TYPES ============

interface AuthState {
  currentUser: User | null;
  isLoggedIn: boolean;
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_RESERVATIONS'; payload: Reservation[] }
  | { type: 'ADD_RESERVATION'; payload: Reservation }
  | { type: 'REMOVE_RESERVATION'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

// ============ REDUCER ============

const initialState: AuthState = {
  currentUser: null,
  isLoggedIn: false,
  reservations: [],
  loading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        currentUser: action.payload,
        isLoggedIn: true,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        currentUser: null,
        isLoggedIn: false,
        reservations: [],
        error: null,
      };
    case 'SET_RESERVATIONS':
      return {
        ...state,
        reservations: action.payload,
      };
    case 'ADD_RESERVATION':
      return {
        ...state,
        reservations: [...state.reservations, action.payload],
      };
    case 'REMOVE_RESERVATION':
      return {
        ...state,
        reservations: state.reservations.filter(
          (r) => r.reservation_id !== action.payload
        ),
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// ============ CONTEXT ============

interface AuthContextValue extends AuthState {
  setUser: (user: User) => void;
  logout: () => void;
  setReservations: (reservations: Reservation[]) => void;
  addReservation: (reservation: Reservation) => void;
  removeReservation: (reservationId: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============ PROVIDER ============

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const setUser = useCallback((user: User) => {
    console.log('[AuthStore] setUser called with:', user);
    dispatch({ type: 'SET_USER', payload: user });
    console.log('[AuthStore] User set, isLoggedIn should now be true');
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const setReservations = useCallback((reservations: Reservation[]) => {
    dispatch({ type: 'SET_RESERVATIONS', payload: reservations });
  }, []);

  const addReservation = useCallback((reservation: Reservation) => {
    dispatch({ type: 'ADD_RESERVATION', payload: reservation });
  }, []);

  const removeReservation = useCallback((reservationId: number) => {
    dispatch({ type: 'REMOVE_RESERVATION', payload: reservationId });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextValue = {
    ...state,
    setUser,
    logout,
    setReservations,
    addReservation,
    removeReservation,
    setLoading,
    setError,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============ HOOK ============

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

