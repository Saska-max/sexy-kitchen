// app/settings/index.tsx - Settings Screen with Theme Options
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSmartKitchen } from "../context/SmartKitchenContext";
import { COLOR_PALETTES, PaletteKey, useTheme } from "../context/ThemeContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useSmartKitchen();
  const { palette, isDarkMode, theme, setPalette, toggleDarkMode } = useTheme();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const palettes = Object.entries(COLOR_PALETTES) as [PaletteKey, typeof COLOR_PALETTES.pink][];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>Settings ⚙️</Text>

        {/* Profile Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={[theme.gradient1, theme.gradient2]}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarEmoji}>👤</Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]}>
                {user?.name || "User"}
              </Text>
              <Text style={[styles.profileIsic, { color: theme.textSecondary }]}>
                {user?.isic || "No ISIC"}
              </Text>
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
        
        {/* Dark Mode Toggle */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" }]}>
                <Ionicons 
                  name={isDarkMode ? "moon" : "sunny"} 
                  size={22} 
                  color={isDarkMode ? "#FCD34D" : "#F59E0B"} 
                />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  {isDarkMode ? "On" : "Off"}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#E5E7EB", true: theme.primaryLight }}
              thumbColor={isDarkMode ? theme.primary : "#F9FAFB"}
            />
          </View>
        </View>

        {/* Color Palette */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Color Theme</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.paletteGrid}>
            {palettes.map(([key, colors]) => {
              const isSelected = palette === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.paletteOption,
                    { borderColor: isSelected ? colors.primary : theme.border },
                    isSelected && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => setPalette(key)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.gradient1, colors.gradient2]}
                    style={styles.palettePreview}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.paletteEmoji}>{colors.emoji}</Text>
                  </LinearGradient>
                  <Text style={[
                    styles.paletteName, 
                    { color: isSelected ? colors.primary : theme.text }
                  ]}>
                    {colors.name}
                  </Text>
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Preview */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Preview</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.previewRow}>
            <View style={[styles.previewButton, { backgroundColor: theme.primary }]}>
              <Text style={styles.previewButtonText}>Primary Button</Text>
            </View>
            <View style={[styles.previewButton, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.previewButtonText, { color: theme.primary }]}>Secondary</Text>
            </View>
          </View>
          <View style={[styles.previewCard, { backgroundColor: theme.background }]}>
            <View style={[styles.previewDot, { backgroundColor: theme.primary }]} />
            <View>
              <Text style={[styles.previewTitle, { color: theme.text }]}>Sample Card</Text>
              <Text style={[styles.previewSubtitle, { color: theme.textSecondary }]}>
                This is how your app will look
              </Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.settingIcon, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="information-circle-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.menuItemText, { color: theme.text }]}>App Version</Text>
            <Text style={[styles.menuItemValue, { color: theme.textSecondary }]}>1.0.0</Text>
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.settingIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="help-circle-outline" size={22} color="#4CAF50" />
            </View>
            <Text style={[styles.menuItemText, { color: theme.text }]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { 
            backgroundColor: theme.isDark ? theme.cardBg : theme.primaryLight,
            borderColor: theme.border,
          }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.primary} />
          <Text style={[styles.logoutText, { color: theme.primary }]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          Sexy Kitchen • Jedlíková 9
        </Text>
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
    marginBottom: 20,
  },

  // Profile Card
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: {
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
  },
  profileIsic: {
    fontSize: 14,
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
  },

  // Setting Row
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },

  // Palette Grid
  paletteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  paletteOption: {
    width: "30%",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    position: "relative",
  },
  palettePreview: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  paletteEmoji: {
    fontSize: 24,
  },
  paletteName: {
    fontSize: 13,
    fontWeight: "600",
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  // Preview
  previewRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  previewButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  previewDot: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  previewSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // Menu Items
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  menuItemValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 2,
    gap: 10,
    marginTop: 8,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Footer
  footerText: {
    textAlign: "center",
    fontSize: 13,
    marginTop: 24,
  },
});

