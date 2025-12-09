// app/components/TimePicker.tsx - Time Picker with Custom Time Option
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

interface TimePickerProps {
  value: string; // Format: "HH:MM"
  onChange: (time: string) => void;
  minTime?: string; // Format: "HH:MM"
  maxTime?: string; // Format: "HH:MM"
  stepMinutes?: number; // Step in minutes (default: 15)
}

export default function TimePicker({
  value,
  onChange,
  minTime = "06:00",
  maxTime = "23:00",
  stepMinutes = 15,
}: TimePickerProps) {
  const { theme } = useTheme();
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customHour, setCustomHour] = useState("12");
  const [customMinute, setCustomMinute] = useState("00");

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const minHour = parseInt(minTime.split(":")[0]);
    const minMin = parseInt(minTime.split(":")[1]);
    const maxHour = parseInt(maxTime.split(":")[0]);
    const maxMin = parseInt(maxTime.split(":")[1]);

    let currentHour = minHour;
    let currentMin = minMin;

    while (
      currentHour < maxHour ||
      (currentHour === maxHour && currentMin <= maxMin)
    ) {
      const hourStr = currentHour.toString().padStart(2, "0");
      const minStr = currentMin.toString().padStart(2, "0");
      slots.push(`${hourStr}:${minStr}`);

      currentMin += stepMinutes;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    return slots;
  }, [minTime, maxTime, stepMinutes]);

  // Parse initial value only when value changes externally (not from our own input)
  useEffect(() => {
    if (!value && timeSlots.length > 0 && !isCustomMode) {
      onChange(timeSlots[0]);
    }
  }, [timeSlots]);

  // Sync value to custom inputs when value changes externally
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      if (h && m) {
        // Only update if different to avoid conflicts while typing
        if (customHour !== h || customMinute !== m) {
          setCustomHour(h);
          setCustomMinute(m);
        }
      }
    }
  }, [value]);

  // Check if current value is in slots
  useEffect(() => {
    if (value && !timeSlots.includes(value)) {
      setIsCustomMode(true);
    }
  }, [value, timeSlots]);

  const handleHourChange = (text: string) => {
    // Remove non-numeric characters
    let h = text.replace(/[^0-9]/g, "").slice(0, 2);
    
    // Update state immediately
    setCustomHour(h);
    
    // Update onChange if we have valid hour and minute
    if (h !== "" && customMinute !== "") {
      const hNum = parseInt(h);
      const mNum = parseInt(customMinute);
      
      if (!isNaN(hNum) && hNum >= 0 && hNum <= 23 && 
          !isNaN(mNum) && mNum >= 0 && mNum <= 59) {
        const hPadded = h.padStart(2, "0");
        const mPadded = customMinute.padStart(2, "0");
        onChange(`${hPadded}:${mPadded}`);
      }
    } else if (h === "" && customMinute !== "") {
      // If hour is cleared, don't update
      return;
    }
  };

  const handleMinuteChange = (text: string) => {
    // Remove non-numeric characters
    let m = text.replace(/[^0-9]/g, "").slice(0, 2);
    
    // Update state immediately
    setCustomMinute(m);
    
    // Update onChange if we have valid hour and minute
    if (customHour !== "" && m !== "") {
      const hNum = parseInt(customHour);
      const mNum = parseInt(m);
      
      if (!isNaN(hNum) && hNum >= 0 && hNum <= 23 && 
          !isNaN(mNum) && mNum >= 0 && mNum <= 59) {
        const hPadded = customHour.padStart(2, "0");
        const mPadded = m.padStart(2, "0");
        onChange(`${hPadded}:${mPadded}`);
      }
    } else if (customHour !== "" && m === "") {
      // If minute is cleared, don't update
      return;
    }
  };

  const isSelected = (slot: string) => slot === value;

  return (
    <View style={styles.container}>
      {/* Toggle Button */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            !isCustomMode
              ? { backgroundColor: theme.primary, borderColor: theme.primary }
              : { backgroundColor: theme.inputBg, borderColor: theme.border },
          ]}
          onPress={() => setIsCustomMode(false)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="flash-outline"
            size={16}
            color={!isCustomMode ? "white" : theme.textSecondary}
          />
          <Text
            style={[
              styles.toggleText,
              { color: !isCustomMode ? "white" : theme.textSecondary },
            ]}
          >
            Quick
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isCustomMode
              ? { backgroundColor: theme.primary, borderColor: theme.primary }
              : { backgroundColor: theme.inputBg, borderColor: theme.border },
          ]}
          onPress={() => setIsCustomMode(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={isCustomMode ? "white" : theme.textSecondary}
          />
          <Text
            style={[
              styles.toggleText,
              { color: isCustomMode ? "white" : theme.textSecondary },
            ]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {!isCustomMode ? (
        // Quick Select Mode
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {timeSlots.map((slot) => {
            const selected = isSelected(slot);
            return (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.timeSlot,
                  selected
                    ? { backgroundColor: theme.primary, borderColor: theme.primary }
                    : { backgroundColor: theme.inputBg, borderColor: theme.border },
                ]}
                onPress={() => onChange(slot)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    { color: selected ? "white" : theme.text },
                  ]}
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        // Custom Time Mode
        <View style={[styles.customTimeContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <View style={styles.customTimeRow}>
            <View style={styles.customTimeInputGroup}>
              <Text style={[styles.customTimeLabel, { color: theme.textSecondary }]}>Hour</Text>
              <TextInput
                style={[
                  styles.customTimeInput,
                  { backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text },
                ]}
                value={customHour}
                onChangeText={handleHourChange}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="12"
                placeholderTextColor={theme.textSecondary}
                selectTextOnFocus={true}
              />
            </View>
            <View style={styles.separator}>
              <Text style={[styles.separatorText, { color: theme.text }]}>:</Text>
            </View>
            <View style={styles.customTimeInputGroup}>
              <Text style={[styles.customTimeLabel, { color: theme.textSecondary }]}>Minute</Text>
              <TextInput
                style={[
                  styles.customTimeInput,
                  { backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text },
                ]}
                value={customMinute}
                onChangeText={handleMinuteChange}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="00"
                placeholderTextColor={theme.textSecondary}
                selectTextOnFocus={true}
              />
            </View>
          </View>
          <View style={[styles.selectedTimeDisplay, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="time-outline" size={16} color={theme.primary} />
            <Text style={[styles.selectedTimeText, { color: theme.primary }]}>
              {customHour || "00"}:{customMinute || "00"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  toggleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scrollView: {
    maxHeight: 60,
  },
  scrollContent: {
    paddingVertical: 8,
    gap: 10,
    paddingHorizontal: 4,
  },
  timeSlot: {
    minWidth: 70,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    marginRight: 8,
  },
  timeSlotText: {
    fontSize: 15,
    fontWeight: "700",
  },
  customTimeContainer: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  customTimeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  customTimeInputGroup: {
    flex: 1,
  },
  customTimeLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  customTimeInput: {
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    paddingHorizontal: 12,
  },
  separator: {
    paddingBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  separatorText: {
    fontSize: 28,
    fontWeight: "700",
  },
  selectedTimeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  selectedTimeText: {
    fontSize: 18,
    fontWeight: "800",
  },
});
