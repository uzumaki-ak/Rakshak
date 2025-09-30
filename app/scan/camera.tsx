import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
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

import { useCamera } from "@/hooks/scan-hook/useCamera";
import { useScanning } from "@/hooks/scan-hook/useScanning";

/**
 * Camera Screen for capturing medicine images
 * Supports both camera capture and gallery selection
 */
export default function CameraScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { takePhoto, pickImage, permissions } = useCamera();
  const { processImageScan, isProcessing, processingStep } = useScanning(
    user?.id
  );

  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  /**
   * Handle image capture or selection
   */
  const handleCapture = async () => {
    try {
      let result;

      if (mode === "gallery") {
        result = await pickImage();
      } else {
        result = await takePhoto();
      }

      if (result.cancelled || !result.uri) {
        return;
      }

      setCapturedImage(result.uri);

      // Process the image with OCR
      Alert.alert(
        "Process Image",
        "Would you like to process this image now?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setCapturedImage(null),
          },
          {
            text: "Process",
            onPress: () => processImage(result.uri),
          },
        ]
      );
    } catch (error) {
      console.error("Capture error:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to capture image"
      );
    }
  };

  /**
   * Process captured image with OCR
   */
  const processImage = async (imageUri: string) => {
    try {
      const result = await processImageScan(imageUri, "ocr_text");

      if (!result.success) {
        Alert.alert(
          "Processing Failed",
          result.error || "Failed to process image",
          [
            { text: "Retry", onPress: () => processImage(imageUri) },
            { text: "Cancel", onPress: () => router.back() },
          ]
        );
        return;
      }

      // Navigate to OCR results screen for confirmation
      if (result.scanResult) {
        router.replace(
          `/scan/ocr-results?scanId=${result.scanResult.id}` as any
        );
      }
    } catch (error) {
      console.error("Processing error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  /**
   * Check permissions before capturing
   */
  React.useEffect(() => {
    const checkAndCapture = async () => {
      if (mode === "gallery" && !permissions.mediaLibrary) {
        Alert.alert("Permission Required", "Photo library access is required", [
          { text: "Cancel", onPress: () => router.back() },
          { text: "OK" },
        ]);
        return;
      }

      if (mode !== "gallery" && !permissions.camera) {
        Alert.alert("Permission Required", "Camera access is required", [
          { text: "Cancel", onPress: () => router.back() },
          { text: "OK" },
        ]);
        return;
      }

      // Auto-trigger capture when screen loads
      handleCapture();
    };

    checkAndCapture();
  }, []);

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
            {processingStep}
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
                { backgroundColor: isDark ? "#3A3A3C" : "#E5E5E7" },
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
              ? "Choose a clear image of the medicine packaging from your gallery"
              : "Position the medicine packaging in good lighting and take a clear photo"}
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
              text="Keep camera steady"
              isDark={isDark}
            />
            <TipItem
              icon="checkmark-circle"
              text="Focus on expiry date and name"
              isDark={isDark}
            />
            <TipItem
              icon="checkmark-circle"
              text="Avoid shadows and glare"
              isDark={isDark}
            />
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
