import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DynamicAgentScreen() {
  const { agentType } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const agentName = agentType
    ? (agentType as string)
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Unknown Agent";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons
            name="help-circle"
            size={64}
            color={isDark ? "#8E8E93" : "#666"}
          />
          <Text style={styles.title}>Agent Not Found</Text>
          <Text style={styles.description}>
            The agent "{agentName}" is not available or hasn't been implemented
            yet.
          </Text>

          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back to Assistants</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? "#050507" : "#fbfbfc",
    },
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    content: {
      alignItems: "center",
      maxWidth: 300,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginTop: 24,
      marginBottom: 12,
      textAlign: "center",
    },
    description: {
      fontSize: 16,
      color: isDark ? "#8E8E93" : "#666",
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 32,
    },
    backButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 25,
    },
    backButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
  });
