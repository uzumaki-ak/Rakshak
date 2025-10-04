import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface EmptyStateCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onActionPress?: () => void;
}

export default function EmptyStateCard({
  title,
  description,
  icon,
  actionLabel,
  onActionPress,
}: EmptyStateCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1C1C1E" : "white" },
      ]}
    >
      <Ionicons name={icon} size={48} color={isDark ? "#38383A" : "#e5e5e5"} />
      <Text style={[styles.title, { color: isDark ? "#fff" : "#1a1a1a" }]}>
        {title}
      </Text>
      <Text
        style={[styles.description, { color: isDark ? "#8E8E93" : "#666" }]}
      >
        {description}
      </Text>
      {actionLabel && onActionPress && (
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
          ]}
          onPress={onActionPress}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
