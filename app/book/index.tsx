// app/book/index.tsx - Booking Screen with Dynamic Theme
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { Calendar } from "react-native-calendars";
import {
  Appliance,
  ApplianceAvailability,
  getAvailability,
} from "../../services/api";
import TimePicker from "../components/TimePicker";
import { useSmartKitchen } from "../context/SmartKitchenContext";
import { useTheme } from "../context/ThemeContext";

// Default color palette (used in styles, overridden by theme in JSX)
const COLORS = {
  primary: "#E91E63",
  primaryLight: "#FCE4EC",
  background: "#FFF8FA",
  cardBg: "#FFFFFF",
  text: "#1A1A2E",
  textSecondary: "#6B7280",
  success: "#10B981",
  error: "#DC2626",
  border: "#F3E8EB",
};

type DateObject = { dateString: string };

const APPLIANCE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  microwave: "radio-outline",
  oven: "flame-outline",
  stove_left: "bonfire-outline",
  stove_right: "bonfire-outline",
};

const APPLIANCE_COLORS: Record<string, string> = {
  microwave: "#9C27B0",
  oven: "#FF5722",
  stove_left: "#FF9800",
  stove_right: "#FF9800",
};

const APPLIANCE_LABELS: Record<string, string> = {
  microwave: "Microwave",
  oven: "Oven",
  stove_left: "Stove (Left)",
  stove_right: "Stove (Right)",
};

export default function BookScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    selectedKitchen,
    appliances,
    appliancesLoading,
    reservations,
    reservationsLoading,
    reservationsError,
    fetchReservations,
    addReservation,
    removeReservation,
  } = useSmartKitchen();

  const todayIso = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Selected appliance for booking
  const [selectedAppliance, setSelectedAppliance] = useState<Appliance | null>(null);

  // Generate mock appliances from kitchen's appliance_counts if no appliances loaded
  const availableAppliances = useMemo(() => {
    if (appliances.length > 0) {
      return appliances;
    }
    
    // Generate mock appliances from selected kitchen's appliance_counts
    if (!selectedKitchen?.appliance_counts) {
      return [];
    }

    const mockAppliances: Appliance[] = [];
    const counts = selectedKitchen.appliance_counts;
    let idCounter = 1;

    // Add microwaves
    for (let i = 0; i < counts.microwave; i++) {
      mockAppliances.push({
        id: `microwave-${idCounter++}`,
        type: "microwave",
        name: `Microwave ${i + 1}`,
      });
    }

    // Add ovens
    for (let i = 0; i < counts.oven; i++) {
      mockAppliances.push({
        id: `oven-${idCounter++}`,
        type: "oven",
        name: `Oven ${i + 1}`,
      });
    }

    // Add stove left
    for (let i = 0; i < counts.stove_left; i++) {
      mockAppliances.push({
        id: `stove_left-${idCounter++}`,
        type: "stove_left",
        name: `Stove Left ${i + 1}`,
      });
    }

    // Add stove right
    for (let i = 0; i < counts.stove_right; i++) {
      mockAppliances.push({
        id: `stove_right-${idCounter++}`,
        type: "stove_right",
        name: `Stove Right ${i + 1}`,
      });
    }

    return mockAppliances;
  }, [appliances, selectedKitchen]);

  // Custom time inputs
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("12:30");

  // Availability data
  const [availability, setAvailability] = useState<ApplianceAvailability[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [operatingHours, setOperatingHours] = useState({ start: "06:00", end: "23:00" });
  const [minDuration, setMinDuration] = useState(5);
  const [maxDuration, setMaxDuration] = useState(120); // 2 hours max

  // Booking state
  const [isBooking, setIsBooking] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Redirect if no kitchen selected
  useEffect(() => {
    if (!selectedKitchen) {
      router.replace("/kitchen");
    }
  }, [selectedKitchen]);

  // Load availability when date changes
  const loadAvailability = useCallback(async (date: string) => {
    if (!selectedKitchen) return;
    
    setAvailabilityLoading(true);
    try {
      const response = await getAvailability(date, selectedKitchen.id);
      setAvailability(response.appliances || []);
      setOperatingHours(response.operatingHours);
      setMinDuration(response.minDuration);
      setMaxDuration(response.maxDuration);
    } catch (error) {
      console.error("Error loading availability:", error);
      setAvailability([]);
    } finally {
      setAvailabilityLoading(false);
    }
  }, [selectedKitchen]);

  useEffect(() => {
    loadAvailability(selectedDate);
  }, [selectedDate, loadAvailability]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchReservations(), loadAvailability(selectedDate)]);
    setRefreshing(false);
  }, [fetchReservations, loadAvailability, selectedDate]);

  const onDayPress = (day: DateObject) => {
    setSelectedDate(day.dateString);
  };

  // Mark dates with reservations
  const markedDates = useMemo(() => {
    const dates: Record<string, any> = {};
    reservations.forEach((r) => {
      if (r.status === "confirmed" && r.kitchenId === selectedKitchen?.id) {
        dates[r.date] = { marked: true, dotColor: COLORS.primary };
      }
    });

    dates[selectedDate] = {
      ...(dates[selectedDate] || {}),
      selected: true,
      selectedColor: COLORS.primary,
    };

    return dates;
  }, [reservations, selectedDate, selectedKitchen]);

  // Filter reservations for selected date and kitchen
  const reservationsForSelectedDate = useMemo(() => {
    return reservations.filter(
      (r) =>
        r.date === selectedDate &&
        r.status === "confirmed" &&
        r.kitchenId === selectedKitchen?.id
    );
  }, [reservations, selectedDate, selectedKitchen]);

  // Get availability info for an appliance
  const getApplianceAvailability = (applianceId: string) => {
    return availability.find((a) => a.applianceId === applianceId);
  };

  // Check if time slot conflicts with existing reservations
  const checkTimeConflict = (applianceId: string) => {
    const newStart = parseTimeToMinutes(startTime);
    const newEnd = parseTimeToMinutes(endTime);

    // Check against availability data from backend
    const appAvail = getApplianceAvailability(applianceId);
    if (appAvail) {
      for (const res of appAvail.reservations) {
        const existingStart = parseTimeToMinutes(res.startTime);
        const existingEnd = parseTimeToMinutes(res.endTime);
        
        if (newStart < existingEnd && newEnd > existingStart) {
          return true;
        }
      }
    }

    // Also check against reservations from context (for mock data)
    const conflictingReservation = reservations.find((r) => {
      if (r.applianceId !== applianceId || r.date !== selectedDate || r.status === "cancelled") {
        return false;
      }
      const existingStart = parseTimeToMinutes(r.startTime);
      const existingEnd = parseTimeToMinutes(r.endTime);
      return newStart < existingEnd && newEnd > existingStart;
    });

    return !!conflictingReservation;
  };

  // Validate time input
  const validateTimeInput = () => {
    const errors: string[] = [];
    const start = parseTimeToMinutes(startTime);
    const end = parseTimeToMinutes(endTime);
    const opStart = parseTimeToMinutes(operatingHours.start);
    const opEnd = parseTimeToMinutes(operatingHours.end);

    if (start >= end) {
      errors.push("End time must be after start time");
    }

    if (start < opStart || start > opEnd) {
      errors.push(`Start time must be between ${operatingHours.start} and ${operatingHours.end}`);
    }

    if (end < opStart || end > opEnd) {
      errors.push(`End time must be between ${operatingHours.start} and ${operatingHours.end}`);
    }

    const duration = end - start;
    if (duration < minDuration) {
      errors.push(`Minimum duration is ${minDuration} minutes`);
    }

    if (duration > maxDuration) {
      errors.push(`Maximum duration is ${maxDuration} minutes`);
    }

    return errors;
  };

  const parseTimeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + (minutes || 0);
  };

  const handleOpenModal = (appliance: Appliance) => {
    setSelectedAppliance(appliance);
    const now = new Date();
    const currentHour = now.getHours();
    const startHour = Math.max(currentHour + 1, 6);
    setStartTime(`${startHour.toString().padStart(2, "0")}:00`);
    setEndTime(`${startHour.toString().padStart(2, "0")}:30`);
    setModalVisible(true);
  };

  const handleConfirm = async () => {
    if (!selectedAppliance || !selectedKitchen) return;

    const errors = validateTimeInput();
    if (errors.length > 0) {
      Alert.alert("Invalid Time", errors.join("\n"));
      return;
    }

    if (checkTimeConflict(selectedAppliance.id)) {
      Alert.alert(
        "Time Conflict",
        "This time slot conflicts with an existing reservation. Please choose a different time."
      );
      return;
    }

    setIsBooking(true);

    try {
      const success = await addReservation({
        date: selectedDate,
        startTime,
        endTime,
        kitchenId: selectedKitchen.id,
        applianceId: selectedAppliance.id,
      });

      if (success) {
        Alert.alert("Success! 🎉", "Your reservation has been confirmed!");
        await loadAvailability(selectedDate);
    setModalVisible(false);
        setSelectedAppliance(null);
      } else {
        Alert.alert("Error", "Failed to create reservation. Please try again.");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create reservation."
      );
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    Alert.alert(
      "Cancel Reservation",
      "Are you sure you want to cancel this reservation?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setCancellingId(id);
            try {
              const success = await removeReservation(id);
              if (success) {
                await loadAvailability(selectedDate);
              } else {
                Alert.alert("Error", "Failed to cancel reservation.");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to cancel reservation.");
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const formattedSelected = new Date(selectedDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (!selectedKitchen) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header with Kitchen Info */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Book Kitchen 📅</Text>
            <TouchableOpacity
              style={[styles.kitchenBadge, { backgroundColor: theme.primaryLight, borderColor: theme.primary + "40" }]}
              onPress={() => router.push("/kitchen")}
              activeOpacity={0.8}
            >
              <Text style={styles.kitchenEmoji}>🍳</Text>
              <Text style={[styles.kitchenBadgeText, { color: theme.primary }]}>
                Floor {selectedKitchen.floor} • Kitchen #{selectedKitchen.kitchen_number}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Calendar
            onDayPress={onDayPress}
            markedDates={markedDates}
            minDate={todayIso}
            theme={{
              backgroundColor: theme.cardBg,
              calendarBackground: theme.cardBg,
              textSectionTitleColor: theme.textSecondary,
              dayTextColor: theme.text,
              todayTextColor: theme.primary,
              selectedDayBackgroundColor: theme.primary,
              arrowColor: theme.primary,
              dotColor: theme.primary,
              monthTextColor: theme.text,
              textDayFontWeight: "500",
              textMonthFontWeight: "700",
              textDayHeaderFontWeight: "600",
            }}
          />
        </View>

        {/* Selected Date */}
        <View style={styles.dateRow}>
          <View>
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>Selected Date</Text>
            <Text style={[styles.dateValue, { color: theme.text }]}>{formattedSelected}</Text>
          </View>
          <View style={[styles.operatingHours, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="time-outline" size={14} color={theme.primary} />
            <Text style={[styles.operatingHoursText, { color: theme.primary }]}>
              {operatingHours.start} - {operatingHours.end}
            </Text>
          </View>
        </View>

        {/* Appliances Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Appliance</Text>

        {appliancesLoading || availabilityLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading appliances...</Text>
          </View>
        ) : availableAppliances.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={40} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No appliances available</Text>
          </View>
        ) : (
          <View style={styles.applianceGrid}>
            {availableAppliances.map((appliance) => {
              // Count reservations for this appliance on the selected date
              const reservationCount = reservations.filter(
                (r) =>
                  r.applianceId === appliance.id &&
                  r.date === selectedDate &&
                  r.status === "confirmed" &&
                  r.kitchenId === selectedKitchen?.id
              ).length;
              const color = APPLIANCE_COLORS[appliance.type] || theme.primary;

              return (
                <TouchableOpacity
                  key={appliance.id}
                  style={styles.applianceCard}
                  onPress={() => handleOpenModal(appliance)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.applianceIcon, { backgroundColor: `${color}15` }]}>
                    <Ionicons
                      name={APPLIANCE_ICONS[appliance.type] || "cube-outline"}
                      size={26}
                      color={color}
                    />
              </View>
                  <Text style={styles.applianceName}>{appliance.name}</Text>
                  <Text style={styles.applianceType}>
                    {APPLIANCE_LABELS[appliance.type] || appliance.type}
                  </Text>
                  <View style={styles.applianceStatus}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: reservationCount > 3 ? COLORS.error : COLORS.success },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {reservationCount} booked
              </Text>
            </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Your Bookings Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Bookings</Text>
          {reservationsLoading && <ActivityIndicator size="small" color={theme.primary} />}
        </View>


        {reservationsForSelectedDate.length === 0 ? (
          <View style={[styles.card, styles.emptyCard]}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyText}>No reservations for this day</Text>
            <Text style={styles.emptySubtext}>Select an appliance above to book</Text>
          </View>
        ) : (
          reservationsForSelectedDate.map((r) => {
            const color = APPLIANCE_COLORS[r.applianceType] || COLORS.primary;
            return (
            <View
              key={r.id}
                style={[styles.card, styles.bookingCard, { borderLeftColor: color }]}
            >
              <View style={styles.bookingRow}>
                <View style={styles.bookingLeft}>
                    <View style={[styles.bookingIcon, { backgroundColor: `${color}15` }]}>
                    <Ionicons
                        name={APPLIANCE_ICONS[r.applianceType] || "cube-outline"}
                        size={22}
                        color={color}
                    />
                  </View>
                  <View>
                      <Text style={styles.bookingTime}>
                        {r.startTime} - {r.endTime}
                      </Text>
                      <Text style={styles.bookingAppliance}>
                        {r.appliance?.name || APPLIANCE_LABELS[r.applianceType]}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingRight}>
                    <View style={styles.confirmedBadge}>
                      <Ionicons name="checkmark" size={12} color="white" />
                  </View>
                  <TouchableOpacity
                    style={styles.cancelButton}
                      onPress={() => handleCancelReservation(r.id)}
                      disabled={cancellingId === r.id}
                    >
                      {cancellingId === r.id ? (
                        <ActivityIndicator size="small" color={theme.error} />
                      ) : (
                        <Ionicons name="close" size={16} color={theme.error} />
                      )}
                  </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Booking Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Book Appliance ✨</Text>
                <TouchableOpacity
                  onPress={() => {
                      Keyboard.dismiss();
                      setModalVisible(false);
                      setSelectedAppliance(null);
                  }}
                    style={[styles.modalClose, { backgroundColor: theme.border }]}
                  >
                    <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                </View>

                {selectedAppliance && (
                  <ScrollView 
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.modalScrollContent}
                    style={styles.modalScrollView}
                  >
                    {/* Selected Appliance */}
                    <View style={[styles.selectedApplianceCard, { backgroundColor: theme.primaryLight, borderColor: theme.primary + "40" }]}>
                      <View
                      style={[
                          styles.modalApplianceIcon,
                          {
                            backgroundColor: `${APPLIANCE_COLORS[selectedAppliance.type]}15`,
                          },
                        ]}
                      >
                        <Ionicons
                          name={APPLIANCE_ICONS[selectedAppliance.type] || "cube-outline"}
                          size={28}
                          color={APPLIANCE_COLORS[selectedAppliance.type]}
                        />
                      </View>
                      <View>
                        <Text style={[styles.selectedApplianceName, { color: theme.text }]}>
                          {selectedAppliance.name}
                        </Text>
                        <Text style={[styles.selectedApplianceDate, { color: theme.textSecondary }]}>{formattedSelected}</Text>
                      </View>
                    </View>

                    {/* Time Selection */}
                    <View style={styles.timeSection}>
                      <View style={styles.timePickerGroup}>
                        <View style={styles.timePickerHeader}>
                          <Ionicons name="time-outline" size={18} color={theme.primary} />
                          <Text style={[styles.timePickerLabel, { color: theme.text }]}>Start Time</Text>
                        </View>
                        <TimePicker
                          value={startTime}
                          onChange={setStartTime}
                          minTime={operatingHours.start}
                          maxTime={operatingHours.end}
                          stepMinutes={15}
                        />
                      </View>

                      <View style={styles.timePickerGroup}>
                        <View style={styles.timePickerHeader}>
                          <Ionicons name="time-outline" size={18} color={theme.primary} />
                          <Text style={[styles.timePickerLabel, { color: theme.text }]}>End Time</Text>
                        </View>
                        <TimePicker
                          value={endTime}
                          onChange={setEndTime}
                          minTime={startTime}
                          maxTime={operatingHours.end}
                          stepMinutes={15}
                        />
                      </View>
                    </View>

                    <View style={[styles.timeInfo, { backgroundColor: theme.primaryLight }]}>
                      <Ionicons name="information-circle-outline" size={14} color={theme.primary} />
                      <Text style={[styles.timeInfoText, { color: theme.text }]}>
                        Duration: {minDuration}-{maxDuration} min
                      </Text>
                    </View>

                    {/* Existing Reservations */}
                    {(() => {
                      const appAvail = getApplianceAvailability(selectedAppliance.id);
                      if (appAvail && appAvail.reservations.length > 0) {
                        return (
                          <View style={[styles.existingReservations, { backgroundColor: "#FEF2F2", borderColor: theme.error + "30" }]}>
                            <Text style={[styles.existingTitle, { color: theme.error }]}>⚠️ Already Reserved:</Text>
                            {appAvail.reservations.map((res, idx) => (
                              <View key={idx} style={styles.existingSlot}>
                                <Ionicons name="time" size={14} color={theme.error} />
                                <Text style={[styles.existingSlotText, { color: "#991B1B" }]}>
                                  {res.startTime} - {res.endTime}
                        </Text>
                              </View>
                            ))}
                          </View>
                        );
                      }
                      return null;
                    })()}

                    {/* Buttons */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                          Keyboard.dismiss();
                  setModalVisible(false);
                          setSelectedAppliance(null);
                }}
                        disabled={isBooking}
              >
                        <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                          styles.confirmButton,
                          isBooking && styles.buttonDisabled,
                ]}
                        disabled={isBooking}
                        onPress={() => {
                          Keyboard.dismiss();
                          handleConfirm();
                        }}
              >
                        {isBooking ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={18} color="white" />
                            <Text style={styles.confirmModalText}>Confirm</Text>
                          </>
                        )}
              </TouchableOpacity>
            </View>
                  </ScrollView>
                )}
          </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 10,
  },
  kitchenBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  kitchenEmoji: {
    fontSize: 18,
  },
  kitchenBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  dateLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "500" },
  dateValue: { fontSize: 17, fontWeight: "700", color: COLORS.text, marginTop: 2 },
  operatingHours: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  operatingHoursText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 8,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 10,
  },
  loadingText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: "500" },

  applianceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  applianceCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 18,
    width: "47%",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  applianceIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  applianceName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  applianceType: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  applianceStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    gap: 10,
  },
  errorBannerText: { color: COLORS.error, fontSize: 14, flex: 1, fontWeight: "500" },

  emptyCard: { alignItems: "center", paddingVertical: 36 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
  emptySubtext: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },

  bookingCard: {
    borderLeftWidth: 5,
  },
  bookingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  bookingIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  bookingTime: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  bookingAppliance: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  bookingRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  confirmedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 0,
    maxHeight: "92%",
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 60,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },

  selectedApplianceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
    gap: 14,
    borderWidth: 1,
  },
  modalApplianceIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedApplianceName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  selectedApplianceDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  timeSection: {
    marginBottom: 20,
    gap: 20,
  },
  timePickerGroup: {
    marginBottom: 4,
  },
  timePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  timePickerLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
  },
  timeInfoText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },

  existingReservations: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
  },
  existingTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  existingSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  existingSlotText: {
    fontSize: 14,
    fontWeight: "500",
  },

  modalButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  modalButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelModalButton: {
    backgroundColor: COLORS.border,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    flex: 2,
    flexDirection: "row",
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  cancelModalText: { color: COLORS.text, fontWeight: "600", fontSize: 16 },
  confirmModalText: { color: "white", fontWeight: "700", fontSize: 16 },
});
