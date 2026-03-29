import { supabase } from "@/config/SupabaseConfig";
import { Medicine } from "@/types/medicine";
import { useAuthContext } from "@/context/AuthContext";
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
} from "react-native";
import color from "@/shared/color";

export default function MedicinesScreen() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const fetchMedicines = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMedicines();
  };

  if (loading || authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={color.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={isDark ? "white" : "black"} />
        </TouchableOpacity>
        <Text style={styles.title}>All Medicines</Text>
        <TouchableOpacity onPress={() => router.push("/medicines/add" as any)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={color.PRIMARY} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={medicines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push(`/medicines/${item.id}` as any)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name="medical" size={20} color="white" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.medName}>{item.name}</Text>
                <Text style={styles.medType}>{item.medicine_type} • {item.strength}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.PRIMARY} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No medicines found</Text>
            <TouchableOpacity onPress={() => router.push("/medicines/add" as any)}>
              <Text style={styles.linkText}>Add your first medicine</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, fontFamily: "PoppinsRegular", fontWeight: "bold", color: isDark ? "white" : "#1A1A1E" },
  addBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { backgroundColor: isDark ? "#1C1C1E" : "white", padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: isDark ? "#2C2C2E" : "#ECEEF2" },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.PRIMARY, justifyContent: "center", alignItems: "center" },
  medName: { fontSize: 16, fontFamily: "PoppinsRegular", fontWeight: "bold", color: isDark ? "white" : "#1A1A1E" },
  medType: { fontSize: 12, fontFamily: "PoppinsRegular", color: "#8E8E93", marginTop: 2 },
  emptyState: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "#8E8E93", fontSize: 16 },
  linkText: { color: color.PRIMARY, marginTop: 8, fontWeight: "bold" },
});
