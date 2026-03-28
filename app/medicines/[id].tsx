import { supabase } from "@/config/SupabaseConfig";
import { Medicine } from "@/types/medicine";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import color from "@/shared/color";

/**
 * MedicineDetailScreen
 * Premium detail view for individual medications.
 * Provides high-level health intelligence, status tracking, and AI interaction entry points.
 */
export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [medicine, setMedicine] = useState<Medicine | null>(null);

  const fetchMedicine = useCallback(async () => {
    if (!user || !id) return;
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setMedicine(data as Medicine);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchMedicine();
  }, [fetchMedicine]);

  const statusInfo = useMemo(() => {
    if (!medicine?.expiry_date) return { label: "Unknown", color: "#8E8E93", icon: "help-circle" };
    const expiry = new Date(medicine.expiry_date);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "Expired", color: "#FF3B30", icon: "alert-circle" };
    if (diffDays < 30) return { label: "Expiring Soon", color: "#FF9500", icon: "warning" };
    return { label: "Safe to Use", color: "#34C759", icon: "checkmark-circle" };
  }, [medicine]);

  const InfoItem = ({ label, value, icon, isDark: itemIsDark }: any) => (
    <View style={[styles.infoItem, { backgroundColor: itemIsDark ? "#1C1C1E" : "white" }]}>
      <Ionicons name={icon} size={18} color={color.PRIMARY} style={{ marginBottom: 8 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color: itemIsDark ? "white" : "black" }]}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={color.PRIMARY} />
      </View>
    );
  }

  if (!medicine) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: isDark ? "white" : "black" }}>Medicine not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: color.PRIMARY }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={isDark ? "white" : "black"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Medicine Details</Text>
        <TouchableOpacity onPress={() => router.push(`/medicines/edit?id=${id}` as any)} style={styles.headerBtn}>
          <Ionicons name="create-outline" size={22} color={color.PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Status Highlight */}
        <View style={[styles.statusCard, { backgroundColor: statusInfo.color + "15", borderColor: statusInfo.color + "30" }]}>
          <View style={[styles.statusIconWrap, { backgroundColor: statusInfo.color }]}>
            <Ionicons name={statusInfo.icon as any} size={24} color="white" />
          </View>
          <View>
            <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            <Text style={[styles.statusSub, { color: isDark ? "#D1D1D6" : "#636366" }]}>
              {medicine.expiry_date ? `Expires on ${new Date(medicine.expiry_date).toLocaleDateString()}` : "No expiry date set"}
            </Text>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.medName}>{medicine.name}</Text>
          <Text style={styles.medGeneric}>{medicine.generic_name || "Generic details not specified"}</Text>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <InfoItem label="Strength" value={medicine.strength || "N/A"} icon="fitness-outline" isDark={isDark} />
          <InfoItem label="Quantity" value={`${medicine.current_quantity} ${medicine.unit_type}`} icon="layers-outline" isDark={isDark} />
        </View>

        {/* AI Assistant Banner */}
        <TouchableOpacity 
          style={styles.aiBanner} 
          onPress={() => router.push(`/assistant/chat/new-chat?agentType=medicine-teller&medicineId=${id}` as any)}
        >
          <View style={styles.aiIconWrap}>
            <Ionicons name="sparkles" size={20} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiTitle}>Ask Rakshak Assistant</Text>
            <Text style={styles.aiSub}>Get help with side effects, storage, and dosage.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="white" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Dosage & Usage</Text>
        <View style={styles.card}>
          <Text style={styles.notesText}>{medicine.dosage_instructions || "No usage instructions provided. Please consult your doctor."}</Text>
        </View>

        {medicine.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.card}>
              <Text style={styles.notesText}>{medicine.notes}</Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
         <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`/assistant/chat/new-chat?agentType=medicine-teller` as any)}>
            <Text style={styles.primaryBtnText}>Check for Interactions</Text>
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF" },
  center: { justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  headerBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "PoppinsRegular", fontWeight: "bold", color: isDark ? "white" : "black" },
  content: { flex: 1, paddingHorizontal: 20 },
  statusCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 24, gap: 16, marginTop: 10, borderWidth: 1 },
  statusIconWrap: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  statusLabel: { fontSize: 16, fontFamily: "PoppinsRegular", fontWeight: "bold" },
  statusSub: { fontSize: 12, fontFamily: "PoppinsRegular" },
  titleSection: { marginVertical: 24 },
  medName: { fontSize: 32, fontFamily: "PoppinsRegular", fontWeight: "bold", color: isDark ? "white" : "#1A1A1E" },
  medGeneric: { fontSize: 16, fontFamily: "PoppinsRegular", color: "#8E8E93", marginTop: 4 },
  infoGrid: { flexDirection: "row", gap: 16, marginBottom: 24 },
  infoItem: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: isDark ? "#2C2C2E" : "#ECEEF2" },
  infoLabel: { fontSize: 12, fontFamily: "PoppinsRegular", color: "#8E8E93" },
  infoValue: { fontSize: 15, fontFamily: "PoppinsRegular", fontWeight: "bold", marginTop: 2 },
  aiBanner: { backgroundColor: color.PRIMARY, flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 24, gap: 12, shadowColor: color.PRIMARY, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  aiIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  aiTitle: { color: "white", fontSize: 16, fontFamily: "PoppinsRegular", fontWeight: "bold" },
  aiSub: { color: "white", fontSize: 11, fontFamily: "PoppinsRegular", opacity: 0.8 },
  sectionTitle: { fontSize: 14, fontFamily: "PoppinsRegular", fontWeight: "bold", color: "#8E8E93", marginTop: 32, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 },
  card: { backgroundColor: isDark ? "#1C1C1E" : "white", padding: 20, borderRadius: 24, borderWidth: 1, borderColor: isDark ? "#2C2C2E" : "#ECEEF2" },
  notesText: { fontSize: 15, fontFamily: "PoppinsRegular", color: isDark ? "#D1D1D6" : "#48484A", lineHeight: 24 },
  footer: { padding: 20 },
  primaryBtn: { height: 56, borderRadius: 16, borderWidth: 2, borderColor: color.PRIMARY, justifyContent: "center", alignItems: "center" },
  primaryBtnText: { color: color.PRIMARY, fontSize: 16, fontFamily: "PoppinsRegular", fontWeight: "bold" },
});
