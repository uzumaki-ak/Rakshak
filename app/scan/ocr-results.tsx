import { useAuthContext } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
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
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/config/SupabaseConfig";
import { SupabaseScanService } from "@/services/supabase/scans";
import { ScanFormData, ScanResult } from "@/types/scan";
import color from "@/shared/color";


/**
 * OCRResultsScreen
 * Review and edit AI-extracted medicine data before saving.
 * Refactored for premium UI consistency and robust data integration.
 */
export default function OCRResultsScreen() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);

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

  const loadScanData = useCallback(async () => {
    if (!user || !scanId) return;

    try {
      setLoading(true);
      const scanData = await scanService.getScanById(scanId, user.id);

      if (!scanData) {
        Alert.alert("Not Found", "We couldn't retrieve this scan record.");
        router.back();
        return;
      }

      setScan(scanData);

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
      console.error("Load Scan Error:", error);
    } finally {
      setLoading(false);
    }
  }, [user, scanId, scanService, router]);

  useEffect(() => {
    loadScanData();
  }, [loadScanData]);

  const updateField = (field: keyof ScanFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Required", "Medicine name is needed to save.");
      return;
    }

    setSaving(true);
    try {
      const { data: medicine, error: medError } = await supabase
        .from("medicines")
        .insert([
          {
            user_id: user!.id,
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
            is_shared: false,
            is_donated: false,
            status: "active",
            currency: "GBP"
          },
        ])
        .select()
        .single();

      if (medError) throw medError;

      await scanService.linkScanToMedicine(scanId!, medicine.id, user!.id);

      Alert.alert("Success", "Medicine secured and added to inventory!", [
        { text: "View Detail", onPress: () => router.replace(`/medicines/${medicine.id}`) },
        { text: "Finish", onPress: () => router.replace("/(tabs)/Medicine" as any) },
      ]);
    } catch (error) {
      console.error("Save Error:", error);
      Alert.alert("Error", "Failed to save medicine data.");
    } finally {
      setSaving(false);
    }
  };

  const EditableField = ({ label, value, onChange, placeholder, isDark: fieldIsDark, required, icon, ...props }: any) => (
    <View style={styles.fieldWrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{label} {required && "*"}</Text>
      </View>
      <View style={[styles.inputBox, { backgroundColor: fieldIsDark ? "#2C2C2E" : "#F2F4F7" }]}>
        {icon && <Ionicons name={icon} size={18} color="#8E8E93" style={{ marginRight: 10 }} />}
        <TextInput
          style={[styles.input, { color: fieldIsDark ? "#FFFFFF" : "#1A1A1E" }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          placeholderTextColor="#636366"
          {...props}
        />
      </View>
    </View>
  );

  if (loading || authLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={color.PRIMARY} />
        <Text style={styles.loadingText}>Verifying AI Extraction...</Text>
      </SafeAreaView>
    );
  }

  const confidence = scan?.confidence_score || 0;
  const confidenceColor = confidence > 0.8 ? "#34C759" : confidence > 0.5 ? "#FF9500" : "#FF3B30";

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={isDark ? "#FFFFFF" : "#1A1A1E"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Results</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={color.PRIMARY} /> : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Confidence Indicator */}
          <View style={[styles.confidenceCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
            <View style={styles.confHeader}>
              <Ionicons name="shield-checkmark" size={18} color={confidenceColor} />
              <Text style={[styles.confLabel, { color: isDark ? "#FFFFFF" : "#1A1A1E" }]}>AI Confidence Rating</Text>
              <Text style={[styles.confPercent, { color: confidenceColor }]}>
                {Math.round(confidence * 100)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${confidence * 100}%`, backgroundColor: confidenceColor }]} />
            </View>
            <Text style={styles.confSub}>Please verify the information below is correct.</Text>
          </View>

          <Text style={styles.sectionTitle}>Main Details</Text>
          <View style={styles.card}>
            <EditableField label="Medicine Name" value={formData.name} onChange={(t: string) => updateField("name", t)} isDark={isDark} required />
            <EditableField label="Generic Name" value={formData.generic_name} onChange={(t: string) => updateField("generic_name", t)} isDark={isDark} />
            <EditableField label="Strength" value={formData.strength} placeholder="e.g. 500mg" onChange={(t: string) => updateField("strength", t)} isDark={isDark} />
          </View>

          <Text style={styles.sectionTitle}>Inventory & Dates</Text>
          <View style={styles.card}>
            <EditableField label="Expiry Date" value={formData.expiry_date} placeholder="YYYY-MM-DD" onChange={(t: string) => updateField("expiry_date", t)} isDark={isDark} icon="calendar-outline" />
            <EditableField label="Quantity" value={formData.current_quantity.toString()} keyboardType="numeric" onChange={(t: string) => updateField("current_quantity", parseInt(t) || 0)} isDark={isDark} icon="layers-outline" />
            <EditableField label="Manufacturer" value={formData.manufacturer} onChange={(t: string) => updateField("manufacturer", t)} isDark={isDark} icon="business-outline" />
          </View>
        </ScrollView>
        
        <View style={styles.footerAction}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.primaryBtnText}>{saving ? "Securing..." : "Add to Inventory"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF",
    },
    center: {
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 16,
      fontFamily: "PoppinsRegular",
      color: "#8E8E93",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: "PoppinsRegular",
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#1A1A1E",
    },
    backBtn: {
      width: 40,
      height: 40,
      justifyContent: "center",
    },
    saveText: {
      color: color.PRIMARY,
      fontSize: 16,
      fontFamily: "PoppinsRegular",
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    confidenceCard: {
      padding: 20,
      borderRadius: 24,
      marginTop: 10,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isDark ? "#2C2C2E" : "#ECEEF2",
    },
    confHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      gap: 8,
    },
    confLabel: {
      flex: 1,
      fontSize: 14,
      fontFamily: "PoppinsRegular",
      fontWeight: "600",
    },
    confPercent: {
      fontSize: 16,
      fontFamily: "PoppinsRegular",
      fontWeight: "bold",
    },
    progressBar: {
      height: 6,
      backgroundColor: isDark ? "#2C2C2E" : "#F2F4F7",
      borderRadius: 3,
      overflow: "hidden",
      marginBottom: 10,
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
    },
    confSub: {
      fontSize: 12,
      fontFamily: "PoppinsRegular",
      color: "#8E8E93",
    },
    sectionTitle: {
      fontSize: 15,
      fontFamily: "PoppinsRegular",
      fontWeight: "bold",
      color: isDark ? "#FFFFFF" : "#1A1A1E",
      marginBottom: 16,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    card: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 24,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isDark ? "#2C2C2E" : "#ECEEF2",
    },
    fieldWrapper: {
      marginBottom: 16,
    },
    labelRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    fieldLabel: {
      fontSize: 13,
      fontFamily: "PoppinsRegular",
      fontWeight: "600",
      color: "#8E8E93",
    },
    inputBox: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      height: 50,
      borderRadius: 14,
    },
    input: {
      flex: 1,
      fontSize: 15,
      fontFamily: "PoppinsRegular",
    },
    footerAction: {
      padding: 20,
      backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF",
    },
    primaryBtn: {
      backgroundColor: color.PRIMARY,
      height: 56,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: color.PRIMARY,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
      elevation: 5,
    },
    primaryBtnText: {
      color: "white",
      fontSize: 17,
      fontFamily: "PoppinsRegular",
      fontWeight: "bold",
    },
  });
