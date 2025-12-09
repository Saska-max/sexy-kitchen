// app/login/index.tsx - Login Screen with Dynamic Theme
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { validateISIC } from "../../services/api";
import { useSmartKitchen } from "../context/SmartKitchenContext";
import { useTheme } from "../context/ThemeContext";

export default function LoginScreen() {
  const { setAuth } = useSmartKitchen();
  const { theme } = useTheme();
  const [isic, setIsic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAgreement, setShowAgreement] = useState(true);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  const isValidFormat = validateISIC(isic);
  const canSubmit = isValidFormat && !isLoading && agreementAccepted;

  const handleAcceptAgreement = () => {
    if (!agreementAccepted) {
      Alert.alert(
        "Agreement Required",
        "You must accept the data usage agreement to login."
      );
      return;
    }
    setShowAgreement(false);
  };

  const handleLogin = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      // TEMPORARY: Bypass backend for UI testing
      // const response = await login(isic);
      // await setAuth(response.token, response.user);
      
      // Mock user data for testing
      const mockUser = {
        id: 1,
        isic: isic || "S1234567890",
        name: "Test User",
        face_enrolled: false,
        theme_palette: "pink",
        theme_dark_mode: false,
      };
      const mockToken = "mock_token_for_testing";
      
      await setAuth(mockToken, mockUser);
      router.replace("/home");
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your connection and try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceLogin = () => {
    router.push("/face/verify");
  };

  // Show agreement modal before login
  if (showAgreement) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.agreementContainer}>
          <View style={[styles.agreementCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.agreementHeader}>
              <Ionicons name="document-text-outline" size={40} color={theme.primary} />
              <Text style={[styles.agreementTitle, { color: theme.text }]}>Data Usage Agreement</Text>
            </View>

            <ScrollView style={styles.agreementContent} showsVerticalScrollIndicator={true}>
              <Text style={[styles.agreementText, { color: theme.textSecondary }]}>
                By using this app, you consent to the collection and processing of your ISIC number and Face ID data for authentication and account management purposes.
              </Text>
              <Text style={[styles.agreementText, { color: theme.textSecondary }]}>
                Your data is securely stored and encrypted. You can access, modify, or delete your data at any time through app settings.
              </Text>
            </ScrollView>

            <View style={styles.agreementCheckbox}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: agreementAccepted ? theme.primary : theme.inputBg,
                    borderColor: agreementAccepted ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setAgreementAccepted(!agreementAccepted)}
                activeOpacity={0.7}
              >
                {agreementAccepted && (
                  <Ionicons name="checkmark" size={18} color="white" />
                )}
              </TouchableOpacity>
              <Text style={[styles.agreementCheckboxText, { color: theme.text }]}>
                I agree to the data usage agreement
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.agreementButton,
                !agreementAccepted && styles.buttonDisabled,
                { shadowColor: theme.primary },
              ]}
              disabled={!agreementAccepted}
              onPress={handleAcceptAgreement}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  agreementAccepted
                    ? [theme.gradient1, theme.gradient2]
                    : [theme.primaryLight, theme.primaryLight]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
              {/* Logo */}
              <View style={styles.logoContainer}>
                <View style={[styles.logoWrapper, { shadowColor: theme.primary }]}>
                  <LinearGradient
                    colors={[theme.gradient1, theme.gradient2]}
                    style={styles.logoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.logoEmoji}>🍳</Text>
                  </LinearGradient>
                </View>
                <Text style={[styles.logoText, { color: theme.text }]}>Sexy Kitchen</Text>
                <Text style={[styles.logoSubtext, { color: theme.textSecondary }]}>Jedlíková 9 • Košice</Text>
        </View>

              {/* Login Card */}
              <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Welcome back! 👋</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                  Login with your ISIC card to get started
        </Text>

                {/* ISIC Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>ISIC Number</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      { borderColor: theme.border, backgroundColor: theme.inputBg },
                      error && styles.inputError,
                      isic.length > 0 && isValidFormat && {
                        borderColor: theme.success,
                        backgroundColor: theme.isDark ? theme.success + "20" : "#F0FDF4",
                      },
                    ]}
                  >
                    <Ionicons name="card-outline" size={20} color={theme.textSecondary} />
            <TextInput
                      placeholder="S1234567890"
                      placeholderTextColor={theme.textSecondary}
              value={isic}
                      onChangeText={(text) => {
                        setIsic(text.toUpperCase());
                        setError(null);
                      }}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      style={[styles.input, { color: theme.text }]}
                      editable={!isLoading}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        Keyboard.dismiss();
                        if (canSubmit) handleLogin();
                      }}
                    />
                    {isic.length > 0 && (
                      <Ionicons
                        name={isValidFormat ? "checkmark-circle" : "close-circle"}
                        size={20}
                        color={isValidFormat ? theme.success : theme.error}
                      />
                    )}
                  </View>
                  <Text style={[styles.helper, { color: theme.textSecondary }]}>
                    Format: S followed by 10-11 digits
                  </Text>
          </View>

                {/* Error */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color={theme.error} />
                    <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
                  </View>
                )}

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, !canSubmit && styles.buttonDisabled, { shadowColor: theme.primary }]}
                  disabled={!canSubmit}
                  onPress={() => {
                    Keyboard.dismiss();
                    handleLogin();
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={canSubmit ? [theme.gradient1, theme.gradient2] : [theme.primaryLight, theme.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Ionicons name="log-in-outline" size={20} color="white" />
                        <Text style={styles.primaryButtonText}>Login with ISIC</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                  <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or</Text>
                  <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                </View>

                {/* Face ID Button */}
          <TouchableOpacity
                  style={[styles.faceButton, { backgroundColor: theme.primaryLight, borderColor: theme.primary + "40" }]}
                  onPress={handleFaceLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="scan-outline" size={20} color={theme.primary} />
                  <Text style={[styles.faceButtonText, { color: theme.primary }]}>Login with Face ID</Text>
          </TouchableOpacity>

                {/* Register Link */}
                <View style={styles.registerLinkContainer}>
                  <Text style={[styles.registerLinkText, { color: theme.textSecondary }]}>
                    Don't have an account?{" "}
                  </Text>
                  <TouchableOpacity onPress={() => router.push("/register")}>
                    <Text style={[styles.registerLink, { color: theme.primary }]}>Register</Text>
                  </TouchableOpacity>
                </View>
        </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Ionicons name="shield-checkmark-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          Secure access to shared kitchen facilities
        </Text>
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
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // Logo
  logoContainer: {
    alignItems: "center",
    marginBottom: 36,
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
    fontSize: 32,
    fontWeight: "800",
  },
  logoSubtext: {
    fontSize: 15,
    marginTop: 4,
    fontWeight: "500",
  },

  // Card
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
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 15,
    marginBottom: 28,
    lineHeight: 22,
  },

  // Input
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
  inputError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  inputValid: {
    // Will be overridden with theme colors in JSX
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

  // Error
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    marginBottom: 20,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },

  // Buttons
  primaryButton: {
    borderRadius: 18,
    overflow: "hidden",
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

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
  },

  // Face Button
  faceButton: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 2,
  },
  faceButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Register Link
  registerLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  registerLinkText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  // Agreement Styles
  agreementContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  agreementCard: {
    width: "100%",
    maxWidth: 500,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    maxHeight: "90%",
  },
  agreementHeader: {
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  agreementTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  agreementContent: {
    maxHeight: 200,
    marginBottom: 20,
  },
  agreementText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  agreementCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  agreementCheckboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  agreementButton: {
    borderRadius: 18,
    overflow: "hidden",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    marginBottom: 12,
  },
  declineButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
