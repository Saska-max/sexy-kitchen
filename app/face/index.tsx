// app/face/index.tsx - Face ID Management Screen with Dynamic Theme
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { useSmartKitchen } from "../context/SmartKitchenContext";
import { useTheme } from "../context/ThemeContext";

export default function FaceScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isFaceEnrolled, setFaceEnrolled, user } = useSmartKitchen();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleEnroll = () => {
    router.push("/face/enroll");
  };

  const handleRemoveFaceID = () => {
    Alert.alert(
      "Remove Face ID",
      "Are you sure you want to remove your Face ID enrollment? You'll need to re-enroll to use Face ID login.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setIsRemoving(true);
            setTimeout(() => {
              setFaceEnrolled(false);
              setIsRemoving(false);
            }, 500);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.text }]}>Face ID Access 🔐</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Use Face ID for quick and secure kitchen access
        </Text>

        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.statusIconContainer,
                { backgroundColor: theme.border },
                isFaceEnrolled && { backgroundColor: "#D1FAE5" },
              ]}
            >
              <Ionicons
                name={isFaceEnrolled ? "shield-checkmark" : "shield-outline"}
                size={28}
                color={isFaceEnrolled ? theme.success : theme.textSecondary}
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Status</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: theme.text },
                  isFaceEnrolled && { color: theme.success },
                ]}
              >
                {isFaceEnrolled ? "Enrolled ✓" : "Not Enrolled"}
              </Text>
            </View>
          </View>

          {/* ISIC Link Info */}
          <View style={[styles.isicInfo, { backgroundColor: theme.primaryLight, borderColor: theme.primary + "40" }]}>
            <Ionicons name="link" size={16} color={theme.primary} />
            <Text style={[styles.isicInfoText, { color: theme.text }]}>
              {isFaceEnrolled
                ? `Linked to ISIC: ${user?.isic}`
                : "Face ID will be linked to your ISIC account"}
            </Text>
          </View>

          {/* Face Area */}
          <View style={[styles.faceArea, { borderColor: theme.border, backgroundColor: theme.background }]}>
            {isRemoving ? (
              <>
                <ActivityIndicator size="large" color={theme.error} />
                <Text style={[styles.faceAreaText, { color: theme.text }]}>Removing...</Text>
              </>
            ) : isFaceEnrolled ? (
              <>
                <View style={[styles.enrolledIcon, { backgroundColor: theme.success, shadowColor: theme.success }]}>
                  <Ionicons name="checkmark" size={40} color="white" />
                </View>
                <Text style={[styles.faceAreaTextSuccess, { color: theme.success }]}>Face ID Ready</Text>
                <Text style={[styles.faceAreaSubtext, { color: theme.textSecondary }]}>
                  You can use Face ID to login
                </Text>
              </>
            ) : (
              <>
                <View style={[styles.notEnrolledIcon, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="person-outline" size={40} color={theme.primary} />
                </View>
                <Text style={[styles.faceAreaText, { color: theme.text }]}>No Face Enrolled</Text>
                <Text style={[styles.faceAreaSubtext, { color: theme.textSecondary }]}>
                  Tap below to set up Face ID
                </Text>
              </>
            )}
          </View>

          {/* Buttons */}
          {isFaceEnrolled ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.reEnrollButton, { backgroundColor: theme.primaryLight, borderColor: theme.primary + "40" }]}
                onPress={handleEnroll}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={18} color={theme.primary} />
                <Text style={[styles.reEnrollText, { color: theme.primary }]}>Re-enroll</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.removeButton, { borderColor: "#FCA5A5" }]}
                onPress={handleRemoveFaceID}
                disabled={isRemoving}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={18} color={theme.error} />
                <Text style={[styles.removeText, { color: theme.error }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.enrollButton, { shadowColor: theme.primary }]}
              onPress={handleEnroll}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.gradient1, theme.gradient2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.enrollButtonGradient}
              >
                <Ionicons name="camera-outline" size={22} color="white" />
                <Text style={styles.enrollButtonText}>Enroll Face ID</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Benefits Section */}
        <View style={[styles.benefitsCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.benefitsTitle, { color: theme.text }]}>Why Use Face ID? ✨</Text>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="flash-outline" size={20} color={theme.primary} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={[styles.benefitLabel, { color: theme.text }]}>Quick Access</Text>
              <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                Unlock the kitchen in seconds
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.success} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={[styles.benefitLabel, { color: theme.text }]}>Secure</Text>
              <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                Biometric authentication linked to your ISIC
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="hand-left-outline" size={20} color="#F59E0B" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={[styles.benefitLabel, { color: theme.text }]}>Contactless</Text>
              <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                No need to carry your ISIC card
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Note */}
        <View style={styles.footerContainer}>
          <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.footerNote, { color: theme.textSecondary }]}>
            You can still use your ISIC card if Face ID is unavailable.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
  },

  // Status Card
  statusCard: {
    borderRadius: 26,
    padding: 22,
    marginBottom: 16,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 14,
  },
  statusIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  statusValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },

  // ISIC Info
  isicInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 22,
    gap: 10,
    borderWidth: 1,
  },
  isicInfoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },

  // Face Area
  faceArea: {
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: "dashed",
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  enrolledIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  notEnrolledIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  faceAreaText: {
    fontSize: 17,
    fontWeight: "600",
  },
  faceAreaTextSuccess: {
    fontSize: 18,
    fontWeight: "700",
  },
  faceAreaSubtext: {
    fontSize: 14,
    marginTop: 6,
  },

  // Buttons
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
  },
  enrollButton: {
    borderRadius: 18,
    overflow: "hidden",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  enrollButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  enrollButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
  reEnrollButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  reEnrollText: {
    fontSize: 15,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  removeText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // Benefits Card
  benefitsCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 18,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 14,
  },
  benefitIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  benefitContent: {
    flex: 1,
  },
  benefitLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  benefitDesc: {
    fontSize: 13,
    marginTop: 2,
  },

  // Footer
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 20,
  },
  footerNote: {
    fontSize: 13,
    textAlign: "center",
  },
});
