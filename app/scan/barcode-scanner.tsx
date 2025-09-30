import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useScanning } from "@/hooks/scan-hook/useScanning";

const { width } = Dimensions.get("window");
const SCAN_AREA_SIZE = width * 0.7;

/**
 * Barcode Scanner Screen
 * Scans barcodes/QR codes on medicine packaging
 */
export default function BarcodeScannerScreen() {
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { processBarcodeData, isProcessing } = useScanning(user?.id);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  /**
   * Handle barcode scan
   */
  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned || isProcessing) return;

    setScanned(true);

    try {
      // Process barcode data
      const result = await processBarcodeData(data);

      if (!result.success) {
        Alert.alert(
          "Barcode Processed",
          `Barcode: ${data}\n\nNo medicine found in database. Would you like to add it manually?`,
          [
            { text: "Cancel", onPress: () => router.back() },
            {
              text: "Add Manually",
              onPress: () => router.push(`/scan/manual-entry?barcode=${data}`),
            },
          ]
        );
        return;
      }

      // Navigate to manual entry with barcode data
      router.replace(
        `/scan/manual-entry?scanId=${result.scanResult?.id}&barcode=${data}`
      );
    } catch (error) {
      console.error("Barcode processing error:", error);
      Alert.alert("Error", "Failed to process barcode");
      setScanned(false);
    }
  };

  /**
   * Toggle flashlight/torch
   */
  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  /**
   * Reset scan state
   */
  const resetScan = () => {
    setScanned(false);
  };

  if (!permission) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000000" : "#F8F9FA" },
        ]}
      >
        <View style={styles.centerContainer}>
          <Text
            style={[
              styles.messageText,
              { color: isDark ? "#FFFFFF" : "#1D1D1F" },
            ]}
          >
            Requesting camera permission...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000000" : "#F8F9FA" },
        ]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="close"
              size={24}
              color={isDark ? "#0A84FF" : "#007AFF"}
            />
          </TouchableOpacity>
          <Text
            style={[styles.title, { color: isDark ? "#FFFFFF" : "#1D1D1F" }]}
          >
            Barcode Scanner
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.centerContainer}>
          <Ionicons
            name="camera"
            size={64}
            color={isDark ? "#636366" : "#8E8E93"}
          />
          <Text
            style={[
              styles.messageTitle,
              { color: isDark ? "#FFFFFF" : "#1D1D1F" },
            ]}
          >
            Camera Access Required
          </Text>
          <Text
            style={[
              styles.messageText,
              { color: isDark ? "#8E8E93" : "#636366" },
            ]}
          >
            Please grant camera permission to use the barcode scanner.
          </Text>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              { backgroundColor: isDark ? "#0A84FF" : "#007AFF" },
            ]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera view using expo-camera */}
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: [
            "ean13",
            "ean8",
            "upc_a",
            "upc_e",
            "code128",
            "code39",
            "qr",
          ],
        }}
      >
        {/* Overlay */}
        <SafeAreaView style={styles.overlay}>
          {/* Header */}
          <View
            style={[styles.header, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={[styles.title, { color: "#FFFFFF" }]}>
              Scan Barcode
            </Text>
            <TouchableOpacity onPress={toggleTorch} style={styles.torchButton}>
              <Ionicons
                name={torchOn ? "flash" : "flash-off"}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* Scan area */}
          <View style={styles.scanAreaContainer}>
            <View style={styles.scanAreaWrapper}>
              {/* Scan frame corners */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />

              {/* Scan line animation would go here */}
              <View style={styles.scanLine} />
            </View>

            <Text style={styles.instructionText}>
              Position barcode within the frame
            </Text>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            {scanned && (
              <TouchableOpacity style={styles.rescanButton} onPress={resetScan}>
                <Ionicons name="refresh" size={24} color="#FFFFFF" />
                <Text style={styles.rescanButtonText}>Scan Again</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => router.push("/scan/manual-entry")}
            >
              <Text style={styles.manualButtonText}>Enter Manually</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  torchButton: {
    padding: 8,
  },
  scanAreaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanAreaWrapper: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#FFFFFF",
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#0A84FF",
    opacity: 0.8,
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 32,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  rescanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A84FF",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  rescanButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  manualButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  manualButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  messageText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  permissionButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
