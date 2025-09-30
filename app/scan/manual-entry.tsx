import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

import { supabase } from "@/config/SupabaseConfig";
import { SupabaseScanService } from "@/services/supabase/scans";
import { ScanFormData } from "@/types/scan";

/**
 * Manual Entry Screen
 * Allows user to manually enter medicine details
 * Can be used standalone or to complete/edit OCR results
 */
export default function ManualEntryScreen() {
  const { scanId, barcode } = useLocalSearchParams<{
    scanId?: string;
    barcode?: string;
  }>();
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const scanService = SupabaseScanService.getInstance();

  const [saving, setSaving] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showManufacturePicker, setShowManufacturePicker] = useState(false);

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
    barcode: barcode || "",
  });

  /**
   * Load scan data if editing
   */
  useEffect(() => {
    if (scanId && user) {
      loadScanData();
    }
  }, [scanId, user]);

  /**
   * Load existing scan data for editing
   */
  const loadScanData = async () => {
    try {
      const scan = await scanService.getScanById(scanId!, user!.id);

      if (scan?.parsed_data) {
        setFormData((prev) => ({
          ...prev,
          name: scan.parsed_data?.name || "",
          generic_name: scan.parsed_data?.generic_name || "",
          brand_name: scan.parsed_data?.brand_name || "",
          strength: scan.parsed_data?.strength || "",
          expiry_date: scan.parsed_data?.expiry_date || "",
          manufacture_date: scan.parsed_data?.manufacture_date || "",
          batch_number: scan.parsed_data?.batch_number || "",
          manufacturer: scan.parsed_data?.manufacturer || "",
          barcode: scan.parsed_data?.barcode || prev.barcode,
        }));
      }
    } catch (error) {
      console.error("Error loading scan:", error);
    }
  };

  /**
   * Update form field
   */
  const updateField = (field: keyof ScanFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Format date string
   */
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  /**
   * Show medicine type picker
   */
  const showMedicineTypePicker = () => {
    Alert.alert("Select Medicine Type", "", [
      {
        text: "OTC (Over-the-counter)",
        onPress: () => updateField("medicine_type", "otc"),
      },
      {
        text: "Prescription",
        onPress: () => updateField("medicine_type", "prescription"),
      },
      {
        text: "Herbal/Natural",
        onPress: () => updateField("medicine_type", "herbal"),
      },
      {
        text: "Supplement",
        onPress: () => updateField("medicine_type", "supplement"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  /**
   * Show unit type picker
   */
  const showUnitTypePicker = () => {
    Alert.alert("Select Unit Type", "", [
      { text: "Tablets", onPress: () => updateField("unit_type", "tablets") },
      { text: "Capsules", onPress: () => updateField("unit_type", "capsules") },
      { text: "ml (Liquid)", onPress: () => updateField("unit_type", "ml") },
      { text: "mg (Powder)", onPress: () => updateField("unit_type", "mg") },
      { text: "Drops", onPress: () => updateField("unit_type", "drops") },
      { text: "Sachets", onPress: () => updateField("unit_type", "sachets") },
      {
        text: "Injections",
        onPress: () => updateField("unit_type", "injections"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  /**
   * Format medicine/unit type for display
   */
  const formatType = (type: string): string => {
    const formatted: Record<string, string> = {
      otc: "OTC",
      prescription: "Prescription",
      herbal: "Herbal/Natural",
      supplement: "Supplement",
      tablets: "Tablets",
      capsules: "Capsules",
      ml: "ml",
      mg: "mg",
      drops: "Drops",
      sachets: "Sachets",
      injections: "Injections",
    };
    return formatted[type] || type.charAt(0).toUpperCase() + type.slice(1);
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

      // Create scan record if manual entry (no scanId)
      let finalScanId = scanId;
      if (!scanId) {
        const scan = await scanService.createScan(user!.id, {
          scan_type: "manual",
          parsed_data: formData,
          processing_status: "completed",
        });
        finalScanId = scan.id;
      }

      // Insert medicine
      const { data: medicine, error: medicineError } = await supabase
        .from("medicines")
        .insert([
          {
            user_id: userData.id,
            name: formData.name.trim(),
            generic_name: formData.generic_name?.trim() || null,
            brand_name: formData.brand_name?.trim() || null,
            strength: formData.strength?.trim() || null,
            current_quantity: formData.current_quantity,
            unit_type: formData.unit_type,
            expiry_date: formData.expiry_date || null,
            manufacture_date: formData.manufacture_date || null,
            medicine_type: formData.medicine_type,
            dosage_instructions: formData.dosage_instructions?.trim() || null,
            notes: formData.notes?.trim() || null,
            batch_number: formData.batch_number?.trim() || null,
            manufacturer: formData.manufacturer?.trim() || null,
            barcode: formData.barcode?.trim() || null,
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
      if (finalScanId) {
        await scanService.linkScanToMedicine(
          finalScanId,
          medicine.id,
          user!.id
        );
      }

      Alert.alert("Success", "Medicine added successfully!", [
        {
          text: "View Medicine",
          onPress: () => router.replace(`/medicines/${medicine.id}`),
        },
        {
          text: "Add Another",
          onPress: () => {
            setFormData({
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
          },
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
            {scanId ? "Edit Details" : "Add Medicine"}
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
          {/* Basic Information Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? "#FFFFFF" : "#1D1D1F" },
              ]}
            >
              Basic Information
            </Text>

            {/* Medicine Name */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? "#8E8E93" : "#636366" },
                ]}
              >
                Medicine Name *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                    color: isDark ? "#FFFFFF" : "#1D1D1F",
                  },
                ]}
                value={formData.name}
                onChangeText={(value) => updateField("name", value)}
                placeholder="e.g., Paracetamol"
                placeholderTextColor={isDark ? "#636366" : "#8E8E93"}
              />
            </View>

            {/* Generic and Brand Name Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? "#8E8E93" : "#636366" },
                  ]}
                >
                  Generic Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                      color: isDark ? "#FFFFFF" : "#1D1D1F",
                    },
                  ]}
                  value={formData.generic_name}
                  onChangeText={(value) => updateField("generic_name", value)}
                  placeholder="e.g., Acetaminophen"
                  placeholderTextColor={isDark ? "#636366" : "#8E8E93"}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? "#8E8E93" : "#636366" },
                  ]}
                >
                  Brand Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                      color: isDark ? "#FFFFFF" : "#1D1D1F",
                    },
                  ]}
                  value={formData.brand_name}
                  onChangeText={(value) => updateField("brand_name", value)}
                  placeholder="e.g., Panadol"
                  placeholderTextColor={isDark ? "#636366" : "#8E8E93"}
                />
              </View>
            </View>

            {/* Strength and Type Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? "#8E8E93" : "#636366" },
                  ]}
                >
                  Strength
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                      color: isDark ? "#FFFFFF" : "#1D1D1F",
                    },
                  ]}
                  value={formData.strength}
                  onChangeText={(value) => updateField("strength", value)}
                  placeholder="e.g., 500mg"
                  placeholderTextColor={isDark ? "#636366" : "#8E8E93"}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? "#8E8E93" : "#636366" },
                  ]}
                >
                  Type
                </Text>
                <TouchableOpacity
                  style={[
                    styles.picker,
                    { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                  ]}
                  onPress={showMedicineTypePicker}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                    ]}
                  >
                    {formatType(formData.medicine_type)}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={isDark ? "#8E8E93" : "#636366"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Quantity & Dates Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? "#FFFFFF" : "#1D1D1F" },
              ]}
            >
              Quantity & Dates
            </Text>

            {/* Quantity and Unit Type Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? "#8E8E93" : "#636366" },
                  ]}
                >
                  Quantity
                </Text>
                <View
                  style={[
                    styles.quantityContainer,
                    { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      updateField(
                        "current_quantity",
                        Math.max(1, formData.current_quantity - 1)
                      )
                    }
                  >
                    <Ionicons
                      name="remove"
                      size={20}
                      color={isDark ? "#0A84FF" : "#007AFF"}
                    />
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.quantityText,
                      { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                    ]}
                  >
                    {formData.current_quantity}
                  </Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      updateField(
                        "current_quantity",
                        formData.current_quantity + 1
                      )
                    }
                  >
                    <Ionicons
                      name="add"
                      size={20}
                      color={isDark ? "#0A84FF" : "#007AFF"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? "#8E8E93" : "#636366" },
                  ]}
                >
                  Unit Type
                </Text>
                <TouchableOpacity
                  style={[
                    styles.picker,
                    { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                  ]}
                  onPress={showUnitTypePicker}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                    ]}
                  >
                    {formatType(formData.unit_type)}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={isDark ? "#8E8E93" : "#636366"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Dates Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? "#8E8E93" : "#636366" },
                  ]}
                >
                  Expiry Date
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                  ]}
                  onPress={() => setShowExpiryPicker(true)}
                >
                  <Text
                    style={[
                      styles.dateButtonText,
                      { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                    ]}
                  >
                    {formatDate(formData.expiry_date)}
                  </Text>
                  <Ionicons
                    name="calendar"
                    size={16}
                    color={isDark ? "#8E8E93" : "#636366"}
                  />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? "#8E8E93" : "#636366" },
                  ]}
                >
                  Manufacture Date
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
                  ]}
                  onPress={() => setShowManufacturePicker(true)}
                >
                  <Text
                    style={[
                      styles.dateButtonText,
                      { color: isDark ? "#FFFFFF" : "#1D1D1F" },
                    ]}
                  >
                    {formatDate(formData.manufacture_date)}
                  </Text>
                  <Ionicons
                    name="calendar"
                    size={16}
                    color={isDark ? "#8E8E93" : "#636366"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Additional Information Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? "#FFFFFF" : "#1D1D1F" },
              ]}
            >
              Additional Information
            </Text>

            {/* Batch Number */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? "#8E8E93" : "#636366" },
                ]}
              >
                Batch Number
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                    color: isDark ? "#FFFFFF" : "#1D1D1F",
                  },
                ]}
                value={formData.batch_number}
                onChangeText={(value) => updateField("batch_number", value)}
                placeholder="e.g., ABC123"
                placeholderTextColor={isDark ? "#636366" : "#8E8E93"}
              />
            </View>

            {/* Manufacturer */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? "#8E8E93" : "#636366" },
                ]}
              >
                Manufacturer
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                    color: isDark ? "#FFFFFF" : "#1D1D1F",
                  },
                ]}
                value={formData.manufacturer}
                onChangeText={(value) => updateField("manufacturer", value)}
                placeholder="e.g., XYZ Pharma"
                placeholderTextColor={isDark ? "#636366" : "#8E8E93"}
              />
            </View>

            {/* Barcode (if exists) */}
            {formData.barcode && (
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? "#8E8E93" : "#636366" },
                  ]}
                >
                  Barcode
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                      color: isDark ? "#FFFFFF" : "#1D1D1F",
                    },
                  ]}
                  value={formData.barcode}
                  editable={false}
                />
              </View>
            )}

            {/* Dosage Instructions */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? "#8E8E93" : "#636366" },
                ]}
              >
                Dosage Instructions
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                    color: isDark ? "#FFFFFF" : "#1D1D1F",
                  },
                ]}
                value={formData.dosage_instructions}
                onChangeText={(value) =>
                  updateField("dosage_instructions", value)
                }
                placeholder="e.g., Take 1 tablet every 6 hours"
                placeholderTextColor={isDark ? "#636366" : "#8E8E93"}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? "#8E8E93" : "#636366" },
                ]}
              >
                Notes
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                    color: isDark ? "#FFFFFF" : "#1D1D1F",
                  },
                ]}
                value={formData.notes}
                onChangeText={(value) => updateField("notes", value)}
                placeholder="Any additional notes..."
                placeholderTextColor={isDark ? "#636366" : "#8E8E93"}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>

        {/* Date Pickers */}
        {showExpiryPicker && (
          <DateTimePicker
            value={
              formData.expiry_date ? new Date(formData.expiry_date) : new Date()
            }
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowExpiryPicker(false);
              if (date) {
                updateField("expiry_date", date.toISOString().split("T")[0]);
              }
            }}
          />
        )}

        {showManufacturePicker && (
          <DateTimePicker
            value={
              formData.manufacture_date
                ? new Date(formData.manufacture_date)
                : new Date()
            }
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowManufacturePicker(false);
              if (date) {
                updateField(
                  "manufacture_date",
                  date.toISOString().split("T")[0]
                );
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
  },
  quantityButton: {
    padding: 12,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "center",
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 16,
  },
  pickerText: {
    fontSize: 16,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 16,
  },
  dateButtonText: {
    fontSize: 16,
  },
});
