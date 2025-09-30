import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
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

/**
 * Main Scan Tab Screen
 * Provides multiple scanning options: Camera OCR, Barcode, Gallery, Manual entry
 * Shows recent scans and quick actions
 */
export default function ScanScreen() {
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    permissions,
    isLoading: permissionsLoading,
    requestPermissions,
  } = useCamera();
  const {
    getRecentScans,
    getScanStats,
    loading: scanLoading,
  } = useScanning(user?.id);

  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [scanStats, setScanStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Available scan modes with their configurations
   */
  const scanModes: ScanMode[] = [
    {
      id: "camera",
      title: "Camera Scan",
      description: "Take a photo of medicine packaging",
      icon: "camera",
      available: permissions.camera,
    },
    {
      id: "barcode",
      title: "Barcode Scan",
      description: "Scan barcode or QR code",
      icon: "barcode",
      available: permissions.camera,
    },
    {
      id: "gallery",
      title: "From Gallery",
      description: "Select image from gallery",
      icon: "images",
      available: permissions.mediaLibrary,
    },
    {
      id: "manual",
      title: "Manual Entry",
      description: "Enter medicine details manually",
      icon: "create",
      available: true,
    },
  ];

  /**
   * Load data on screen focus
   */
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  /**
   * Load recent scans and statistics
   */
  const loadData = async () => {
    try {
      const [scans, stats] = await Promise.all([
        getRecentScans(5),
        getScanStats(),
      ]);

      setRecentScans(scans);
      setScanStats(stats);
    } catch (error) {
      console.error("Error loading scan data:", error);
    }
  };

  /**
   * Handle refresh data
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  /**
   * Handle scan mode selection
   */
  const handleScanMode = async (mode: ScanMode) => {
    if (!mode.available) {
      if (mode.id === "camera" || mode.id === "barcode") {
        Alert.alert(
          "Permission Required",
          "Camera permission is required for this feature.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Grant Permission",
              onPress: requestPermissions,
            },
          ]
        );
      } else if (mode.id === "gallery") {
        Alert.alert(
          "Permission Required",
          "Photo library permission is required for this feature.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Grant Permission",
              onPress: requestPermissions,
            },
          ]
        );
      }
      return;
    }

    // Navigate to appropriate scan screen
    switch (mode.id) {
      case "camera":
        router.push("/scan/camera" as any);
        break;
      case "barcode":
        router.push("/scan/barcode-scanner" as any);
        break;
      case "gallery":
        router.push("/scan/camera?mode=gallery" as any);
        break;
      case "manual":
        router.push("/scan/manual-entry" as any);
        break;
    }
  };

  /**
   * Navigate to scan detail
   */
  const handleScanPress = (scan: ScanResult) => {
    router.push(`/scan/ocr-results?scanId=${scan.id}` as any);
  };

  /**
   * Get scan status display info
   */
  const getScanStatusDisplay = (scan: ScanResult) => {
    switch (scan.processing_status) {
      case "completed":
        return {
          color: isDark ? "#34C759" : "#28A745",
          icon: "checkmark-circle" as const,
          text: "Completed",
        };
      case "failed":
        return {
          color: isDark ? "#FF453A" : "#DC3545",
          icon: "close-circle" as const,
          text: "Failed",
        };
      case "processing":
        return {
          color: isDark ? "#FF9F0A" : "#FFC107",
          icon: "time" as const,
          text: "Processing",
        };
      default:
        return {
          color: isDark ? "#8E8E93" : "#6C757D",
          icon: "ellipse" as const,
          text: "Pending",
        };
    }
  };

  /**
   * Format scan time
   */
  const formatScanTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  if (permissionsLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000000" : "#F8F9FA" },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isDark ? "#0A84FF" : "#007AFF"}
          />
          <Text
            style={[
              styles.loadingText,
              { color: isDark ? "#FFFFFF" : "#1D1D1F" },
            ]}
          >
            Setting up scanner...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000000" : "#F8F9FA" },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
        ]}
      >
        <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#1D1D1F" }]}>
          Scan Medicine
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/scan/history" as any)}
          style={styles.historyButton}
        >
          <Ionicons
            name="time-outline"
            size={24}
            color={isDark ? "#0A84FF" : "#007AFF"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS === "ios"
            ? ({
                refreshing,
                onRefresh: handleRefresh,
                tintColor: isDark ? "#FFFFFF" : "#000000",
              } as any)
            : undefined
        }
      >
        {/* Scan Modes */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#FFFFFF" : "#1D1D1F" },
            ]}
          >
            Choose Scan Method
          </Text>

          <View style={styles.scanModesGrid}>
            {scanModes.map((mode, index) => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.scanModeCard,
                  { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
                  !mode.available && styles.scanModeCardDisabled,
                ]}
                onPress={() => handleScanMode(mode)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    mode.available
                      ? isDark
                        ? ["#0A84FF", "#007AFF"]
                        : ["#007AFF", "#0056CC"]
                      : isDark
                      ? ["#2C2C2E", "#1C1C1E"]
                      : ["#E5E5E7", "#D1D1D6"]
                  }
                  style={styles.scanModeIconContainer}
                >
                  <Ionicons
                    name={mode.icon as any}
                    size={28}
                    color={
                      mode.available
                        ? "#FFFFFF"
                        : isDark
                        ? "#636366"
                        : "#8E8E93"
                    }
                  />
                </LinearGradient>

                <View style={styles.scanModeContent}>
                  <Text
                    style={[
                      styles.scanModeTitle,
                      { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                      !mode.available && {
                        color: isDark ? "#636366" : "#8E8E93",
                      },
                    ]}
                  >
                    {mode.title}
                  </Text>
                  <Text
                    style={[
                      styles.scanModeDescription,
                      { color: isDark ? "#8E8E93" : "#636366" },
                      !mode.available && {
                        color: isDark ? "#48484A" : "#AEAEB2",
                      },
                    ]}
                  >
                    {mode.description}
                  </Text>
                </View>

                {!mode.available && (
                  <Ionicons
                    name="lock-closed"
                    size={16}
                    color={isDark ? "#636366" : "#8E8E93"}
                    style={styles.lockIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Scan Statistics */}
        {scanStats && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? "#FFFFFF" : "#1D1D1F" },
              ]}
            >
              Scan Statistics
            </Text>

            <View style={styles.statsContainer}>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
                ]}
              >
                <Text
                  style={[
                    styles.statNumber,
                    { color: isDark ? "#0A84FF" : "#007AFF" },
                  ]}
                >
                  {scanStats.total}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: isDark ? "#8E8E93" : "#636366" },
                  ]}
                >
                  Total Scans
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
                ]}
              >
                <Text
                  style={[
                    styles.statNumber,
                    { color: isDark ? "#30D158" : "#28A745" },
                  ]}
                >
                  {scanStats.successful}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: isDark ? "#8E8E93" : "#636366" },
                  ]}
                >
                  Successful
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
                ]}
              >
                <Text
                  style={[
                    styles.statNumber,
                    { color: isDark ? "#FF453A" : "#DC3545" },
                  ]}
                >
                  {scanStats.failed}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: isDark ? "#8E8E93" : "#636366" },
                  ]}
                >
                  Failed
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                ]}
              >
                Recent Scans
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/scan/history" as any)}
                style={styles.viewAllButton}
              >
                <Text
                  style={[
                    styles.viewAllText,
                    { color: isDark ? "#0A84FF" : "#007AFF" },
                  ]}
                >
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {recentScans.map((scan, index) => {
              const statusDisplay = getScanStatusDisplay(scan);
              return (
                <TouchableOpacity
                  key={scan.id}
                  style={[
                    styles.scanHistoryItem,
                    { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
                    index < recentScans.length - 1 &&
                      styles.scanHistoryItemBorder,
                  ]}
                  onPress={() => handleScanPress(scan)}
                  activeOpacity={0.7}
                >
                  <View style={styles.scanHistoryContent}>
                    <View style={styles.scanHistoryMain}>
                      <Text
                        style={[
                          styles.scanHistoryTitle,
                          { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                        ]}
                      >
                        {scan.parsed_data?.name || "Medicine Scan"}
                      </Text>
                      <Text
                        style={[
                          styles.scanHistorySubtitle,
                          { color: isDark ? "#8E8E93" : "#636366" },
                        ]}
                      >
                        {scan.scan_type.charAt(0).toUpperCase() +
                          scan.scan_type.slice(1).replace("_", " ")}{" "}
                        • {formatScanTime(scan.created_at)}
                      </Text>
                    </View>

                    <View style={styles.scanHistoryStatus}>
                      <Ionicons
                        name={statusDisplay.icon}
                        size={16}
                        color={statusDisplay.color}
                      />
                      <Text
                        style={[
                          styles.scanHistoryStatusText,
                          { color: statusDisplay.color },
                        ]}
                      >
                        {statusDisplay.text}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isDark ? "#636366" : "#8E8E93"}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  historyButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: "500",
  },
  scanModesGrid: {
    gap: 16,
  },
  scanModeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanModeCardDisabled: {
    opacity: 0.6,
  },
  scanModeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  scanModeContent: {
    flex: 1,
  },
  scanModeTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  scanModeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  lockIcon: {
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  scanHistoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanHistoryItemBorder: {
    marginBottom: 12,
  },
  scanHistoryContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 12,
  },
  scanHistoryMain: {
    flex: 1,
  },
  scanHistoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  scanHistorySubtitle: {
    fontSize: 14,
  },
  scanHistoryStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scanHistoryStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
