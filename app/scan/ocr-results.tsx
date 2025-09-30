import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/config/SupabaseConfig";
import { SupabaseScanService } from "@/services/supabase/scans";
import { ScanFormData, ScanResult } from "@/types/scan";

/**
 * OCR Results Screen
 * Shows extracted data from scan and allows user to confirm/edit before saving
 */
export default function OCRResultsScreen() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const scanService = SupabaseScanService.getInstance();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [formData, setFormData] = useState<ScanFormData>({
    name: "",
    generic_name: "",
    brand_name: "",
    strength: "",
    current_quantity: 1,
    unit_type: "tablets",
    expiry_date: "",
    manufacture_date: "",
    medicine_type: "otc",
    dosage_instructions: "",
    notes: "",
    batch_number: "",
    manufacturer: "",
    barcode: "",
  });

  /**
   * Load scan data
   */
  useEffect(() => {
    if (user && scanId) {
      loadScanData();
    }
  }, [user, scanId]);

  /**
   * Fetch scan details and populate form
   */
  const loadScanData = async () => {
    try {
      setLoading(true);

      const scanData = await scanService.getScanById(scanId, user!.id);

      if (!scanData) {
        Alert.alert("Error", "Scan not found");
        router.back();
        return;
      }

      setScan(scanData);

      // Pre-fill form with parsed data
      if (scanData.parsed_data) {
        setFormData({
          name: scanData.parsed_data.name || "",
          generic_name: scanData.parsed_data.generic_name || "",
          brand_name: scanData.parsed_data.brand_name || "",
          strength: scanData.parsed_data.strength || "",
          current_quantity: 1,
          unit_type: "tablets",
          expiry_date: scanData.parsed_data.expiry_date || "",
          manufacture_date: scanData.parsed_data.manufacture_date || "",
          medicine_type: "otc",
          dosage_instructions: "",
          notes: "",
          batch_number: scanData.parsed_data.batch_number || "",
          manufacturer: scanData.parsed_data.manufacturer || "",
          barcode: scanData.parsed_data.barcode || "",
        });
      }
    } catch (error) {
      console.error("Error loading scan:", error);
      Alert.alert("Error", "Failed to load scan data");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update form field
   */
  const updateField = (field: keyof ScanFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Get confidence indicator
   */
  const getConfidenceColor = (confidence?: number): string => {
    if (!confidence) return isDark ? "#636366" : "#8E8E93";
    if (confidence >= 0.8) return isDark ? "#30D158" : "#28A745";
    if (confidence >= 0.6) return isDark ? "#FF9F0A" : "#FFC107";
    return isDark ? "#FF453A" : "#DC3545";
  };

  /**
   * Save medicine to database
   */
  const handleSave = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      Alert.alert("Validation Error", "Medicine name is required");
      return;
    }

    setSaving(true);

    try {
      // Get user UUID
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user!.id)
        .single();

      if (userError || !userData) {
        throw new Error("User not found");
      }

      // Insert medicine
      const { data: medicine, error: medicineError } = await supabase
        .from("medicines")
        .insert([
          {
            user_id: userData.id,
            name: formData.name.trim(),
            generic_name: formData.generic_name?.trim(),
            brand_name: formData.brand_name?.trim(),
            strength: formData.strength?.trim(),
            current_quantity: formData.current_quantity,
            unit_type: formData.unit_type,
            expiry_date: formData.expiry_date || null,
            manufacture_date: formData.manufacture_date || null,
            medicine_type: formData.medicine_type,
            dosage_instructions: formData.dosage_instructions?.trim(),
            notes: formData.notes?.trim(),
            batch_number: formData.batch_number?.trim(),
            manufacturer: formData.manufacturer?.trim(),
            barcode: formData.barcode?.trim(),
            status: "active",
            is_shared: false,
            is_donated: false,
            currency: "GBP",
          },
        ])
        .select()
        .single();

      if (medicineError) throw medicineError;

      // Link scan to medicine
      await scanService.linkScanToMedicine(scanId, medicine.id, user!.id);

      Alert.alert("Success", "Medicine added successfully!", [
        {
          text: "View Medicine",
          onPress: () => router.replace(`/medicines/${medicine.id}`),
        },
        {
          text: "Done",
          onPress: () => router.replace("/medicines" as any),
        },
      ]);
    } catch (error) {
      console.error("Error saving medicine:", error);
      Alert.alert("Error", "Failed to save medicine");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
            Loading scan results...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!scan) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000000" : "#F8F9FA" },
        ]}
      >
        <View style={styles.loadingContainer}>
          <Ionicons
            name="alert-circle"
            size={64}
            color={isDark ? "#FF453A" : "#DC3545"}
          />
          <Text
            style={[
              styles.errorText,
              { color: isDark ? "#FFFFFF" : "#1D1D1F" },
            ]}
          >
            Scan not found
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
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
          <Text
            style={[styles.title, { color: isDark ? "#FFFFFF" : "#1D1D1F" }]}
          >
            Confirm Details
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={saving}
          >
            <Text
              style={[
                styles.saveText,
                { color: isDark ? "#0A84FF" : "#007AFF" },
              ]}
            >
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: Platform.OS === "android" ? 100 : 50,
          }}
        >
          {/* Confidence Score */}
          {scan.confidence_score !== undefined && (
            <View
              style={[
                styles.confidenceCard,
                { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
              ]}
            >
              <View style={styles.confidenceHeader}>
                <Ionicons
                  name="analytics"
                  size={20}
                  color={getConfidenceColor(scan.confidence_score)}
                />
                <Text
                  style={[
                    styles.confidenceTitle,
                    { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                  ]}
                >
                  Extraction Confidence
                </Text>
              </View>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceBarFill,
                    {
                      width: `${scan.confidence_score * 100}%`,
                      backgroundColor: getConfidenceColor(
                        scan.confidence_score
                      ),
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.confidenceText,
                  { color: isDark ? "#8E8E93" : "#636366" },
                ]}
              >
                {Math.round(scan.confidence_score * 100)}% confidence • Please
                verify the extracted data
              </Text>
            </View>
          )}

          {/* Extracted Data - Editable Fields */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? "#FFFFFF" : "#1D1D1F" },
              ]}
            >
              Medicine Information
            </Text>

            {/* Name */}
            <View style={styles.fieldContainer}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? "#8E8E93" : "#636366" },
                ]}
              >
                Medicine Name *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                ]}
              >
                <Text
                  style={[
                    styles.inputText,
                    { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                  ]}
                >
                  {formData.name || "Not detected"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.prompt(
                      "Medicine Name",
                      "Enter medicine name",
                      (text) => updateField("name", text),
                      "plain-text",
                      formData.name
                    );
                  }}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={isDark ? "#0A84FF" : "#007AFF"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Strength */}
            <View style={styles.fieldContainer}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? "#8E8E93" : "#636366" },
                ]}
              >
                Strength
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                ]}
              >
                <Text
                  style={[
                    styles.inputText,
                    { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                  ]}
                >
                  {formData.strength || "Not detected"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.prompt(
                      "Strength",
                      "Enter strength (e.g., 500mg)",
                      (text) => updateField("strength", text),
                      "plain-text",
                      formData.strength
                    );
                  }}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={isDark ? "#0A84FF" : "#007AFF"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Expiry Date */}
            <View style={styles.fieldContainer}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? "#8E8E93" : "#636366" },
                ]}
              >
                Expiry Date
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                ]}
              >
                <Text
                  style={[
                    styles.inputText,
                    { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                  ]}
                >
                  {formData.expiry_date
                    ? new Date(formData.expiry_date).toLocaleDateString()
                    : "Not detected"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.prompt(
                      "Expiry Date",
                      "Enter date (YYYY-MM-DD)",
                      (text) => updateField("expiry_date", text),
                      "plain-text",
                      formData.expiry_date
                    );
                  }}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={isDark ? "#0A84FF" : "#007AFF"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Batch Number */}
            {formData.batch_number && (
              <View style={styles.fieldContainer}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: isDark ? "#8E8E93" : "#636366" },
                  ]}
                >
                  Batch Number
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                  ]}
                >
                  <Text
                    style={[
                      styles.inputText,
                      { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                    ]}
                  >
                    {formData.batch_number}
                  </Text>
                </View>
              </View>
            )}

            {/* Manufacturer */}
            {formData.manufacturer && (
              <View style={styles.fieldContainer}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: isDark ? "#8E8E93" : "#636366" },
                  ]}
                >
                  Manufacturer
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                  ]}
                >
                  <Text
                    style={[
                      styles.inputText,
                      { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                    ]}
                  >
                    {formData.manufacturer}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Raw OCR Text (collapsible) */}
          {scan.raw_ocr_text && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.rawTextHeader}
                onPress={() => Alert.alert("Raw OCR Text", scan.raw_ocr_text)}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                  ]}
                >
                  Raw Extracted Text
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? "#0A84FF" : "#007AFF"}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.editButton,
                { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
              ]}
              onPress={() =>
                router.push(`/scan/manual-entry?scanId=${scanId}` as any)
              }
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={isDark ? "#0A84FF" : "#007AFF"}
              />
              <Text
                style={[
                  styles.editButtonText,
                  { color: isDark ? "#0A84FF" : "#007AFF" },
                ]}
              >
                Edit All Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButtonLarge,
                { backgroundColor: isDark ? "#0A84FF" : "#007AFF" },
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonLargeText}>Save Medicine</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  confidenceCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confidenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  confidenceTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  confidenceBar: {
    height: 8,
    backgroundColor: "rgba(142, 142, 147, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  confidenceBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
  },
  inputText: {
    fontSize: 16,
    flex: 1,
  },
  rawTextHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonLargeText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
