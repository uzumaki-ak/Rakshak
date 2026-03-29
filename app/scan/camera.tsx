import { useAuthContext } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useScanning } from "@/hooks/scan-hook/useScanning";
import color from "@/shared/color";

/**
 * CameraScreen
 * Handles image capture and gallery selection for medicine scanning.
 * Integrated with the modernized OCRService for AI-powered extraction.
 */
export default function CameraScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { user } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { processImageScan, isProcessing, processingStep } = useScanning(user?.id);

  const [permissionStatus, setPermissionStatus] = useState<"checking" | "granted" | "denied">("checking");

  const checkPermissions = async () => {
    try {
      const { status } = mode === "gallery" 
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();
      
      setPermissionStatus(status === "granted" ? "granted" : "denied");
    } catch (error) {
      setPermissionStatus("denied");
    }
  };

  useEffect(() => {
    checkPermissions();
  }, [mode]);

  const handleCapture = async () => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      };

      const result = mode === "gallery" 
        ? await ImagePicker.launchImageLibraryAsync(options)
        : await ImagePicker.launchCameraAsync(options);

      if (result.canceled || !result.assets?.[0]) {
        router.back();
        return;
      }

      await processImage(result.assets[0].uri);
    } catch (error) {
      Alert.alert("Capture Error", "Failed to acquire image. Please try again.");
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      const result = await processImageScan(imageUri, "ocr_text");

      if (result.success && result.scanResult) {
        router.replace(`/scan/ocr-results?scanId=${result.scanResult.id}` as any);
      } else {
        Alert.alert(
          "Analysis Failed",
          result.error || "We couldn't read the medicine details. The image might be too blurry.",
          [
            { text: "Retry", onPress: handleCapture },
            { text: "Manual Entry", onPress: () => router.replace("/scan/manual-entry" as any) },
            { text: "Cancel", onPress: () => router.back() }
          ]
        );
      }
    } catch (error) {
      router.back();
    }
  };

  useEffect(() => {
    if (permissionStatus === "granted") {
      handleCapture();
    } else if (permissionStatus === "denied") {
      Alert.alert("Permission Denied", "We need access to your camera/gallery to scan medicines.", [
        { text: "Go Back", onPress: () => router.back() }
      ]);
    }
  }, [permissionStatus]);

  const TipRow = ({ icon, text, isDark: tipIsDark }: any) => (
    <View style={styles.tipRow}>
      <Ionicons name={icon} size={20} color={color.PRIMARY} />
      <Text style={[styles.tipText, { color: tipIsDark ? "#D1D1D6" : "#48484A" }]}>{text}</Text>
    </View>
  );

  if (isProcessing) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF" }]}>
        <ActivityIndicator size="large" color={color.PRIMARY} />
        <View style={styles.processingInfo}>
          <Text style={[styles.processingTitle, { color: isDark ? "#FFFFFF" : "#1A1A1E" }]}>
            Analyzing Intelligence
          </Text>
          <Text style={styles.processingSub}>
            {processingStep || "Extracting medical data..."}
          </Text>
        </View>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={16} color={color.PRIMARY} />
          <Text style={styles.aiBadgeText}>Powered by Google Vision & Gemini AI</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF" }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#1A1A1E"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? "#FFFFFF" : "#1A1A1E" }]}>
          {mode === "gallery" ? "Import Image" : "Scanner"}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.instructionBox}>
        <View style={styles.iconCircle}>
          <Ionicons name={mode === "gallery" ? "images" : "camera"} size={40} color={color.PRIMARY} />
        </View>
        <Text style={[styles.insTitle, { color: isDark ? "#FFFFFF" : "#1A1A1E" }]}>
          {mode === "gallery" ? "Select a Photo" : "Capture Package"}
        </Text>
        <Text style={styles.insSub}>
          Ensure the medicine name and expiry date are clearly visible in the frame for best accuracy.
        </Text>
      </View>

      <View style={styles.tipsBox}>
        <TipRow icon="flash-outline" text="Avoid glare and heavy shadows" isDark={isDark} />
        <TipRow icon="scan-outline" text="Align text horizontally" isDark={isDark} />
        <TipRow icon="sunny-outline" text="Use adequate lighting" isDark={isDark} />
      </View>

      <TouchableOpacity style={styles.mainActionBtn} onPress={handleCapture}>
        <Ionicons name={mode === "gallery" ? "image" : "camera"} size={24} color="white" />
        <Text style={styles.mainActionText}>
          {mode === "gallery" ? "Pick from Gallery" : "Open Camera"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontFamily: "PoppinsRegular", fontWeight: "600" },
  closeBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  instructionBox: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: color.PRIMARY + "15", justifyContent: "center", alignItems: "center", marginBottom: 24 },
  insTitle: { fontSize: 24, fontFamily: "PoppinsRegular", fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  insSub: { fontSize: 15, fontFamily: "PoppinsRegular", color: "#8E8E93", textAlign: "center", lineHeight: 22 },
  tipsBox: { marginTop: 40, paddingHorizontal: 40, gap: 16 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  tipText: { fontSize: 15, fontFamily: "PoppinsRegular" },
  mainActionBtn: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: color.PRIMARY, height: 56, borderRadius: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, shadowColor: color.PRIMARY, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  mainActionText: { color: "white", fontSize: 18, fontFamily: "PoppinsRegular", fontWeight: "bold" },
  processingInfo: { marginTop: 24, alignItems: "center" },
  processingTitle: { fontSize: 22, fontFamily: "PoppinsRegular", fontWeight: "bold" },
  processingSub: { fontSize: 16, fontFamily: "PoppinsRegular", color: "#8E8E93", marginTop: 8 },
  aiBadge: { position: 'absolute', bottom: 60, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: color.PRIMARY + "10", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  aiBadgeText: { color: color.PRIMARY, fontSize: 12, fontFamily: "PoppinsRegular", fontWeight: "600" },
});
