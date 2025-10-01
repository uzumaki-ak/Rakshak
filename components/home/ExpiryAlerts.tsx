import { ExpiryAlert } from "@/types/home";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface ExpiryAlertsProps {
  alerts: ExpiryAlert[];
  onAlertPress: (medicineId: string) => void;
}

export default function ExpiryAlerts({
  alerts,
  onAlertPress,
}: ExpiryAlertsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const getAlertConfig = (severity: ExpiryAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          icon: "warning" as const,
          color: isDark ? "#FF6B6B" : "#FF3B30",
          bgColor: isDark
            ? "rgba(255, 107, 107, 0.1)"
            : "rgba(255, 59, 48, 0.1)",
          label: "Expired",
        };
      case "warning":
        return {
          icon: "time" as const,
          color: isDark ? "#FFB86B" : "#FF9500",
          bgColor: isDark
            ? "rgba(255, 184, 107, 0.1)"
            : "rgba(255, 149, 0, 0.1)",
          label: "Expiring Soon",
        };
      default:
        return {
          icon: "information" as const,
          color: isDark ? "#5FD0D8" : "#007AFF",
          bgColor: isDark
            ? "rgba(95, 208, 216, 0.1)"
            : "rgba(0, 122, 255, 0.1)",
          label: "Expiring",
        };
    }
  };

  const formatDaysText = (days: number) => {
    if (days < 0) return "Expired";
    if (days === 0) return "Today";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expiry Alerts</Text>
        <Text style={styles.alertCount}>{alerts.length} alert(s)</Text>
      </View>

      {alerts.map((alert) => {
        const config = getAlertConfig(alert.severity);
        return (
          <TouchableOpacity
            key={alert.id}
            style={[styles.alertCard, { backgroundColor: config.bgColor }]}
            onPress={() => onAlertPress(alert.id)}
          >
            <View style={styles.alertIcon}>
              <Ionicons name={config.icon} size={20} color={config.color} />
            </View>

            <View style={styles.alertContent}>
              <Text style={styles.medicineName}>{alert.medicineName}</Text>
              <Text style={[styles.alertText, { color: config.color }]}>
                {config.label} • {formatDaysText(alert.daysUntilExpiry)}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={16}
              color={isDark ? "#8E8E93" : "#666"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
    },
    alertCount: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#666",
    },
    alertCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    alertIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    alertContent: {
      flex: 1,
    },
    medicineName: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 2,
    },
    alertText: {
      fontSize: 14,
      fontWeight: "500",
    },
  });
