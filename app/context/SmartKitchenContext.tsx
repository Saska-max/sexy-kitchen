// app/context/SmartKitchenContext.tsx - v2.0
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  cancelReservation as apiCancelReservation,
  createReservation as apiCreateReservation,
  Appliance,
  CreateReservationData,
  getMyReservations,
  getToken,
  Kitchen,
  removeToken,
  Reservation,
  saveToken,
  User
} from "../../services/api";

interface SmartKitchenContextValue {
  // Auth state
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;

  // Auth actions
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  updateUser: (user: User) => void;

  // Face enrollment
  isFaceEnrolled: boolean;
  setFaceEnrolled: (value: boolean) => void;

  // Kitchens
  kitchens: Kitchen[];
  kitchensLoading: boolean;
  selectedKitchen: Kitchen | null;
  selectKitchen: (kitchen: Kitchen | null) => void;
  fetchKitchens: () => Promise<void>;

  // Appliances
  appliances: Appliance[];
  appliancesLoading: boolean;
  fetchAppliances: (kitchenId: number) => Promise<void>;

  // Reservations
  reservations: Reservation[];
  reservationsLoading: boolean;
  reservationsError: string | null;
  fetchReservations: () => Promise<void>;
  addReservation: (data: CreateReservationData) => Promise<boolean>;
  removeReservation: (id: string) => Promise<boolean>;
}

const SmartKitchenContext = createContext<SmartKitchenContextValue | undefined>(
  undefined
);

export function SmartKitchenProvider({ children }: { children: ReactNode }) {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Face enrollment state
  const [isFaceEnrolled, setIsFaceEnrolled] = useState(false);

  // Kitchens state
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [kitchensLoading, setKitchensLoading] = useState(false);
  const [selectedKitchen, setSelectedKitchen] = useState<Kitchen | null>(null);

  // Appliances state
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [appliancesLoading, setAppliancesLoading] = useState(false);

  // Reservations state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationsError, setReservationsError] = useState<string | null>(null);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Fetch kitchens and reservations when authenticated
  useEffect(() => {
    if (token && user) {
      fetchKitchens();
      fetchReservations();
    }
  }, [token, user]);

  // Fetch appliances when kitchen is selected
  useEffect(() => {
    if (selectedKitchen) {
      fetchAppliances(selectedKitchen.id);
    } else {
      setAppliances([]);
    }
  }, [selectedKitchen]);

  // Update face enrolled status from user data
  useEffect(() => {
    if (user?.face_enrolled !== undefined) {
      setIsFaceEnrolled(user.face_enrolled);
    }
  }, [user]);

  const setAuth = useCallback(async (newToken: string, newUser: User) => {
    try {
      await saveToken(newToken);
      setToken(newToken);
      setUser(newUser);
      setAuthError(null);
      if (newUser.face_enrolled !== undefined) {
        setIsFaceEnrolled(newUser.face_enrolled);
      }
    } catch (error) {
      console.error("Error saving auth:", error);
      setAuthError("Failed to save authentication");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await removeToken();
      setToken(null);
      setUser(null);
      setReservations([]);
      setIsFaceEnrolled(false);
      setSelectedKitchen(null);
      setKitchens([]);
      setAppliances([]);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser((prevUser) => {
      // Merge updated user data with existing user data to preserve all fields
      if (prevUser) {
        return {
          ...prevUser,
          ...updatedUser,
        };
      }
      return updatedUser;
    });
    if (updatedUser.face_enrolled !== undefined) {
      setIsFaceEnrolled(updatedUser.face_enrolled);
    }
  }, []);

  const fetchKitchens = useCallback(async () => {
    if (!token) return;

    setKitchensLoading(true);
    try {
      // Use mock kitchens data (no backend fetch)
      const mockKitchens: Kitchen[] = [
        { id: 1, kitchen_number: 1, floor: 1, name: "Kitchen Floor 1", appliance_counts: { microwave: 2, oven: 1, stove_left: 1, stove_right: 1 } },
        { id: 2, kitchen_number: 1, floor: 2, name: "Kitchen Floor 2", appliance_counts: { microwave: 2, oven: 1, stove_left: 1, stove_right: 1 } },
        { id: 3, kitchen_number: 1, floor: 3, name: "Kitchen Floor 3", appliance_counts: { microwave: 1, oven: 1, stove_left: 1, stove_right: 1 } },
        { id: 4, kitchen_number: 1, floor: 4, name: "Kitchen Floor 4", appliance_counts: { microwave: 2, oven: 1, stove_left: 1, stove_right: 1 } },
        { id: 5, kitchen_number: 1, floor: 5, name: "Kitchen Floor 5", appliance_counts: { microwave: 1, oven: 1, stove_left: 1, stove_right: 1 } },
        { id: 6, kitchen_number: 1, floor: 6, name: "Kitchen Floor 6", appliance_counts: { microwave: 2, oven: 1, stove_left: 1, stove_right: 1 } },
        { id: 7, kitchen_number: 1, floor: 7, name: "Kitchen Floor 7", appliance_counts: { microwave: 2, oven: 1, stove_left: 1, stove_right: 1 } },
      ];
      setKitchens(mockKitchens);
    } catch (error: any) {
      console.error("Error setting mock kitchens:", error);
    } finally {
      setKitchensLoading(false);
    }
  }, [token]);

  const selectKitchen = useCallback((kitchen: Kitchen | null) => {
    setSelectedKitchen(kitchen);
  }, []);

  const fetchAppliances = useCallback(async (kitchenId: number) => {
    if (!token) return;

    setAppliancesLoading(true);
    try {
      // Appliances are generated from kitchen's appliance_counts in the booking screen
      // No need to fetch from backend - just set empty array
      // The booking screen will generate appliances from selectedKitchen.appliance_counts
      setAppliances([]);
    } catch (error: any) {
      console.error("Error setting appliances:", error);
    } finally {
      setAppliancesLoading(false);
    }
  }, [token]);

  const fetchReservations = useCallback(async () => {
    if (!token) return;

    setReservationsLoading(true);
    setReservationsError(null);

    try {
      const data = await getMyReservations();
      setReservations(data);
    } catch (error: any) {
      console.error("Error fetching reservations:", error);
      setReservationsError(
        error.response?.data?.message || "Failed to load reservations"
      );
    } finally {
      setReservationsLoading(false);
    }
  }, [token]);

  const addReservation = useCallback(
    async (data: CreateReservationData): Promise<boolean> => {
      // TEMPORARY: Create mock reservation for UI testing without backend
      if (!token || token === "mock_token_for_testing") {
        try {
          // Find the appliance to get its type
          const appliance = appliances.find(a => a.id === data.applianceId);
          let applianceType: string = "microwave";
          
          if (appliance) {
            applianceType = appliance.type;
          } else {
            // Fallback: extract type from ID format like "microwave-1"
            const typeMatch = data.applianceId.match(/^([a-z_]+)-\d+$/);
            if (typeMatch) {
              applianceType = typeMatch[1];
            }
          }

          // Find the kitchen for the reservation
          const kitchen = kitchens.find(k => k.id === data.kitchenId);

          // Create a mock reservation
          const mockReservation: Reservation = {
            id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            kitchenId: data.kitchenId,
            applianceId: data.applianceId,
            applianceType: applianceType as any,
            status: "confirmed",
            userId: user?.id || 1,
            kitchen: kitchen ? {
              id: kitchen.id,
              floor: kitchen.floor,
              kitchen_number: kitchen.kitchen_number,
            } : undefined,
          };
          
          setReservations((prev) => [...prev, mockReservation]);
          return true;
        } catch (error: any) {
          console.error("Error creating mock reservation:", error);
          return false;
        }
      }

      try {
        const newReservation = await apiCreateReservation(data);
        setReservations((prev) => [...prev, newReservation]);
        return true;
      } catch (error: any) {
        console.error("Error creating reservation:", error);
        setReservationsError(
          error.response?.data?.message || "Failed to create reservation"
        );
        return false;
      }
    },
    [token, user, kitchens, appliances]
  );

  const removeReservation = useCallback(
    async (id: string): Promise<boolean> => {
      if (!token) return false;

      // TEMPORARY: Handle mock reservations for UI testing without backend
      if (token === "mock_token_for_testing") {
        try {
          // Update local state to mark as cancelled
          setReservations((prev) => 
            prev.map((r) => r.id === id ? { ...r, status: "cancelled" } : r)
          );
          return true;
        } catch (error: any) {
          console.error("Error cancelling mock reservation:", error);
          return false;
        }
      }

      try {
        await apiCancelReservation(id);
        // Update local state to mark as cancelled (instead of removing)
        setReservations((prev) => 
          prev.map((r) => r.id === id ? { ...r, status: "cancelled" } : r)
        );
        // Refresh from server to ensure consistency
        await fetchReservations();
        return true;
      } catch (error: any) {
        console.error("Error cancelling reservation:", error);
        setReservationsError(
          error.response?.data?.message || "Failed to cancel reservation"
        );
        return false;
      }
    },
    [token]
  );

  return (
    <SmartKitchenContext.Provider
      value={{
        // Auth
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        authError,
        setAuth,
        logout,
        clearAuthError,
        updateUser,

        // Face
        isFaceEnrolled,
        setFaceEnrolled: setIsFaceEnrolled,

        // Kitchens
        kitchens,
        kitchensLoading,
        selectedKitchen,
        selectKitchen,
        fetchKitchens,

        // Appliances
        appliances,
        appliancesLoading,
        fetchAppliances,

        // Reservations
        reservations,
        reservationsLoading,
        reservationsError,
        fetchReservations,
        addReservation,
        removeReservation,
      }}
    >
      {children}
    </SmartKitchenContext.Provider>
  );
}

export function useSmartKitchen() {
  const ctx = useContext(SmartKitchenContext);
  if (!ctx) {
    throw new Error("useSmartKitchen must be used inside SmartKitchenProvider");
  }
  return ctx;
}
