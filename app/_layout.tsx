// app/_layout.tsx - Root Layout with Dynamic Theme
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SmartKitchenProvider,
  useSmartKitchen,
} from "./context/SmartKitchenContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

function AppContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSmartKitchen();
  const { theme } = useTheme();

  // Routes where bottom bar should be hidden
  const hideBar =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/face/enroll") ||
    pathname.startsWith("/face/verify") ||
    pathname === "/";

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const publicRoutes = ["/login", "/register", "/face/verify", "/"];
      const isPublicRoute = publicRoutes.some(
        (route) =>
          pathname === route ||
          pathname.startsWith("/login") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/face/verify")
      );

      if (!isPublicRoute) {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isLoading, pathname]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.loadingIcon, { backgroundColor: theme.primaryLight }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  const tabInactive = theme.isDark ? "#6B7280" : "#9CA3AF";

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login/index" />
        <Stack.Screen name="register/index" />
        <Stack.Screen name="home/index" />
        <Stack.Screen name="kitchen/index" />
        <Stack.Screen name="book/index" />
        <Stack.Screen name="face/index" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen
          name="face/enroll"
          options={{ presentation: "fullScreenModal" }}
        />
        <Stack.Screen
          name="face/verify"
          options={{ presentation: "fullScreenModal" }}
        />
      </Stack>

      {!hideBar && isAuthenticated && (
        <View style={[
          styles.tabBar, 
          { 
            backgroundColor: theme.cardBg, 
            borderColor: theme.border,
            shadowColor: theme.primary,
          }
        ]}>
          <Link href="/home" asChild>
            <TouchableOpacity style={styles.tabItem}>
              <View style={[
                styles.tabIconBg,
                pathname === "/home" && { backgroundColor: theme.primaryLight }
              ]}>
              <Ionicons
                name={pathname === "/home" ? "home" : "home-outline"}
                  size={22}
                  color={pathname === "/home" ? theme.primary : tabInactive}
                />
              </View>
              <Text style={[
                styles.tabLabel,
                { color: pathname === "/home" ? theme.primary : tabInactive },
                pathname === "/home" && styles.tabLabelActive,
              ]}>
                Home
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/kitchen" asChild>
            <TouchableOpacity style={styles.tabItem}>
              <View style={[
                styles.tabIconBg,
                pathname === "/kitchen" && { backgroundColor: theme.primaryLight }
              ]}>
                <Ionicons
                  name={pathname === "/kitchen" ? "restaurant" : "restaurant-outline"}
                  size={22}
                  color={pathname === "/kitchen" ? theme.primary : tabInactive}
                />
              </View>
              <Text style={[
                styles.tabLabel,
                { color: pathname === "/kitchen" ? theme.primary : tabInactive },
                pathname === "/kitchen" && styles.tabLabelActive,
              ]}>
                Kitchens
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/book" asChild>
            <TouchableOpacity style={styles.tabItem}>
              <View style={[
                styles.tabIconBg,
                pathname === "/book" && { backgroundColor: theme.primaryLight }
              ]}>
              <Ionicons
                name={pathname === "/book" ? "calendar" : "calendar-outline"}
                  size={22}
                  color={pathname === "/book" ? theme.primary : tabInactive}
              />
              </View>
              <Text style={[
                styles.tabLabel,
                { color: pathname === "/book" ? theme.primary : tabInactive },
                pathname === "/book" && styles.tabLabelActive,
              ]}>
                Book
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/settings" asChild>
            <TouchableOpacity style={styles.tabItem}>
              <View style={[
                styles.tabIconBg,
                pathname === "/settings" && { backgroundColor: theme.primaryLight }
              ]}>
              <Ionicons
                  name={pathname === "/settings" ? "settings" : "settings-outline"}
                  size={22}
                  color={pathname === "/settings" ? theme.primary : tabInactive}
              />
              </View>
              <Text style={[
                styles.tabLabel,
                { color: pathname === "/settings" ? theme.primary : tabInactive },
                pathname === "/settings" && styles.tabLabelActive,
              ]}>
                Settings
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}
    </>
  );
}

function AppWithTheme() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SmartKitchenProvider>
      <AppWithTheme />
    </SmartKitchenProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
    paddingBottom: 28,
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tabItem: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
  },
  tabIconBg: {
    width: 44,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  tabLabelActive: {
    fontWeight: "600",
  },
});
