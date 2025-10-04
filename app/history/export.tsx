import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? "#050507" : "#fbfbfc" },
      ]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? "#1C1C1E" : "white" },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#fff" : "#1a1a1a"}
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#1a1a1a" }]}>
          Export Data
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Ionicons
          name="download"
          size={64}
          color={isDark ? "#8E8E93" : "#666"}
        />
        <Text style={[styles.message, { color: isDark ? "#fff" : "#1a1a1a" }]}>
          Export functionality coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#38383A",
  },
  backButton: { padding: 4, marginRight: 8 },
  title: { fontSize: 18, fontWeight: "600", flex: 1, textAlign: "center" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    fontSize: 18,
    marginTop: 16,
    textAlign: "center",
  },
});
