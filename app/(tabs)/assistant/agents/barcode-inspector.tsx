import { supabase } from "@/config/SupabaseConfig";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BarcodeInspectorAgent() {
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [permission, requestPermission] = useCameraPermissions();
  const [barcodeNumber, setBarcodeNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setBarcodeNumber(data);
    setShowCamera(false);
    processBarcode(data);
  };

  const pickBarcodeImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "We need access to your photos to upload barcode images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        // In a real app, you would process the image with OCR to extract barcode
        Alert.alert(
          "Barcode Image",
          "Barcode image captured. Please enter the barcode number manually for now."
        );
      }
    } catch (error) {
      console.error("Error picking barcode image:", error);
      Alert.alert("Error", "Failed to pick barcode image");
    }
  };

  const processBarcode = async (barcode: string) => {
    if (!user || !barcode.trim()) return;

    setLoading(true);

    try {
      // Get user UUID
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!userData) return;

      // Create new chat session
      const { data: session, error: sessionError } = await supabase
        .from("ai_chat_sessions")
        .insert([
          {
            user_id: userData.id,
            title: "Barcode Scan",
            session_type: "barcode_inspector",
            is_active: true,
            last_message_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create message with barcode
      const { error: messageError } = await supabase
        .from("chat_messages")
        .insert([
          {
            session_id: session.id,
            sender: "user",
            content: `Barcode: ${barcode}. Please provide information about this medicine.`,
            message_type: "text",
            created_at: new Date().toISOString(),
          },
        ]);

      if (messageError) throw messageError;

      // Navigate to chat session
      router.replace(`/assistant/chat/${session.id}` as any);
    } catch (error) {
      console.error("Error processing barcode:", error);
      Alert.alert("Error", "Failed to process barcode");
    } finally {
      setLoading(false);
    }
  };

  const startCameraScan = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    setShowCamera(true);
    setScanned(false);
  };

  if (showCamera && permission?.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "code39",
              "code128",
            ],
          }}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraFrame} />
            <Text style={styles.cameraText}>
              Align barcode within the frame
            </Text>

            <TouchableOpacity
              style={styles.closeCamera}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Ionicons
              name="barcode"
              size={48}
              color={isDark ? "#34C759" : "#32D74B"}
            />
            <Text style={styles.title}>Barcode Scanner</Text>
            <Text style={styles.description}>
              Scan medicine barcodes to get detailed product information,
              manufacturer details, and regulatory information.
            </Text>
          </View>

          {/* Scan Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scan Options</Text>

            <TouchableOpacity
              style={[
                styles.optionCard,
                { backgroundColor: isDark ? "#1C1C1E" : "white" },
              ]}
              onPress={startCameraScan}
              disabled={loading}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
                ]}
              >
                <Ionicons name="camera" size={24} color="white" />
              </View>
              <Text style={styles.optionTitle}>Scan with Camera</Text>
              <Text style={styles.optionDescription}>
                Use your camera to scan barcode directly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                { backgroundColor: isDark ? "#1C1C1E" : "white" },
              ]}
              onPress={pickBarcodeImage}
              disabled={loading}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: isDark ? "#FFB86B" : "#FF9500" },
                ]}
              >
                <Ionicons name="image" size={24} color="white" />
              </View>
              <Text style={styles.optionTitle}>Upload Barcode Image</Text>
              <Text style={styles.optionDescription}>
                Select a photo containing the barcode
              </Text>
            </TouchableOpacity>
          </View>

          {/* Manual Entry */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Or Enter Manually</Text>

            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: isDark ? "#1C1C1E" : "white" },
              ]}
              value={barcodeNumber}
              onChangeText={setBarcodeNumber}
              placeholder="Enter barcode number (EAN-13, UPC, etc.)"
              placeholderTextColor={isDark ? "#636366" : "#999"}
              keyboardType="number-pad"
              maxLength={20}
            />

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor:
                    loading || !barcodeNumber.trim()
                      ? isDark
                        ? "#38383A"
                        : "#e5e5e5"
                      : isDark
                      ? "#2D89FF"
                      : "#007AFF",
                },
              ]}
              onPress={() => processBarcode(barcodeNumber)}
              disabled={loading || !barcodeNumber.trim()}
            >
              <Text style={styles.actionButtonText}>
                {loading ? "Processing..." : "Lookup Barcode"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Supported Barcodes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supported Barcode Types</Text>
            <View style={styles.barcodeTypes}>
              <View style={styles.barcodeType}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={isDark ? "#34C759" : "#32D74B"}
                />
                <Text style={styles.barcodeTypeText}>EAN-13</Text>
              </View>
              <View style={styles.barcodeType}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={isDark ? "#34C759" : "#32D74B"}
                />
                <Text style={styles.barcodeTypeText}>EAN-8</Text>
              </View>
              <View style={styles.barcodeType}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={isDark ? "#34C759" : "#32D74B"}
                />
                <Text style={styles.barcodeTypeText}>UPC-A</Text>
              </View>
              <View style={styles.barcodeType}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={isDark ? "#34C759" : "#32D74B"}
                />
                <Text style={styles.barcodeTypeText}>CODE-128</Text>
              </View>
            </View>
          </View>

          {/* Tips */}
          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Tips for best results:</Text>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={isDark ? "#34C759" : "#32D74B"}
              />
              <Text style={styles.tipText}>
                Ensure good lighting when scanning
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={isDark ? "#34C759" : "#32D74B"}
              />
              <Text style={styles.tipText}>
                Hold steady and align barcode with frame
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={isDark ? "#34C759" : "#32D74B"}
              />
              <Text style={styles.tipText}>
                For manual entry, double-check the numbers
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? "#050507" : "#fbfbfc",
    },
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
      padding: 20,
    },
    header: {
      alignItems: "center",
      paddingVertical: 24,
      marginBottom: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginTop: 16,
      marginBottom: 8,
      textAlign: "center",
    },
    description: {
      fontSize: 16,
      color: isDark ? "#8E8E93" : "#666",
      textAlign: "center",
      lineHeight: 22,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 12,
    },
    optionCard: {
      padding: 20,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    optionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#666",
      lineHeight: 18,
    },
    textInput: {
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      borderWidth: 1,
      borderColor: isDark ? "#38383A" : "#e5e5e5",
      marginBottom: 12,
    },
    actionButton: {
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    actionButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    barcodeTypes: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    barcodeType: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    barcodeTypeText: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#666",
    },
    tips: {
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
      padding: 16,
      borderRadius: 8,
    },
    tipsTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 12,
    },
    tipItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    tipText: {
      fontSize: 14,
      color: isDark ? "#8E8E93" : "#666",
      marginLeft: 8,
    },
    camera: {
      flex: 1,
    },
    cameraOverlay: {
      flex: 1,
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
    },
    cameraFrame: {
      width: 250,
      height: 150,
      borderWidth: 2,
      borderColor: "white",
      backgroundColor: "transparent",
    },
    cameraText: {
      color: "white",
      fontSize: 16,
      marginTop: 20,
      textAlign: "center",
    },
    closeCamera: {
      position: "absolute",
      top: 50,
      right: 20,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 20,
      padding: 8,
    },
  });
