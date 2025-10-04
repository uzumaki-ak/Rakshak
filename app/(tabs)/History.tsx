import SearchBar from "@/components/assistant/SearchBar";
import ActivityItem from "@/components/history/ActivityItem";
import FilterBar from "@/components/history/FilterBar";
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

interface HistoryItem {
  id: string;
  type: "chat" | "scan" | "reminder" | "medicine" | "report";
  title: string;
  description?: string;
  timestamp: string;
  metadata?: any;
}

const ITEMS_PER_PAGE = 20;

export default function HistoryScreen() {
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "chat" | "scan" | "reminder" | "medicine" | "report"
  >("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [historyItems, searchQuery, activeFilter]);

  const fetchHistory = async (pageNum = 1, isLoadMore = false) => {
    if (!user) return;

    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (userError || !userData) {
        console.error("User not found:", userError);
        return;
      }

      const userId = userData.id;
      const offset = (pageNum - 1) * ITEMS_PER_PAGE;

      // Fetch all history types in parallel
      const [chats, scans, reminders, medicines, reports] = await Promise.all([
        fetchChats(userId, offset),
        fetchScans(userId, offset),
        fetchReminders(userId, offset),
        fetchMedicines(userId, offset),
        fetchReports(userId, offset),
      ]);

      const allItems = [
        ...chats,
        ...scans,
        ...reminders,
        ...medicines,
        ...reports,
      ];

      // Sort by timestamp descending
      allItems.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      if (isLoadMore) {
        setHistoryItems((prev) => [...prev, ...allItems]);
      } else {
        setHistoryItems(allItems);
      }

      setHasMore(allItems.length === ITEMS_PER_PAGE);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const fetchChats = async (
    userId: string,
    offset: number
  ): Promise<HistoryItem[]> => {
    const { data, error } = await supabase
      .from("ai_chat_sessions")
      .select("id, title, session_type, last_message_at, created_at")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (error) {
      console.error("Error fetching chats:", error);
      return [];
    }

    return (data || []).map((chat) => ({
      id: chat.id,
      type: "chat" as const,
      title: chat.title || "Chat Session",
      description: chat.session_type?.replace(/_/g, " ").replace(/-/g, " "),
      timestamp: chat.last_message_at || chat.created_at,
      metadata: { session_type: chat.session_type },
    }));
  };

  const fetchScans = async (
    userId: string,
    offset: number
  ): Promise<HistoryItem[]> => {
    const { data, error } = await supabase
      .from("scans")
      .select("id, scan_type, parsed_data, created_at, medicine_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (error) {
      console.error("Error fetching scans:", error);
      return [];
    }

    return (data || []).map((scan) => ({
      id: scan.id,
      type: "scan" as const,
      title: `${scan.scan_type?.replace(/_/g, " ")} Scan`,
      description: scan.parsed_data?.name || "Scanned medicine",
      timestamp: scan.created_at,
      metadata: { scan_type: scan.scan_type, medicine_id: scan.medicine_id },
    }));
  };

  const fetchReminders = async (
    userId: string,
    offset: number
  ): Promise<HistoryItem[]> => {
    const { data, error } = await supabase
      .from("reminders")
      .select("id, title, reminder_type, remind_at, is_delivered, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (error) {
      console.error("Error fetching reminders:", error);
      return [];
    }

    return (data || []).map((reminder) => ({
      id: reminder.id,
      type: "reminder" as const,
      title: reminder.title,
      description: `${reminder.reminder_type} - ${
        reminder.is_delivered ? "Delivered" : "Pending"
      }`,
      timestamp: reminder.created_at,
      metadata: {
        remind_at: reminder.remind_at,
        is_delivered: reminder.is_delivered,
      },
    }));
  };

  const fetchMedicines = async (
    userId: string,
    offset: number
  ): Promise<HistoryItem[]> => {
    const { data, error } = await supabase
      .from("medicines")
      .select("id, name, status, expiry_date, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (error) {
      console.error("Error fetching medicines:", error);
      return [];
    }

    return (data || []).map((medicine) => ({
      id: medicine.id,
      type: "medicine" as const,
      title: medicine.name,
      description: `Status: ${medicine.status}`,
      timestamp: medicine.created_at,
      metadata: { expiry_date: medicine.expiry_date, status: medicine.status },
    }));
  };

  const fetchReports = async (
    userId: string,
    offset: number
  ): Promise<HistoryItem[]> => {
    const { data, error } = await supabase
      .from("medical_reports")
      .select("id, title, report_type, report_date, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (error) {
      console.error("Error fetching reports:", error);
      return [];
    }

    return (data || []).map((report) => ({
      id: report.id,
      type: "report" as const,
      title: report.title || "Medical Report",
      description: report.report_type,
      timestamp: report.created_at,
      metadata: { report_date: report.report_date },
    }));
  };

  const applyFilters = () => {
    let filtered = historyItems;

    if (activeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    setFilteredItems(filtered);
  };

  const handleItemPress = (item: HistoryItem) => {
    switch (item.type) {
      case "chat":
        router.push(`/assistant/chat/${item.id}` as any);
        break;
      case "medicine":
        router.push(`/medicines/${item.id}` as any);
        break;
      case "scan":
        if (item.metadata?.medicine_id) {
          router.push(`/medicines/${item.metadata.medicine_id}` as any);
        }
        break;
      case "report":
        router.push(`/history/reports/${item.id}` as any);
        break;
      case "reminder":
        router.push(`/history/reminders` as any);
        break;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchHistory(1, false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchHistory(page + 1, true);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ padding: 20 }}>
        <ActivityIndicator
          size="small"
          color={isDark ? "#5FD0D8" : "#007AFF"}
        />
      </View>
    );
  };

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
          <Text
            style={[styles.loadingText, { color: isDark ? "#ccc" : "#666" }]}
          >
            Loading history...
          </Text>
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
          { backgroundColor: isDark ? "#07070a" : "white" },
        ]}
      >
        <Text style={[styles.title, { color: isDark ? "#fff" : "#1a1a1a" }]}>
          History
        </Text>
        <TouchableOpacity
          style={[
            styles.exportButton,
            { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
          ]}
          onPress={() => router.push("/history/export" as any)}
        >
          <Ionicons name="download" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search history..."
      />

      <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item }) => (
          <ActivityItem item={item} onPress={() => handleItemPress(item)} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="time"
              size={64}
              color={isDark ? "#38383A" : "#e5e5e5"}
            />
            <Text
              style={[styles.emptyText, { color: isDark ? "#fff" : "#1a1a1a" }]}
            >
              No history found
            </Text>
            <Text
              style={[
                styles.emptySubtext,
                { color: isDark ? "#8E8E93" : "#666" },
              ]}
            >
              {searchQuery || activeFilter !== "all"
                ? "Try adjusting your search or filter"
                : "Start using the app to see your activity"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
});
