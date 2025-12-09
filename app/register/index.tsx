// app/register/index.tsx - Register User Screen
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { createUser } from "../../src/api/smartKitchen";
import { useAuth } from "../../src/state/useAuthStore.tsx";
import { useTheme } from "../context/ThemeContext";

export default function RegisterUserScreen() {
  const { theme } = useTheme();
  const { setUser, clearError } = useAuth();
  const [isicNumber, setIsicNumber] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidISIC = /^S\d{10,11}$/.test(isicNumber);
  const canSubmit = isValidISIC && name.trim().length > 0 && !isLoading;

  const handleCreateUser = async () => {
    if (!canSubmit) return;

    console.log('[Register] Starting registration...');
    console.log('[Register] ISIC:', isicNumber);
    console.log('[Register] Name:', name);

    Keyboard.dismiss();
    setIsLoading(true);
    setError(null);
    clearError();

    try {
      console.log('[Register] Calling createUser API...');
      const response = await createUser({
        isic_number: isicNumber.toUpperCase(),
        name: name.trim(),
      });

      console.log('[Register] API Response:', JSON.stringify(response, null, 2));

      if (response.success && response.user) {
        console.log('[Register] Success! User created:', response.user);
        setUser(response.user);
        console.log('[Register] Navigating to face enrollment...');
        // Navigate to face enrollment after registration
        setTimeout(() => {
          router.replace("/face/enroll");
        }, 300);
      } else {
        console.error('[Register] API returned success=false');
        setError(response.message || "Failed to create user");
      }
    } catch (err: any) {
      console.error("[Register] ERROR:", err);
      console.error("[Register] Error details:", JSON.stringify(err, null, 2));
      
      let errorMessage = "Failed to create user. Please try again.";
      
      if (err.status === 0) {
        if (err.message && err.message.includes('timeout')) {
          errorMessage = "Request timeout. The backend might be starting up. Please wait 10 seconds and try again.";
        } else {
          errorMessage = "Network error. Please check your internet connection and try again.";
        }
      } else if (err.detail) {
        errorMessage = err.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[styles.backButton, { backgroundColor: theme.border }]}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  Create Account
                </Text>
                <View style={{ width: 44 }} />
              </View>

              {/* Logo */}
              <View style={styles.logoContainer}>
                <View style={[styles.logoWrapper, { shadowColor: theme.primary }]}>
                  <LinearGradient
                    colors={[theme.gradient1, theme.gradient2]}
                    style={styles.logoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.logoEmoji}>👤</Text>
                  </LinearGradient>
                </View>
                <Text style={[styles.logoText, { color: theme.text }]}>
                  New User
                </Text>
                <Text style={[styles.logoSubtext, { color: theme.textSecondary }]}>
                  Register to use Smart Kitchen
                </Text>
              </View>

              {/* Form Card */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.cardBg, borderColor: theme.border },
                ]}
              >
                {/* ISIC Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    ISIC Number *
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.inputBg,
                      },
                      isicNumber.length > 0 &&
                        isValidISIC &&
                        styles.inputValid,
                    ]}
                  >
                    <Ionicons
                      name="card-outline"
                      size={20}
                      color={theme.textSecondary}
                    />
                    <TextInput
                      placeholder="S1234567890"
                      placeholderTextColor={theme.textSecondary}
                      value={isicNumber}
                      onChangeText={(text) => {
                        setIsicNumber(text.toUpperCase());
                        setError(null);
                        clearError();
                      }}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      style={[styles.input, { color: theme.text }]}
                      editable={!isLoading}
                      returnKeyType="next"
                    />
                    {isicNumber.length > 0 && (
                      <Ionicons
                        name={isValidISIC ? "checkmark-circle" : "close-circle"}
                        size={20}
                        color={isValidISIC ? theme.success : theme.error}
                      />
                    )}
                  </View>
                  <Text style={[styles.helper, { color: theme.textSecondary }]}>
                    Format: S followed by 10-11 digits
                  </Text>
                </View>

                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Name *</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.inputBg,
                      },
                      name.trim().length > 0 && styles.inputValid,
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={theme.textSecondary}
                    />
                    <TextInput
                      placeholder="Your full name"
                      placeholderTextColor={theme.textSecondary}
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        setError(null);
                        clearError();
                      }}
                      autoCapitalize="words"
                      autoCorrect={false}
                      style={[styles.input, { color: theme.text }]}
                      editable={!isLoading}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        Keyboard.dismiss();
                        if (canSubmit) handleCreateUser();
                      }}
                    />
                    {name.trim().length > 0 && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.success}
                      />
                    )}
                  </View>
                </View>

                {/* Error Display */}
                {error && (
                  <View
                    style={[
                      styles.errorContainer,
                      { backgroundColor: theme.error + "20", borderColor: theme.error },
                    ]}
                  >
                    <Ionicons name="alert-circle" size={20} color={theme.error} />
                    <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
                  </View>
                )}

                {/* Create Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    !canSubmit && styles.buttonDisabled,
                    { shadowColor: theme.primary },
                  ]}
                  disabled={!canSubmit}
                  onPress={handleCreateUser}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      canSubmit
                        ? [theme.gradient1, theme.gradient2]
                        : [theme.primaryLight, theme.primaryLight]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Ionicons name="person-add-outline" size={20} color="white" />
                        <Text style={styles.primaryButtonText}>Create User</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoWrapper: {
    marginBottom: 18,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  logoEmoji: {
    fontSize: 44,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "800",
  },
  logoSubtext: {
    fontSize: 15,
    marginTop: 4,
    fontWeight: "500",
  },
  card: {
    width: "100%",
    borderRadius: 28,
    padding: 28,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    gap: 12,
  },
  inputValid: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 17,
    letterSpacing: 0.5,
    fontWeight: "500",
  },
  helper: {
    marginTop: 8,
    fontSize: 12,
  },
  primaryButton: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 8,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonGradient: {
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  buttonDisabled: {
    shadowOpacity: 0.1,
  },
  primaryButtonText: {
    fontSize: 17,
    color: "white",
    fontWeight: "700",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
});

