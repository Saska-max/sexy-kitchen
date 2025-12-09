// app/register/index.tsx - Registration Screen with Face ID Enrollment
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type RegistrationStep = "agreement" | "info" | "face" | "processing" | "success";

export default function RegisterScreen() {
  const { setAuth, setFaceEnrolled, updateUser } = useSmartKitchen();
  const { theme } = useTheme();
  const [step, setStep] = useState<RegistrationStep>("agreement");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // Agreement state
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  // Registration form state
  const [name, setName] = useState("");
  const [isic, setIsic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Face enrollment state
  const [faceEnrollmentError, setFaceEnrollmentError] = useState<string>("");

  const isValidISIC = validateISIC(isic);
  const canProceedToFace = name.trim().length > 0 && isValidISIC && !isLoading;

  const handleAcceptAgreement = () => {
    if (!agreementAccepted) {
      Alert.alert(
        "Agreement Required",
        "You must accept the data usage agreement to register."
      );
      return;
    }
    setStep("info");
  };

  const handleContinueToFace = async () => {
    if (!canProceedToFace) return;

    setError(null);
    
    // Request camera permission
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Please enable camera access to enroll your Face ID."
        );
        return;
      }
    }

    setStep("face");
  };

  const handleCaptureFace = async () => {
    if (!cameraRef.current || !isic) return;

    setStep("processing");
    setFaceEnrollmentError("");

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      if (!photo?.base64) {
        throw new Error("Failed to capture image");
      }

      // TEMPORARY: Mock registration and Face ID enrollment
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create mock user with Face ID enrolled
      const mockUser = {
        id: Date.now(), // Unique ID
        isic: isic,
        name: name.trim(),
        face_enrolled: true,
        theme_palette: "pink",
        theme_dark_mode: false,
      };
      const mockToken = "mock_token_for_testing";

      // Set authentication and Face ID status
      await setAuth(mockToken, mockUser);
      setFaceEnrolled(true);
      updateUser({ ...mockUser, face_enrolled: true });

      setStep("success");

      // Redirect to home after a moment
      setTimeout(() => {
        router.replace("/home");
      }, 2000);

      // Original backend code (commented out):
      // 1. Register user: await register(name, isic);
      // 2. Enroll Face ID: await enrollFace(photo.base64, isic);
      // 3. Login: await setAuth(response.token, response.user);
    } catch (error: any) {
      console.error("Registration error:", error);
      setFaceEnrollmentError(
        error.response?.data?.message ||
          error.message ||
          "Failed to complete registration. Please try again."
      );
      setStep("face");
    }
  };

  const handleBack = () => {
    if (step === "face") {
      setStep("info");
    } else {
      router.back();
    }
  };

  // Agreement Step
  if (step === "agreement") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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

  // Info Step
  if (step === "info") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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
              <View style={styles.content}>
                {/* Header */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>

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
                  <Text style={[styles.logoSubtext, { color: theme.textSecondary }]}>
                    Create your account
                  </Text>
                </View>

                {/* Registration Card */}
                <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Get Started! 🎉</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                    Register with your ISIC card and set up Face ID
                  </Text>

                  {/* Name Input */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.inputBg,
                        },
                        name.length > 0 && {
                          borderColor: theme.success,
                          backgroundColor: theme.isDark ? theme.success + "20" : "#F0FDF4",
                        },
                      ]}
                    >
                      <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
                      <TextInput
                        placeholder="John Doe"
                        placeholderTextColor={theme.textSecondary}
                        value={name}
                        onChangeText={(text) => {
                          setName(text);
                          setError(null);
                        }}
                        autoCapitalize="words"
                        autoCorrect={false}
                        style={[styles.input, { color: theme.text }]}
                        editable={!isLoading}
                        returnKeyType="next"
                        onSubmitEditing={() => {
                          if (isValidISIC) {
                            Keyboard.dismiss();
                            handleContinueToFace();
                          }
                        }}
                      />
                      {name.length > 0 && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                      )}
                    </View>
                  </View>

                  {/* ISIC Input */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>ISIC Number</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.inputBg,
                        },
                        isic.length > 0 && isValidISIC && {
                          borderColor: theme.success,
                          backgroundColor: theme.isDark ? theme.success + "20" : "#F0FDF4",
                        },
                        isic.length > 0 && !isValidISIC && {
                          borderColor: theme.error,
                          backgroundColor: theme.isDark ? theme.error + "20" : "#FEF2F2",
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
                          if (canProceedToFace) handleContinueToFace();
                        }}
                      />
                      {isic.length > 0 && (
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

                  {/* Error */}
                  {error && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color={theme.error} />
                      <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
                    </View>
                  )}

                  {/* Continue Button */}
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      !canProceedToFace && styles.buttonDisabled,
                      { shadowColor: theme.primary },
                    ]}
                    disabled={!canProceedToFace}
                    onPress={() => {
                      Keyboard.dismiss();
                      handleContinueToFace();
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        canProceedToFace
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
                          <Ionicons name="arrow-forward" size={20} color="white" />
                          <Text style={styles.primaryButtonText}>Continue to Face ID</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Login Link */}
                  <View style={styles.loginLinkContainer}>
                    <Text style={[styles.loginLinkText, { color: theme.textSecondary }]}>
                      Already have an account?{" "}
                    </Text>
                    <TouchableOpacity onPress={() => router.replace("/login")}>
                      <Text style={[styles.loginLink, { color: theme.primary }]}>Login</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                    Your data is secure and encrypted
                  </Text>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Face Enrollment Step
  if (step === "face") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.faceContainer}>
          {/* Header */}
          <View style={styles.faceHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.faceTitle, { color: theme.text }]}>Face ID Enrollment</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Instructions */}
          <View style={[styles.instructionsCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.instructionsTitle, { color: theme.text }]}>
              Position your face in the frame
            </Text>
            <Text style={[styles.instructionsText, { color: theme.textSecondary }]}>
              • Make sure your face is well-lit{"\n"}
              • Look directly at the camera{"\n"}
              • Remove glasses or hat if possible{"\n"}
              • Keep a neutral expression
            </Text>
          </View>

          {/* Camera */}
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front"
            >
              <View style={styles.cameraOverlay}>
                <View
                  style={[
                    styles.faceFrame,
                    { borderColor: theme.primary, shadowColor: theme.primary },
                  ]}
                />
              </View>
            </CameraView>
          </View>

          {/* Capture Button */}
          <View style={styles.captureContainer}>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
              onPress={handleCaptureFace}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.gradient1, theme.gradient2]}
                style={styles.captureButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="camera" size={28} color="white" />
              </LinearGradient>
            </TouchableOpacity>
            {faceEnrollmentError && (
              <Text style={[styles.errorText, { color: theme.error }]}>
                {faceEnrollmentError}
              </Text>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Processing Step
  if (step === "processing") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.processingContainer}>
          <View style={[styles.processingIcon, { backgroundColor: theme.primaryLight }]}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
          <Text style={[styles.processingTitle, { color: theme.text }]}>
            Creating your account...
          </Text>
          <Text style={[styles.processingSubtext, { color: theme.textSecondary }]}>
            Please wait while we set everything up
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Success Step
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.successContainer}>
        <View style={[styles.successIcon, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="checkmark-circle" size={64} color={theme.success} />
        </View>
        <Text style={[styles.successTitle, { color: theme.text }]}>
          Registration Successful! 🎉
        </Text>
        <Text style={[styles.successSubtext, { color: theme.textSecondary }]}>
          Your account has been created and Face ID is set up.
        </Text>
        <Text style={[styles.successSubtext, { color: theme.textSecondary }]}>
          Redirecting to home...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 0,
    padding: 8,
    zIndex: 10,
  },
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
  primaryButton: {
    borderRadius: 18,
    overflow: "hidden",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    marginTop: 8,
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
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  loginLinkText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
  },
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
  // Face Enrollment Styles
  faceContainer: {
    flex: 1,
  },
  faceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 16,
  },
  faceTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  instructionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  faceFrame: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: SCREEN_WIDTH * 0.35,
    borderWidth: 4,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  captureContainer: {
    alignItems: "center",
    paddingBottom: 40,
    gap: 12,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  captureButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  // Processing & Success Styles
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  processingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  processingSubtext: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  successSubtext: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
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

