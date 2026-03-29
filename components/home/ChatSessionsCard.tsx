import { supabase } from "@/config/SupabaseConfig";
import { useAuthContext } from "@/context/AuthContext";
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

interface ChatSession {
  id: string;
  title: string;
  session_type: string;
  last_message_at: string;
}

export default function ChatSessionsCard() {
  const { user } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    fetchRecentChats();
  }, [user]);

  const fetchRecentChats = async () => {
    if (!user) return;

    try {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!userData) return;

      const { data, error } = await supabase
        .from("ai_chat_sessions")
        .select("id, title, session_type, last_message_at")
        .eq("user_id", userData.id)
        .eq("is_active", true)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(3);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
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

  if (sessions.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#1a1a1a" }]}>
          Recent Chats
        </Text>
        <TouchableOpacity onPress={() => router.push("/assistant" as any)}>
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
        {sessions.map((session, index) => (
          <TouchableOpacity
            key={session.id}
            style={[
              styles.sessionItem,
              index < sessions.length - 1 && styles.sessionBorder,
              { borderBottomColor: isDark ? "#38383A" : "#e5e5e5" },
            ]}
            onPress={() => router.push(`/assistant/chat/${session.id}` as any)}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
              ]}
            >
              <Ionicons name="chatbubble" size={16} color="white" />
            </View>
            <View style={styles.sessionContent}>
              <Text
                style={[
                  styles.sessionTitle,
                  { color: isDark ? "#fff" : "#1a1a1a" },
                ]}
                numberOfLines={1}
              >
                {session.title}
              </Text>
              <Text
                style={[
                  styles.sessionType,
                  { color: isDark ? "#8E8E93" : "#666" },
                ]}
              >
                {session.session_type?.replace(/_/g, " ").replace(/-/g, " ")}
              </Text>
            </View>
            <Text
              style={[
                styles.sessionTime,
                { color: isDark ? "#636366" : "#999" },
              ]}
            >
              {formatTime(session.last_message_at)}
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
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  sessionBorder: {
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
  sessionContent: { flex: 1 },
  sessionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  sessionType: { fontSize: 12, textTransform: "capitalize" },
  sessionTime: { fontSize: 12 },
});
