import EmptyState from "@/components/medicine/EmptyState";
import FilterBar from "@/components/medicine/FilterBar";
import MedicineCard from "@/components/medicine/MedicineCard";
import { supabase } from "@/config/SupabaseConfig";
import color from "@/shared/color";
import { Medicine } from "@/types/medicine";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserSync } from "@/hooks/useUserSync";

/**
 * MedicinesScreen
 * Inventory management screen for tracking medications, expiry, and status.
 * Enhanced with Supabase Realtime for instant synchronization.
 */
export default function MedicinesScreen() {
  const { user } = useUser();
  const { isSynced } = useUserSync();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "expired" | "expiring">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const applyFilters = (meds: Medicine[], filter: string, query: string) => {
    let result = meds;
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (filter === "active") result = result.filter(m => m.status === "active");
    else if (filter === "expired") result = result.filter(m => m.expiry_date && new Date(m.expiry_date) < now);
    else if (filter === "expiring") {
      result = result.filter(m => m.expiry_date && new Date(m.expiry_date) >= now && new Date(m.expiry_date) <= thirtyDays);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.generic_name?.toLowerCase().includes(q) ||
        m.manufacturer?.toLowerCase().includes(q)
      );
    }
    setFilteredMedicines(result);
  };

  const fetchMedicines = useCallback(async () => {
    if (!user || !isSynced) return;
    try {
      const { data: dbUser } = await supabase.from("users").select("id").eq("clerk_user_id", user.id).single();
      if (!dbUser) return;

      const { data, error } = await supabase.from("medicines").select("*").eq("user_id", dbUser.id).order("expiry_date", { ascending: true });
      if (error) throw error;

      const medicineData = (data || []) as Medicine[];
      setMedicines(medicineData);
      applyFilters(medicineData, activeFilter, searchQuery);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isSynced, activeFilter, searchQuery]);

  useEffect(() => {
    fetchMedicines();

    // Enable Supabase Realtime Listener
    const subscription = supabase
      .channel('medicines_inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, (payload) => {
        console.log('Inventory Change Detected:', payload.eventType);
        fetchMedicines();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchMedicines]);

  useEffect(() => {
    applyFilters(medicines, activeFilter, searchQuery);
  }, [activeFilter, searchQuery, medicines]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMedicines();
  };

  const stats = (() => {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      total: medicines.length,
      expired: medicines.filter(m => m.expiry_date && new Date(m.expiry_date) < now).length,
      expiring: medicines.filter(m => m.expiry_date && new Date(m.expiry_date) >= now && new Date(m.expiry_date) <= thirtyDays).length,
    };
  })();

  if (loading || !isSynced) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={color.PRIMARY} />
        <Text style={styles.loadingText}>Inventory syncing...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Inventory</Text>
          <Text style={styles.subtitle}>Tracking {stats.total} medicines</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push("/medicines/add" as any)}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
           <View style={styles.statChip}>
             <Text style={styles.statValue}>{stats.total}</Text>
             <Text style={styles.statLabel}>Total</Text>
           </View>
           <View style={[styles.statChip, { borderColor: "#FF3B3020" }]}>
             <Text style={[styles.statValue, { color: "#FF3B30" }]}>{stats.expired}</Text>
             <Text style={styles.statLabel}>Expired</Text>
           </View>
           <View style={[styles.statChip, { borderColor: "#FF950020" }]}>
             <Text style={[styles.statValue, { color: "#FF9500" }]}>{stats.expiring}</Text>
             <Text style={styles.statLabel}>Expiring</Text>
           </View>
        </ScrollView>
      </View>

      <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter as any} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {filteredMedicines.length === 0 ? (
        <EmptyState filter={activeFilter} searchQuery={searchQuery} onAddMedicine={() => router.push("/medicines/add" as any)} />
      ) : (
        <FlatList
          data={filteredMedicines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MedicineCard medicine={item} onPress={() => router.push(`/medicines/${item.id}` as any)} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.PRIMARY} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 20 }]} onPress={() => router.push("/medicines/add" as any)}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF" },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 28, fontFamily: "PoppinsRegular", fontWeight: "bold", color: isDark ? "#FFFFFF" : "#1A1A1E" },
  subtitle: { fontSize: 14, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366" },
  addButton: { backgroundColor: color.PRIMARY, width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", shadowColor: color.PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  statsBar: { paddingVertical: 8 },
  statsScroll: { paddingHorizontal: 20, gap: 12 },
  statChip: { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, minWidth: 100, alignItems: "center", borderWidth: 1, borderColor: isDark ? "#2C2C2E" : "#E5E5E7" },
  statValue: { fontSize: 20, fontFamily: "PoppinsRegular", fontWeight: "bold", color: isDark ? "#FFFFFF" : "#1A1A1E" },
  statLabel: { fontSize: 12, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366" },
  listContent: { padding: 20 },
  fab: { position: "absolute", right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: color.PRIMARY, justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: color.PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
});
