import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: any) => void;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "chat", label: "Chats" },
  { key: "scan", label: "Scans" },
  { key: "medicine", label: "Medicines" },
  { key: "reminder", label: "Reminders" },
  { key: "report", label: "Reports" },
];

export default function FilterBar({
  activeFilter,
  onFilterChange,
}: FilterBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            {
              backgroundColor: isDark ? "#1C1C1E" : "white",
              borderColor: isDark ? "#38383A" : "#e5e5e5",
            },
            activeFilter === filter.key && {
              backgroundColor: isDark ? "#2D89FF" : "#007AFF",
              borderColor: "transparent",
            },
          ]}
          onPress={() => onFilterChange(filter.key)}
        >
          <Text
            style={[
              styles.filterText,
              { color: isDark ? "#8E8E93" : "#666" },
              activeFilter === filter.key && { color: "white" },
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
