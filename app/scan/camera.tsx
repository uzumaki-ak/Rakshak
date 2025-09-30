import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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

/**
 * Camera Screen for capturing medicine images
 * Supports both camera capture and gallery selection with REAL OCR processing
 */
export default function CameraScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { processImageScan, isProcessing, processingStep } = useScanning(
    user?.id
  );

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    "checking" | "granted" | "denied"
  >("checking");

  /**
   * Check and request permissions
   */
  React.useEffect(() => {
    checkPermissions();
  }, [mode]);

  const checkPermissions = async () => {
    try {
      if (mode === "gallery") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        setPermissionStatus(status === "granted" ? "granted" : "denied");
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        setPermissionStatus(status === "granted" ? "granted" : "denied");
      }
    } catch (error) {
      console.error("Permission check error:", error);
      setPermissionStatus("denied");
    }
  };

  /**
   * Handle image capture or selection
   */
  const handleCapture = async () => {
    try {
      let result;

      if (mode === "gallery") {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        router.back();
        return;
      }

      const imageUri = result.assets[0].uri;
      setCapturedImage(imageUri);

      // Immediately process the image with REAL OCR
      await processImage(imageUri);
    } catch (error) {
      console.error("Capture error:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to capture image",
        [
          { text: "Retry", onPress: handleCapture },
          { text: "Cancel", onPress: () => router.back() },
        ]
      );
    }
  };

  /**
   * Process captured image with REAL OCR
   */
  const processImage = async (imageUri: string) => {
    try {
      console.log("Starting REAL OCR processing for:", imageUri);

      const result = await processImageScan(imageUri, "ocr_text");

      if (!result.success) {
        Alert.alert(
          "Processing Failed",
          result.error ||
            "Failed to process image. The image may not contain readable text.",
          [
            { text: "Retry", onPress: () => handleCapture() },
            {
              text: "Enter Manually",
              onPress: () => router.replace("/scan/manual-entry" as any),
            },
            { text: "Cancel", onPress: () => router.back() },
          ]
        );
        return;
      }

      console.log("OCR Success! Parsed data:", result.parsedData);

      // Navigate to OCR results screen for confirmation
      if (result.scanResult) {
        router.replace(
          `/scan/ocr-results?scanId=${result.scanResult.id}` as any
        );
      } else {
        throw new Error("Scan result not created");
      }
    } catch (error) {
      console.error("Processing error:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred while processing the image.",
        [
          { text: "Retry", onPress: () => handleCapture() },
          { text: "Cancel", onPress: () => router.back() },
        ]
      );
    }
  };

  /**
   * Auto-trigger capture when screen loads and permission is granted
   */
  React.useEffect(() => {
    if (permissionStatus === "granted") {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        handleCapture();
      }, 100);
      return () => clearTimeout(timer);
    } else if (permissionStatus === "denied") {
      Alert.alert(
        "Permission Required",
        mode === "gallery"
          ? "Photo library access is required to select images."
          : "Camera access is required to take photos.",
        [
          { text: "Cancel", onPress: () => router.back() },
          { text: "Grant Permission", onPress: checkPermissions },
        ]
      );
    }
  }, [permissionStatus]);

  if (isProcessing) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000000" : "#F8F9FA" },
        ]}
      >
        <View style={styles.processingContainer}>
          <ActivityIndicator
            size="large"
            color={isDark ? "#0A84FF" : "#007AFF"}
          />
          <Text
            style={[
              styles.processingTitle,
              { color: isDark ? "#FFFFFF" : "#1D1D1F" },
            ]}
          >
            Processing Image
          </Text>
          <Text
            style={[
              styles.processingStep,
              { color: isDark ? "#8E8E93" : "#636366" },
            ]}
          >
            {processingStep || "Analyzing medicine packaging..."}
          </Text>

          {/* Processing steps indicator */}
          <View style={styles.stepsContainer}>
            <View
              style={[
                styles.stepDot,
                styles.stepDotActive,
                { backgroundColor: isDark ? "#0A84FF" : "#007AFF" },
              ]}
            />
            <View
              style={[
                styles.stepLine,
                { backgroundColor: isDark ? "#0A84FF" : "#007AFF" },
              ]}
            />
            <View
              style={[
                styles.stepDot,
                styles.stepDotActive,
                { backgroundColor: isDark ? "#0A84FF" : "#007AFF" },
              ]}
            />
            <View
              style={[
                styles.stepLine,
                { backgroundColor: isDark ? "#3A3A3C" : "#E5E5E7" },
              ]}
            />
            <View
              style={[
                styles.stepDot,
                { backgroundColor: isDark ? "#3A3A3C" : "#E5E5E7" },
              ]}
            />
          </View>

          <Text
            style={[
              styles.processingNote,
              { color: isDark ? "#636366" : "#8E8E93" },
            ]}
          >
            Using Google ML Kit & Gemini AI
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (permissionStatus === "checking") {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000000" : "#F8F9FA" },
        ]}
      >
        <View style={styles.processingContainer}>
          <ActivityIndicator
            size="large"
            color={isDark ? "#0A84FF" : "#007AFF"}
          />
          <Text
            style={[
              styles.processingTitle,
              { color: isDark ? "#FFFFFF" : "#1D1D1F" },
            ]}
          >
            Checking permissions...
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
        <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#1D1D1F" }]}>
          {mode === "gallery" ? "Select Image" : "Take Photo"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.instructionContainer}>
          <Ionicons
            name={mode === "gallery" ? "images" : "camera"}
            size={64}
            color={isDark ? "#0A84FF" : "#007AFF"}
          />
          <Text
            style={[
              styles.instructionTitle,
              { color: isDark ? "#FFFFFF" : "#1D1D1F" },
            ]}
          >
            {mode === "gallery"
              ? "Select Medicine Image"
              : "Capture Medicine Packaging"}
          </Text>
          <Text
            style={[
              styles.instructionText,
              { color: isDark ? "#8E8E93" : "#636366" },
            ]}
          >
            {mode === "gallery"
              ? "Choose a clear image of the medicine packaging. Our AI will extract medicine details automatically."
              : "Position the medicine packaging in good lighting. Our AI will read the text automatically."}
          </Text>
        </View>

        {/* Tips */}
        <View
          style={[
            styles.tipsContainer,
            { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
          ]}
        >
          <Text
            style={[
              styles.tipsTitle,
              { color: isDark ? "#FFFFFF" : "#1D1D1F" },
            ]}
          >
            Tips for Best Results:
          </Text>
          <View style={styles.tipsList}>
            <TipItem
              icon="checkmark-circle"
              text="Ensure good lighting"
              isDark={isDark}
            />
            <TipItem
              icon="checkmark-circle"
              text="Keep camera steady and focused"
              isDark={isDark}
            />
            <TipItem
              icon="checkmark-circle"
              text="Capture expiry date and medicine name clearly"
              isDark={isDark}
            />
            <TipItem
              icon="checkmark-circle"
              text="Avoid shadows, glare, and blurry images"
              isDark={isDark}
            />
          </View>

          <View
            style={[
              styles.aiNote,
              { backgroundColor: isDark ? "#0A84FF20" : "#007AFF20" },
            ]}
          >
            <Ionicons
              name="sparkles"
              size={16}
              color={isDark ? "#0A84FF" : "#007AFF"}
            />
            <Text
              style={[
                styles.aiNoteText,
                { color: isDark ? "#0A84FF" : "#007AFF" },
              ]}
            >
              Powered by Google ML Kit & Gemini AI
            </Text>
          </View>
        </View>

        {/* Action button */}
        <TouchableOpacity
          style={[
            styles.captureButton,
            { backgroundColor: isDark ? "#0A84FF" : "#007AFF" },
          ]}
          onPress={handleCapture}
        >
          <Ionicons
            name={mode === "gallery" ? "images" : "camera"}
            size={24}
            color="#FFFFFF"
          />
          <Text style={styles.captureButtonText}>
            {mode === "gallery" ? "Choose Image" : "Take Photo"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/**
 * Tip item component
 */
const TipItem = ({
  icon,
  text,
  isDark,
}: {
  icon: string;
  text: string;
  isDark: boolean;
}) => (
  <View style={styles.tipItem}>
    <Ionicons
      name={icon as any}
      size={20}
      color={isDark ? "#30D158" : "#28A745"}
      style={styles.tipIcon}
    />
    <Text style={[styles.tipText, { color: isDark ? "#FFFFFF" : "#1D1D1F" }]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  instructionContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  tipsContainer: {
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  tipIcon: {
    marginRight: 12,
  },
  tipText: {
    fontSize: 16,
    flex: 1,
  },
  aiNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  aiNoteText: {
    fontSize: 14,
    fontWeight: "600",
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  captureButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 8,
  },
  processingStep: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },
  processingNote: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  stepsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepDotActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
});
