// app/admin/index.tsx - Admin Debug Screen
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getAllReservations,
  getAllUsers,
  getHealth,
} from "../../src/api/smartKitchen";
import { API_BASE_URL } from "../../src/api/config";
import { useTheme } from "../context/ThemeContext";

export default function AdminDebugScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetAllUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllUsers();
      setData({ type: "users", data: response });
    } catch (err: any) {
      setError(err.detail || err.message || "Failed to fetch users");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGetAllReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllReservations();
      setData({ type: "reservations", data: response });
    } catch (err: any) {
      setError(err.detail || err.message || "Failed to fetch reservations");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGetHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Admin] Testing health endpoint...');
      const response = await getHealth();
      console.log('[Admin] Health check success:', response);
      setData({ type: "health", data: response });
    } catch (err: any) {
      console.error('[Admin] Health check error:', err);
      console.error('[Admin] Error details:', JSON.stringify(err, null, 2));
      setError(err.detail || err.message || "Failed to check health");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

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
          Admin Debug
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* API URL Info */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.primaryLight, borderColor: theme.primary },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            API Configuration
          </Text>
          <Text style={[styles.urlText, { color: theme.text }]}>
            {API_BASE_URL}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Test Endpoints
          </Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primaryLight }]}
              onPress={handleGetAllUsers}
              disabled={loading}
            >
              <Ionicons name="people-outline" size={20} color={theme.primary} />
              <Text style={[styles.buttonText, { color: theme.primary }]}>
                Get All Users
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primaryLight }]}
              onPress={handleGetAllReservations}
              disabled={loading}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              <Text style={[styles.buttonText, { color: theme.primary }]}>
                Get All Reservations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primaryLight }]}
              onPress={handleGetHealth}
              disabled={loading}
            >
              <Ionicons name="heart-outline" size={20} color={theme.primary} />
              <Text style={[styles.buttonText, { color: theme.primary }]}>
                Health Check
              </Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}

          {error && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: theme.error + "20", borderColor: theme.error },
              ]}
            >
              <Ionicons name="alert-circle" size={20} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]}>
                {error}
              </Text>
            </View>
          )}

          {data && (
            <View
              style={[
                styles.dataContainer,
                { backgroundColor: theme.inputBg, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.dataTitle, { color: theme.text }]}>
                Response ({data.type})
              </Text>
              <ScrollView
                style={styles.dataScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator={true}
              >
                <Text style={[styles.dataText, { color: theme.text }]}>
                  {JSON.stringify(data.data, null, 2)}
                </Text>
              </ScrollView>
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  dataContainer: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    maxHeight: 400,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  dataScroll: {
    maxHeight: 350,
  },
  dataText: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  urlText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});

