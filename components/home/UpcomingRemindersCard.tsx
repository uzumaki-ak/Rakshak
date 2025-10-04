import { supabase } from "@/config/SupabaseConfig";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface Reminder {
  id: string;
  title: string;
  remind_at: string;
  reminder_type: string;
  medicine_id?: string;
}

export default function UpcomingRemindersCard() {
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    fetchUpcomingReminders();
  }, [user]);

  const fetchUpcomingReminders = async () => {
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
        .select("id, title, remind_at, reminder_type, medicine_id")
        .eq("user_id", userData.id)
        .eq("is_delivered", false)
        .gte("remind_at", new Date().toISOString())
        .order("remind_at", { ascending: true })
        .limit(3);

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatRemindTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Soon";
    if (hours < 24) return `In ${hours}h`;
    if (days < 7) return `In ${days}d`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#1C1C1E" : "white" },
        ]}
      >
        <ActivityIndicator
          size="small"
          color={isDark ? "#5FD0D8" : "#007AFF"}
        />
      </View>
    );
  }

  if (reminders.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#1a1a1a" }]}>
          Upcoming Reminders
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/history/reminders" as any)}
        >
          <Text
            style={[styles.viewAll, { color: isDark ? "#5FD0D8" : "#007AFF" }]}
          >
            View All
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#1C1C1E" : "white" },
        ]}
      >
        {reminders.map((reminder, index) => (
          <TouchableOpacity
            key={reminder.id}
            style={[
              styles.reminderItem,
              index < reminders.length - 1 && styles.reminderBorder,
              { borderBottomColor: isDark ? "#38383A" : "#e5e5e5" },
            ]}
            onPress={() =>
              reminder.medicine_id
                ? router.push(`/medicines/${reminder.medicine_id}` as any)
                : router.push("/history/reminders" as any)
            }
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isDark ? "#BA8AFF" : "#5856D6" },
              ]}
            >
              <Ionicons name="alarm" size={16} color="white" />
            </View>
            <View style={styles.reminderContent}>
              <Text
                style={[
                  styles.reminderTitle,
                  { color: isDark ? "#fff" : "#1a1a1a" },
                ]}
                numberOfLines={1}
              >
                {reminder.title}
              </Text>
              <Text
                style={[
                  styles.reminderType,
                  { color: isDark ? "#8E8E93" : "#666" },
                ]}
              >
                {reminder.reminder_type}
              </Text>
            </View>
            <Text
              style={[
                styles.reminderTime,
                { color: isDark ? "#FFB86B" : "#FF9500" },
              ]}
            >
              {formatRemindTime(reminder.remind_at)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: { fontSize: 20, fontWeight: "bold" },
  viewAll: { fontSize: 14, fontWeight: "600" },
  container: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  reminderBorder: {
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  reminderContent: { flex: 1 },
  reminderTitle: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  reminderType: { fontSize: 12, textTransform: "capitalize" },
  reminderTime: { fontSize: 12, fontWeight: "600" },
});
