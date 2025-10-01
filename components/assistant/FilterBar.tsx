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
  { key: 'all', label: 'All' },
  { key: 'medicine', label: 'Medicine' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'assistance', label: 'Assistance' },
  { key: 'custom', label: 'Custom' },
];

export default function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

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
            activeFilter === filter.key && [
              styles.filterButtonActive,
              { backgroundColor: isDark ? "#2D89FF" : "#007AFF" }
            ]
          ]}
          onPress={() => onFilterChange(filter.key)}
        >
          <Text style={[
            styles.filterText,
            activeFilter === filter.key ? styles.filterTextActive : {}
          ]}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: isDark ? "#1C1C1E" : "white",
      borderWidth: 1,
      borderColor: isDark ? "#38383A" : "#e5e5e5",
    },
    filterButtonActive: {
      borderColor: 'transparent',
    },
    filterText: {
      fontSize: 14,
      fontWeight: "500",
      color: isDark ? "#8E8E93" : "#666",
    },
    filterTextActive: {
      color: "white",
    },
  });