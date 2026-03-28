import { supabase } from "@/config/SupabaseConfig";
import { MedicineFormData } from "@/types/medicine";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import color from "@/shared/color";
import { NotificationService } from "@/services/notifications/notificationService";

/**
 * EditMedicineScreen
 * Refactored for premium consistency and robust notification management.
 * High-end UI with automatic re-scheduling of expiry alerts.
 */
export default function EditMedicineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);
  
  const notificationService = NotificationService.getInstance();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [formData, setFormData] = useState<MedicineFormData>({
    name: "",
    generic_name: "",
    strength: "",
    current_quantity: 1,
    unit_type: "tablets",
    expiry_date: "",
    medicine_type: "otc",
    dosage_instructions: "",
    notes: "",
  });

  const fetchMedicine = useCallback(async () => {
    if (!user || !id) return;
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name,
          generic_name: data.generic_name || "",
          strength: data.strength || "",
          current_quantity: data.current_quantity,
          unit_type: data.unit_type,
          expiry_date: data.expiry_date || "",
          medicine_type: data.medicine_type,
          dosage_instructions: data.dosage_instructions || "",
          notes: data.notes || "",
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert("Failed", "We couldn't retrieve this medicine's details.");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchMedicine();
  }, [fetchMedicine]);

  const updateField = (field: keyof MedicineFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("medicines")
        .update({
          name: formData.name.trim(),
          generic_name: formData.generic_name?.trim(),
          strength: formData.strength?.trim(),
          current_quantity: formData.current_quantity,
          unit_type: formData.unit_type,
          expiry_date: formData.expiry_date || null,
          medicine_type: formData.medicine_type,
          dosage_instructions: formData.dosage_instructions?.trim(),
          notes: formData.notes?.trim(),
        })
        .eq("id", id!);

      if (error) throw error;

      // Reset and Reschedule notifications
      await notificationService.cancelMedicineNotifications(id!);
      if (formData.expiry_date) {
        await notificationService.scheduleExpiryAlert(id!, formData.name, formData.expiry_date);
      }

      Alert.alert("Success", "Medicine information updated.", [
        { text: "Done", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Update Error:", error);
      Alert.alert("Error", "Failed to update record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert("Delete Medicine", "Are you sure you want to remove this from your inventory?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await notificationService.cancelMedicineNotifications(id!);
            const { error } = await supabase.from("medicines").delete().eq("id", id!);
            if (error) throw error;
            router.replace("/(tabs)/Medicine" as any);
          } catch (err) {
            Alert.alert("Error", "Could not delete at this time.");
          }
        }
      }
    ]);
  };

  const CustomInput = ({ label, value, onChange, required, isDark }: any) => (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{label} {required && "*"}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: isDark ? "#2C2C2E" : "#F2F4F7", color: isDark ? "white" : "black" }]}
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#8E8E93"
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={color.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={24} color={isDark ? "white" : "black"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Details</Text>
          <TouchableOpacity onPress={handleUpdate} disabled={saving} style={styles.headerBtn}>
            {saving ? <ActivityIndicator size="small" color={color.PRIMARY} /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          <Text style={styles.sectionTitle}>Essential Details</Text>
          <View style={styles.card}>
            <CustomInput label="Medicine Name" value={formData.name} onChange={(t: string) => updateField("name", t)} required isDark={isDark} />
            <CustomInput label="Strength" value={formData.strength} onChange={(t: string) => updateField("strength", t)} isDark={isDark} />
          </View>

          <Text style={styles.sectionTitle}>Inventory Control</Text>
          <View style={styles.card}>
             <View style={styles.row}>
               <View style={{ flex: 1, marginRight: 10 }}>
                 <Text style={styles.label}>Quantity</Text>
                 <View style={styles.qtyRow}>
                   <TouchableOpacity onPress={() => updateField("current_quantity", Math.max(0, formData.current_quantity - 1))} style={styles.qtyBtn}>
                     <Ionicons name="remove" size={18} color={color.PRIMARY} />
                   </TouchableOpacity>
                   <Text style={[styles.qtyText, { color: isDark ? "white" : "black" }]}>{formData.current_quantity}</Text>
                   <TouchableOpacity onPress={() => updateField("current_quantity", formData.current_quantity + 1)} style={styles.qtyBtn}>
                     <Ionicons name="add" size={18} color={color.PRIMARY} />
                   </TouchableOpacity>
                 </View>
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={styles.label}>Expiry Date</Text>
                 <TouchableOpacity onPress={() => setShowExpiryPicker(true)} style={[styles.dateBtn, { backgroundColor: isDark ? "#2C2C2E" : "#F2F4F7" }]}>
                   <Ionicons name="calendar-outline" size={18} color="#8E8E93" />
                   <Text style={{ color: formData.expiry_date ? (isDark ? 'white' : 'black') : '#8E8E93', fontSize: 13 }}>
                     {formData.expiry_date ? new Date(formData.expiry_date).toLocaleDateString() : "Select Date"}
                   </Text>
                 </TouchableOpacity>
               </View>
             </View>
          </View>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteText}>Remove Medicine</Text>
          </TouchableOpacity>
        </ScrollView>

        {showExpiryPicker && (
          <DateTimePicker
            value={formData.expiry_date ? new Date(formData.expiry_date) : new Date()}
            mode="date"
            onChange={(e, date) => {
              setShowExpiryPicker(false);
              if (date) updateField("expiry_date", date.toISOString().split("T")[0]);
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF" },
  center: { justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  headerBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "PoppinsRegular", fontWeight: "bold", color: isDark ? "white" : "black" },
  saveText: { color: color.PRIMARY, fontSize: 16, fontFamily: "PoppinsRegular", fontWeight: "bold" },
  content: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, fontFamily: "PoppinsRegular", fontWeight: "bold", color: "#8E8E93", marginTop: 24, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
  card: { backgroundColor: isDark ? "#1C1C1E" : "white", padding: 20, borderRadius: 24, gap: 16, borderWidth: 1, borderColor: isDark ? "#2C2C2E" : "#ECEEF2" },
  inputWrap: { gap: 8 },
  label: { fontSize: 13, fontFamily: "PoppinsRegular", fontWeight: "600", color: "#8E8E93" },
  input: { height: 50, borderRadius: 14, paddingHorizontal: 16, fontSize: 15, fontFamily: "PoppinsRegular" },
  row: { flexDirection: "row" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 16, height: 50, borderRadius: 14, backgroundColor: isDark ? "#2C2C2E" : "#F2F4F7", paddingHorizontal: 12 },
  qtyBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: color.PRIMARY + "15", justifyContent: "center", alignItems: "center" },
  qtyText: { fontSize: 16, fontFamily: "PoppinsRegular", fontWeight: "bold", minWidth: 20, textAlign: "center" },
  dateBtn: { height: 50, borderRadius: 14, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10 },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 32, padding: 16, borderRadius: 16, backgroundColor: "#FF3B3010", gap: 8 },
  deleteText: { color: "#FF3B30", fontSize: 15, fontFamily: "PoppinsRegular", fontWeight: "bold" },
});
