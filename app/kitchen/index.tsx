// app/kitchen/index.tsx - Kitchen Selection with Horizontal Scrolling
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSmartKitchen } from "../context/SmartKitchenContext";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 80; // Card width with margins
const CARD_SPACING = 20;

const APPLIANCE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  microwave: "radio-outline",
  oven: "flame-outline",
  stove_left: "bonfire-outline",
  stove_right: "bonfire-outline",
};

const APPLIANCE_COLORS: Record<string, string> = {
  microwave: "#9C27B0",
  oven: "#FF5722",
  stove_left: "#FF9800",
  stove_right: "#FF9800",
};

// Mock kitchens data (7 floors, one kitchen per floor)
const MOCK_KITCHENS = [
  { id: 1, kitchen_number: 1, floor: 1, name: "Kitchen Floor 1", appliance_counts: { microwave: 2, oven: 1, stove_left: 1, stove_right: 1 } },
  { id: 2, kitchen_number: 1, floor: 2, name: "Kitchen Floor 2", appliance_counts: { microwave: 2, oven: 1, stove_left: 1, stove_right: 1 } },
  { id: 3, kitchen_number: 1, floor: 3, name: "Kitchen Floor 3", appliance_counts: { microwave: 1, oven: 1, stove_left: 1, stove_right: 1 } },
  { id: 4, kitchen_number: 1, floor: 4, name: "Kitchen Floor 4", appliance_counts: { microwave: 2, oven: 1, stove_left: 1, stove_right: 1 } },
  { id: 5, kitchen_number: 1, floor: 5, name: "Kitchen Floor 5", appliance_counts: { microwave: 1, oven: 1, stove_left: 1, stove_right: 1 } },
  { id: 6, kitchen_number: 1, floor: 6, name: "Kitchen Floor 6", appliance_counts: { microwave: 2, oven: 1, stove_left: 1, stove_right: 1 } },
  { id: 7, kitchen_number: 1, floor: 7, name: "Kitchen Floor 7", appliance_counts: { microwave: 2, oven: 1, stove_left: 1, stove_right: 1 } },
];

export default function KitchenSelectScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    kitchens,
    kitchensLoading,
    fetchKitchens,
    selectKitchen,
    selectedKitchen,
  } = useSmartKitchen();

  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Use mock kitchens if no kitchens are loaded (for UI testing without backend)
  const availableKitchens = kitchens.length > 0 ? kitchens : MOCK_KITCHENS;

  // Sort kitchens by floor
  const sortedKitchens = useMemo(() => {
    return [...availableKitchens].sort((a, b) => a.floor - b.floor);
  }, [availableKitchens]);

  useEffect(() => {
    if (selectedKitchen) {
      const index = sortedKitchens.findIndex(k => k.id === selectedKitchen.id);
      if (index !== -1) {
        setCurrentIndex(index);
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: true });
        }, 100);
      }
    }
  }, [selectedKitchen, sortedKitchens]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchKitchens();
    setRefreshing(false);
  }, [fetchKitchens]);

  const handleSelectKitchen = (kitchen: typeof kitchens[0]) => {
    selectKitchen(kitchen);
    router.push("/book");
  };

  const getTotalAppliances = (counts: any) => {
    if (!counts) return 0;
    return counts.microwave + counts.oven + counts.stove_left + counts.stove_right;
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderKitchenCard = ({ item: kitchen, index }: { item: typeof kitchens[0], index: number }) => {
    const isCurrentlySelected = selectedKitchen?.id === kitchen.id;
    
    return (
      <View
        style={[
          styles.kitchenCard,
          { 
            width: CARD_WIDTH,
            backgroundColor: theme.cardBg, 
            borderColor: theme.border,
            shadowColor: theme.primary,
          },
          isCurrentlySelected && { 
            borderColor: theme.primary, 
            backgroundColor: theme.primaryLight,
            borderWidth: 2,
          },
        ]}
      >
        {isCurrentlySelected && (
          <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
            <Ionicons name="checkmark-circle" size={16} color="white" />
            <Text style={styles.selectedBadgeText}>Current</Text>
          </View>
        )}
        
        {/* Floor Badge */}
        <View style={[styles.floorBadge, { backgroundColor: theme.primary }]}>
          <Text style={styles.floorBadgeText}>Floor {kitchen.floor}</Text>
        </View>

        {/* Kitchen Icon */}
        <View style={styles.kitchenIconWrapper}>
          <LinearGradient
            colors={[theme.gradient1, theme.gradient2]}
            style={styles.kitchenIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.kitchenEmoji}>🍳</Text>
          </LinearGradient>
        </View>

        {/* Kitchen Info */}
        <View style={styles.kitchenContent}>
          <Text style={[styles.kitchenName, { color: theme.text }]}>
            {kitchen.name}
          </Text>
          
          <View style={styles.applianceStats}>
            <View style={styles.statItem}>
              <Ionicons name="apps-outline" size={18} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {getTotalAppliances(kitchen.appliance_counts)} appliances
              </Text>
            </View>
          </View>

          {/* Appliance Chips */}
          {kitchen.appliance_counts && (
            <View style={styles.applianceRow}>
              {kitchen.appliance_counts.microwave > 0 && (
                <View style={[styles.applianceChip, { backgroundColor: "#F3E5F5" }]}>
                  <Ionicons
                    name={APPLIANCE_ICONS.microwave}
                    size={16}
                    color={APPLIANCE_COLORS.microwave}
                  />
                  <Text style={[styles.applianceChipText, { color: APPLIANCE_COLORS.microwave }]}>
                    {kitchen.appliance_counts.microwave}x Microwave
                  </Text>
                </View>
              )}
              {kitchen.appliance_counts.oven > 0 && (
                <View style={[styles.applianceChip, { backgroundColor: "#FBE9E7" }]}>
                  <Ionicons
                    name={APPLIANCE_ICONS.oven}
                    size={16}
                    color={APPLIANCE_COLORS.oven}
                  />
                  <Text style={[styles.applianceChipText, { color: APPLIANCE_COLORS.oven }]}>
                    {kitchen.appliance_counts.oven}x Oven
                  </Text>
                </View>
              )}
              {(kitchen.appliance_counts.stove_left > 0 ||
                kitchen.appliance_counts.stove_right > 0) && (
                <View style={[styles.applianceChip, { backgroundColor: "#FFF3E0" }]}>
                  <Ionicons
                    name={APPLIANCE_ICONS.stove_left}
                    size={16}
                    color={APPLIANCE_COLORS.stove_left}
                  />
                  <Text style={[styles.applianceChipText, { color: APPLIANCE_COLORS.stove_left }]}>
                    {kitchen.appliance_counts.stove_left + kitchen.appliance_counts.stove_right}x Stove
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Select Button */}
          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: theme.primary }]}
            onPress={() => handleSelectKitchen(kitchen)}
            activeOpacity={0.8}
          >
            <Text style={styles.selectButtonText}>Select Kitchen</Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Kitchens 🍴</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Jedlíková 9, Košice</Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="location" size={14} color={theme.primary} />
          <Text style={[styles.headerBadgeText, { color: theme.primary }]}>
            {sortedKitchens.length} kitchens
          </Text>
        </View>
      </View>

      {/* Floor Indicator */}
      {sortedKitchens.length > 0 && (
        <View style={styles.floorIndicator}>
          <Text style={[styles.floorIndicatorText, { color: theme.textSecondary }]}>
            Floor {sortedKitchens[currentIndex]?.floor || 1} of 7
          </Text>
          <View style={styles.dotsContainer}>
            {sortedKitchens.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: index === currentIndex ? theme.primary : theme.border },
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {kitchensLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingIcon, { backgroundColor: theme.primaryLight }]}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Finding kitchens...</Text>
        </View>
      ) : sortedKitchens.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="restaurant-outline" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.emptyText, { color: theme.text }]}>No kitchens available</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={sortedKitchens}
          renderItem={renderKitchenCard}
          keyExtractor={(item) => item.id.toString()}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.listContent}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          scrollEnabled={true}
          directionalLockEnabled={true}
          alwaysBounceHorizontal={false}
          alwaysBounceVertical={false}
          bounces={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          getItemLayout={(_, index) => ({
            length: CARD_WIDTH + CARD_SPACING,
            offset: (CARD_WIDTH + CARD_SPACING) * index,
            index,
          })}
          disableIntervalMomentum={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  
  floorIndicator: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
  },
  floorIndicatorText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
  
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
  },
  
  listContent: {
    paddingHorizontal: 30,
    paddingBottom: 120,
  },
  
  kitchenCard: {
    borderRadius: 28,
    padding: 24,
    marginRight: CARD_SPACING,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    position: "relative",
    overflow: "hidden",
  },
  selectedBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 16,
    gap: 4,
    zIndex: 10,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
  },
  floorBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  floorBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
  },
  kitchenIconWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  kitchenIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  kitchenEmoji: {
    fontSize: 48,
  },
  kitchenContent: {
    alignItems: "center",
  },
  kitchenName: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
  },
  applianceStats: {
    marginBottom: 20,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  applianceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
    justifyContent: "center",
  },
  applianceChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 8,
  },
  applianceChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    gap: 8,
    width: "100%",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  selectButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
});
