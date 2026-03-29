import { useAuthContext } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
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
import { useCamera } from "@/hooks/scan-hook/useCamera";
import { useScanning } from "@/hooks/scan-hook/useScanning";
import { ScanMode, ScanResult } from "@/types/scan";

import color from "@/shared/color";

/**
 * ScanScreen
 * Hub for all scanning activities: Camera OCR, Barcodes, and Manual Entry.
 */
export default function ScanScreen() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const { permissions, isLoading: permissionsLoading, requestPermissions } = useCamera();
  const { getRecentScans, getScanStats } = useScanning(user?.id);

  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [scanStats, setScanStats] = useState<any>(null);

  const scanModesList: ScanMode[] = [
    { id: "camera", title: "Smart OCR", description: "Extract text from medicine labels", icon: "camera", available: permissions.camera },
    { id: "barcode", title: "Barcode", description: "Fast scanning for drug databases", icon: "barcode", available: permissions.camera },
    { id: "gallery", title: "Import Photo", description: "Analyze images from your gallery", icon: "images", available: permissions.mediaLibrary },
    { id: "manual", title: "Manual Entry", description: "Log details without a camera", icon: "create", available: true },
  ];

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [scans, stats] = await Promise.all([getRecentScans(5), getScanStats()]);
      setRecentScans(scans);
      setScanStats(stats);
    } catch (error) {
      console.error("Scan Data Fetch Error:", error);
    }
  }, [user, getRecentScans, getScanStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleScanMode = (mode: ScanMode) => {
    if (!mode.available) {
      Alert.alert("Permissions Needed", `Allow ${mode.id === 'gallery' ? 'Gallery' : 'Camera'} access.`, [{ text: "Grant", onPress: requestPermissions }]);
      return;
    }
    if (mode.id === "camera") router.push("/scan/camera" as any);
    else if (mode.id === "barcode") router.push("/scan/barcode-scanner" as any);
    else if (mode.id === "gallery") router.push("/scan/camera?mode=gallery" as any);
    else if (mode.id === "manual") router.push("/scan/manual-entry" as any);
  };

  const StatBox = ({ label, value, color: tint, isDark: statIsDark }: any) => (
    <View style={[styles.statBox, { backgroundColor: statIsDark ? "#1C1C1E" : "#FFFFFF" }]}>
      <Text style={[styles.statValue, { color: tint }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (permissionsLoading || authLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={color.PRIMARY} />
        <Text style={styles.loadingText}>Initializing scanner...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View><Text style={styles.title}>Scanner</Text><Text style={styles.subtitle}>AI identification</Text></View>
        <TouchableOpacity style={styles.historyBtn} onPress={() => router.push("/scan/history" as any)}>
          <Ionicons name="time-outline" size={24} color={color.PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatBox label="Total" value={scanStats?.total || 0} color={color.PRIMARY} isDark={isDark} />
          <StatBox label="Success" value={scanStats?.successful || 0} color="#34C759" isDark={isDark} />
          <StatBox label="Insights" value={scanStats?.total || 0} color="#5856D6" isDark={isDark} />
        </View>

        <Text style={styles.sectionTitle}>Select Method</Text>
        <View style={styles.modesGrid}>
          {scanModesList.map((mode) => (
            <TouchableOpacity key={mode.id} style={[styles.modeCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]} onPress={() => handleScanMode(mode)}>
              <LinearGradient colors={mode.available ? [color.PRIMARY, "#0056CC"] : ["#8E8E93", "#636366"]} style={styles.iconCircle}>
                <Ionicons name={mode.icon as any} size={28} color="white" />
              </LinearGradient>
              <View style={styles.modeText}>
                <Text style={[styles.modeTitle, { color: isDark ? "#FFFFFF" : "#1A1A1E" }]}>{mode.title}</Text>
                <Text style={styles.modeSub}>{mode.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? "#3A3A3C" : "#C7C7CC"} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF" },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 28, fontFamily: "PoppinsRegular", fontWeight: "bold", color: isDark ? "#FFFFFF" : "#1A1A1E" },
  subtitle: { fontSize: 14, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366" },
  historyBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: color.PRIMARY + "10", justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 20 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statBox: { flex: 1, padding: 16, borderRadius: 20, alignItems: "center", borderWidth: 1, borderColor: isDark ? "#2C2C2E" : "#ECEEF2" },
  statValue: { fontSize: 20, fontFamily: "PoppinsRegular", fontWeight: "bold" },
  statLabel: { fontSize: 11, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366", marginTop: 2 },
  sectionTitle: { fontSize: 18, fontFamily: "PoppinsRegular", fontWeight: "bold", color: isDark ? "#FFFFFF" : "#1A1A1E", marginBottom: 16 },
  modesGrid: { gap: 12 },
  modeCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 24, borderWidth: 1, borderColor: isDark ? "#2C2C2E" : "#ECEEF2" },
  iconCircle: { width: 56, height: 56, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 16 },
  modeText: { flex: 1 },
  modeTitle: { fontSize: 17, fontFamily: "PoppinsRegular", fontWeight: "bold" },
  modeSub: { fontSize: 13, fontFamily: "PoppinsRegular", color: isDark ? "#8E8E93" : "#636366", marginTop: 2 },
});
