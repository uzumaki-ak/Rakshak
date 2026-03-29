import { supabase } from "@/config/SupabaseConfig";
import { MedicineFormData } from "@/types/medicine";
import { useAuthContext } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import color from "@/shared/color";
import { NotificationService } from "@/services/notifications/notificationService";

/**
 * AddMedicineScreen
 * Modernized flow for manual medicine entry.
 * Features: Premium UI, Type Safety, Automatic Expiry Alerts, Daily Dose Reminders.
 */
export default function AddMedicineScreen() {
  const { user } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = createStyles(isDark);
  
  const notificationService = NotificationService.getInstance();

  const [loading, setLoading] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
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
    intake_times: [],
  });

  const updateField = (field: keyof MedicineFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addIntakeTime = (time: string) => {
    if (formData.intake_times?.includes(time)) return;
    setFormData((prev) => ({
      ...prev,
      intake_times: [...(prev.intake_times || []), time].sort(),
    }));
  };

  const removeIntakeTime = (time: string) => {
    setFormData((prev) => ({
      ...prev,
      intake_times: prev.intake_times?.filter((t) => t !== time),
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Required", "Please enter the medicine name.");
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      const { data: medicine, error } = await supabase
        .from("medicines")
        .insert([{
          user_id: user.id,
          name: formData.name.trim(),
          generic_name: formData.generic_name?.trim(),
          strength: formData.strength?.trim(),
          current_quantity: formData.current_quantity,
          unit_type: formData.unit_type,
          expiry_date: formData.expiry_date || null,
          medicine_type: formData.medicine_type,
          dosage_instructions: formData.dosage_instructions?.trim(),
          notes: formData.notes?.trim(),
          intake_times: formData.intake_times,
          status: "active",
          is_shared: false,
          is_donated: false,
          currency: "GBP"
        }])
        .select()
        .single();

      if (error) throw error;

      // Schedule notifications — wrapped separately so they don't block the save
      try {
        if (formData.expiry_date) {
          await notificationService.scheduleExpiryAlert(medicine.id, medicine.name, formData.expiry_date);
        }
        if (formData.intake_times && formData.intake_times.length > 0) {
          await notificationService.scheduleIntakeReminders(medicine.id, medicine.name, formData.intake_times);
        }
      } catch (notifError) {
        console.warn("Notification scheduling skipped:", notifError);
      }

      Alert.alert("Success", `${formData.name} added to your vault.`, [
        { text: "Done", onPress: () => router.replace("/(tabs)/Medicine" as any) }
      ]);

    } catch (error) {
      console.error("Save Error:", error);
      Alert.alert("Error", "Failed to save medicine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color={isDark ? "white" : "black"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manual Entry</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.headerBtn}>
            {loading ? <ActivityIndicator size="small" color={color.PRIMARY} /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.sectionTitle}>Essential Details</Text>
          <View style={styles.card}>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Medicine Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? "#2C2C2E" : "#F2F4F7", color: isDark ? "white" : "black" }]}
                value={formData.name}
                onChangeText={(t) => updateField("name", t)}
                placeholder="Enter medicine name"
                placeholderTextColor="#8E8E93"
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Strength (e.g. 500mg)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? "#2C2C2E" : "#F2F4F7", color: isDark ? "white" : "black" }]}
                value={formData.strength}
                onChangeText={(t) => updateField("strength", t)}
                placeholder="Enter strength"
                placeholderTextColor="#8E8E93"
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Generic Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? "#2C2C2E" : "#F2F4F7", color: isDark ? "white" : "black" }]}
                value={formData.generic_name}
                onChangeText={(t) => updateField("generic_name", t)}
                placeholder="Enter generic name"
                placeholderTextColor="#8E8E93"
              />
            </View>
          </View>


          <Text style={styles.sectionTitle}>Daily Reminders</Text>
          <View style={styles.card}>
            <View style={styles.reminderHeader}>
              <Text style={styles.label}>Intake Schedule</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.addTimeBtn}>
                <Ionicons name="add-circle" size={20} color={color.PRIMARY} />
                <Text style={styles.addTimeText}>Add Time</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.timeChips}>
              {formData.intake_times?.map((time) => (
                <View key={time} style={styles.chip}>
                  <Text style={styles.chipText}>{time}</Text>
                  <TouchableOpacity onPress={() => removeIntakeTime(time)}>
                    <Ionicons name="close-circle" size={16} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
              ))}
              {(!formData.intake_times || formData.intake_times.length === 0) && (
                <Text style={styles.emptyTimesText}>No reminders set yet</Text>
              )}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Inventory & Expiry</Text>
          <View style={styles.card}>
             <View style={styles.row}>
               <View style={{ flex: 1, marginRight: 10 }}>
                 <Text style={styles.label}>Quantity</Text>
                 <View style={styles.qtyRow}>
                   <TouchableOpacity onPress={() => updateField("current_quantity", Math.max(1, formData.current_quantity - 1))} style={styles.qtyBtn}>
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

          <Text style={styles.sectionTitle}>Usage Notes</Text>
          <View style={styles.card}>
            <TextInput
              style={[styles.textArea, { backgroundColor: isDark ? "#2C2C2E" : "#F2F4F7", color: isDark ? "white" : "black" }]}
              placeholder="Dosage instructions or notes..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={4}
              value={formData.dosage_instructions}
              onChangeText={(t: string) => updateField("dosage_instructions", t)}
            />
          </View>
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

        {showTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            is24Hour={false}
            onChange={(e, date) => {
              setShowTimePicker(false);
              if (date) {
                const hh = date.getHours().toString().padStart(2, '0');
                const mm = date.getMinutes().toString().padStart(2, '0');
                addIntakeTime(`${hh}:${mm}`);
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? "#0A0A0C" : "#F8FBFF" },
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
  textArea: { minHeight: 100, borderRadius: 16, padding: 16, textAlignVertical: "top", fontSize: 15, fontFamily: "PoppinsRegular" },
  reminderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addTimeBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  addTimeText: { color: color.PRIMARY, fontSize: 14, fontFamily: "PoppinsRegular", fontWeight: "600" },
  timeChips: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  chip: { flexDirection: "row", alignItems: "center", backgroundColor: color.PRIMARY + "10", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: color.PRIMARY + "20" },
  chipText: { fontSize: 14, fontFamily: "PoppinsRegular", fontWeight: "bold", color: color.PRIMARY },
  emptyTimesText: { fontSize: 13, fontFamily: "PoppinsRegular", color: "#8E8E93", fontStyle: "italic" },
});
