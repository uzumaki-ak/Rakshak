import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface ActivityItemProps {
  item: {
    id: string;
    type: "chat" | "scan" | "reminder" | "medicine" | "report";
    title: string;
    description?: string;
    timestamp: string;
    metadata?: any;
  };
  onPress: () => void;
}

export default function ActivityItem({ item, onPress }: ActivityItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const getIcon = () => {
    switch (item.type) {
      case "chat":
        return "chatbubble";
      case "scan":
        return "scan";
      case "medicine":
        return "medical";
      case "reminder":
        return "alarm";
      case "report":
        return "document-text";
    }
  };

  const getIconColor = () => {
    switch (item.type) {
      case "chat":
        return isDark ? "#5FD0D8" : "#007AFF";
      case "scan":
        return isDark ? "#BA8AFF" : "#5856D6";
      case "medicine":
        return isDark ? "#FF6B6B" : "#FF3B30";
      case "reminder":
        return isDark ? "#FFB86B" : "#FF9500";
      case "report":
        return isDark ? "#34C759" : "#32D74B";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: isDark ? "#1C1C1E" : "white" }]}
      onPress={onPress}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getIconColor() + "20" },
        ]}
      >
        <Ionicons name={getIcon() as any} size={20} color={getIconColor()} />
      </View>

      <View style={styles.content}>
        <Text
          style={[styles.title, { color: isDark ? "#FFFFFF" : "#1a1a1a" }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {item.description && (
          <Text
            style={[styles.description, { color: isDark ? "#8E8E93" : "#666" }]}
            numberOfLines={1}
          >
            {item.description}
          </Text>
        )}
      </View>

      <View style={styles.timeContainer}>
        <Text style={[styles.time, { color: isDark ? "#8E8E93" : "#666" }]}>
          {formatTime(item.timestamp)}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={isDark ? "#8E8E93" : "#666"}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    textTransform: "capitalize",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    fontSize: 12,
  },
});
