// app/face/enroll.tsx - Face Enrollment Screen with Dynamic Theme
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSmartKitchen } from "../context/SmartKitchenContext";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type EnrollmentStep = "instructions" | "camera" | "processing" | "success" | "error";

export default function FaceEnrollScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, setFaceEnrolled, updateUser } = useSmartKitchen();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [step, setStep] = useState<EnrollmentStep>("instructions");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleStartEnrollment = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Please enable camera access in your device settings to use Face ID enrollment."
        );
        return;
      }
    }
    setStep("camera");
  };

  const handleCapture = async () => {
    if (!cameraRef.current || !user) return;

    setStep("processing");

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      if (!photo?.base64) {
        throw new Error("Failed to capture image");
      }

      // TEMPORARY: Bypass backend for UI testing
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful enrollment
      setFaceEnrolled(true);
      updateUser({ ...user, face_enrolled: true });
      setStep("success");

      // Original backend code (commented out):
      // const response = await enrollFace(photo.base64, user.isic);
      // if (response.success) {
      //   setFaceEnrolled(true);
      //   if (response.user) {
      //     updateUser(response.user);
      //   }
      //   setStep("success");
      // } else {
      //   throw new Error(response.message || "Enrollment failed");
      // }
    } catch (error: any) {
      console.error("Face enrollment error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to enroll face. Please try again."
      );
      setStep("error");
    }
  };

  const handleClose = () => {
    router.back();
  };

  const handleRetry = () => {
    setErrorMessage("");
    setStep("camera");
  };

  // Instructions step
  if (step === "instructions") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: theme.border }]}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Face ID Enrollment</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.iconContainer, { shadowColor: theme.primary }]}>
            <LinearGradient
              colors={[theme.gradient1, theme.gradient2]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="scan-outline" size={56} color="white" />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>Set Up Face ID 📸</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Your Face ID will be linked to your ISIC account
          </Text>
          
          <View style={[styles.isicCard, { backgroundColor: theme.primaryLight, borderColor: theme.primary + "40" }]}>
            <Ionicons name="card-outline" size={20} color={theme.primary} />
            <Text style={[styles.isicText, { color: theme.primary }]}>{user?.isic}</Text>
          </View>

          <View style={styles.instructionsList}>
            <View style={[styles.instructionItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.instructionIcon, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="sunny-outline" size={22} color="#FF9800" />
              </View>
              <View style={styles.instructionContent}>
                <Text style={[styles.instructionTitle, { color: theme.text }]}>Good Lighting</Text>
                <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
                  Ensure your face is well-lit
                </Text>
              </View>
            </View>

            <View style={[styles.instructionItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.instructionIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="eye-outline" size={22} color={theme.primary} />
              </View>
              <View style={styles.instructionContent}>
                <Text style={[styles.instructionTitle, { color: theme.text }]}>Look Straight</Text>
                <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
                  Look directly at the camera
                </Text>
              </View>
            </View>

            <View style={[styles.instructionItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.instructionIcon, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="glasses-outline" size={22} color={theme.success} />
              </View>
              <View style={styles.instructionContent}>
                <Text style={[styles.instructionTitle, { color: theme.text }]}>Clear Face</Text>
                <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
                  Remove glasses or face coverings
                </Text>
              </View>
            </View>

            <View style={[styles.instructionItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.instructionIcon, { backgroundColor: "#F3E5F5" }]}>
                <Ionicons name="happy-outline" size={22} color="#9C27B0" />
              </View>
              <View style={styles.instructionContent}>
                <Text style={[styles.instructionTitle, { color: theme.text }]}>Neutral Expression</Text>
                <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
                  Keep a relaxed, natural face
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <TouchableOpacity
            style={[styles.primaryButton, { shadowColor: theme.primary }]}
            onPress={handleStartEnrollment}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.gradient1, theme.gradient2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="camera" size={22} color="white" />
              <Text style={styles.primaryButtonText}>Start Camera</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
            <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Camera step
  if (step === "camera") {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front">
          <SafeAreaView style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                onPress={() => setStep("instructions")}
                style={styles.cameraBackButton}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Position Your Face</Text>
              <View style={{ width: 44 }} />
            </View>

            <View style={styles.faceGuide}>
              <View style={styles.faceGuideOuter}>
                <View style={[styles.faceGuideInner, { borderColor: theme.primary }]} />
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
              </View>
              <View style={[styles.isicLabelContainer, { backgroundColor: theme.primary }]}>
                <Ionicons name="card-outline" size={14} color="white" />
                <Text style={styles.isicLabel}>{user?.isic}</Text>
              </View>
            </View>

            <View style={styles.cameraFooter}>
              <Text style={styles.cameraHint}>
                Align your face within the frame
              </Text>
              <TouchableOpacity
                style={[styles.captureButton, { shadowColor: theme.primary }]}
                onPress={handleCapture}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.gradient1, theme.gradient2]}
                  style={styles.captureButtonGradient}
                >
                  <View style={styles.captureButtonInner} />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.captureTip}>Tap to capture</Text>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  // Processing step
  if (step === "processing") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContent}>
          <View style={[styles.processingIconContainer, { backgroundColor: theme.primaryLight }]}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
          <Text style={[styles.processingText, { color: theme.text }]}>Processing your face...</Text>
          <Text style={[styles.processingSubtext, { color: theme.textSecondary }]}>
            Linking to ISIC: {user?.isic}
          </Text>
          <View style={styles.processingDots}>
            <View style={[styles.dot, { backgroundColor: theme.primary }]} />
            <View style={[styles.dot, { backgroundColor: theme.primary }]} />
            <View style={[styles.dot, { backgroundColor: theme.border }]} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Success step
  if (step === "success") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContent}>
          <View style={[styles.successIcon, { backgroundColor: theme.primary, shadowColor: theme.primary }]}>
            <Ionicons name="checkmark" size={56} color="white" />
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>Face ID Enrolled! 🎉</Text>
          <Text style={[styles.successDescription, { color: theme.textSecondary }]}>
            Your face has been securely linked to your ISIC account.
          </Text>
          <Text style={[styles.successSubtext, { color: theme.textSecondary }]}>
            You can now use Face ID for quick kitchen access
          </Text>
          
          <View style={[styles.successIsicBadge, { backgroundColor: theme.primaryLight, borderColor: theme.primary + "40" }]}>
            <Ionicons name="card-outline" size={18} color={theme.primary} />
            <Text style={[styles.successIsicText, { color: theme.primary }]}>{user?.isic}</Text>
            <View style={[styles.linkedBadge, { backgroundColor: theme.success + "20" }]}>
              <Ionicons name="checkmark-circle" size={14} color={theme.success} />
              <Text style={[styles.linkedText, { color: theme.success }]}>Linked</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.doneButton, { shadowColor: theme.primary }]}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.gradient1, theme.gradient2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Error step
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.centerContent}>
        <View style={[styles.errorIcon, { backgroundColor: theme.error, shadowColor: theme.error }]}>
          <Ionicons name="alert" size={56} color="white" />
        </View>
        <Text style={[styles.errorTitle, { color: theme.text }]}>Enrollment Failed</Text>
        <Text style={[styles.errorDescription, { color: theme.textSecondary }]}>{errorMessage}</Text>
        
        <TouchableOpacity
          style={[styles.retryButton, { shadowColor: theme.primary }]}
          onPress={handleRetry}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.gradient1, theme.gradient2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
          <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
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
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: "center",
  },
  
  iconContainer: {
    marginBottom: 24,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconGradient: {
    width: 110,
    height: 110,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  
  isicCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 28,
    gap: 10,
    borderWidth: 1,
  },
  isicText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  
  instructionsList: {
    width: "100%",
    gap: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    gap: 14,
    borderWidth: 1,
  },
  instructionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 13,
  },
  
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 18,
    overflow: "hidden",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  cameraHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  cameraBackButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  
  faceGuide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  faceGuideOuter: {
    width: Math.min(SCREEN_WIDTH * 0.7, 280),
    height: Math.min(SCREEN_WIDTH * 0.9, 360),
    borderRadius: Math.min(SCREEN_WIDTH * 0.35, 140),
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  faceGuideInner: {
    width: "100%",
    height: "100%",
    borderRadius: Math.min(SCREEN_WIDTH * 0.35, 140),
    borderWidth: 3,
    borderStyle: "dashed",
  },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "white",
    borderTopLeftRadius: 20,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "white",
    borderTopRightRadius: 20,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "white",
    borderBottomLeftRadius: 20,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "white",
    borderBottomRightRadius: 20,
  },
  isicLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  isicLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  
  cameraFooter: {
    paddingBottom: 50,
    alignItems: "center",
    gap: 16,
  },
  cameraHint: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: "hidden",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  captureButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "white",
  },
  captureTip: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "500",
  },
  
  // Center content styles
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  
  processingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  processingText: {
    fontSize: 20,
    fontWeight: "700",
  },
  processingSubtext: {
    marginTop: 8,
    fontSize: 15,
  },
  processingDots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  
  successIcon: {
    width: 110,
    height: 110,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  successSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  successIsicBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
    gap: 10,
    borderWidth: 1,
  },
  successIsicText: {
    fontSize: 16,
    fontWeight: "700",
  },
  linkedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    gap: 4,
  },
  linkedText: {
    fontSize: 12,
    fontWeight: "600",
  },
  doneButton: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 32,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  doneButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
  
  errorIcon: {
    width: 110,
    height: 110,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  errorTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
  },
  errorDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  retryButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
});
