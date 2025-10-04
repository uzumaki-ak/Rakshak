import { supabase } from "@/config/SupabaseConfig";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Reminder {
  id: string;
  title: string;
  message?: string;
  reminder_type: string;
  remind_at: string;
  is_delivered: boolean;
  is_acknowledged: boolean;
  medicine_id?: string;
}

export default function RemindersScreen() {
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    fetchReminders();
  }, [user]);

  const fetchReminders = async () => {
    if (!user) return;

    try {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!userData) return;

      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", userData.id)
        .order("remind_at", { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReminders();
  };

  const renderReminder = ({ item }: { item: Reminder }) => (
    <TouchableOpacity
      style={[
        styles.reminderCard,
        { backgroundColor: isDark ? "#1C1C1E" : "white" },
      ]}
      onPress={() =>
        item.medicine_id && router.push(`/medicines/${item.medicine_id}` as any)
      }
    >
      <View style={styles.reminderHeader}>
        <Ionicons
          name={item.is_delivered ? "checkmark-circle" : "alarm"}
          size={24}
          color={item.is_delivered ? "#34C759" : isDark ? "#FFB86B" : "#FF9500"}
        />
        <View style={styles.reminderContent}>
          <Text
            style={[
              styles.reminderTitle,
              { color: isDark ? "#fff" : "#1a1a1a" },
            ]}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.reminderType,
              { color: isDark ? "#8E8E93" : "#666" },
            ]}
          >
            {item.reminder_type} - {new Date(item.remind_at).toLocaleString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: isDark ? "#050507" : "#fbfbfc" },
        ]}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={isDark ? "#5FD0D8" : "#007AFF"}
          />
        </View>
      </SafeAreaView>
    );
  }

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
          Reminders
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={renderReminder}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#38383A",
  },
  backButton: { padding: 4, marginRight: 8 },
  title: { fontSize: 18, fontWeight: "600", flex: 1, textAlign: "center" },
  list: { padding: 16 },
  reminderCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reminderContent: { flex: 1 },
  reminderTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  reminderType: { fontSize: 14, textTransform: "capitalize" },
});
