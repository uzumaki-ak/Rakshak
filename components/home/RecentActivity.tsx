import { RecentActivity as RecentActivityType } from "@/types/home";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";

interface RecentActivityProps {
  activities: RecentActivityType[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "scan":
        return "scan" as const;
      case "medicine_added":
        return "medical" as const;
      case "reminder_set":
        return "notifications" as const;
      case "chat_started":
        return "chatbubble" as const;
      case "report_uploaded":
        return "document" as const;
      default:
        return "time" as const;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "scan":
        return isDark ? "#5FD0D8" : "#007AFF";
      case "medicine_added":
        return isDark ? "#34C759" : "#32D74B";
      case "reminder_set":
        return isDark ? "#BA8AFF" : "#5856D6";
      case "chat_started":
        return isDark ? "#FFB86B" : "#FF9500";
      case "report_uploaded":
        return isDark ? "#FF6B6B" : "#FF3B30";
      default:
        return isDark ? "#8E8E93" : "#666";
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInHours = Math.floor(
      (now.getTime() - activityTime.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return activityTime.toLocaleDateString();
  };

  if (activities.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recent Activity</Text>
        <View
          style={[
            styles.emptyState,
            { backgroundColor: isDark ? "#1C1C1E" : "white" },
          ]}
        >
          <Ionicons
            name="time"
            size={48}
            color={isDark ? "#38383A" : "#e5e5e5"}
          />
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Activity</Text>

      <View style={styles.activitiesList}>
        {activities.map((activity, index) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getActivityColor(activity.type) },
                ]}
              >
                <Ionicons
                  name={getActivityIcon(activity.type)}
                  size={16}
                  color="white"
                />
              </View>

              {index < activities.length - 1 && (
                <View style={styles.connectorLine} />
              )}
            </View>

            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription}>
                {activity.description}
              </Text>
              <Text style={styles.activityTime}>
                {formatTime(activity.timestamp)}
              </Text>
            </View>
          </View>
        ))}
      </View>
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
    activitiesList: {
      backgroundColor: isDark ? "#1C1C1E" : "white",
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    activityItem: {
      flexDirection: "row",
      marginBottom: 16,
    },
    activityLeft: {
      alignItems: "center",
      marginRight: 12,
      width: 24,
    },
    iconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2,
    },
    connectorLine: {
      width: 2,
      flex: 1,
      backgroundColor: isDark ? "#38383A" : "#e5e5e5",
      marginTop: 4,
      marginBottom: 4,
    },
    activityContent: {
      flex: 1,
      paddingBottom: 16,
    },
    activityTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 2,
    },
    activityDescription: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#666",
      marginBottom: 4,
    },
    activityTime: {
      fontSize: 12,
      color: isDark ? "#636366" : "#999",
    },
    emptyState: {
      borderRadius: 12,
      padding: 32,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    emptyText: {
      marginTop: 12,
      fontSize: 16,
      color: isDark ? "#8E8E93" : "#666",
      textAlign: "center",
    },
  });
