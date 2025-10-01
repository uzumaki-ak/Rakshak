import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface QuickActionsProps {
  onActionPress: (action: string) => void;
}

export default function QuickActions({ onActionPress }: QuickActionsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const actions = [
    {
      id: "scan",
      label: "Scan Medicine",
      icon: "scan" as const,
      color: isDark ? "#5FD0D8" : "#007AFF",
    },
    {
      id: "add",
      label: "Add Manually",
      icon: "add-circle" as const,
      color: isDark ? "#34C759" : "#32D74B",
    },
    {
      id: "assistant",
      label: "AI Assistant",
      icon: "chatbubble" as const,
      color: isDark ? "#BA8AFF" : "#5856D6",
    },
    {
      id: "emergency",
      label: "Emergency",
      icon: "medkit" as const,
      color: isDark ? "#FF6B6B" : "#FF3B30",
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>

      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionButton,
              { backgroundColor: isDark ? "#1C1C1E" : "white" },
            ]}
            onPress={() => onActionPress(action.id)}
          >
            <View
              style={[styles.iconContainer, { backgroundColor: action.color }]}
            >
              <Ionicons name={action.icon} size={24} color="white" />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
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
    actionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    actionButton: {
      width: "48%",
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    actionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      textAlign: "center",
    },
  });
