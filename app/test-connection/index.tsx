// app/test-connection/index.tsx - Simple Connection Test
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
import { API_BASE_URL } from "../../src/api/config";
import { useTheme } from "../context/ThemeContext";

export default function TestConnectionScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  // Test 1: Simple fetch to health endpoint
  const testFetch = async () => {
    setLoading(true);
    setResult("Testing with fetch...\n");

    try {
      const url = `${API_BASE_URL}/health`;
      setResult((prev) => prev + `URL: ${url}\n\n`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      setResult(
        (prev) =>
          prev +
          `Status: ${response.status}\n` +
          `OK: ${response.ok}\n\n`
      );

      const data = await response.json();
      setResult(
        (prev) => prev + `Response:\n${JSON.stringify(data, null, 2)}\n\n✅ SUCCESS!`
      );
    } catch (error: any) {
      setResult(
        (prev) =>
          prev +
          `❌ ERROR:\n${error.message}\n\n` +
          `Details:\n${JSON.stringify(error, null, 2)}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Test user creation
  const testCreateUser = async () => {
    setLoading(true);
    setResult("Testing user creation...\n");

    try {
      const url = `${API_BASE_URL}/user/create`;
      const testUser = {
        isic_number: "S9999999999",
        name: "Test User Android",
      };

      setResult(
        (prev) =>
          prev +
          `URL: ${url}\n` +
          `Payload: ${JSON.stringify(testUser, null, 2)}\n\n`
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testUser),
      });

      setResult(
        (prev) =>
          prev +
          `Status: ${response.status}\n` +
          `OK: ${response.ok}\n\n`
      );

      const data = await response.json();
      setResult(
        (prev) =>
          prev +
          `Response:\n${JSON.stringify(data, null, 2)}\n\n` +
          (response.ok ? "✅ SUCCESS!" : "⚠️ Check response")
      );
    } catch (error: any) {
      setResult(
        (prev) =>
          prev +
          `❌ ERROR:\n${error.message}\n\n` +
          `Details:\n${JSON.stringify(error, null, 2)}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Simple GET to see if server is reachable
  const testSimpleGet = async () => {
    setLoading(true);
    setResult("Testing simple GET request...\n");

    try {
      setResult((prev) => prev + `Testing: ${API_BASE_URL}\n\n`);

      const response = await fetch(API_BASE_URL);

      setResult(
        (prev) =>
          prev +
          `Status: ${response.status}\n` +
          `OK: ${response.ok}\n\n` +
          "✅ Server is reachable!"
      );
    } catch (error: any) {
      setResult(
        (prev) =>
          prev +
          `❌ Cannot reach server!\n` +
          `Error: ${error.message}\n\n` +
          `This means:\n` +
          `- Backend might be down\n` +
          `- No internet connection\n` +
          `- URL is incorrect\n`
      );
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
          Connection Test
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* API Info */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.primaryLight, borderColor: theme.primary },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Testing API
          </Text>
          <Text style={[styles.urlText, { color: theme.primary }]}>
            {API_BASE_URL}
          </Text>
        </View>

        {/* Test Buttons */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Run Tests
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primaryLight }]}
            onPress={testSimpleGet}
            disabled={loading}
          >
            <Ionicons name="globe-outline" size={20} color={theme.primary} />
            <Text style={[styles.buttonText, { color: theme.primary }]}>
              1. Test Server Reachable
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primaryLight }]}
            onPress={testFetch}
            disabled={loading}
          >
            <Ionicons name="heart-outline" size={20} color={theme.primary} />
            <Text style={[styles.buttonText, { color: theme.primary }]}>
              2. Test Health Endpoint
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primaryLight }]}
            onPress={testCreateUser}
            disabled={loading}
          >
            <Ionicons name="person-add-outline" size={20} color={theme.primary} />
            <Text style={[styles.buttonText, { color: theme.primary }]}>
              3. Test Create User
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Testing...
            </Text>
          </View>
        )}

        {/* Results */}
        {result && (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.inputBg, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Result
            </Text>
            <ScrollView style={styles.resultScroll} nestedScrollEnabled>
              <Text style={[styles.resultText, { color: theme.text }]}>
                {result}
              </Text>
            </ScrollView>
          </View>
        )}
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
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  urlText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
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
    paddingVertical: 30,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  resultScroll: {
    maxHeight: 400,
  },
  resultText: {
    fontSize: 13,
    fontFamily: "monospace",
    lineHeight: 20,
  },
});

