import { supabase } from "@/config/SupabaseConfig";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// removed deprecated FileSystem import

const REPORT_TYPES = [
  { id: "blood_test", name: "Blood Test", icon: "water" },
  { id: "urine_test", name: "Urine Test", icon: "flask" },
  { id: "xray", name: "X-Ray", icon: "scan" },
  { id: "mri", name: "MRI", icon: "magnet" },
  { id: "ct_scan", name: "CT Scan", icon: "layers" },
  { id: "ecg", name: "ECG", icon: "pulse" },
  { id: "ultrasound", name: "Ultrasound", icon: "radio" },
  { id: "other", name: "Other", icon: "document" },
];

export default function ReportAnalyzerAgent() {
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");

  const pickDocument = async () => {
    if (!selectedType) {
      Alert.alert(
        "Select Report Type",
        "Please select the type of report first."
      );
      return;
    }

    try {
      // DocumentPicker.getDocumentAsync may have slightly different TS types across SDKs,
      // so use a runtime check and narrow with 'as any' to avoid TS errors.
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      // result can be { type: 'cancel' } or success shape. Check runtime 'type' field first.
      if (!("type" in result) || (result as any).type !== "success") {
        // user cancelled or unexpected shape — bail out
        return;
      }

      // Now safe to read uri/name — cast to any to satisfy TS without changing runtime behavior
      const r = result as any;
      const uri: string = r.uri;
      const name: string = r.name || `report-${Date.now()}`;

      // Infer mimeType from extension if not provided
      const ext = name.includes(".")
        ? name.split(".").pop()!.toLowerCase()
        : "";
      let mimeType = "application/octet-stream";
      if (ext === "pdf") mimeType = "application/pdf";
      else if (ext === "png") mimeType = "image/png";
      else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";

      await processReport(uri, name, mimeType);
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const processReport = async (
    uri: string,
    fileName: string,
    mimeType: string
  ) => {
    if (!user) return;

    setUploading(true);

    try {
      // Get user UUID
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!userData) return;

      // NEW: fetch the file as a blob instead of reading base64 via deprecated API
      // In Expo, fetch(uri) for a file:// or content:// URI returns a Response we can .blob()
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create upload filename
      const fileExt = fileName.includes(".")
        ? fileName.split(".").pop()
        : "bin";
      const uploadFileName = `reports/${userData.id}/${Date.now()}.${fileExt}`;

      // Upload blob directly to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("rak-ai")
        .upload(uploadFileName, blob as any, {
          contentType: mimeType,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("rak-ai").getPublicUrl(uploadFileName);

      // Create medical report record
      const { data: report, error: reportError } = await supabase
        .from("medical_reports")
        .insert([
          {
            user_id: userData.id,
            title: fileName,
            report_type: selectedType,
            file_path: publicUrl,
            file_type: mimeType.includes("pdf") ? "pdf" : "image",
            // file_size_bytes: we don't have exact bytes easily here; best to leave null or query uploadData if available
            file_size_bytes: null,
            processing_status: "pending",
            ai_processing_status: "pending",
          },
        ])
        .select()
        .single();

      if (reportError) throw reportError;

      // Create chat session linked to this report
      const { data: session, error: sessionError } = await supabase
        .from("ai_chat_sessions")
        .insert([
          {
            user_id: userData.id,
            medical_report_id: report.id,
            title: `Report Analysis - ${
              REPORT_TYPES.find((t) => t.id === selectedType)?.name
            }`,
            session_type: "report_analyzer",
            context_data: { report_type: selectedType, report_id: report.id },
            is_active: true,
            last_message_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create initial message
      const { error: messageError } = await supabase
        .from("chat_messages")
        .insert([
          {
            session_id: session.id,
            sender: "user",
            content: `I've uploaded a ${
              REPORT_TYPES.find((t) => t.id === selectedType)?.name
            } report. Please analyze it and provide insights.`,
            message_type: "file",
            attachments: [publicUrl],
            created_at: new Date().toISOString(),
          },
        ]);

      if (messageError) throw messageError;

      // Navigate to chat session
      router.replace(`/assistant/chat/${session.id}` as any);
    } catch (error) {
      console.error("Error processing report:", error);
      Alert.alert("Error", "Failed to process report");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons
            name="document"
            size={48}
            color={isDark ? "#5FD0D8" : "#007AFF"}
          />
          <Text style={styles.title}>Report Analyzer</Text>
          <Text style={styles.description}>
            Upload medical reports for AI-powered analysis. Get insights on
            normal/abnormal values, trends, and recommendations.
          </Text>
        </View>

        {/* Report Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Report Type</Text>
          <View style={styles.reportTypesGrid}>
            {REPORT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.reportTypeButton,
                  { backgroundColor: isDark ? "#1C1C1E" : "white" },
                  selectedType === type.id && [
                    styles.reportTypeButtonActive,
                    { backgroundColor: isDark ? "#2D89FF" : "#007AFF" },
                  ],
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={
                    selectedType === type.id
                      ? "white"
                      : isDark
                      ? "#8E8E93"
                      : "#666"
                  }
                />
                <Text
                  style={[
                    styles.reportTypeText,
                    selectedType === type.id && styles.reportTypeTextActive,
                  ]}
                >
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Report</Text>

          <TouchableOpacity
            style={[
              styles.uploadButton,
              {
                backgroundColor:
                  !selectedType || uploading
                    ? isDark
                      ? "#38383A"
                      : "#e5e5e5"
                    : isDark
                    ? "#2D89FF"
                    : "#007AFF",
              },
            ]}
            onPress={pickDocument}
            disabled={!selectedType || uploading}
          >
            <Ionicons
              name="cloud-upload"
              size={24}
              color={
                !selectedType || uploading
                  ? isDark
                    ? "#8E8E93"
                    : "#666"
                  : "white"
              }
            />
            <Text
              style={[
                styles.uploadButtonText,
                {
                  color:
                    !selectedType || uploading
                      ? isDark
                        ? "#8E8E93"
                        : "#666"
                      : "white",
                },
              ]}
            >
              {uploading ? "Uploading..." : "Choose Report File"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.uploadInfo}>
            Supported formats: PDF, JPG, PNG (Max 10MB)
          </Text>
        </View>

        {/* Analysis Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Analyze</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={isDark ? "#34C759" : "#32D74B"}
              />
              <Text style={styles.featureText}>
                Normal/Abnormal value identification
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={isDark ? "#34C759" : "#32D74B"}
              />
              <Text style={styles.featureText}>
                Trend analysis and comparisons
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={isDark ? "#34C759" : "#32D74B"}
              />
              <Text style={styles.featureText}>
                Clinical significance explanation
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={isDark ? "#34C759" : "#32D74B"}
              />
              <Text style={styles.featureText}>
                Recommendations and next steps
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={isDark ? "#34C759" : "#32D74B"}
              />
              <Text style={styles.featureText}>Red flag identification</Text>
            </View>
          </View>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={isDark ? "#5FD0D8" : "#007AFF"}
          />
          <View style={styles.privacyContent}>
            <Text style={styles.privacyTitle}>Your Privacy Matters</Text>
            <Text style={styles.privacyText}>
              All uploaded reports are encrypted and stored securely. Your data
              is never shared with third parties.
            </Text>
          </View>
        </View>
      </ScrollView>
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
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      marginBottom: 16,
    },
    reportTypesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    reportTypeButton: {
      flex: 1,
      minWidth: "30%",
      alignItems: "center",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#38383A" : "#e5e5e5",
    },
    reportTypeButtonActive: {
      borderColor: "transparent",
    },
    reportTypeText: {
      fontSize: 12,
      fontWeight: "500",
      color: isDark ? "#8E8E93" : "#666",
      marginTop: 8,
      textAlign: "center",
    },
    reportTypeTextActive: {
      color: "white",
    },
    uploadButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      gap: 12,
    },
    uploadButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    uploadInfo: {
      fontSize: 12,
      color: isDark ? "#8E8E93" : "#666",
      textAlign: "center",
      marginTop: 8,
    },
    featuresList: {
      gap: 12,
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    featureText: {
      fontSize: 14,
      color: isDark ? "#FFFFFF" : "#1a1a1a",
      flex: 1,
    },
    privacyNotice: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 16,
      backgroundColor: isDark
        ? "rgba(95, 208, 216, 0.1)"
        : "rgba(0, 122, 255, 0.1)",
      borderRadius: 8,
      gap: 12,
    },
    privacyContent: {
      flex: 1,
    },
    privacyTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#5FD0D8" : "#007AFF",
      marginBottom: 4,
    },
    privacyText: {
      fontSize: 12,
      color: isDark ? "#5FD0D8" : "#007AFF",
      lineHeight: 16,
    },
  });
