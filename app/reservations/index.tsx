// app/reservations/index.tsx - Reservation Management Screen
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addReservation,
  checkReservation,
  deleteReservation,
  getUserReservations,
} from "../../src/api/smartKitchen";
import { Reservation } from "../../src/api/types";
import { useAuth } from "../../src/state/useAuthStore.tsx";
import { useTheme } from "../context/ThemeContext";
// Simple date/time inputs for reservations

export default function ReservationScreen() {
  const { theme } = useTheme();
  const {
    currentUser,
    reservations,
    setReservations,
    removeReservation,
    setLoading,
    setError,
    loading,
  } = useAuth();

  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  useEffect(() => {
    if (currentUser) {
      loadReservations();
      checkActiveReservation();
    }
  }, [currentUser]);

  const loadReservations = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const response = await getUserReservations(currentUser.isic_number);
      setReservations(response.reservations);
    } catch (err: any) {
      console.error("Error loading reservations:", err);
      setError(err.detail || err.message || "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  const checkActiveReservation = async () => {
    if (!currentUser) return;

    setIsChecking(true);
    try {
      const response = await checkReservation(currentUser.isic_number);
      if (response.hasReservation && response.reservation) {
        setActiveReservation(response.reservation);
      } else {
        setActiveReservation(null);
      }
    } catch (err: any) {
      console.error("Error checking reservation:", err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCreateReservation = async () => {
    if (!currentUser || !startDate || !startTime || !endDate || !endTime) {
      Alert.alert("Missing Fields", "Please fill in all date and time fields");
      return;
    }

    // Combine date and time into ISO strings
    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    const endDateTime = new Date(`${endDate}T${endTime}:00`);

    if (startDateTime >= endDateTime) {
      Alert.alert("Invalid Time", "End time must be after start time");
      return;
    }

    setIsCreating(true);
    try {
      const response = await addReservation(currentUser.isic_number, {
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      });

      if (response.success) {
        Alert.alert("Success", response.message);
        setShowTimePicker(false);
        setStartDate("");
        setStartTime("");
        setEndDate("");
        setEndTime("");
        await loadReservations();
        await checkActiveReservation();
      }
    } catch (err: any) {
      console.error("Error creating reservation:", err);
      Alert.alert(
        "Error",
        err.detail || err.message || "Failed to create reservation"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteReservation = async (reservationId: number) => {
    Alert.alert(
      "Delete Reservation",
      "Are you sure you want to delete this reservation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteReservation(reservationId);
              removeReservation(reservationId);
              await checkActiveReservation();
              Alert.alert("Success", "Reservation deleted");
            } catch (err: any) {
              console.error("Error deleting reservation:", err);
              Alert.alert(
                "Error",
                err.detail || err.message || "Failed to delete reservation"
              );
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: theme.text }]}>
            Please log in to view reservations
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.border }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Reservations
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Reservation Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.statusBadge, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="time" size={16} color={theme.primary} />
              <Text style={[styles.statusText, { color: theme.primary }]}>
                Active Reservation
              </Text>
            </View>
            {isChecking && <ActivityIndicator size="small" color={theme.primary} />}
          </View>

          {activeReservation ? (
            <View style={styles.reservationInfo}>
              <Text style={[styles.reservationTime, { color: theme.text }]}>
                {formatDateTime(activeReservation.start_time)} -{" "}
                {formatDateTime(activeReservation.end_time)}
              </Text>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: theme.error + "20" }]}
                onPress={() => handleDeleteReservation(activeReservation.reservation_id)}
              >
                <Ionicons name="trash-outline" size={18} color={theme.error} />
                <Text style={[styles.deleteButtonText, { color: theme.error }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.noReservation, { color: theme.textSecondary }]}>
              No active reservation
            </Text>
          )}
        </View>

        {/* Create Reservation */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Create Reservation
          </Text>

          {showTimePicker ? (
            <View style={styles.timePickerContainer}>
              <View style={styles.dateTimeGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Start Date</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
                  ]}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.dateTimeGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Start Time</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
                  ]}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.dateTimeGroup}>
                <Text style={[styles.label, { color: theme.text }]}>End Date</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
                  ]}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.dateTimeGroup}>
                <Text style={[styles.label, { color: theme.text }]}>End Time</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
                  ]}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.timePickerActions}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.border }]}
                  onPress={() => {
                    setShowTimePicker(false);
                    setStartDate("");
                    setStartTime("");
                    setEndDate("");
                    setEndTime("");
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.createButton, { shadowColor: theme.primary }]}
                  onPress={handleCreateReservation}
                  disabled={!startDate || !startTime || !endDate || !endTime || isCreating}
                >
                  <LinearGradient
                    colors={[theme.gradient1, theme.gradient2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {isCreating ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Ionicons name="add-circle-outline" size={20} color="white" />
                        <Text style={styles.createButtonText}>Create</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primaryLight }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
              <Text style={[styles.addButtonText, { color: theme.primary }]}>
                Add Reservation
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reservations List */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            All Reservations ({reservations.length})
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : reservations.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No reservations yet
            </Text>
          ) : (
            <View style={styles.reservationsList}>
              {reservations.map((reservation) => (
                <View
                  key={reservation.reservation_id}
                  style={[
                    styles.reservationItem,
                    { backgroundColor: theme.inputBg, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.reservationItemContent}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={theme.primary}
                    />
                    <View style={styles.reservationItemText}>
                      <Text style={[styles.reservationItemTime, { color: theme.text }]}>
                        {formatDateTime(reservation.start_time)} -{" "}
                        {formatDateTime(reservation.end_time)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      handleDeleteReservation(reservation.reservation_id)
                    }
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  reservationInfo: {
    gap: 12,
  },
  reservationTime: {
    fontSize: 16,
    fontWeight: "600",
  },
  noReservation: {
    fontSize: 15,
    fontStyle: "italic",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  timePickerContainer: {
    gap: 16,
  },
  dateTimeGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  timePickerActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  createButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  createButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "700",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 20,
  },
  reservationsList: {
    gap: 12,
  },
  reservationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  reservationItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  reservationItemText: {
    flex: 1,
  },
  reservationItemTime: {
    fontSize: 15,
    fontWeight: "500",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

