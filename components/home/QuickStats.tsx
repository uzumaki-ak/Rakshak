import { HomeStats } from "@/types/home";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

interface QuickStatsProps {
  stats: HomeStats;
}

export default function QuickStats({ stats }: QuickStatsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const statItems = [
    {
      key: "total",
      label: "Total Medicines",
      value: stats.totalMedicines,
      icon: "medical" as const,
      color: isDark ? "#5FD0D8" : "#007AFF",
    },
    {
      key: "expiring",
      label: "Expiring Soon",
      value: stats.expiringSoon,
      icon: "time" as const,
      color: isDark ? "#FFB86B" : "#FF9500",
    },
    {
      key: "expired",
      label: "Expired",
      value: stats.expired,
      icon: "warning" as const,
      color: isDark ? "#FF6B6B" : "#FF3B30",
    },
    {
      key: "reminders",
      label: "Active Reminders",
      value: stats.activeReminders,
      icon: "notifications" as const,
      color: isDark ? "#BA8AFF" : "#5856D6",
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Stats</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {statItems.map((item) => (
          <View
            key={item.key}
            style={[
              styles.statCard,
              { backgroundColor: isDark ? "#1C1C1E" : "white" },
            ]}
          >
            <View
              style={[styles.iconContainer, { backgroundColor: item.color }]}
            >
              <Ionicons name={item.icon} size={20} color="white" />
            </View>

            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    scrollContent: {
      paddingHorizontal: 4,
    },
    statCard: {
      width: 140,
      padding: 16,
      borderRadius: 12,
      marginRight: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? "#8E8E93" : "#666",
    },
  });
