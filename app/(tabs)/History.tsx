import SearchBar from "@/components/assistant/SearchBar";
import ActivityItem from "@/components/history/ActivityItem";
import FilterBar from "@/components/history/FilterBar";
import { supabase } from "@/config/SupabaseConfig";
import color from "@/shared/color";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Alert,
} from "react-native";
import { useUserSync } from "@/hooks/useUserSync";

interface HistoryItem {
  id: string;
  type: "chat" | "scan" | "reminder" | "medicine" | "report";
  title: string;
  description?: string;
  timestamp: string;
  metadata?: any;
}

const ITEMS_PER_PAGE = 20;

/**
 * HistoryScreen
 * Consolidated view of all user activities: scans, medicine updates, AI chats, and notifications.
 */
export default function HistoryScreen() {
  const { user } = useUser();
  const { isSynced } = useUserSync();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "chat" | "scan" | "reminder" | "medicine" | "report">("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchHistory = useCallback(async (pageNum = 1, isLoadMore = false) => {
    if (!user || !isSynced) return;

    if (isLoadMore) setLoadingMore(true);
    else if (!refreshing) setLoading(true);

    try {
      const { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!dbUser) return;

      const userId = dbUser.id;
      const offset = (pageNum - 1) * ITEMS_PER_PAGE;

      const [medicines, scans, notifications] = await Promise.all([
        supabase.from("medicines").select("*").eq("user_id", userId).order("created_at", { ascending: false }).range(offset, offset + 10),
        supabase.from("scans").select("*").eq("user_id", userId).order("created_at", { ascending: false }).range(offset, offset + 10),
        supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).range(offset, offset + 10),
      ]);

      const items: HistoryItem[] = [
        ...(medicines.data || []).map(m => ({
          id: m.id,
          type: "medicine" as const,
          title: m.name,
          description: `Added to inventory - ${m.status}`,
          timestamp: m.created_at,
          metadata: m
        })),
        ...(scans.data || []).map(s => ({
          id: s.id,
          type: "scan" as const,
          title: "Medicine Scanned",
          description: s.parsed_data?.name || "OCR Processing",
          timestamp: s.created_at,
          metadata: s
        })),
        ...(notifications.data || []).map(n => ({
          id: n.id,
          type: "reminder" as const,
          title: n.title,
          description: n.body,
          timestamp: n.created_at,
          metadata: n
        }))
      ];

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (isLoadMore) setHistoryItems(prev => [...prev, ...items]);
      else setHistoryItems(items);

      setHasMore(items.length > 0);
      setPage(pageNum);
    } catch (error) {
      console.error("History Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user, isSynced, refreshing]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    let result = historyItems;
    if (activeFilter !== "all") {
      result = result.filter(item => item.type === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.description?.toLowerCase().includes(q)
      );
    }
    setFilteredItems(result);
  }, [historyItems, activeFilter, searchQuery]);

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

  if (loading || !isSynced) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={color.PRIMARY} />
        <Text style={styles.loadingText}>Syncing history...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity History</Text>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => Alert.alert("Export", "Exporting your health history...")}
        >
          <Ionicons name="cloud-download-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search items..." />
        <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter as any} />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item }) => (
          <ActivityItem 
            item={item} 
            onPress={() => {
              if (item.type === 'medicine') router.push(`/medicines/${item.id}` as any);
            }} 
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.PRIMARY} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 20 }} color={color.PRIMARY} /> : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color={isDark ? "#2C2C2E" : "#E5E5E7"} />
            <Text style={styles.emptyText}>No history records found</Text>
            <Text style={styles.emptySubtext}>Your recent scans and updates will appear here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF" },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 16, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 28, fontFamily: "PoppinsRegular", fontWeight: "bold", color: isDark ? "#FFFFFF" : "#1A1A1E" },
  exportButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: color.PRIMARY, justifyContent: "center", alignItems: "center", shadowColor: color.PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  controls: { paddingHorizontal: 16, gap: 12, marginBottom: 8 },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: "center", justifyContent: "center", padding: 60 },
  emptyText: { fontSize: 18, fontFamily: "PoppinsRegular", fontWeight: "600", color: isDark ? "#FFFFFF" : "#1A1A1E", marginTop: 20 },
  emptySubtext: { fontSize: 14, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366", textAlign: "center", marginTop: 8 },
});
