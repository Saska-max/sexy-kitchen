// app/home/index.tsx - Home Screen with Reservations List
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSmartKitchen } from "../context/SmartKitchenContext";
import { useTheme } from "../context/ThemeContext";

const APPLIANCE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  microwave: "radio-outline",
  oven: "flame-outline",
  stove_left: "bonfire-outline",
  stove_right: "bonfire-outline",
};

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    user,
    isFaceEnrolled,
    reservations,
    reservationsLoading,
    fetchReservations,
    removeReservation,
    selectedKitchen,
  } = useSmartKitchen();

  const [refreshing, setRefreshing] = useState(false);
  const [showAllReservations, setShowAllReservations] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReservations();
    setRefreshing(false);
  }, [fetchReservations]);

  // Split reservations into upcoming and past
  const { upcomingReservations, pastReservations } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const upcoming: typeof reservations = [];
    const past: typeof reservations = [];

    reservations.forEach((r) => {
      if (r.status !== "confirmed") {
        past.push(r);
      } else if (r.date > todayStr || (r.date === todayStr && r.endTime > currentTime)) {
        upcoming.push(r);
      } else {
        past.push(r);
      }
    });

    // Sort upcoming by date/time
    upcoming.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    // Sort past by date/time descending
    past.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.startTime.localeCompare(a.startTime);
    });

    return { upcomingReservations: upcoming, pastReservations: past };
  }, [reservations]);

  const handleCancelReservation = (id: string) => {
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
              if (!success) {
                Alert.alert("Error", "Failed to cancel reservation. Please try again.");
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

  const firstName = user?.name ? user.name.split(" ")[0] : "";

  const handleBookKitchen = () => {
    if (selectedKitchen) {
      router.push("/book");
    } else {
      router.push("/kitchen");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const ReservationCard = ({ reservation, showCancel = true }: { reservation: typeof reservations[0], showCancel?: boolean }) => {
    const isPast = reservation.status !== "confirmed" || 
      new Date(reservation.date + "T" + reservation.endTime) < new Date();

    return (
      <View 
        style={[
          styles.reservationCard, 
          { 
            backgroundColor: theme.cardBg, 
            borderColor: theme.border,
            opacity: isPast ? 0.6 : 1,
          }
        ]}
      >
        <View style={styles.reservationLeft}>
          <View style={[styles.reservationIcon, { backgroundColor: theme.primaryLight }]}>
            <Ionicons
              name={APPLIANCE_ICONS[reservation.applianceType] || "cube-outline"}
              size={22}
              color={theme.primary}
            />
          </View>
          <View style={styles.reservationInfo}>
            <Text style={[styles.reservationTime, { color: theme.text }]}>
              {reservation.startTime} - {reservation.endTime}
            </Text>
            <Text style={[styles.reservationDate, { color: theme.textSecondary }]}>
              {formatDate(reservation.date)}
            </Text>
            {reservation.kitchen && (
              <Text style={[styles.reservationKitchen, { color: theme.textSecondary }]}>
                Floor {reservation.kitchen.floor} • Kitchen #{reservation.kitchen.kitchen_number}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.reservationRight}>
          {reservation.status === "confirmed" && !isPast ? (
            <>
              <View style={[styles.statusBadge, { backgroundColor: "#D1FAE5" }]}>
                <Ionicons name="checkmark" size={12} color={theme.success} />
              </View>
              {showCancel && (
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: "#FCA5A5" }]}
                  onPress={() => handleCancelReservation(reservation.id)}
                  disabled={cancellingId === reservation.id}
                >
                  {cancellingId === reservation.id ? (
                    <ActivityIndicator size="small" color={theme.error} />
                  ) : (
                    <Ionicons name="close" size={16} color={theme.error} />
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: theme.border }]}>
              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                {reservation.status === "cancelled" ? "Cancelled" : "Past"}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text }]}>Sexy Kitchen</Text>
          <Text style={styles.titleEmoji}>🍳</Text>
        </View>

        {/* WELCOME CARD */}
        <View style={styles.welcomeCard}>
          <LinearGradient
            colors={[theme.gradient1, theme.gradient2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeGradient}
          >
          <View style={styles.welcomeIcon}>
              <Ionicons name="person" size={24} color={theme.primary} />
          </View>

            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>
                Hello{firstName ? `, ${firstName}` : ""}! 👋
              </Text>
              <Text style={styles.welcomeIsic}>{user?.isic || "Loading..."}</Text>
          </View>

            <TouchableOpacity 
              style={styles.settingsBtn}
              onPress={() => router.push("/settings")}
            >
              <Ionicons name="settings-outline" size={20} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* STATS ROW */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => router.push("/face")}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconBg, { backgroundColor: isFaceEnrolled ? "#D1FAE5" : theme.primaryLight }]}>
            <Ionicons
              name="finger-print"
                size={24}
                color={isFaceEnrolled ? theme.success : theme.textSecondary}
              />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Face ID</Text>
            <Text style={[styles.statValue, { color: isFaceEnrolled ? theme.success : theme.text }]}>
              {isFaceEnrolled ? "Active ✓" : "Not Set"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => setShowAllReservations(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconBg, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="calendar" size={24} color={theme.primary} />
            </View>
            <Text
              style={[styles.statLabel, { color: theme.textSecondary }]} 
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.75}
            >
              Bookings
            </Text>
            {reservationsLoading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.statValue, { color: theme.text }]}>{upcomingReservations.length}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => setShowAllReservations(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconBg, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="time" size={24} color="#F59E0B" />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>History</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{pastReservations.length}</Text>
          </TouchableOpacity>
          </View>

        {/* UPCOMING RESERVATIONS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Reservations</Text>
          {upcomingReservations.length > 0 && (
            <TouchableOpacity onPress={() => setShowAllReservations(true)}>
              <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {reservationsLoading ? (
          <View style={[styles.loadingCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
            </View>
        ) : upcomingReservations.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="calendar-outline" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No upcoming reservations</Text>
            <TouchableOpacity 
              style={[styles.bookNowBtn, { backgroundColor: theme.primary }]} 
              onPress={handleBookKitchen}
            >
              <Text style={styles.bookNowText}>Book Now</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          upcomingReservations.slice(0, 3).map((r) => (
            <ReservationCard key={r.id} reservation={r} />
          ))
        )}

        {/* QUICK ACTIONS */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Quick Actions</Text>

        <TouchableOpacity 
          style={[styles.quickButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]} 
          onPress={handleBookKitchen}
        >
          <View style={[styles.quickIconWrapper, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="calendar-outline" size={22} color={theme.primary} />
          </View>
          <View style={styles.quickTextWrapper}>
            <Text style={[styles.quickButtonText, { color: theme.text }]}>
              {selectedKitchen ? "Book Appliance" : "Select Kitchen"}
            </Text>
            <Text style={[styles.quickButtonSubtext, { color: theme.textSecondary }]}>Reserve your cooking time</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => router.push("/kitchen")}
        >
          <View style={[styles.quickIconWrapper, { backgroundColor: "#FFF3E0" }]}>
            <Ionicons name="restaurant-outline" size={22} color="#FF9800" />
          </View>
          <View style={styles.quickTextWrapper}>
            <Text style={[styles.quickButtonText, { color: theme.text }]}>Browse Kitchens</Text>
            <Text style={[styles.quickButtonSubtext, { color: theme.textSecondary }]}>Explore all available kitchens</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => router.push("/settings")}
        >
          <View style={[styles.quickIconWrapper, { backgroundColor: "#E8F5E9" }]}>
            <Ionicons name="color-palette-outline" size={22} color="#4CAF50" />
          </View>
          <View style={styles.quickTextWrapper}>
            <Text style={[styles.quickButtonText, { color: theme.text }]}>Customize Theme</Text>
            <Text style={[styles.quickButtonSubtext, { color: theme.textSecondary }]}>Change colors & dark mode</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </ScrollView>

      {/* ALL RESERVATIONS MODAL */}
      <Modal visible={showAllReservations} animationType="slide" transparent>
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>All Reservations 📋</Text>
              <TouchableOpacity
                style={[styles.modalClose, { backgroundColor: theme.border }]}
                onPress={() => setShowAllReservations(false)}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Upcoming */}
              <Text style={[styles.modalSectionTitle, { color: theme.text }]}>
                Upcoming ({upcomingReservations.length})
              </Text>
              {upcomingReservations.length === 0 ? (
                <Text style={[styles.modalEmpty, { color: theme.textSecondary }]}>
                  No upcoming reservations
                </Text>
              ) : (
                upcomingReservations.map((r) => (
                  <ReservationCard key={r.id} reservation={r} />
                ))
              )}

              {/* History */}
              <Text style={[styles.modalSectionTitle, { color: theme.text, marginTop: 20 }]}>
                History ({pastReservations.length})
              </Text>
              {pastReservations.length === 0 ? (
                <Text style={[styles.modalEmpty, { color: theme.textSecondary }]}>
                  No past reservations
                </Text>
              ) : (
                pastReservations.slice(0, 10).map((r) => (
                  <ReservationCard key={r.id} reservation={r} showCancel={false} />
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  scroll: { 
    padding: 20, 
    paddingBottom: 120 
  },
  
  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
  },
  titleEmoji: {
    fontSize: 28,
    marginLeft: 8,
  },

  // Welcome Card
  welcomeCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  welcomeGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  welcomeIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  welcomeContent: { flex: 1 },
  welcomeTitle: { 
    color: "white", 
    fontSize: 18, 
    fontWeight: "600" 
  },
  welcomeIsic: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 4,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    minWidth: 0,
  },
  statIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statLabel: { 
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
    paddingHorizontal: 1,
  },
  statValue: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "700",
  },

  // Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "700",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Reservation Card
  reservationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
  },
  reservationLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  reservationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  reservationInfo: {
    flex: 1,
  },
  reservationTime: {
    fontSize: 16,
    fontWeight: "700",
  },
  reservationDate: {
    fontSize: 13,
    marginTop: 2,
  },
  reservationKitchen: {
    fontSize: 12,
    marginTop: 2,
  },
  reservationRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  cancelBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
  },

  // Loading/Empty
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 18,
    gap: 10,
    borderWidth: 1,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyCard: {
    alignItems: "center",
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500",
  },
  bookNowBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bookNowText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },

  // Quick Actions
  quickButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
  },
  quickIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  quickTextWrapper: {
    flex: 1,
  },
  quickButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  quickButtonSubtext: {
    fontSize: 12,
    marginTop: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalEmpty: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
});
