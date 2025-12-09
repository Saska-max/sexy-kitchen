// app/face/verify.tsx - Face Verification Login Screen with Dynamic Theme
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { loginWithFace } from "../../src/api/smartKitchen";
import { useAuth } from "../../src/state/useAuthStore.tsx";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type VerifyStep = "camera" | "processing" | "success" | "error";

export default function FaceVerifyScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { setUser } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [step, setStep] = useState<VerifyStep>("camera");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleCapture = async () => {
    if (!cameraRef.current) {
      console.log('[Face Verify] Camera ref not available');
      console.log('[Face Verify] cameraRef.current:', cameraRef.current);
      return;
    }

    if (!cameraReady) {
      console.log('[Face Verify] Camera not ready yet');
      Alert.alert('Camera Not Ready', 'Please wait a moment for the camera to initialize.');
      return;
    }

    if (isCapturing) {
      console.log('[Face Verify] Already capturing, ignoring...');
      return;
    }

    console.log('[Face Verify] Starting capture...');
    setIsCapturing(true);

    try {
      console.log('[Face Verify] Taking picture...');
      console.log('[Face Verify] cameraRef.current:', cameraRef.current);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
        imageType: 'jpg',
      });

      console.log('[Face Verify] Photo captured:', photo ? 'Success' : 'Failed');
      console.log('[Face Verify] Photo URI:', photo?.uri);

      if (!photo?.uri) {
        throw new Error("Failed to capture image - no URI returned");
      }

      // Now that we have the photo, we can change to processing step
      setStep("processing");

      console.log('[Face Verify] Calling loginWithFace API...');
      const response = await loginWithFace(photo.uri);

      if (response.success && response.user) {
        setMatchedUser(response.user);
        setUser(response.user);
        setStep("success");
        
        // Navigate to reservations after successful face login
        setTimeout(() => {
          router.replace("/reservations");
        }, 1500);
      } else {
        throw new Error(response.message || "Face verification failed");
      }
    } catch (error: any) {
      console.error("[Face Verify] ERROR:", error);
      console.error("[Face Verify] Error code:", error.code);
      console.error("[Face Verify] Error message:", error.message);
      console.error("[Face Verify] Error details:", JSON.stringify(error, null, 2));
      
      let errorMessage = "Face not recognized. Please try again or use ISIC login.";
      
      // Handle camera errors
      if (error.code === 'ERR_IMAGE_CAPTURE_FAILED' || error.code === 'ERR_CAMERA_UNAVAILABLE') {
        errorMessage = "Camera error. Please grant camera permissions and try again.";
      } else if (error.message && error.message.includes('takePictureAsync')) {
        errorMessage = "Camera not available. Please go back and try again.";
      } else if (error.status === 0) {
        if (error.message && error.message.includes('timeout')) {
          errorMessage = "Request timeout. Backend might be starting up. Please wait and try again.";
        } else {
          errorMessage = "Network error. Please check your internet connection and try again.";
        }
      } else if (error.detail) {
        errorMessage = error.detail;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setErrorMessage(errorMessage);
      setIsCapturing(false);
      setStep("error");
    }
  };

  const handleClose = () => {
    router.back();
  };

  const handleRetry = () => {
    setErrorMessage("");
    setMatchedUser(null);
    setIsCapturing(false);
    setCameraReady(false);
    setStep("camera");
  };

  const handleUseISIC = () => {
    router.replace("/login");
  };

  // No permission
  if (!permission?.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContent}>
          <View style={[styles.permissionIcon, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="camera-outline" size={52} color={theme.primary} />
          </View>
          <Text style={[styles.permissionTitle, { color: theme.text }]}>Camera Access Required</Text>
          <Text style={[styles.permissionDescription, { color: theme.textSecondary }]}>
            To use Face ID login, please grant camera access.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { shadowColor: theme.primary }]}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.gradient1, theme.gradient2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
            <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>Use ISIC Instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Camera step
  if (step === "camera") {
    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          ref={cameraRef} 
          style={styles.camera} 
          facing="front"
          onCameraReady={() => {
            console.log('[Face Verify] Camera is ready');
            setCameraReady(true);
          }}
          onMountError={(error) => {
            console.error('[Face Verify] Camera mount error:', error);
            setErrorMessage('Camera failed to initialize: ' + error.message);
            setStep("error");
          }}
        >
          <SafeAreaView style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.cameraCloseButton}
              >
                <Ionicons name="close" size={26} color="white" />
              </TouchableOpacity>
              <View style={[styles.cameraTitleContainer, { backgroundColor: theme.primary }]}>
                <Ionicons name="scan" size={18} color="white" />
                <Text style={styles.cameraTitle}>Face ID Login</Text>
              </View>
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
              <Text style={styles.faceGuideHint}>
                We'll match your face to your ISIC account
              </Text>
            </View>

            <View style={styles.cameraFooter}>
              <Text style={styles.cameraHint}>
                Position your face in the frame
              </Text>
              {!cameraReady && (
                <View style={styles.cameraReadyIndicator}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.cameraReadyText}>Initializing camera...</Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.captureButton, 
                  { shadowColor: theme.primary },
                  (!cameraReady || isCapturing) && styles.captureButtonDisabled
                ]}
                onPress={handleCapture}
                activeOpacity={0.8}
                disabled={!cameraReady || isCapturing}
              >
                <LinearGradient
                  colors={(cameraReady && !isCapturing) ? [theme.gradient1, theme.gradient2] : ['#666', '#666']}
                  style={styles.captureButtonGradient}
                >
                  <View style={styles.captureButtonInner}>
                    {isCapturing ? (
                      <ActivityIndicator color={theme.primary} size="large" />
                    ) : (
                      <Ionicons name="scan" size={32} color={theme.primary} />
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.isicLink} onPress={handleUseISIC}>
                <Ionicons name="card-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.isicLinkText}>Use ISIC instead</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  // Processing step
  if (step === "processing") {
    return (
      <SafeAreaView style={[styles.container, styles.darkContainer]}>
        <View style={styles.centerContent}>
          <View style={[styles.processingIcon, { backgroundColor: theme.primary + "30" }]}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
          <Text style={styles.processingTextLight}>Verifying your face...</Text>
          <Text style={styles.processingSubtextLight}>
            Comparing with enrolled faces
          </Text>
          <View style={styles.processingDots}>
            <View style={[styles.dot, styles.dotActive, { backgroundColor: theme.primary }]} />
            <View style={[styles.dot, styles.dotActive, { backgroundColor: theme.primary }]} />
            <View style={styles.dot} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Success step
  if (step === "success") {
    return (
      <SafeAreaView style={[styles.container, styles.darkContainer]}>
        <View style={styles.centerContent}>
          <View style={[styles.successIcon, { backgroundColor: theme.success, shadowColor: theme.success }]}>
            <Ionicons name="checkmark" size={56} color="white" />
          </View>
          <Text style={styles.successTitleLight}>Welcome Back! 🎉</Text>
          {matchedUser && (
            <View style={styles.matchedUserCard}>
              <View style={styles.matchedUserAvatar}>
                <Ionicons name="person" size={24} color={theme.primary} />
              </View>
              <View>
                <Text style={styles.matchedUserName}>{matchedUser.name}</Text>
                <Text style={styles.matchedUserIsic}>{matchedUser.isic_number}</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              </View>
            </View>
          )}
          <Text style={styles.successDescriptionLight}>
            Face verified successfully
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error step
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.cardBg }]}>
          <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: theme.border }]}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Verification Failed</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.centerContent}>
          <View style={[styles.errorIcon, { backgroundColor: theme.error, shadowColor: theme.error }]}>
            <Ionicons name="alert" size={56} color="white" />
          </View>
          <Text style={[styles.errorTitle, { color: theme.text }]}>Face Not Recognized 😔</Text>
          <Text style={[styles.errorDescription, { color: theme.textSecondary }]}>{errorMessage}</Text>

          <View style={[styles.errorHints, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.hintItem}>
            <View style={[styles.hintIcon, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="sunny-outline" size={18} color="#FF9800" />
            </View>
            <Text style={styles.hintText}>Try better lighting</Text>
          </View>
          <View style={styles.hintItem}>
            <View style={[styles.hintIcon, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="eye-outline" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.hintText, { color: theme.text }]}>Look directly at camera</Text>
          </View>
          <View style={styles.hintItem}>
            <View style={[styles.hintIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="person-outline" size={18} color={theme.success} />
            </View>
            <Text style={[styles.hintText, { color: theme.text }]}>Make sure face is enrolled</Text>
          </View>
        </View>

        <View style={styles.errorActions}>
          <TouchableOpacity 
            style={[styles.primaryButton, { shadowColor: theme.primary }]} 
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
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.outlineButton, { borderColor: theme.primary }]} 
            onPress={handleUseISIC}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={20} color={theme.primary} />
            <Text style={[styles.outlineButtonText, { color: theme.primary }]}>Login with ISIC</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkContainer: {
    backgroundColor: "#1A1A2E",
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
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  
  // Permission styles
  permissionIcon: {
    width: 110,
    height: 110,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },
  permissionDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  
  primaryButton: {
    width: "100%",
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
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  outlineButton: {
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },
  outlineButtonText: {
    fontSize: 17,
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
  cameraCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  cameraTitle: {
    fontSize: 16,
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
  faceGuideHint: {
    marginTop: 20,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
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
    justifyContent: "center",
    alignItems: "center",
  },
  isicLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  isicLinkText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  cameraReadyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  cameraReadyText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "500",
  },
  
  // Processing
  processingIcon: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "rgba(233,30,99,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  processingTextLight: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  processingSubtextLight: {
    marginTop: 8,
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
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
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  
  // Success styles
  successIcon: {
    width: 110,
    height: 110,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  successTitleLight: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    marginBottom: 20,
  },
  matchedUserCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 18,
    gap: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  matchedUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  matchedUserName: {
    fontSize: 17,
    fontWeight: "700",
    color: "white",
  },
  matchedUserIsic: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  verifiedBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(16,185,129,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  successDescriptionLight: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
  },
  
  // Error styles
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
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
  },
  errorDescription: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  errorHints: {
    width: "100%",
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
    gap: 14,
    borderWidth: 1,
  },
  hintItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  hintIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  hintText: {
    fontSize: 15,
    fontWeight: "500",
  },
  errorActions: {
    width: "100%",
    gap: 14,
  },
});
